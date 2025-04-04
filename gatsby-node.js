// gatsby-node.js
const path = require("path");
const { createClient } = require("@supabase/supabase-js");
const { decodeMojibake } = require("./src/utils/decodeHtml");

// Load environment variables
require("dotenv").config({
  path: `.env.${process.env.NODE_ENV}`,
});

exports.createPages = async ({ actions, reporter }) => {
  const { createPage } = actions;

  // --- 1. Initialize Supabase Admin Client ---
  const supabaseAdmin = createClient(
    process.env.GATSBY_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  reporter.info("--- Starting Page Creation Process ---");
  // (Keep existing Supabase connection logs)
  reporter.info(
    `Supabase URL: ${process.env.GATSBY_SUPABASE_URL ? "Set" : "NOT SET"}`
  );
  reporter.info(
    `Supabase Service Key: ${
      process.env.SUPABASE_SERVICE_ROLE_KEY ? "Set (masked)" : "NOT SET"
    }`
  );

  // --- 2. Fetch All Exam and Question Data ---
  reporter.info("Fetching exams data from Supabase...");
  const { data: examsData, error: examsError } = await supabaseAdmin
    .from("exams")
    .select(
      "exam_id, exam_name, section_name, test_category, allow_practice_mode"
    );

  if (examsError) {
    reporter.error("!!! Error fetching exams from Supabase:", examsError);
    reporter.panicOnBuild("Aborting build due to error fetching exams.");
    return;
  }
  reporter.info(`Fetched ${examsData ? examsData.length : 0} exams.`);

  reporter.info("Fetching exam_questions data (with nested questions)...");
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
            domain,
            skill
        )
    `
      )
      .order("question_order", { ascending: true })
      .range(0, 50000); // Consider if pagination is needed for very large datasets

  if (examQuestionsError) {
    reporter.error(
      "!!! Error fetching exam_questions from Supabase:",
      examQuestionsError
    );
    reporter.panicOnBuild(
      "Aborting build due to error fetching exam_questions."
    );
    return;
  }
  reporter.info(
    `Fetched ${
      examQuestionsData ? examQuestionsData.length : 0
    } exam-question relationships.`
  );

  // --- 3. Process and Group Data ---
  reporter.info("Processing and grouping fetched data...");
  const examsWithQuestions = {};
  examsData.forEach((exam) => {
    // Basic validation
    if (exam.exam_id) {
      examsWithQuestions[exam.exam_id] = { ...exam, questions: [] };
    } else {
      reporter.warn(`Exam missing exam_id:`, exam);
    }
  });

  let processedCount = 0;
  let orphanedCount = 0;
  examQuestionsData.forEach((eq) => {
    if (
      eq.exam_id && // Check if exam_id exists
      examsWithQuestions[eq.exam_id] &&
      eq.questions && // Check if nested question data exists
      typeof eq.question_order === "number" // Check if question_order is valid
    ) {
      // Decode question data
      const originalQuestion = eq.questions;
      const decodedQuestion = {
        ...originalQuestion,
        question_html: decodeMojibake(originalQuestion.question_html),
        leading_sentence: decodeMojibake(originalQuestion.leading_sentence),
        answer_a: decodeMojibake(originalQuestion.answer_a),
        answer_b: decodeMojibake(originalQuestion.answer_b),
        answer_c: decodeMojibake(originalQuestion.answer_c),
        answer_d: decodeMojibake(originalQuestion.answer_d),
        explanation: decodeMojibake(originalQuestion.explanation),
      };

      examsWithQuestions[eq.exam_id].questions.push({
        ...decodedQuestion,
        question_order: eq.question_order,
      });
      processedCount++;
    } else {
      reporter.warn(
        `Orphaned/incomplete exam_question relation: exam_id=${
          eq.exam_id
        }, order=${
          eq.question_order
        }, has nested questions? ${!!eq.questions}, order type? ${typeof eq.question_order}`
      );
      orphanedCount++;
    }
  });
  reporter.info(
    `Processed ${processedCount} relationships successfully, ${orphanedCount} orphaned/incomplete.`
  );

  // Ensure sorting (important for prev/next logic)
  Object.values(examsWithQuestions).forEach((exam) => {
    exam.questions.sort((a, b) => a.question_order - b.question_order);
  });
  reporter.info("Data processing complete.");

  // --- 4. Define Page Templates ---
  const questionPageTemplate = path.resolve("./src/templates/question-page.js");
  const examReviewPageTemplate = path.resolve(
    "./src/templates/exam-review-page.js"
  ); // <-- Define review template path
  reporter.info("Defined page templates.");

  // --- 5. Create Individual Question and Review Pages ---
  reporter.info("Starting creation of individual question and review pages...");
  let questionPageCount = 0;
  let reviewPageCount = 0;

  Object.values(examsWithQuestions).forEach((exam) => {
    const questions = exam.questions;
    const totalQuestions = questions.length;

    if (totalQuestions === 0) {
      reporter.warn(
        `Exam "${exam.exam_name}" (ID: ${exam.exam_id}) has no valid questions assigned after processing. Skipping page creation for this exam.`
      );
      return; // Skip exams with no valid questions
    }

    // --- 5a. Generate All Question Paths for this Exam ---
    const allQuestionPaths = {};
    questions.forEach((q) => {
      // Use the path structure consistent with React components
      allQuestionPaths[
        q.question_order
      ] = `/exam/${exam.exam_id}/question/${q.question_order}/`;
    });
    // reporter.info(`Generated ${Object.keys(allQuestionPaths).length} paths for exam ${exam.exam_id}`); // Optional debug log

    // --- 5b. Create Individual Question Pages ---
    questions.forEach((question, index) => {
      const currentOrder = question.question_order;
      const pagePath = allQuestionPaths[currentOrder]; // Use the generated path

      if (!pagePath) {
        reporter.error(
          `!!! Could not generate path for exam ${exam.exam_id}, question order ${currentOrder}. Skipping question page.`
        );
        return; // Skip if path generation failed
      }

      // Determine previous and next question paths using the generated map
      const prevQuestion = index > 0 ? questions[index - 1] : null;
      const nextQuestion =
        index < totalQuestions - 1 ? questions[index + 1] : null;
      const prevPath = prevQuestion
        ? allQuestionPaths[prevQuestion.question_order]
        : null;
      const nextPath = nextQuestion
        ? allQuestionPaths[nextQuestion.question_order]
        : null;

      try {
        createPage({
          path: pagePath,
          component: questionPageTemplate,
          context: {
            exam_id: exam.exam_id,
            exam_name: exam.exam_name,
            allow_practice_mode: exam.allow_practice_mode || false, // Default if null/undefined
            question_data: question,
            question_order: currentOrder,
            total_questions_in_exam: totalQuestions,
            prev_question_path: prevPath,
            next_question_path: nextPath,
            all_question_paths: allQuestionPaths, // <-- Pass the map here
          },
        });
        questionPageCount++;
      } catch (error) {
        reporter.error(
          `!!! FAILED calling createPage for question path: ${pagePath}`,
          error
        );
      }
    }); // End question loop

    // --- 5c. Create Exam Review Page ---
    const reviewPagePath = `/exam-review/${exam.exam_id}/`;
    try {
      createPage({
        path: reviewPagePath,
        component: examReviewPageTemplate,
        context: {
          exam_id: exam.exam_id,
          exam_name: exam.exam_name,
          total_questions_in_exam: totalQuestions,
          all_question_paths: allQuestionPaths, // <-- Pass the map here too
        },
      });
      reviewPageCount++;
    } catch (error) {
      reporter.error(
        `!!! FAILED calling createPage for review path: ${reviewPagePath}`,
        error
      );
    }
  }); // End exam loop

  reporter.info(
    `Total question pages created (attempted): ${questionPageCount}`
  );
  reporter.info(`Total review pages created (attempted): ${reviewPageCount}`);
  reporter.info("--- Finished Page Creation Process ---");
}; // End of createPages

// --- Optional: onCreatePage if needed ---
// exports.onCreatePage = async ({ page, actions }) => { ... }
