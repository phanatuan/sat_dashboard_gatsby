import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";
import { corsHeaders } from "../shared/cors.ts"; // Corrected path: removed underscore

interface ExamProgressPayload {
  examId: string;
  userAnswers: { [key: string]: string }; // e.g., {"1": "A", "5": "C"}
  markedQuestions?: string[]; // Array of actual question IDs (optional for save)
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // 1. Authorization Check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing Authorization Header");
    }

    // Create a Supabase client with the user's JWT
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    // Get user details (throws error if JWT is invalid)
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      console.error("User auth error:", userError?.message);
      throw new Error("Authentication failed");
    }

    // 2. Parse Input Payload
    const payload: ExamProgressPayload = await req.json();
    const { examId, userAnswers, markedQuestions } = payload;

    if (!examId || typeof userAnswers !== "object") {
      throw new Error("Invalid payload: examId and userAnswers are required.");
    }

    // 3. Calculate Current Progress
    let currentProgress = 0; // Default to 0 if no answers
    const answeredOrders = Object.keys(userAnswers)
      .map(Number) // Convert keys "1", "5" to numbers 1, 5
      .filter((num) => !isNaN(num) && num > 0); // Ensure they are valid positive numbers

    if (answeredOrders.length > 0) {
      currentProgress = Math.max(...answeredOrders);
    }

    // 4. Prepare Data for Upsert
    const dataToUpsert = {
      user_id: user.id,
      exam_id: examId,
      user_answers: userAnswers,
      current_progress: currentProgress,
      // Only include marked_questions if it was provided in the payload
      ...(markedQuestions && { marked_questions: markedQuestions }),
      // DO NOT update score, correct_count, total_questions, or submitted_at here
    };

    // 5. Perform Upsert Operation
    const { error: upsertError } = await supabaseClient
      .from("exam_results")
      .upsert(dataToUpsert, {
        onConflict: "user_id, exam_id", // Specify the unique constraint columns
        // IMPORTANT: Do NOT ignore duplicates here, we want to update if exists
      })
      .select("id") // Select something to confirm success/failure
      .single(); // Expecting one row affected or created

    if (upsertError) {
      console.error("Supabase upsert error:", upsertError);
      // Check for specific errors, e.g., RLS violation
      if (upsertError.code === "42501") {
        // permission denied
        throw new Error(
          "Permission denied. Check RLS policies on exam_results."
        );
      }
      throw new Error(`Failed to save progress: ${upsertError.message}`);
    }

    // 6. Return Success Response
    return new Response(
      JSON.stringify({ message: "Progress saved successfully" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error in save-exam-progress function:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400, // Use 401 for auth errors? 500 for server errors?
    });
  }
});
