// gatsby-node.js
const path = require("path");
const { createClient } = require("@supabase/supabase-js");
const { decodeMojibake } = require("./src/utils/decodeHtml");

// Load environment variables
require("dotenv").config({
  path: `.env.${process.env.NODE_ENV}`,
});

exports.createPages = async ({ graphql, actions, reporter }) => {
  const { createPage } = actions;

  // --- 1. Initialize Supabase Admin Client ---
  const supabaseAdmin = createClient(
    process.env.GATSBY_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  reporter.info("--- Starting Page Creation Process ---");
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
    reporter.error("!!! Error fetching exams from Supabase:", examsError); // More prominent error log
    reporter.panicOnBuild("Aborting build due to error fetching exams.");
    return;
  }
  reporter.info(`Fetched ${examsData ? examsData.length : 0} exams.`);
  reporter.info(
    "Fetching exam_questions data (with nested questions) from Supabase..."
  );
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
      .range(0, 50000); // Increased range just in case

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
    examsWithQuestions[exam.exam_id] = { ...exam, questions: [] };
  });

  let processedCount = 0;
  let orphanedCount = 0;
  examQuestionsData.forEach((eq) => {
    if (examsWithQuestions[eq.exam_id] && eq.questions) {
      // --- 4. DECODE the question data HERE ---
      const originalQuestion = eq.questions;
      const decodedQuestion = {
        ...originalQuestion, // Keep non-text fields (question_id, correct_answer, domain, skill)
        question_html: decodeMojibake(originalQuestion.question_html),
        leading_sentence: decodeMojibake(originalQuestion.leading_sentence),
        answer_a: decodeMojibake(originalQuestion.answer_a),
        answer_b: decodeMojibake(originalQuestion.answer_b),
        answer_c: decodeMojibake(originalQuestion.answer_c),
        answer_d: decodeMojibake(originalQuestion.answer_d),
        explanation: decodeMojibake(originalQuestion.explanation),
      };
      // ------------------------------------------

      examsWithQuestions[eq.exam_id].questions.push({
        ...decodedQuestion,
        question_order: eq.question_order,
      });
      processedCount++;
    } else {
      // --- DEBUG: More specific orphan warning ---
      reporter.warn(
        `Orphaned/incomplete exam_question: exam_id=${
          eq.exam_id
        } (Exists in examsData? ${!!examsWithQuestions[
          eq.exam_id
        ]}), question_order=${
          eq.question_order
        }, Has nested questions data? ${!!eq.questions}`
      );
      orphanedCount++;
    }
  });
  reporter.info(
    `Processed ${processedCount} relationships successfully, ${orphanedCount} orphaned/incomplete.`
  );

  // Ensure sorting (redundant but safe)
  Object.values(examsWithQuestions).forEach((exam) => {
    exam.questions.sort((a, b) => a.question_order - b.question_order);
  });

  reporter.info("Data processing complete.");

  // --- 5. Create Individual Question Pages ---
  reporter.info("Starting creation of individual question pages...");
  const questionPageTemplate = path.resolve("./src/templates/question-page.js");
  let questionPageCount = 0;
  let specificPageCreated = false; // Flag for our target page

  Object.values(examsWithQuestions).forEach((exam) => {
    const questions = exam.questions;
    const totalQuestions = questions.length;

    if (totalQuestions === 0) {
      // reporter.warn( // Keep this less verbose unless debugging specific empty exams
      //   `Exam "${exam.exam_name}" (ID: ${exam.exam_id}) has no questions assigned. Skipping.`
      // );
      return;
    }

    questions.forEach((question, index) => {
      const currentOrder = question.question_order;
      const pagePath = `/exams/${exam.exam_id}/questions/${currentOrder}/`;

      // Determine previous and next question paths
      const prevQuestion = index > 0 ? questions[index - 1] : null;
      const nextQuestion =
        index < totalQuestions - 1 ? questions[index + 1] : null;
      const prevPath = prevQuestion
        ? `/exams/${exam.exam_id}/questions/${prevQuestion.question_order}/`
        : null;
      const nextPath = nextQuestion
        ? `/exams/${exam.exam_id}/questions/${nextQuestion.question_order}/`
        : null;

      try {
        createPage({
          path: pagePath,
          component: questionPageTemplate,
          context: {
            exam_id: exam.exam_id,
            exam_name: exam.exam_name,
            allow_practice_mode: exam.allow_practice_mode,
            question_data: question, // Pass the whole object
            question_order: currentOrder,
            total_questions_in_exam: totalQuestions,
            prev_question_path: prevPath,
            next_question_path: nextPath,
          },
        });
        questionPageCount++;
      } catch (error) {
        reporter.error(
          `!!! FAILED calling createPage for path: ${pagePath}`,
          error
        );
      }
    });
  });

  reporter.info(
    `Total question pages created (attempted): ${questionPageCount}`
  );
  // --- DEBUG: Final check if the specific page was processed for creation ---
  if (specificPageCreated) {
    reporter.info(
      `--- DEBUG: The createPage function was successfully CALLED for /exams/e514367/questions/23/.`
    );
  } else {
    reporter.warn(
      `--- DEBUG: The createPage function was NEVER CALLED for /exams/e514367/questions/23/. Check processing logs above.`
    );
  }
  reporter.info("--- Finished Page Creation Process ---");
}; // End of createPages
