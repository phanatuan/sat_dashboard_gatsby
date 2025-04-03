// gatsby-node.js
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

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
  // --- DEBUG: Log fetched exams ---
  // console.log("Fetched Exams Sample:", JSON.stringify(examsData?.slice(0, 2), null, 2));
  // --- DEBUG: Check if specific exam ID exists ---
  const specificExamExists = examsData?.some((e) => e.exam_id === "e514367");
  reporter.info(
    `--- DEBUG: Does exam 'e514367' exist in fetched exams data? ${specificExamExists}`
  );

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
  // --- DEBUG: Check raw data for the specific exam/question ---
  const specificRawEQ = examQuestionsData?.find(
    (eq) => eq.exam_id === "e514367" && eq.question_order === 23
  );
  reporter.info(
    `--- DEBUG: Found raw exam_question for 'e514367' order 23? ${!!specificRawEQ}`
  );
  if (specificRawEQ) {
    reporter.info(
      `--- DEBUG: Raw data for 'e514367' order 23: ${JSON.stringify(
        specificRawEQ
      )}`
    );
    reporter.info(
      `--- DEBUG: Nested question data present in raw data? ${!!specificRawEQ.questions}`
    );
    if (specificRawEQ.questions) {
      reporter.info(
        `--- DEBUG: Nested question_id: ${specificRawEQ.questions.question_id}`
      );
    }
  } else {
    reporter.warn(
      `--- DEBUG: Could not find raw exam_question entry for exam_id='e514367' AND question_order=23.`
    );
    // Check if the exam ID exists at all in exam_questions
    const anyEQforExam = examQuestionsData?.some(
      (eq) => eq.exam_id === "e514367"
    );
    reporter.info(
      `--- DEBUG: Found *any* exam_question entry for exam_id='e514367'? ${anyEQforExam}`
    );
  }

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
      // --- DEBUG: Log when adding the specific question ---
      if (eq.exam_id === "e514367" && eq.question_order === 23) {
        reporter.info(
          `--- DEBUG: Processing and adding question order 23 for exam 'e514367'. Question data: ${JSON.stringify(
            eq.questions
          )}`
        );
      }
      examsWithQuestions[eq.exam_id].questions.push({
        ...eq.questions,
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
      // --- DEBUG: Log the specific problematic orphan if it matches ---
      if (eq.exam_id === "e514367" && eq.question_order === 23) {
        reporter.error(
          `--- !!! DEBUG: The specific question ('e514367', 23) was detected as ORPHANED/INCOMPLETE during processing!`
        );
      }
    }
  });
  reporter.info(
    `Processed ${processedCount} relationships successfully, ${orphanedCount} orphaned/incomplete.`
  );

  // --- DEBUG: Check processed structure for the specific exam ---
  const specificProcessedExam = examsWithQuestions["e514367"];
  if (specificProcessedExam) {
    reporter.info(
      `--- DEBUG: Found processed exam 'e514367'. It has ${specificProcessedExam.questions.length} questions.`
    );
    const specificProcessedQuestion = specificProcessedExam.questions.find(
      (q) => q.question_order === 23
    );
    reporter.info(
      `--- DEBUG: Found question order 23 within processed exam 'e514367'? ${!!specificProcessedQuestion}`
    );
    if (specificProcessedQuestion) {
      reporter.info(
        `--- DEBUG: Processed data for question 23: ${JSON.stringify(
          specificProcessedQuestion
        )}`
      );
    } else {
      // If not found here, but found in raw, the processing/push logic might be flawed
      reporter.warn(
        `--- DEBUG: Question order 23 NOT FOUND in the processed questions array for exam 'e514367', even though the exam exists.`
      );
      // Log the orders that *are* present for this exam
      const ordersPresent = specificProcessedExam.questions
        .map((q) => q.question_order)
        .join(", ");
      reporter.info(
        `--- DEBUG: Orders present for exam 'e514367': [${ordersPresent}]`
      );
    }
  } else {
    reporter.warn(
      `--- DEBUG: Exam 'e514367' NOT FOUND in the final 'examsWithQuestions' map after processing.`
    );
  }

  // Ensure sorting (redundant but safe)
  Object.values(examsWithQuestions).forEach((exam) => {
    exam.questions.sort((a, b) => a.question_order - b.question_order);
  });

  reporter.info("Data processing complete.");

  // --- 4. Create Exam List Page ---
  reporter.info("Creating Exam List page...");
  try {
    createPage({
      path: `/exams/`,
      component: path.resolve("./src/templates/exam-list-page.js"),
      context: {
        allExams: examsData,
      },
    });
    reporter.info("--> SUCCESS creating Exam List page at /exams/");
  } catch (pageError) {
    reporter.error("--> FAILED creating Exam List page", pageError);
  }

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

      // --- DEBUG: Log right before creating the specific page ---
      if (exam.exam_id === "e514367" && currentOrder === 23) {
        reporter.info(
          `--->>> ATTEMPTING createPage for SPECIFIC path: ${pagePath}`
        );
        reporter.info(
          `--->>> Context for ${pagePath}: ${JSON.stringify(
            {
              exam_id: exam.exam_id,
              question_order: currentOrder,
              total_questions_in_exam: totalQuestions,
              // Only log keys or small parts of question_data to avoid huge logs
              question_data_keys: Object.keys(question),
              question_id_in_data: question.question_id,
              // prev/next paths are good to check too
              prev_path:
                index > 0
                  ? `/exams/${exam.exam_id}/questions/${
                      questions[index - 1].question_order
                    }/`
                  : null,
              next_path:
                index < totalQuestions - 1
                  ? `/exams/${exam.exam_id}/questions/${
                      questions[index + 1].question_order
                    }/`
                  : null,
            },
            null,
            2
          )}`
        ); // Pretty print context
      }

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
        // --- DEBUG: Confirm creation for specific page ---
        if (exam.exam_id === "e514367" && currentOrder === 23) {
          reporter.info(`--->>> SUCCESS calling createPage for ${pagePath}`);
          specificPageCreated = true;
        }
      } catch (error) {
        reporter.error(
          `!!! FAILED calling createPage for path: ${pagePath}`,
          error
        );
        // --- DEBUG: Specific failure ---
        if (exam.exam_id === "e514367" && currentOrder === 23) {
          reporter.error(
            `--->>> !!! The createPage call ITSELF failed for the specific page ${pagePath}!`
          );
        }
      }
    });
    // reporter.info(`Created ${totalQuestions} question pages for Exam: ${exam.exam_name}`); // Can be verbose
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
