// src/templates/exam-review-page.js
import React, { useState, useEffect, useCallback } from "react";
import { Link, navigate } from "gatsby";
import { supabase } from "../supabaseClient";
import Layout from "../components/Layout";
import { useAuth } from "../context/AuthContext";
import { useExamTimer } from "../context/ExamTimerContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
// Import icon if you decide to mark current location here too
// import { faLocationDot } from '@fortawesome/free-solid-svg-icons';

// --- Re-use LocalStorage Helpers ---
const getExamStateKey = (examId) => `examState_${examId}`;

const loadExamStateFromLocalStorage = (examId) => {
  // Ensure this runs only client-side
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

const ExamReviewPage = ({ pageContext }) => {
  const {
    exam_id,
    exam_name,
    total_questions_in_exam,
    all_question_paths,
    questionOrderToIdMap, // Destructure the new map
  } = pageContext;
  const { user, loading: authLoading } = useAuth();
  const { formattedTime, resetTimer, pauseTimer, resumeTimer } = useExamTimer(); // Use pause/resume if needed

  const [questionStatuses, setQuestionStatuses] = useState({
    answers: {},
    marked: {},
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [lastQuestionPath, setLastQuestionPath] = useState(null); // To store where user came from

  // Load statuses and potentially store last question path on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      // Client-side only
      if (exam_id) {
        setQuestionStatuses(loadExamStateFromLocalStorage(exam_id));
      }
      // Store the previous path if available (useful for 'Back to Question' button)
      if (window.history.state && window.history.state.referrerPath) {
        setLastQuestionPath(window.history.state.referrerPath);
      } else {
        // Fallback: try to guess last question if not available in state
        const lastQ = total_questions_in_exam;
        if (all_question_paths && all_question_paths[lastQ]) {
          setLastQuestionPath(all_question_paths[lastQ]);
        }
      }
      // Optional: pause timer on review page?
      // pauseTimer();
      // return () => resumeTimer(); // Resume if they navigate away
    }

    // Optional: Redirect if no user?
    // if (!authLoading && !user && typeof window !== 'undefined') {
    //   navigate('/login/');
    // }
  }, [exam_id, total_questions_in_exam, all_question_paths]); // Removed auth dependencies for simplicity here

  const navigateToQuestion = (qNum) => {
    const path = all_question_paths?.[qNum];
    if (path) {
      // Pass current path so the question page knows where we came from
      navigate(path, { state: { referrerPath: `/exam-review/${exam_id}/` } });
    } else {
      console.error(`Path for question ${qNum} not found.`);
      // navigate(`/exam/${exam_id}/question/${qNum}/`); // Fallback
    }
  };

  const handleGoBack = () => {
    if (lastQuestionPath) {
      navigate(lastQuestionPath);
    } else {
      // Fallback if we couldn't determine the last question path
      if (
        total_questions_in_exam > 0 &&
        all_question_paths?.[total_questions_in_exam]
      ) {
        navigate(all_question_paths[total_questions_in_exam]);
      } else {
        console.warn("Could not determine path to go back to.");
        // Or navigate to a default place like the first question or exam list
        // navigate('/exams/');
      }
    }
  };

  // --- Submission Logic (copied from question-page) ---
  const handleFinishExam = useCallback(async () => {
    if (isSubmitting || typeof window === "undefined") return;
    setIsSubmitting(true);
    setSubmitError(null);

    // Load the absolute latest state from LS before submitting
    const finalExamState = loadExamStateFromLocalStorage(exam_id);
    const userAnswers = finalExamState.answers || {};
    // Extract marked question ORDERS
    const markedOrders = Object.keys(finalExamState.marked || {}).filter(
      (key) => finalExamState.marked[key] === true
    );
    // Map marked orders to actual question IDs using the map from context
    const markedQuestionIds = markedOrders
      .map((order) => questionOrderToIdMap?.[order]) // Get ID from map
      .filter((id) => id !== undefined && id !== null); // Filter out any undefined/null IDs

    // Optional: Log if mapping failed for some orders
    if (markedOrders.length !== markedQuestionIds.length) {
      console.warn("Could not map all marked question orders to IDs:", {
        markedOrders,
        markedQuestionIds,
      });
    }

    // Check if *any* questions have been answered
    const answeredCount = Object.keys(userAnswers).length;
    if (answeredCount === 0) {
      alert("Please answer at least one question before submitting.");
      setIsSubmitting(false);
      return;
    }

    // Optional: Check if any questions are *unanswered* (but at least one is answered)
    if (answeredCount < total_questions_in_exam) {
      const unmarkedCount = total_questions_in_exam - answeredCount;
      const confirmSubmit = window.confirm(
        `You have ${unmarkedCount} unanswered question(s). Are you sure you want to submit?`
      );
      if (!confirmSubmit) {
        setIsSubmitting(false);
        return;
      }
    }

    try {
      const { data, error } = await supabase.functions.invoke("submit-exam", {
        body: {
          examId: exam_id,
          userAnswers: userAnswers,
          markedQuestions: markedQuestionIds, // Send the array of actual IDs
        },
      });

      if (error) throw new Error(error.message || "Failed to submit exam.");
      if (data && data.error) throw new Error(data.error);

      console.log("Exam submitted successfully:", data);
      localStorage.removeItem(getExamStateKey(exam_id)); // Clear state
      resetTimer(exam_id); // Reset timer state for this exam

      if (data?.resultId) {
        navigate(`/exam-result/${data.resultId}/`);
      } else {
        console.error("Submission successful but no resultId received.");
        navigate("/exams/"); // Fallback navigation
      }
    } catch (err) {
      console.error("Submission failed:", err);
      setSubmitError(
        err.message || "An unexpected error occurred during submission."
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [
    exam_id,
    resetTimer,
    isSubmitting,
    total_questions_in_exam,
    questionOrderToIdMap, // Add missing dependency
  ]);

  // --- Grid Styling Function ---
  const getStatusClass = (qNum) => {
    const isMarked = questionStatuses?.marked?.[qNum];
    const isAnswered =
      questionStatuses?.answers?.[qNum] !== undefined &&
      questionStatuses?.answers?.[qNum] !== null;

    let classes =
      "w-full aspect-square border border-gray-400 flex items-center justify-center rounded text-sm font-medium cursor-pointer transition-colors duration-150 ";

    if (isMarked) {
      classes += " bg-yellow-300 border-yellow-500 hover:bg-yellow-400 ";
    } else if (isAnswered) {
      classes += " bg-blue-500 border-blue-700 text-white hover:bg-blue-600 ";
    } else {
      classes += " bg-white hover:bg-gray-100 ";
    }
    return classes;
  };

  if (authLoading) {
    return (
      <Layout>
        <p>Loading...</p>
      </Layout>
    );
  }
  // Add check for exam_id just in case
  if (!exam_id) {
    return (
      <Layout>
        <p>Error: Exam information missing.</p>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between mb-6 pb-3 border-b border-gray-200 gap-2">
        <h1 className="text-xl font-semibold text-center sm:text-left">
          Check Your Work
        </h1>
        <div className="text-center">
          <span className="font-semibold">{exam_name}</span>
          <div className="text-sm text-gray-600">{formattedTime}</div>
        </div>
        <button
          onClick={handleGoBack}
          className="text-blue-600 hover:underline text-sm"
        >
          Back to Question
        </button>
      </div>

      <p className="text-center text-gray-700 mb-4 text-sm sm:text-base">
        Look over your work, go back to questions you marked for review, and
        answer any questions you skipped. Remember, there's no penalty for
        guessing.
      </p>
      <p className="text-center text-red-600 font-medium mb-6 text-sm sm:text-base">
        When the timer reaches zero, you'll automatically move on.{" "}
        <span className="font-bold">Please stay seated and remain quiet.</span>
      </p>

      {/* Question Grid */}
      <div className="max-w-xl mx-auto mb-8 px-4">
        {" "}
        {/* Added padding */}
        <h3 className="text-center font-medium mb-4 text-lg">{exam_name}</h3>
        <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-11 gap-2">
          {" "}
          {/* Responsive grid */}
          {Array.from({ length: total_questions_in_exam }, (_, i) => i + 1).map(
            (qNum) => (
              <button
                key={qNum}
                className={getStatusClass(qNum)}
                onClick={() => navigateToQuestion(qNum)}
                aria-label={`Go to question ${qNum}`}
              >
                {qNum}
              </button>
            )
          )}
        </div>
        {/* Legend (same as modal) */}
        <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-gray-600 mt-5 border-t pt-3">
          <div className="flex items-center">
            <span className="w-3 h-3 rounded-sm bg-blue-500 border border-blue-700 mr-1.5"></span>{" "}
            Answered
          </div>
          <div className="flex items-center">
            <span className="w-3 h-3 rounded-sm bg-yellow-300 border border-yellow-500 mr-1.5"></span>{" "}
            Marked
          </div>
          <div className="flex items-center">
            <span className="w-3 h-3 rounded-sm bg-white border border-gray-400 mr-1.5"></span>{" "}
            Not Answered
          </div>
        </div>
      </div>

      {/* Submission Error Display */}
      {submitError && (
        <div className="mt-4 mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded max-w-lg mx-auto text-sm">
          <strong>Submission Error:</strong> {submitError}
        </div>
      )}

      {/* Bottom Submit Button */}
      <div className="flex justify-center mt-8 mb-6">
        <button
          onClick={handleFinishExam}
          className="px-8 py-3 rounded bg-green-600 text-white hover:bg-green-700 transition duration-200 text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Submitting Module..." : "Submit Module"}
        </button>
      </div>
    </Layout>
  );
};

export default ExamReviewPage;
