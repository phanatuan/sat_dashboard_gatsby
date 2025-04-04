// src/templates/question-page.js
import React, { useState, useEffect, useCallback } from "react";
import { Link, navigate } from "gatsby";
import clsx from "clsx";
import { supabase } from "../supabaseClient";
import Layout from "../components/Layout";
import { useAuth } from "../context/AuthContext";
import { useExamTimer } from "../context/ExamTimerContext";
import QuestionEditModal from "../components/QuestionEditModal"; // *** IMPORT NEW MODAL ***

// --- Import the extracted modal component ---
import NavigationModal from "../components/NavigationModal"; // Adjust path if needed

// --- Helper functions for localStorage (keep as they are) ---
const getExamStateKey = (examId) => `examState_${examId}`;
const loadExamStateFromLocalStorage = (examId) => {
  if (typeof window === "undefined") {
    return { answers: {}, marked: {} };
  }
  const storageKey = getExamStateKey(examId);
  try {
    const storedStateRaw = localStorage.getItem(storageKey);
    if (storedStateRaw) {
      const state = JSON.parse(storedStateRaw);
      return {
        answers: state.answers || {},
        marked: state.marked || {},
      };
    }
  } catch (error) {
    console.error("Error reading exam state from localStorage:", error);
  }
  return { answers: {}, marked: {} };
};
const saveExamStateToLocalStorage = (examId, state) => {
  if (!state || typeof window === "undefined") return;
  const storageKey = getExamStateKey(examId);
  try {
    localStorage.setItem(storageKey, JSON.stringify(state));
  } catch (error) {
    console.error("Error saving exam state to localStorage:", error);
  }
};

