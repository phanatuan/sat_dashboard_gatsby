// supabase/functions/submit-exam/index.ts
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../shared/cors.ts";

interface SubmissionPayload {
  examId: string;
  userAnswers: { [key: number]: string }; // { question_order: selected_choice }
  markedQuestions?: string[]; // Array of question_ids marked for review
}

serve(async (req) => {
  // 1. Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // 2. Initialize Supabase client with user's auth context
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      // Pass the Authorization header from the client request
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    // 3. Get user data (Edge functions automatically handle user context)
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      console.error("Auth error:", userError);
      return new Response(JSON.stringify({ error: "User not authenticated" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    // 4. Parse request body
    const payload: SubmissionPayload = await req.json();
    // Default markedQuestions to an empty array if not provided
    const { examId, userAnswers, markedQuestions = [] } = payload;

    // Keep the original check: require examId and non-empty userAnswers
    if (!examId || !userAnswers || Object.keys(userAnswers).length === 0) {
      return new Response(
        JSON.stringify({ error: "Missing examId or userAnswers" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    // 5. Fetch correct answers for this exam
    // We need exam_questions to link exam_id -> question_id -> correct_answer
    const { data: examQuestionsData, error: questionsError } =
      await supabaseClient
        .from("exam_questions")
        .select(
          `
        question_order,
        questions ( correct_answer )
      `
        ) // Join with questions table
        .eq("exam_id", examId)
        .order("question_order", { ascending: true }); // Ensure order if needed, though we use question_order key

    if (questionsError) {
      console.error("Error fetching questions:", questionsError);
      throw questionsError; // Rethrow to be caught by the main try/catch
    }

    if (!examQuestionsData || examQuestionsData.length === 0) {
      return new Response(
        JSON.stringify({ error: "Exam or questions not found" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 404,
        }
      );
    }

    // 6. Calculate Score
    let correctCount = 0;
    const totalQuestions = examQuestionsData.length;

    for (const eq of examQuestionsData) {
      const questionOrder = eq.question_order;
      // Access nested correct_answer safely
      const correctAnswer = eq.questions?.correct_answer;
      const userAnswer = userAnswers[questionOrder]; // User's submitted answer for this question order

      if (correctAnswer && userAnswer && userAnswer === correctAnswer) {
        correctCount++;
      }
    }

    const scorePercentage =
      totalQuestions > 0
        ? parseFloat(((correctCount / totalQuestions) * 100).toFixed(2)) // Calculate and format to 2 decimal places
        : 0;

    // 7. Upsert result into the database (Insert or Update)
    const { data: resultData, error: upsertError } = await supabaseClient
      .from("exam_results")
      .upsert(
        {
          user_id: user.id,
          exam_id: examId,
          score_percentage: scorePercentage,
          correct_count: correctCount,
          total_questions: totalQuestions,
          user_answers: userAnswers, // Store the submitted answers
          submitted_at: new Date().toISOString(),
          marked_questions: markedQuestions, // Store the marked questions
        },
        {
          onConflict: "user_id, exam_id", // Specify columns for conflict detection
        }
      )
      .select("id") // Select the ID of the upserted record
      .single(); // Expect only one record back

    if (upsertError) {
      console.error("Error upserting result:", upsertError);
      // No need to specifically check for 23505 (unique violation) as upsert handles it
      throw upsertError;
    }

    // 8. Return success response (resultData.id will be the ID of the inserted or updated row)
    return new Response(
      JSON.stringify({
        message: "Exam submitted successfully!",
        resultId: resultData.id, // Send back the ID of the result row
        score: scorePercentage,
        exam_id: examId,
        correctCount: correctCount,
        totalQuestions: totalQuestions,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("General error in function:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal Server Error" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
