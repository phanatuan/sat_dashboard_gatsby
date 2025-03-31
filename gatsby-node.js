// gatsby-node.js
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

// Load environment variables
require("dotenv").config({
  path: `.env.${process.env.NODE_ENV}`,
});

exports.createPages = async ({ graphql, actions, reporter }) => {
  const { createPage } = actions;

  // --- 1. Initialize Supabase Admin Client (using Service Role Key) ---
  // IMPORTANT: This client bypasses RLS and should ONLY be used server-side during build.
  const supabaseAdmin = createClient(
    process.env.GATSBY_SUPABASE_URL, // Use the same URL variable
    process.env.SUPABASE_SERVICE_ROLE_KEY // Use the service role key!
  );

  reporter.info("Fetching data from Supabase for page creation...");

  // --- 2. Fetch All Exam and Question Data ---
  // Fetch all exams
  const { data: examsData, error: examsError } = await supabaseAdmin
    .from("exams")
    .select(
      "exam_id, exam_name, section_name, test_category, allow_practice_mode"
    );

  if (examsError) {
    reporter.panicOnBuild("Error fetching exams from Supabase", examsError);
    return;
  }

  // Fetch all exam-question relationships with full question details, ordered
  const { data: examQuestionsData, error: examQuestionsError } =
    await supabaseAdmin
      .from("exam_questions")
      .select(
        `
        exam_id,
        question_order,
        questions (
            question_id,
            question_html,
            leading_sentence,
            answer_a,
            answer_b,
            answer_c,
            answer_d,
            correct_answer,
            explanation,
            question_type
        )
    `
      )
      .order("question_order", { ascending: true })
      .range(0, 50000); // Order globally first

  if (examQuestionsError) {
    reporter.panicOnBuild(
      "Error fetching exam_questions from Supabase",
      examQuestionsError
    );
    return;
  }

  // Log the actual number fetched now
  reporter.info(
    `Fetched ${
      examQuestionsData ? examQuestionsData.length : 0
    } exam-question relationships.`
  );

  // --- 3. Process and Group Data ---
  const examsWithQuestions = {};
  examsData.forEach((exam) => {
    // Initialize each exam entry with an empty questions array
    examsWithQuestions[exam.exam_id] = { ...exam, questions: [] };
  });

  examQuestionsData.forEach((eq) => {
    // Check if the exam exists in our map and if the nested question data is present
    if (examsWithQuestions[eq.exam_id] && eq.questions) {
      // Add the question details along with its order specific to this exam
      examsWithQuestions[eq.exam_id].questions.push({
        ...eq.questions, // Spread all fields from the 'questions' object
        question_order: eq.question_order, // Ensure order is included at the top level
      });
    } else {
      reporter.warn(
        `Orphaned or incomplete exam_question found: exam_id=${eq.exam_id}, question_order=${eq.question_order}`
      );
    }
  });

  // Ensure questions within each exam are sorted by question_order (redundant if global sort works, but safe)
  Object.values(examsWithQuestions).forEach((exam) => {
    exam.questions.sort((a, b) => a.question_order - b.question_order);
    const questions = exam.questions;
    const totalQuestions = questions.length;
    reporter.info(
      `Processing Exam: ${exam.exam_name} (ID: ${exam.exam_id}) with ${totalQuestions} questions.`
    ); // Verify totalQuestions
  });

  reporter.info(`Fetched ${examsData.length} exams.`);
  reporter.info(
    `Processed ${examQuestionsData.length} exam-question relationships.`
  );

  // --- 4. Create Exam List Page ---
  // Although you might create src/pages/exams.js directly, passing the data
  // here ensures it's available at build time without extra client-side fetching.

  try {
    createPage({
      path: `/exams/`,
      component: path.resolve("./src/templates/exam-list-page.js"), // We'll create this template
      context: {
        allExams: examsData, // Pass the list of exams to the page
      },
    });
    reporter.info(` --> SUCCESS creating page for ${examsData.exam_id}`); // Add success log
  } catch (pageError) {
    reporter.error(
      ` --> FAILED creating page for ${examsData.exam_id}`,
      pageError
    );
    // Decide if you want the build to stop: throw pageError;
  }

  reporter.info(`Created Exam List page at /exams/`);

  // --- 5. Create Individual Question Pages ---
  const questionPageTemplate = path.resolve("./src/templates/question-page.js"); // We'll create this template

  let questionPageCount = 0;
  // Iterate through each exam that has questions
  Object.values(examsWithQuestions).forEach((exam) => {
    const questions = exam.questions;
    const totalQuestions = questions.length;

    if (totalQuestions === 0) {
      reporter.warn(
        `Exam "${exam.exam_name}" (ID: ${exam.exam_id}) has no questions assigned. Skipping question page creation for it.`
      );
      return; // Skip exams with no questions
    }

    // Iterate through the ordered questions for this exam
    questions.forEach((question, index) => {
      const currentOrder = question.question_order;

      // Determine previous and next question paths based on the *ordered array index*
      const prevQuestion = index > 0 ? questions[index - 1] : null;
      const nextQuestion =
        index < totalQuestions - 1 ? questions[index + 1] : null;

      const prevPath = prevQuestion
        ? `/exams/${exam.exam_id}/questions/${prevQuestion.question_order}/`
        : null;
      const nextPath = nextQuestion
        ? `/exams/${exam.exam_id}/questions/${nextQuestion.question_order}/`
        : null;

      createPage({
        path: `/exams/${exam.exam_id}/questions/${currentOrder}/`,
        component: questionPageTemplate,
        context: {
          // Pass all necessary data down to the question page template
          exam_id: exam.exam_id,
          exam_name: exam.exam_name,
          allow_practice_mode: exam.allow_practice_mode,
          question_data: question, // The full question object including its order
          question_order: currentOrder,
          total_questions_in_exam: totalQuestions,
          prev_question_path: prevPath,
          next_question_path: nextPath,
        },
      });
      questionPageCount++;
    });
    reporter.info(
      `Created ${totalQuestions} question pages for Exam: ${exam.exam_name}`
    );
  });
  reporter.info(`Total question pages created: ${questionPageCount}`);
}; // End of createPages

// You might add other gatsby-node APIs later (e.g., onCreateNode) if needed.
