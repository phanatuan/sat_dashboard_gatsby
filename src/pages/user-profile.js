import React, { useState, useEffect, useMemo } from "react"; // Import useMemo
import { Link } from "gatsby";
import Layout from "../components/Layout";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../supabaseClient"; // Import Supabase client
import QuestionReviewModal from "../components/QuestionReviewModal"; // Import the modal
import { decodeMojibake } from "../utils/decodeHtml"; // Import decoder if needed for modal content

const UserProfilePage = () => {
  const { user } = useAuth();
  const [examResults, setExamResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // State for the review modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState(null);
  const [expandedExams, setExpandedExams] = useState({}); // State for accordion

  useEffect(() => {
    const fetchResults = async () => {
      if (!user) {
        setLoading(false);
        setError("User not logged in.");
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const { data, error: fetchError } = await supabase
          .from("exam_results")
          .select(
            `
            id,
            exam_id,
            score_percentage,
            correct_count,
            total_questions,
            submitted_at,
            marked_questions,
            exams ( exam_name ) 
          `
          ) // Join with exams table to get exam_name
          .eq("user_id", user.id)
          .order("submitted_at", { ascending: false });

        if (fetchError) {
          throw fetchError;
        }

        setExamResults(data || []);
      } catch (err) {
        console.error("Error fetching exam results:", err);
        setError(err.message || "Failed to fetch exam results.");
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [user]); // Re-run effect if user changes

  // Filter results to get only those with marked questions
  const markedResults = examResults.filter(
    (result) => result.marked_questions && result.marked_questions.length > 0
  );

  // Group marked questions by exam
  const groupedMarkedQuestions = useMemo(() => {
    return markedResults.reduce((acc, result) => {
      const examId = result.exam_id;
      if (!acc[examId]) {
        acc[examId] = {
          name: result.exams?.exam_name || examId,
          questions: [],
        };
      }
      // Add question IDs to the list for this exam
      result.marked_questions.forEach((qId) => {
        // Avoid duplicates if somehow a question is marked twice in the array
        if (!acc[examId].questions.includes(qId)) {
          acc[examId].questions.push(qId);
        }
      });
      return acc;
    }, {});
  }, [markedResults]); // Recalculate only when markedResults changes

  const toggleExamExpansion = (examId) => {
    setExpandedExams((prev) => ({
      ...prev,
      [examId]: !prev[examId], // Toggle the boolean state for this examId
    }));
  };

  const handleReviewClick = async (questionId) => {
    setModalLoading(true);
    setModalError(null);
    setSelectedQuestion(null); // Clear previous selection
    setIsModalOpen(true); // Open modal immediately to show loading state

    try {
      const { data: questionData, error: questionError } = await supabase
        .from("questions")
        .select("*") // Select all columns for the modal
        .eq("question_id", questionId)
        .single();

      if (questionError) throw questionError;
      if (!questionData) throw new Error("Question details not found.");

      // Decode text fields if necessary (assuming modal expects decoded data)
      const decodedQuestion = {
        ...questionData,
        question_html: decodeMojibake(questionData.question_html),
        leading_sentence: decodeMojibake(questionData.leading_sentence),
        answer_a: decodeMojibake(questionData.answer_a),
        answer_b: decodeMojibake(questionData.answer_b),
        answer_c: decodeMojibake(questionData.answer_c),
        answer_d: decodeMojibake(questionData.answer_d),
        explanation: decodeMojibake(questionData.explanation),
      };

      setSelectedQuestion(decodedQuestion); // Set the fetched and decoded data
    } catch (err) {
      console.error("Error fetching question details for modal:", err);
      setModalError(err.message || "Failed to load question details.");
      // Keep modal open to show error, or close it: setIsModalOpen(false);
    } finally {
      setModalLoading(false);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedQuestion(null);
    setModalError(null); // Clear modal error on close
  };

  return (
    <Layout>
      <h1 className="text-2xl font-bold mb-6">User Profile</h1>

      {user ? (
        <div className="mb-6">
          <p>
            <span className="font-semibold">Email:</span> {user.email}
          </p>
          {/* Add other user details here if available and needed */}
        </div>
      ) : (
        <p>Loading user information...</p>
      )}

      {loading && <p>Loading exam results...</p>}
      {error && <p className="text-red-500">Error: {error}</p>}

      {!loading && !error && (
        <>
          {/* All Exam Results Section */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Exam History</h2>
            {examResults.length > 0 ? (
              <div className="overflow-x-auto shadow rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Exam Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Score (%)
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Correct/Total
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Submitted At
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {examResults.map((result) => (
                      <tr key={result.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 align-middle">
                          {result.exams?.exam_name || result.exam_id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 align-middle">
                          {result.score_percentage}%
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 align-middle">
                          {result.correct_count}/{result.total_questions}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 align-middle">
                          {new Date(result.submitted_at).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium align-middle">
                          <Link
                            to={`/exam-result/${result.id}`}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            View Details
                          </Link>
                          {/* Add "Do Test Again" link */}
                          <Link
                            to={`/exam/${result.exam_id}/question/1`} // Link to the first question
                            className="ml-4 text-green-600 hover:text-green-900" // Added margin-left
                          >
                            Do Test Again
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p>No exam results found.</p>
            )}
          </section>

          {/* Marked Questions Section - Accordion Style */}
          <section>
            <h2 className="text-xl font-semibold mb-4">Marked for Review</h2>
            {Object.keys(groupedMarkedQuestions).length > 0 ? (
              <div className="space-y-2">
                {Object.entries(groupedMarkedQuestions).map(
                  ([examId, examData]) => (
                    <div key={examId} className="border rounded shadow-sm">
                      <button
                        onClick={() => toggleExamExpansion(examId)}
                        className="w-full flex justify-between items-center px-4 py-3 bg-gray-50 hover:bg-gray-100 text-left font-medium"
                        aria-expanded={!!expandedExams[examId]}
                      >
                        <span>{examData.name}</span>
                        {/* Simple +/- indicator */}
                        <span>{expandedExams[examId] ? "-" : "+"}</span>
                      </button>
                      {/* Collapsible content */}
                      {expandedExams[examId] && (
                        <ul className="px-4 py-3 border-t divide-y">
                          {examData.questions.map((questionId) => (
                            <li
                              key={questionId}
                              className="py-2 flex justify-between items-center text-sm"
                            >
                              <span>Question ID: {questionId}</span>
                              <button
                                onClick={() => handleReviewClick(questionId)}
                                className="ml-4 px-2 py-1 text-xs rounded bg-blue-500 text-white hover:bg-blue-600 transition duration-150 disabled:opacity-50"
                                disabled={
                                  modalLoading &&
                                  selectedQuestion?.question_id === questionId
                                }
                              >
                                {modalLoading &&
                                selectedQuestion?.question_id === questionId
                                  ? "Loading..."
                                  : "Review"}
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )
                )}
              </div>
            ) : (
              <p>No questions marked for review.</p>
            )}
          </section>
        </>
      )}

      {/* Render the modal */}
      <QuestionReviewModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        questionData={selectedQuestion}
        isLoading={modalLoading} // Pass loading state
        error={modalError} // Pass error state
      />
    </Layout>
  );
};

export default UserProfilePage;
