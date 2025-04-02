// src/templates/question-page.js
import React, { useState, useEffect, useCallback } from "react";
import { Link, navigate } from "gatsby";
import clsx from "clsx";
import { supabase } from "../supabaseClient";
import Layout from "../components/Layout";
import { useAuth } from "../context/AuthContext";
import { useExamTimer } from "../context/ExamTimerContext"; // Import the timer hook

// --- Helper function for localStorage ---
const getExamAnswersKey = (examId) => `examAnswers_${examId}`;

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
  } = pageContext;

  // --- Auth and Authorization State ---
  const { user, isAdmin, loading: authLoading } = useAuth();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  const { formattedTime, resetTimer } = useExamTimer(); // Get timer state and reset functions
  const [selectedAnswer, setSelectedAnswer] = useState(null); // Initial state is null
  const [showExplanation, setShowExplanation] = useState(false);
  const [feedback, setFeedback] = useState({ correct: null, checked: false });
  const [isMarked, setIsMarked] = useState(false);
  const [checkButtonText, setCheckButtonText] = useState("Check Answer");
  const [isCorrect, setIsCorrect] = useState(false);
  const [incorrectAnswers, setIncorrectAnswers] = useState(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false); // <-- Add submission state
  const [submitError, setSubmitError] = useState(null); // <-- Add error state

  // --- Authorization Check Effect (Keep as is) ---
  useEffect(() => {
    if (authLoading) {
      setCheckingAuth(true);
      return;
    }
    if (!user) {
      navigate("/login/");
      return;
    }
    if (isAdmin) {
      setIsAuthorized(true);
      setCheckingAuth(false);
      return;
    }
    const checkStudentAccess = async () => {
      try {
        const { error, count } = await supabase
          .from("user_exam_access")
          .select("exam_id", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("exam_id", exam_id);
        if (error) throw error;
        if (count > 0) {
          setIsAuthorized(true);
        } else {
          setIsAuthorized(false);
          // Optional: navigate('/exams/');
        }
      } catch (err) {
        console.error("Error checking access:", err);
        setIsAuthorized(false);
        // Optional: navigate('/exams/');
      } finally {
        setCheckingAuth(false);
      }
    };
    checkStudentAccess();
  }, [user, isAdmin, authLoading, exam_id]);

  // --- Load Answer from Local Storage Effect ---
  useEffect(() => {
    // Only run if authorized and question data exists
    if (!isAuthorized || !question_data) return;

    const storageKey = getExamAnswersKey(exam_id);
    try {
      const storedAnswersRaw = localStorage.getItem(storageKey);
      if (storedAnswersRaw) {
        const storedAnswers = JSON.parse(storedAnswersRaw);
        const previousAnswer = storedAnswers[question_order]; // Get answer for *this* question order
        if (previousAnswer) {
          setSelectedAnswer(previousAnswer);
          console.log(
            `Loaded answer ${previousAnswer} for question ${question_order} from localStorage`
          );
        } else {
          setSelectedAnswer(null); // Reset if no answer stored for this specific question
        }
      } else {
        setSelectedAnswer(null); // Reset if no answers object exists yet for the exam
      }
    } catch (error) {
      console.error("Error reading answers from localStorage:", error);
      // Optionally clear corrupted data: localStorage.removeItem(storageKey);
      setSelectedAnswer(null); // Reset on error
    }
    setIncorrectAnswers(new Set());
    // Reset explanation visibility when question changes
    setShowExplanation(false);
    // We could load/save the 'isMarked' state similarly if desired
  }, [exam_id, question_order, isAuthorized, question_data]); // Rerun when question changes or auth resolves

  // --- Save Answer to Local Storage Function (called by handleSelectAnswer) ---
  const saveAnswerToLocalStorage = (choice) => {
    if (!isAuthorized) return; // Don't save if not authorized

    const storageKey = getExamAnswersKey(exam_id);
    try {
      const storedAnswersRaw = localStorage.getItem(storageKey);
      let currentAnswers = {};
      if (storedAnswersRaw) {
        currentAnswers = JSON.parse(storedAnswersRaw);
      }
      // Update the answer for the current question
      currentAnswers[question_order] = choice;
      // Save back to localStorage
      localStorage.setItem(storageKey, JSON.stringify(currentAnswers));
      console.log(
        `Saved answer ${choice} for question ${question_order} to localStorage`
      );
    } catch (error) {
      console.error("Error saving answer to localStorage:", error);
    }
  };

  // --- Handlers ---
  const handleSelectAnswer = (answerChoice) => {
    setSelectedAnswer(answerChoice);
    // Reset feedback on new selection, but keep 'checked' as true

    if (incorrectAnswers.has(answerChoice)) {
      const newIncorrectAnswers = new Set(incorrectAnswers);
      newIncorrectAnswers.delete(answerChoice);
      setIncorrectAnswers(newIncorrectAnswers);
    }

    setFeedback({ correct: null, checked: false });
    setIsCorrect(false);
    saveAnswerToLocalStorage(answerChoice); // <<< SAVE HERE

    console.log("Selected:", answerChoice);
  };

  const handleCheck = () => {
    if (selectedAnswer) {
      const correct = selectedAnswer === question_data.correct_answer;
      setFeedback({ correct: correct, checked: true });
      setIsCorrect(correct);
      if (correct) {
        setCheckButtonText("Correct!");
      } else {
        setCheckButtonText("Check Again");
        setIncorrectAnswers(new Set(incorrectAnswers).add(selectedAnswer));
      }
    }
  };

  const handleToggleExplanation = () => setShowExplanation(!showExplanation);
  const handleMarkForReview = () => setIsMarked(!isMarked); // Could also save this to localStorage if needed

  // --- Optional: Handler for Finishing Exam ---
  const handleFinishExam = useCallback(async () => {
    // Prevent double submission
    if (isSubmitting) return;

    setIsSubmitting(true);
    setSubmitError(null);
    const storageKey = getExamAnswersKey(exam_id);

    try {
      // 1. Get answers from localStorage
      const storedAnswersRaw = localStorage.getItem(storageKey);
      const userAnswers = storedAnswersRaw ? JSON.parse(storedAnswersRaw) : {};

      if (Object.keys(userAnswers).length === 0) {
        // Optional: Add confirmation if no answers are saved?
        console.warn("No answers saved in localStorage to submit.");
        // Maybe still allow submission if intended? Or show warning.
      }

      // 2. Call the Edge Function
      const { data, error } = await supabase.functions.invoke("submit-exam", {
        body: {
          examId: exam_id,
          userAnswers: userAnswers, // Send the answers object
        },
      });

      if (error) {
        // Handle function invocation errors (network, permissions, etc.)
        console.error("Error invoking submit-exam function:", error);
        throw new Error(error.message || "Failed to submit exam.");
      }

      if (data && data.error) {
        // Handle errors returned *from* the function logic (e.g., validation, db error)
        console.error("Error during exam submission:", data.error);
        throw new Error(data.error); // Throw the specific error message from the function
      }

      // 3. Success: Cleanup and Navigate
      console.log("Exam submitted successfully:", data);
      localStorage.removeItem(storageKey); // Clear answers for this exam
      resetTimer(exam_id); // Reset and clear the timer state

      // Navigate to a results page (pass the result ID or exam ID)
      // Option 1: Navigate using result ID (if you create a specific page for one result)
      // if (data?.resultId) {
      //   navigate(`/exam-result/${data.resultId}/`);
      // } else {
      navigate("/exams/"); // Fallback
      // }

      // Option 2: Navigate to a general results overview for that exam
      // navigate(`/exam-results/${exam_id}/`);
    } catch (err) {
      console.error("Submission failed:", err);
      setSubmitError(
        err.message || "An unexpected error occurred during submission."
      );
      // Don't clear localStorage or timer on error, allow retry
    } finally {
      setIsSubmitting(false); // Re-enable button
    }
  }, [exam_id, resetTimer, isSubmitting]); // Add isSubmitting to dependency array

  if (authLoading || checkingAuth) {
    return (
      <Layout>
        <p>Checking permissions...</p>
      </Layout>
    );
  }

  if (!isAuthorized) {
    return (
      <Layout>
        <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
        <p>You do not have permission to view this exam.</p>
        <Link
          to="/exams/"
          className="text-blue-600 hover:underline mt-4 inline-block"
        >
          Back to Exams
        </Link>
      </Layout>
    );
  }

  if (!question_data) {
    return (
      <Layout>
        <p className="text-red-600">Error: Question data not found.</p>
        <Link to="/exams/">Back to Exams</Link>
      </Layout>
    );
  }

  const answerButtonBaseClasses =
    "flex items-baseline text-left w-full mb-3 p-3 border rounded transition duration-150 disabled:opacity-50 disabled:cursor-not-allowed"; // Added flex items-baseline text-left
  const navButtonBaseClasses = "px-4 py-2 rounded transition duration-200";
  const navLinkClasses = `${navButtonBaseClasses} bg-gray-600 text-white hover:bg-gray-700`;
  const navDisabledClasses = `${navButtonBaseClasses} text-gray-400 cursor-not-allowed bg-gray-200`;

  return (
    <Layout>
      {/* Top Bar (as before) */}
      <div className="flex justify-between items-center mb-5 pb-3 border-b border-gray-200">
        <span className="font-semibold">{exam_name}</span>
        <span>{formattedTime}</span>
        <span className="text-sm text-gray-600">
          {question_order} / {total_questions_in_exam}
        </span>
      </div>

      <div className="flex flex-col md:flex-row gap-5">
        {/* Left Column */}
        <div className="md:w-1/2 md:border-r md:border-gray-200 md:pr-5">
          <div
            dangerouslySetInnerHTML={{ __html: question_data.question_html }}
          />
        </div>
        {/* Right Column */}
        <div className="md:w-1/2">
          <button
            onClick={handleMarkForReview}
            className={clsx(
              "mb-4 px-3 py-1 border rounded transition duration-150",
              isMarked
                ? "bg-yellow-100 border-yellow-400"
                : "border-gray-400 hover:bg-gray-100"
            )}
          >
            {isMarked ? "Unmark Review" : "Mark for Review"}
          </button>
          {question_data.leading_sentence && (
            <p className="italic text-gray-600 mb-4">
              {question_data.leading_sentence}
            </p>
          )}

          {/* Answer Buttons */}
          {["A", "B", "C", "D"].map((choice) => {
            const answerText = question_data[`answer_${choice.toLowerCase()}`];
            if (!answerText) return null;
            // Determine button styling based on state and feedback
            const isCorrectAnswer = choice === question_data.correct_answer;
            const isSelected = selectedAnswer === choice;
            const isIncorrect = incorrectAnswers.has(choice);

            let buttonClasses = [answerButtonBaseClasses]; // Start with base + flex classes

            if (isIncorrect) {
              buttonClasses.push(
                "bg-red-200 border-red-500 text-red-900 font-semibold line-through"
              ); // Incorrect selected + strikethrough
            } else if (isCorrect && isSelected) {
              buttonClasses.push(
                "bg-green-200 border-green-500 text-green-900 font-semibold"
              ); // Correct (whether selected or not)
            } else {
              // If not checked yet
              if (isSelected) {
                buttonClasses.push("bg-blue-100 border-blue-400"); // Currently selected
              } else {
                buttonClasses.push("border-gray-300 hover:bg-gray-50 bg-white"); // Not selected
              }
            }

            return (
              <button
                key={choice}
                onClick={() => handleSelectAnswer(choice)}
                className={clsx(buttonClasses)} // Use clsx to combine classes
                disabled={isCorrect}
              >
                {/* Flexbox applied via answerButtonBaseClasses handles inline */}
                <strong className="mr-2 flex-shrink-0">{choice}.</strong>
                <div
                  className="flex-grow" // Allow text to take remaining space
                  dangerouslySetInnerHTML={{ __html: answerText }}
                />
              </button>
            );
          })}

          {/* Explanation (as before) */}
          {allow_practice_mode && (
            <div className="mt-5">
              <button
                onClick={handleToggleExplanation}
                className="px-3 py-1 border border-gray-400 rounded hover:bg-gray-100 transition duration-150"
              >
                {showExplanation ? "Hide Explanation" : "Show Explanation"}
              </button>
              {showExplanation && (
                <div className="mt-3 p-3 border-dashed border-gray-400 bg-gray-50 rounded">
                  <p className="font-semibold">Explanation:</p>
                  <p className="mb-2">
                    {question_data.explanation || "No explanation provided."}
                  </p>
                  <p className="font-semibold">
                    Correct Answer: {question_data.correct_answer}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-10 flex justify-between items-center bg-white px-6 py-3 shadow-md">
        {/* Back Button */}
        {prev_question_path ? (
          <Link to={prev_question_path} className={navLinkClasses}>
            Back
          </Link>
        ) : (
          <span className={navDisabledClasses}>Back</span>
        )}
        {/* Check Answer Button (conditional rendering might be better if not practice mode) */}
        {allow_practice_mode && (
          <button
            onClick={handleCheck}
            className={clsx(
              `${navButtonBaseClasses}  text-white `,
              !selectedAnswer ? "bg-gray-400 cursor-not-allowed" : "",
              isCorrect ? "bg-green-600 hover:bg-green-700" : "",
              feedback.correct === false
                ? "bg-red-600 hover:bg-red-700"
                : "bg-blue-600 hover:bg-blue-700"
            )}
            disabled={isCorrect || !selectedAnswer}
          >
            {checkButtonText}
          </button>
        )}
        {/* Spacer if check button isn't shown */}
        {!allow_practice_mode && <div></div>}
        {/* Next/Finish Button */}
        {next_question_path ? (
          <Link to={next_question_path} className={navLinkClasses}>
            Next
          </Link>
        ) : question_order === total_questions_in_exam ? (
          // Use the button with the cleanup handler
          <button
            onClick={handleFinishExam}
            className={`${navButtonBaseClasses} bg-green-600 text-white hover:bg-green-700`}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Submitting..." : "Finish Exam"}
          </button>
        ) : (
          <span className={navDisabledClasses}>Next</span>
        )}
      </div>
      {/* Submission Error Display */}
      {submitError && (
        <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          <strong>Submission Error:</strong> {submitError}
        </div>
      )}
    </Layout>
  );
};

export default QuestionPage;
