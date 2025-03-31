// src/templates/question-page.js
import React, { useState, useEffect } from "react"; // Keep useEffect/useState
import { Link, navigate } from "gatsby"; // Import navigate
import clsx from "clsx";
import { supabase } from "../supabaseClient";
import Layout from "../components/Layout";
import { useAuth } from "../context/AuthContext"; // Import useAuth

// Timer component (keep as is)
const Timer = () => {
  /* ... */
  const [time, setTime] = useState(0);
  useEffect(() => {
    const intervalId = setInterval(
      () => setTime((prevTime) => prevTime + 1),
      1000
    );
    return () => clearInterval(intervalId);
  }, []);
  const hours = Math.floor(time / 3600)
    .toString()
    .padStart(2, "0");
  const minutes = Math.floor((time % 3600) / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (time % 60).toString().padStart(2, "0");
  return (
    <span>
      {hours}:{minutes}:{seconds}
    </span>
  );
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
  } = pageContext;

  // --- Auth and Authorization State ---
  const { user, isAdmin, loading: authLoading } = useAuth(); // Get auth info
  const [isAuthorized, setIsAuthorized] = useState(false); // Permission for *this specific* exam
  const [checkingAuth, setCheckingAuth] = useState(true); // Loading state for the permission check

  // --- Component State (remains the same) ---
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [feedback, setFeedback] = useState({ correct: null, checked: false });
  const [isMarked, setIsMarked] = useState(false);

  // --- Authorization Check Effect ---
  useEffect(() => {
    // Don't run check until auth context is loaded
    if (authLoading) {
      setCheckingAuth(true);
      return;
    }

    // 1. Check if logged in
    if (!user) {
      navigate("/login/"); // Redirect to login if not authenticated
      return; // Stop processing
    }

    // 2. Check if Admin
    if (isAdmin) {
      console.log(`Admin access granted for exam ${exam_id}`);
      setIsAuthorized(true);
      setCheckingAuth(false);
      return; // Admins have access to everything
    }

    // 3. If not admin, check student access via user_exam_access table
    const checkStudentAccess = async () => {
      try {
        // Use head: true count for efficiency - just check if a row exists
        const { error, count } = await supabase
          .from("user_exam_access")
          .select("exam_id", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("exam_id", exam_id);

        if (error) {
          console.error(`Error checking access for exam ${exam_id}:`, error);
          throw error; // Handle error below
        }

        if (count > 0) {
          console.log(`Student access granted for exam ${exam_id}`);
          setIsAuthorized(true);
        } else {
          console.warn(`Student access denied for exam ${exam_id}`);
          setIsAuthorized(false);
          // Optional: Redirect immediately if denied
          // navigate('/exams/'); // Redirect to exam list or an 'unauthorized' page
        }
      } catch (err) {
        setIsAuthorized(false);
        // Optional: Redirect on error
        // navigate('/exams/');
      } finally {
        setCheckingAuth(false); // Finished checking authorization
      }
    };

    checkStudentAccess();

    // Dependencies for the effect
  }, [user, isAdmin, authLoading, exam_id]); // Re-run if any of these change

  // --- Handlers (remain the same) ---
  const handleSelectAnswer = (answerChoice) => {
    /* ... */
    if (!feedback.checked) {
      setSelectedAnswer(answerChoice);
      setFeedback({ correct: null, checked: false });
    }
    console.log("Selected:", answerChoice);
  };
  const handleCheck = () => {
    /* ... */
    if (selectedAnswer) {
      const isCorrect = selectedAnswer === question_data.correct_answer;
      setFeedback({ correct: isCorrect, checked: true });
      console.log(
        "Checked:",
        selectedAnswer,
        "Correct:",
        question_data.correct_answer,
        "Result:",
        isCorrect
      );
    }
  };
  const handleToggleExplanation = () => setShowExplanation(!showExplanation);
  const handleMarkForReview = () => setIsMarked(!isMarked);

  // --- Render Logic ---

  // Handle loading states first
  if (authLoading || checkingAuth) {
    return (
      <Layout>
        <p>Checking permissions...</p>
      </Layout>
    );
  }

  // Handle unauthorized access after checks are complete
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

  // --- Render Question Content (Only if authorized) ---
  if (!question_data) {
    // This case should be less likely now but good to keep
    return (
      <Layout>
        <p className="text-red-600">Error: Question data not found.</p>
        <Link to="/exams/">Back to Exams</Link>
      </Layout>
    );
  }

  // Define base classes (remains the same)
  const answerButtonBaseClasses =
    "block w-full text-left mb-3 p-3 border rounded transition duration-150 disabled:opacity-50 disabled:cursor-not-allowed";
  const navButtonBaseClasses = "px-4 py-2 rounded transition duration-200";
  const navLinkClasses = `${navButtonBaseClasses} bg-gray-600 text-white hover:bg-gray-700`;
  const navDisabledClasses = `${navButtonBaseClasses} text-gray-400 cursor-not-allowed bg-gray-200`;

  return (
    <Layout>
      {/* Top Bar */}
      <div className="flex justify-between items-center mb-5 pb-3 border-b border-gray-200">
        {/* ... */}
        <span className="font-semibold">{exam_name}</span>
        <span>
          <Timer />
        </span>
        <span className="text-sm text-gray-600">
          {question_order} / {total_questions_in_exam}
        </span>
      </div>

      {/* Main Content */}
      <div className="flex flex-col md:flex-row gap-5">
        {/* Left Column */}
        <div className="md:w-2/3 md:border-r md:border-gray-200 md:pr-5">
          {/* ... */}
          <div
            dangerouslySetInnerHTML={{ __html: question_data.question_html }}
          />
        </div>
        {/* Right Column */}
        <div className="md:w-1/3">
          {/* ... (Mark, Leading Sentence, Buttons, Explanation) ... */}
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
          {["A", "B", "C", "D"].map((choice) => {
            const answerText = question_data[`answer_${choice.toLowerCase()}`];
            if (!answerText) return null;
            return (
              <button
                key={choice}
                onClick={() => handleSelectAnswer(choice)}
                className={clsx(
                  answerButtonBaseClasses,
                  selectedAnswer === choice &&
                    !feedback.checked &&
                    "bg-blue-100 border-blue-400",
                  feedback.checked &&
                    selectedAnswer === choice &&
                    (feedback.correct
                      ? "bg-green-200 border-green-500 text-green-900 font-semibold"
                      : "bg-red-200 border-red-500 text-red-900 font-semibold"),
                  feedback.checked &&
                    choice === question_data.correct_answer &&
                    "bg-green-200 border-green-500 text-green-900 font-semibold",
                  selectedAnswer !== choice &&
                    !feedback.checked &&
                    "border-gray-300 hover:bg-gray-50"
                )}
                disabled={feedback.checked}
              >
                {" "}
                <strong className="mr-2">{choice}.</strong> {answerText}{" "}
              </button>
            );
          })}
          {allow_practice_mode && (
            <div className="mt-5">
              {" "}
              <button
                onClick={handleToggleExplanation}
                className="px-3 py-1 border border-gray-400 rounded hover:bg-gray-100 transition duration-150"
              >
                {" "}
                {showExplanation ? "Hide Explanation" : "Show Explanation"}{" "}
              </button>{" "}
              {showExplanation && (
                <div className="mt-3 p-3 border-dashed border-gray-400 bg-gray-50 rounded">
                  {" "}
                  <p className="font-semibold">Explanation:</p>{" "}
                  <p className="mb-2">
                    {question_data.explanation || "No explanation provided."}
                  </p>{" "}
                  <p className="font-semibold">
                    Correct Answer: {question_data.correct_answer}
                  </p>{" "}
                </div>
              )}{" "}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="flex justify-between items-center mt-8 pt-3 border-t border-gray-200">
        {/* ... (Back/Check/Next buttons) ... */}
        {prev_question_path ? (
          <Link to={prev_question_path} className={navLinkClasses}>
            Back
          </Link>
        ) : (
          <span className={navDisabledClasses}>Back</span>
        )}
        <button
          onClick={handleCheck}
          disabled={!selectedAnswer || feedback.checked}
          className={`${navButtonBaseClasses} bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed`}
        >
          {" "}
          Check Answer{" "}
        </button>
        {next_question_path ? (
          <Link to={next_question_path} className={navLinkClasses}>
            Next
          </Link>
        ) : question_order === total_questions_in_exam ? (
          <Link
            to="/exams/"
            className={`${navButtonBaseClasses} bg-green-600 text-white hover:bg-green-700`}
          >
            Finish Exam
          </Link>
        ) : (
          <span className={navDisabledClasses}>Next</span>
        )}
      </div>
    </Layout>
  );
};

export default QuestionPage;