const QuestionPage = ({ pageContext }) => {
  const {
    exam_id,
    exam_name,
    allow_practice_mode,
    question_data,
    question_order,
    total_questions_in_exam,
    prev_question_path,
    next_question_path,
    all_question_paths, // Provided by gatsby-node
  } = pageContext;

  // --- State ---
  const { user, isAdmin, loading: authLoading } = useAuth();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const { formattedTime, resetTimer } = useExamTimer();
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [feedback, setFeedback] = useState({ correct: null, checked: false });
  // 'isMarked' holds the marked status ONLY for the CURRENT question being viewed
  const [isMarked, setIsMarked] = useState(false);
  const [checkButtonText, setCheckButtonText] = useState("Check Answer");
  const [isCorrect, setIsCorrect] = useState(false);
  const [incorrectAnswers, setIncorrectAnswers] = useState(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [isNavModalOpen, setIsNavModalOpen] = useState(false);

  // 'allQuestionStatuses' holds the { answers: {}, marked: {} } object for ALL questions, loaded from LS
  const [allQuestionStatuses, setAllQuestionStatuses] = useState({
    answers: {},
    marked: {},
  });

  // *** STATE for Edit Modal ***
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSavingQuestion, setIsSavingQuestion] = useState(false);
  const [saveQuestionError, setSaveQuestionError] = useState(null);
  const [saveQuestionSuccess, setSaveQuestionSuccess] = useState(false); // Optional success message

  // --- Effects ---
  // Authorization Check Effect
  useEffect(() => {
    if (authLoading) {
      setCheckingAuth(true);
      return;
    }
    if (!user) {
      navigate("/login/");
      return;
    }
    setIsAuthorized(true);
    setCheckingAuth(false);
  }, [user, isAdmin, authLoading, exam_id]);

  // Load state from Local Storage when component mounts or question changes
  useEffect(() => {
    if (!isAuthorized || !question_data || typeof window === "undefined")
      return;

    const examState = loadExamStateFromLocalStorage(exam_id);
    const previousAnswer = examState.answers[question_order];
    const previousMarked = examState.marked[question_order];

    // Update state for the current question
    setSelectedAnswer(previousAnswer || null);
    setIsMarked(!!previousMarked); // Set the isMarked state for the current question's button

    // Load the complete status object for the modal
    setAllQuestionStatuses(examState);

    // Reset other question-specific states
    setIncorrectAnswers(new Set());
    setShowExplanation(false);
    setFeedback({ correct: null, checked: false });
    setIsCorrect(false);
    setCheckButtonText("Check Answer");
  }, [exam_id, question_order, isAuthorized, question_data]); // Dependencies

  // --- Save Answer Logic ---
  const saveAnswerToLocalStorage = (choice) => {
    if (!isAuthorized || typeof window === "undefined") return;
    const currentState = loadExamStateFromLocalStorage(exam_id);
    const updatedState = {
      ...currentState,
      answers: { ...currentState.answers, [question_order]: choice },
    };
    saveExamStateToLocalStorage(exam_id, updatedState);
    // Update the shared state used by the modal
    setAllQuestionStatuses(updatedState);
  };

  // --- Handlers ---
  // Select an answer choice
  const handleSelectAnswer = (answerChoice) => {
    setSelectedAnswer(answerChoice);
    // Clear any strikethrough if selecting a previously incorrect answer
    if (incorrectAnswers.has(answerChoice)) {
      const newIncorrectAnswers = new Set(incorrectAnswers);
      newIncorrectAnswers.delete(answerChoice);
      setIncorrectAnswers(newIncorrectAnswers);
    }
    // Reset feedback state
    setFeedback({ correct: null, checked: false });
    setIsCorrect(false);
    // Save the selected answer
    saveAnswerToLocalStorage(answerChoice);
  };

  // Check answer (Practice Mode)
  const handleCheck = () => {
    if (selectedAnswer && question_data) {
      const correct = selectedAnswer === question_data.correct_answer;
      setFeedback({ correct: correct, checked: true });
      setIsCorrect(correct);
      setCheckButtonText(correct ? "Correct!" : "Check Again");
      if (!correct) {
        setIncorrectAnswers(new Set(incorrectAnswers).add(selectedAnswer));
      }
    }
  };

  // Toggle explanation visibility (Practice Mode)
  const handleToggleExplanation = () => setShowExplanation(!showExplanation);

  // Mark or unmark the *current* question for review
  const handleMarkForReview = () => {
    if (typeof window === "undefined") return;
    // Toggle the state variable that controls the button's appearance
    const newMarkedStatus = !isMarked;
    setIsMarked(newMarkedStatus);

    // Update the status in Local Storage and the shared state object
    if (!isAuthorized) return;
    const currentState = loadExamStateFromLocalStorage(exam_id);
    const updatedMarked = { ...currentState.marked };
    if (newMarkedStatus) {
      updatedMarked[question_order] = true; // Add mark for this question order
    } else {
      delete updatedMarked[question_order]; // Remove mark for this question order
    }
    const updatedState = { ...currentState, marked: updatedMarked };
    saveExamStateToLocalStorage(exam_id, updatedState);
    // Ensure the state passed to the modal is updated
    setAllQuestionStatuses(updatedState);
  };

  // Open the navigation modal
  const handleOpenNavModal = () => {
    if (typeof window === "undefined") return;
    // Load the latest state from LS when opening to ensure modal is up-to-date
    setAllQuestionStatuses(loadExamStateFromLocalStorage(exam_id));
    setIsNavModalOpen(true);
  };

  const handleOpenEditModal = () => {
    setSaveQuestionError(null); // Clear previous errors
    setSaveQuestionSuccess(false); // Reset success message
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    // Optionally clear errors/success messages when closing manually
    // setSaveQuestionError(null);
    // setSaveQuestionSuccess(false);
  };

  const handleSaveQuestion = async (questionId, updatedData) => {
    if (!isAdmin) {
      setSaveQuestionError("Permission denied.");
      return;
    }
    if (!questionId) {
      setSaveQuestionError("Cannot save: Question ID is missing.");
      return;
    }

    setIsSavingQuestion(true);
    setSaveQuestionError(null);
    setSaveQuestionSuccess(false);

    try {
      // Filter out any undefined/null values if necessary, or let Supabase handle it
      const dataToUpdate = { ...updatedData };

      // Ensure correct_answer is uppercase if your schema requires it
      if (dataToUpdate.correct_answer) {
        dataToUpdate.correct_answer = dataToUpdate.correct_answer.toUpperCase();
      }

      console.log(
        "Attempting to update question:",
        questionId,
        "with data:",
        dataToUpdate
      );

      const { error } = await supabase
        .from("questions")
        .update(dataToUpdate)
        .eq("question_id", questionId);

      if (error) {
        console.error("Supabase update error:", error);
        throw new Error(error.message || "Failed to update question.");
      }

      console.log("Question updated successfully!");
      setSaveQuestionSuccess(true);
      setIsEditModalOpen(false); // Close modal on success

      // Optional: Add a small delay before resetting success message
      setTimeout(() => setSaveQuestionSuccess(false), 3000);
    } catch (err) {
      console.error("Error saving question:", err);
      setSaveQuestionError(
        err.message || "An unexpected error occurred during save."
      );
      // Keep the modal open so the user can see the error
    } finally {
      setIsSavingQuestion(false);
    }
  };

  // Navigate to a specific question from the modal
  const navigateToQuestion = (qNum) => {
    const path = all_question_paths?.[qNum]; // Use paths from gatsby-node context
    if (path) {
      navigate(path);
      setIsNavModalOpen(false); // Close modal on navigation
    } else {
      console.error(`Path for question ${qNum} not found.`);
    }
  };

  // Navigate to the main review page
  const navigateToReviewPage = () => {
    navigate(`/exam-review/${exam_id}/`);
    setIsNavModalOpen(false); // Close modal on navigation
  };

  // --- Direct Finish (Fallback - submission logic primarily on review page) ---
  // NOTE: This function is less likely to be used if the 'Review' button always shows last.
  const handleFinishExamDirectly = useCallback(async () => {
    if (isSubmitting || typeof window === "undefined") return;
    setIsSubmitting(true);
    setSubmitError(null);
    const finalExamState = loadExamStateFromLocalStorage(exam_id);
    const userAnswers = finalExamState.answers || {};
    try {
      const { data, error } = await supabase.functions.invoke("submit-exam", {
        body: { examId: exam_id, userAnswers: userAnswers },
      });
      if (error) throw new Error(error.message || "Failed to submit exam.");
      if (data && data.error) throw new Error(data.error);
      console.log("Exam submitted successfully:", data);
      localStorage.removeItem(getExamStateKey(exam_id));
      resetTimer(exam_id);
      if (data?.resultId) {
        navigate(`/exam-result/${data.resultId}/`);
      } else {
        console.error("Submission successful but no resultId received.");
        navigate("/exams/");
      }
    } catch (err) {
      console.error("Direct submission failed:", err);
      setSubmitError(err.message || "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  }, [exam_id, resetTimer, isSubmitting]);

  // --- RENDER SECTION ---

  // Loading/Auth States
  if (authLoading || checkingAuth)
    return (
      <Layout>
        <p>Loading...</p>
      </Layout>
    );
  if (!isAuthorized)
    return (
      <Layout>
        <p>Access Denied.</p>
      </Layout>
    );
  if (!question_data)
    return (
      <Layout>
        <p>Error: Question data not found.</p>
      </Layout>
    );
  if (!all_question_paths)
    console.warn("Warning: all_question_paths missing in pageContext.");

  // Common Tailwind classes
  const answerButtonBaseClasses =
    "flex items-baseline text-left w-full mb-3 p-3 border rounded transition duration-150 disabled:opacity-50 disabled:cursor-not-allowed";
  const navButtonBaseClasses = "px-4 py-2 rounded transition duration-200";
  const navLinkClasses = `${navButtonBaseClasses} bg-gray-600 text-white hover:bg-gray-700`;
  const navDisabledClasses = `${navButtonBaseClasses} text-gray-400 cursor-not-allowed bg-gray-200`;

  return (
    <Layout>
      {/* Top Bar: Exam Name, Timer, Progress */}
      <div className="flex items-center mb-5 pb-3 border-b border-gray-200">
        <div className="flex-1 text-left">
          <span className="font-semibold">{exam_name}</span>
        </div>
        <div className="flex-1 text-center">
          <span>{formattedTime}</span>
        </div>
        <div className="flex-1 text-right">
          <span className="text-sm text-gray-600">
            {question_order} / {total_questions_in_exam}
          </span>
        </div>
      </div>
      {/* Main Content Area: Question | Answers/Controls */}
      {/* Added margin-bottom to prevent overlap with fixed bottom nav */}
      <div className="flex flex-col md:flex-row gap-5 mb-20">
        {/* Left Column: Question Text/HTML */}
        <div className="md:w-1/2 md:border-r md:border-gray-200 md:pr-5">
          {question_data.question_html && (
            <div
              dangerouslySetInnerHTML={{ __html: question_data.question_html }}
            />
          )}
        </div>
        {/* Right Column: Answers, Mark Button, Practice Mode Controls */}
        <div className="md:w-1/2">
          <div className="flex items-center mb-4">
            {/* Flex container for Mark & Edit buttons */}
            <button
              onClick={handleMarkForReview}
              className={clsx(
                "mb-4 px-3 py-1 border rounded transition duration-150 text-sm",
                isMarked
                  ? "bg-yellow-100 border-yellow-400 hover:bg-yellow-200"
                  : "border-gray-400 hover:bg-gray-100"
              )}
            >
              {isMarked ? "Marked for Review" : "Mark for Review"}
            </button>
            {isAdmin && (
              <button
                onClick={handleOpenEditModal}
                className="ml-3 px-3 py-1 border border-blue-500 text-blue-600 rounded hover:bg-blue-50 transition duration-150 text-sm"
              >
                Edit Question
              </button>
            )}
          </div>
          {/* Optional Leading Sentence */}
          {question_data.leading_sentence && (
            <p className="text-gray-700 mb-4">
              {question_data.leading_sentence}
            </p>
          )}
          {/* Answer Choice Buttons */}
          {["A", "B", "C", "D"].map((choice) => {
            const answerText = question_data[`answer_${choice.toLowerCase()}`];
            if (!answerText) return null; // Skip if answer doesn't exist

            const isCorrectAnswer = choice === question_data.correct_answer;
            const isSelected = selectedAnswer === choice;
            const isIncorrect = incorrectAnswers.has(choice); // Strikethrough in practice mode
            let buttonClasses = [answerButtonBaseClasses];

            // Apply styling based on selection, correctness (practice mode), etc.
            if (allow_practice_mode && feedback.checked) {
              // Practice mode AFTER checking
              if (isCorrectAnswer)
                buttonClasses.push(
                  "bg-green-200 border-green-500 text-green-900 font-semibold"
                );
              else if (isSelected)
                buttonClasses.push(
                  "bg-red-200 border-red-500 text-red-900 font-semibold line-through"
                );
              else buttonClasses.push("border-gray-300 bg-white"); // Unselected, incorrect
            } else {
              // Standard mode OR practice mode BEFORE checking
              if (isSelected) buttonClasses.push("bg-blue-100 border-blue-400");
              // Highlight selected
              else
                buttonClasses.push("border-gray-300 hover:bg-gray-50 bg-white"); // Default unselected
            }

            return (
              <button
                key={choice}
                onClick={() => handleSelectAnswer(choice)}
                className={clsx(buttonClasses)}
                // Disable button only if correct answer shown in practice mode
                disabled={allow_practice_mode && isCorrect}
              >
                <strong className="mr-2 flex-shrink-0">{choice}.</strong>
                <div
                  className="flex-grow"
                  dangerouslySetInnerHTML={{ __html: answerText }}
                />
              </button>
            );
          })}
          {/* Practice Mode Specific Controls */}
          {allow_practice_mode && (
            <div className="mt-5 flex flex-col items-start gap-3">
              <button
                onClick={handleCheck}
                className={clsx(
                  navButtonBaseClasses, // Use consistent base padding/rounding
                  "text-white", // Base text color (overridden by states)
                  // Conditional background/state classes:
                  !selectedAnswer ? "bg-gray-400 cursor-not-allowed" : "",
                  isCorrect ? "bg-green-600 hover:bg-green-700" : "",
                  !isCorrect && feedback.checked // If checked and incorrect
                    ? "bg-red-600 hover:bg-red-700"
                    : "",
                  !feedback.checked && selectedAnswer // Default active blue if not checked yet
                    ? "bg-blue-600 hover:bg-blue-700"
                    : "",
                  // Fallback if no answer selected (covered by disabled state but good practice)
                  !selectedAnswer
                    ? "bg-gray-400"
                    : "bg-blue-600 hover:bg-blue-700"
                )}
                // Disable if correct shown, nothing selected, or already checked incorrectly
                disabled={
                  isCorrect ||
                  !selectedAnswer ||
                  (!isCorrect && feedback.checked)
                }
              >
                {checkButtonText}
              </button>

              {/* Explanation Toggle Button */}
              <button
                onClick={handleToggleExplanation}
                className={clsx(
                  navButtonBaseClasses, // Use consistent base padding/rounding
                  // Style like a secondary/outline button:
                  "bg-white border border-gray-400 text-gray-700 hover:bg-gray-100"
                )}
              >
                {showExplanation ? "Hide Explanation" : "Show Explanation"}
              </button>

              {/* Explanation Content */}
              {showExplanation && (
                // Ensure explanation also aligns well, give it full width in the flex container
                <div className="w-full mt-1 p-3 border-t border-gray-200 bg-gray-50 rounded">
                  <p className="font-semibold text-gray-800">Explanation:</p>
                  <p className="mb-2 text-gray-700">
                    {question_data.explanation || "No explanation provided."}
                  </p>
                  <p className="font-semibold text-green-700">
                    Correct Answer: {question_data.correct_answer}
                  </p>
                </div>
              )}
            </div>
          )}
          {/* End Practice Mode Controls */}
        </div>
        {/* End Right Column */}
      </div>
      {/* End Main Content Area */}
      {/* Bottom Navigation Bar (Fixed) */}
      <div className="fixed bottom-0 left-0 right-0 z-10 flex justify-between items-center bg-white px-4 sm:px-6 py-3 shadow-md border-t border-gray-200">
        {/* Back Button */}
        {prev_question_path ? (
          <Link to={prev_question_path} className={navLinkClasses}>
            Back
          </Link>
        ) : (
          <span className={navDisabledClasses}>
            Back
          </span> /* Disabled Back on first question */
        )}

        {/* Navigation Modal Trigger Button */}
        <button
          onClick={handleOpenNavModal}
          className="px-3 sm:px-4 py-2 rounded bg-gray-800 text-white hover:bg-gray-900 transition duration-200 text-xs sm:text-sm"
          aria-label="Open question navigation"
        >
          Question {question_order} of {total_questions_in_exam}
        </button>

        {/* Next / Review Button */}
        {next_question_path ? (
          <Link to={next_question_path} className={navLinkClasses}>
            Next
          </Link>
        ) : (
          /* On last question, show Review button instead of Next */
          <button
            onClick={navigateToReviewPage}
            className={`${navButtonBaseClasses} bg-blue-600 text-white hover:bg-blue-700`}
          >
            Review
          </button>
        )}
      </div>
      {/* --- Use the imported Modal Component --- */}
      {/* Pass all necessary props */}
      <NavigationModal
        isOpen={isNavModalOpen}
        onClose={() => setIsNavModalOpen(false)}
        examName={exam_name}
        totalQuestions={total_questions_in_exam}
        currentQuestionOrder={question_order}
        questionStatuses={allQuestionStatuses} // Pass the state holding LS data for all questions
        onNavigateToQuestion={navigateToQuestion}
        onNavigateToReview={navigateToReviewPage}
      />

      {/* --- *** EDIT QUESTION MODAL *** --- */}
      {isAdmin &&
        question_data && ( // Ensure data is loaded and user is admin
          <QuestionEditModal
            isOpen={isEditModalOpen}
            onClose={handleCloseEditModal}
            onSave={handleSaveQuestion} // Pass the save handler
            initialQuestionData={question_data} // Pass the current question's data
            isSaving={isSavingQuestion} // Pass saving state for button disable/text
          />
        )}

      {/* Submission Error Display (Only for direct submit fallback) */}
      {submitError && (
        <div className="fixed bottom-16 left-1/2 transform -translate-x-1/2 w-11/12 max-w-md z-20 mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded shadow-lg">
          <strong>Submission Error:</strong> {submitError}
        </div>
      )}
    </Layout>
  );
};

export default QuestionPage;
