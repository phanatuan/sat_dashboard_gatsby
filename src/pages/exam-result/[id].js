import React, { useState, useEffect } from "react";
import { Link, navigate } from "gatsby";
import { supabase } from "../../supabaseClient";
import Layout from "../../components/Layout";
import QuestionReviewModal from "../../components/QuestionReviewModal";
import { useAuth } from "../../context/AuthContext";
import clsx from "clsx";

const ExamResultPage = (props) => {
  const { user, loading: authLoading } = useAuth();
  const resultId = props.params.id; // Get result ID from Gatsby's params
  console.log("ExamResultPage: resultId:", resultId);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [resultData, setResultData] = useState(null);
  const [examData, setExamData] = useState(null);
  const [questions, setQuestions] = useState([]); // Array to hold combined question data

  // State for the review modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState(null);

  useEffect(() => {
    if (authLoading) return; // Wait for auth to load
    if (!user) {
      navigate("/login/"); // Redirect if not logged in
      return;
    }
    if (!resultId) {
      setError("Result ID not found in URL.");
      setLoading(false);
      return;
    }

    const fetchResultData = async () => {
      setLoading(true);
      setError(null);

      try {
        // 1. Fetch the specific exam result, ensuring it belongs to the current user
        const { data: result, error: resultError } = await supabase
          .from("exam_results")
          .select(
            `
            *,
            exams ( exam_name, section_name )
          `
          )
          .eq("id", resultId)
          .eq("user_id", user.id) // Security check!
          .single();

        if (resultError) throw resultError;
        if (!result) throw new Error("Exam result not found or access denied.");

        setResultData(result);
        setExamData(result.exams); // Store nested exam data

        // 2. Fetch all questions associated with this exam
        const { data: examQuestions, error: questionsError } = await supabase
          .from("exam_questions")
          .select(
            `
            question_order,
            questions ( question_id, question_html, leading_sentence, answer_a, answer_b, answer_c, answer_d, correct_answer, explanation )
          `
          )
          .eq("exam_id", result.exam_id)
          .order("question_order", { ascending: true });

        if (questionsError) throw questionsError;
        if (!examQuestions)
          throw new Error("Could not fetch questions for this exam.");

        // 3. Combine question data with user's answers from the result
        const detailedQuestions = examQuestions.map((eq) => {
          const questionDetails = eq.questions;
          const userAnswer = result.user_answers?.[eq.question_order] || null; // Get user answer from JSONB
          const isCorrect = userAnswer === questionDetails.correct_answer;

          return {
            ...questionDetails, // Spread all question fields (question_id, html, options, etc.)
            question_order: eq.question_order,
            user_answer: userAnswer,
            is_correct: isCorrect,
          };
        });

        setQuestions(detailedQuestions);
      } catch (err) {
        console.error("Error fetching result data:", err);
        setError(err.message || "Failed to load exam results.");
      } finally {
        setLoading(false);
      }
    };

    fetchResultData();
  }, [resultId, user, authLoading]); // Rerun if user or resultId changes

  const handleReviewClick = (question) => {
    setSelectedQuestion(question);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedQuestion(null);
  };

  // --- Render Logic ---

  if (authLoading || loading) {
    return (
      <Layout>
        <p>Loading results...</p>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <p className="text-red-600">Error: {error}</p>
      </Layout>
    );
  }

  if (!resultData || !examData || questions.length === 0) {
    return (
      <Layout>
        <p>Could not load complete result data.</p>
      </Layout>
    );
  }

  const incorrectCount = resultData.total_questions - resultData.correct_count;
  const submissionDate = resultData.submitted_at
    ? new Date(resultData.submitted_at).toLocaleString()
    : "N/A";

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6">
        {/* Score Details Header */}
        <div className="mb-6 p-4 border border-gray-300 rounded bg-gray-50">
          <h1 className="text-2xl font-bold mb-3">Score Details</h1>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
            <div>
              <strong>Exam:</strong> {examData.exam_name}
            </div>
            <div>
              <strong>Module:</strong> {examData.section_name || "N/A"}
            </div>
            <div>
              <strong>Submitted:</strong> {submissionDate}
            </div>
            {/* Add score display if needed: <div><strong>Score:</strong> {resultData.score_percentage}%</div> */}
          </div>
          {/* You could add the timer/duration here if you calculate and store it */}
          {/* <div className="mt-2"><strong>Time Taken:</strong> 00:00:00 </div> */}
        </div>

        {/* Questions Overview Stats */}
        <div className="mb-6 p-4 border border-gray-300 rounded">
          <h2 className="text-xl font-semibold mb-3">Questions Overview</h2>
          <div className="flex justify-around text-center">
            <div>
              <div className="text-2xl font-bold">
                {resultData.total_questions}
              </div>
              <div className="text-sm text-gray-600">Total Questions</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {resultData.correct_count}
              </div>
              <div className="text-sm text-gray-600">Correct Answers</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-600">
                {incorrectCount}
              </div>
              <div className="text-sm text-gray-600">Incorrect Answers</div>
            </div>
          </div>
        </div>

        {/* Questions Table */}
        <div className="overflow-x-auto">
          <h2 className="text-xl font-semibold mb-3">Questions</h2>
          <table className="min-w-full bg-white border border-gray-300">
            <thead className="bg-gray-100">
              <tr>
                <th className="py-2 px-3 border-b text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  No.
                </th>
                <th className="py-2 px-3 border-b text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Question
                </th>
                <th className="py-2 px-3 border-b text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Correct Answer
                </th>
                <th className="py-2 px-3 border-b text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Your Answer
                </th>
                <th className="py-2 px-3 border-b text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {questions.map((q, index) => (
                <tr
                  key={q.question_id}
                  className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
                >
                  <td className="py-2 px-3 border-b text-sm">
                    {q.question_order}
                  </td>
                  <td className="py-2 px-3 border-b text-sm">
                    {/* Display leading sentence or truncated HTML */}
                    {q.leading_sentence || `Question ${q.question_order}`}
                  </td>
                  <td className="py-2 px-3 border-b text-sm font-medium text-green-700">
                    {q.correct_answer}
                  </td>
                  <td
                    className={clsx(
                      "py-2 px-3 border-b text-sm font-medium",
                      q.user_answer === null
                        ? "text-gray-500 italic"
                        : q.is_correct
                        ? "text-green-700"
                        : "text-red-700"
                    )}
                  >
                    {q.user_answer ?? "Omitted"}{" "}
                    {/* Display 'Omitted' if null */}
                  </td>
                  <td className="py-2 px-3 border-b text-sm">
                    <button
                      onClick={() => handleReviewClick(q)}
                      className="text-blue-600 hover:text-blue-800 hover:underline text-xs px-2 py-1 rounded border border-blue-600 hover:bg-blue-50 transition duration-150"
                    >
                      Review
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <QuestionReviewModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        questionData={selectedQuestion}
      />
    </Layout>
  );
};

export default ExamResultPage;
