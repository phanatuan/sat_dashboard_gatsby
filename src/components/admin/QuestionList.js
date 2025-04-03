// src/components/admin/QuestionList.js
import React, { useState, useEffect, useCallback } from "react"; // Import useCallback
import { Link } from "@reach/router";
import useAdminAuthGuard from "../../hooks/useAdminAuthGuard";
import AdminUnauthorized from "./AdminUnauthorized";
import { supabase } from "../../supabaseClient";

// Helper to generate a safe snippet from HTML
const createSnippet = (html, length = 100) => {
  if (!html) return "";
  const text = html.replace(/<[^>]*>?/gm, " ");
  const cleanedText = text.replace(/\s+/g, " ").trim();
  return cleanedText.length > length
    ? cleanedText.substring(0, length) + "..."
    : cleanedText;
};

const QuestionList = (props) => {
  const { isChecking, isAllowed } = useAdminAuthGuard(props.location);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedType, setSelectedType] = useState("all"); // Add state for selected type
  const [questionTypes, setQuestionTypes] = useState([]); // Add state for question types
  const [selectedQuestionIds, setSelectedQuestionIds] = useState([]); // State for selected question IDs

  console.log("QuestionList Render:", { isChecking, isAllowed, loading }); // Log render state

  // Function to fetch questions (wrapped in useCallback)
  const fetchQuestions = useCallback(async () => {
    console.log("fetchQuestions called"); // DEBUG
    setLoading(true); // Set loading true at the start of fetch attempt
    setError(null);
    try {
      let query = supabase
        .from("questions")
        .select("question_id, question_html, skill");

      if (selectedType !== "all") {
        query = query.eq("skill", selectedType);
      }

      const { data, error: fetchError } = await query.order("question_id", {
        ascending: false,
      });

      if (fetchError) {
        console.error("Supabase fetch error:", fetchError); // DEBUG
        throw fetchError;
      }
      console.log("Fetch successful, setting questions"); // DEBUG
      setQuestions(data || []);
      setError(null); // Clear error on success

      // Extract unique question types from the fetched questions
      const uniqueTypes = [
        "all",
        ...new Set(data.map((q) => q.domain).filter(Boolean)), // Filter out null/undefined
      ];
      setQuestionTypes(uniqueTypes);
    } catch (err) {
      console.error("Error caught in fetchQuestions:", err); // DEBUG
      setError(err.message);
      setQuestions([]); // Clear data on error
    } finally {
      console.log("Running finally block, setting loading false"); // DEBUG
      setLoading(false); // **CRITICAL:** Ensure loading is set to false
    }
  }, [selectedType]); // Add selectedType as a dependency

  // Effect to trigger fetch when allowed
  useEffect(() => {
    console.log("QuestionList useEffect Check:", { isAllowed }); // DEBUG
    if (isAllowed) {
      fetchQuestions();
    } else {
      // If not allowed (e.g., during initial check or if permissions change), reset state
      setLoading(false); // Ensure loading is false if not allowed
      setQuestions([]);
      setError(null);
    }
    // fetchQuestions is stable due to useCallback, so isAllowed is the correct dependency
  }, [isAllowed, fetchQuestions]); // Added fetchQuestionTypes

  // Handle Deletion
  const handleDelete = async (questionId) => {
    if (
      window.confirm(
        `Are you sure you want to delete this question (ID: ${questionId})? This will also remove it from any exams it belongs to.`
      )
    ) {
      // No need to set loading state here if fetchQuestions handles it on refresh,
      // but could add specific delete loading state if preferred.
      try {
        const { error: deleteError } = await supabase
          .from("questions")
          .delete()
          .eq("question_id", questionId);

        if (deleteError) throw deleteError;

        alert(`Question deleted successfully.`);
        // Refetch the list to show the updated data
        fetchQuestions();
      } catch (err) {
        console.error("Error deleting question:", err);
        setError(`Failed to delete question: ${err.message}`);
        alert(`Error deleting question: ${err.message}`);
      }
    }
  };

  // Handle Type Change
  const handleTypeChange = (event) => {
    setSelectedType(event.target.value);
  };

  // Handle checkbox change for a single question
  const handleQuestionSelect = (questionId) => {
    setSelectedQuestionIds((prevSelected) => {
      if (prevSelected.includes(questionId)) {
        return prevSelected.filter((id) => id !== questionId); // Unselect
      } else {
        return [...prevSelected, questionId]; // Select
      }
    });
  };

  // Handle select all checkbox
  const handleSelectAll = () => {
    setSelectedQuestionIds((prevSelected) => {
      const allCurrentIds = questions.map((q) => q.question_id); // IDs of *currently filtered* questions

      if (allCurrentIds.every((id) => prevSelected.includes(id))) {
        // If ALL currently displayed questions are already selected, UNSELECT them all
        return prevSelected.filter((id) => !allCurrentIds.includes(id));
      } else {
        // Otherwise, SELECT all currently displayed questions, preserving any other selections
        return [...new Set([...prevSelected, ...allCurrentIds])]; // Add all current IDs, avoiding duplicates
      }
    });
  };

  // --- Render Logic ---
  if (isChecking) {
    console.log("Rendering: Checking Admin Permissions"); // DEBUG
    return <p>Loading admin section...</p>;
  }
  if (!isAllowed) {
    console.log("Rendering: Not Allowed"); // DEBUG
    return <AdminUnauthorized />;
  }

  // If allowed, show loading state specific to questions fetch
  if (loading) {
    console.log("Rendering: Loading Questions"); // DEBUG
    // It's okay to show the layout shell while loading questions
    return (
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Manage Questions</h2>
          <span className="text-gray-500">Loading...</span>
        </div>
        <p>Loading questions content...</p>

        <Link
          to="/admin/"
          className="text-blue-600 hover:underline mt-6 inline-block"
        >
          Back to Admin Home
        </Link>
      </div>
    );
  }

  // If error occurred during fetch
  if (error) {
    console.log("Rendering: Error State"); // DEBUG
    return (
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Manage Questions</h2>
        </div>
        <p className="text-red-600 p-4 bg-red-100 border border-red-400 rounded">
          Error loading questions: {error}
        </p>
        <button
          onClick={fetchQuestions}
          className="mt-2 px-3 py-1 border rounded bg-blue-100"
        >
          Retry
        </button>
        <br />
        <Link
          to="/admin/"
          className="text-blue-600 hover:underline mt-6 inline-block"
        >
          Back to Admin Home
        </Link>
      </div>
    );
  }

  // --- Render actual content if not checking, allowed, not loading, and no error ---
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Manage Questions</h2>
        <Link
          to="/admin/questions/new"
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition duration-150"
        >
          Add New Question
        </Link>
      </div>

      {/* Question Type Filter */}
      <div className="mb-4">
        <label
          htmlFor="questionType"
          className="block text-gray-700 text-sm font-bold mb-2"
        >
          Filter by Type:
        </label>
        <select
          id="questionType"
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          value={selectedType}
          onChange={handleTypeChange}
        >
          {questionTypes.map((type) => (
            <option key={type} value={type}>
              {type === "all" ? "All Types" : type}
            </option>
          ))}
        </select>
      </div>

      {/* Button to Add Selected Questions to Exam */}
      <p>Selected Questions: {selectedQuestionIds.length}</p>
      <button
        onClick={() => {
          // TODO: Implement the logic to add selected questions to an exam
          console.log("Selected Question IDs:", selectedQuestionIds);
          alert("Add questions to exam functionality not yet implemented");
        }}
        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition duration-150"
      >
        Add Selected to Exam
      </button>

      <div className="overflow-x-auto shadow-md rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                <input
                  type="checkbox"
                  onChange={handleSelectAll}
                  checked={
                    questions.length > 0 &&
                    questions.every((q) =>
                      selectedQuestionIds.includes(q.question_id)
                    )
                  }
                  className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                />
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                ID
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Content Snippet
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Type
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {questions.length === 0 ? (
              <tr>
                <td colSpan="4" className="px-6 py-4 text-center text-gray-500">
                  No questions found.
                </td>
              </tr>
            ) : (
              questions.map((question) => (
                <tr key={question.question_id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <input
                      type="checkbox"
                      value={question.question_id}
                      checked={selectedQuestionIds.includes(
                        question.question_id
                      )}
                      onChange={() =>
                        handleQuestionSelect(question.question_id)
                      }
                      className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                    />
                  </td>

                  <td
                    className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-500"
                    title={question.question_id}
                  >
                    {/* Show shorter version of ID */}
                    {question.question_id.substring(0, 8)}...
                  </td>
                  <td
                    className="px-6 py-4 text-sm text-gray-900 max-w-md overflow-hidden overflow-ellipsis whitespace-nowrap"
                    title={createSnippet(question.question_html, 500)}
                  >
                    {createSnippet(question.question_html, 100)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {question.skill || "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                    <Link
                      to={`/admin/questions/edit/${question.question_id}`}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(question.question_id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <Link
        to="/admin/"
        className="text-blue-600 hover:underline mt-6 inline-block"
      >
        Back to Admin Home
      </Link>
    </div>
  );
};
export default QuestionList;
