// src/components/admin/ExamList.js
import React, { useState, useEffect, useCallback } from "react"; // Import useCallback
import { Link } from "@reach/router"; // Use Reach Router Link
import useAdminAuthGuard from "../../hooks/useAdminAuthGuard";
import AdminUnauthorized from "./AdminUnauthorized";
import { supabase } from "../../supabaseClient";

const ExamList = (props) => {
  const { isChecking, isAllowed } = useAdminAuthGuard(props.location);
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true); // Start in loading state
  const [error, setError] = useState(null);

  console.log("ExamList Render:", { isChecking, isAllowed, loading }); // Log render state

  // Function to fetch exams (wrapped in useCallback)
  const fetchExams = useCallback(async () => {
    console.log("fetchExams called"); // DEBUG
    setLoading(true); // Set loading true at the start of fetch attempt
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from("exams")
        .select("*") // Select all columns
        .order("exam_name", { ascending: true }); // Keep ordering by name

      if (fetchError) {
        console.error("Supabase fetch error:", fetchError); // DEBUG
        throw fetchError;
      }
      console.log("Fetch successful, setting exams"); // DEBUG
      setExams(data || []);
      setError(null); // Clear error on success
    } catch (err) {
      console.error("Error caught in fetchExams:", err); // DEBUG
      setError(err.message);
      setExams([]); // Clear data on error
    } finally {
      console.log("Running finally block, setting loading false"); // DEBUG
      setLoading(false); // **CRITICAL:** Ensure loading is set to false
    }
  }, []); // Empty dependency array for useCallback

  // Effect to trigger fetch when allowed
  useEffect(() => {
    console.log("ExamList useEffect Check:", { isAllowed }); // DEBUG
    if (isAllowed) {
      fetchExams();
    } else {
      // If not allowed, reset state
      setLoading(false);
      setExams([]);
      setError(null);
    }
  }, [isAllowed, fetchExams]);

  // Handle Deletion
  const handleDelete = async (examId, examName) => {
    if (
      window.confirm(
        `Are you sure you want to delete the exam "${examName}"? This will also delete its assigned questions links and cannot be undone.`
      )
    ) {
      // Can add specific delete loading state if needed
      try {
        // Cascade delete should handle exam_questions and user_exam_access
        const { error: deleteError } = await supabase
          .from("exams")
          .delete()
          .eq("exam_id", examId);

        if (deleteError) throw deleteError;

        alert(`Exam "${examName}" deleted successfully.`);
        // Refetch the list to show updated data
        fetchExams();
      } catch (err) {
        console.error("Error deleting exam:", err);
        setError(`Failed to delete exam: ${err.message}`);
        alert(`Error deleting exam: ${err.message}`);
      }
    }
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

  // If allowed, show loading state specific to exams fetch
  if (loading) {
    console.log("Rendering: Loading Exams"); // DEBUG
    // Show layout shell while loading
    return (
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Manage Exams</h2>
          <span className="text-gray-500">Loading...</span>
        </div>
        <p>Loading exams content...</p>
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
          <h2 className="text-xl font-semibold">Manage Exams</h2>
        </div>
        <p className="text-red-600 p-4 bg-red-100 border border-red-400 rounded">
          Error loading exams: {error}
        </p>
        <button
          onClick={fetchExams}
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
  console.log("Rendering: Exam List Table"); // DEBUG
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Manage Exams</h2>
        <Link
          to="/admin/exams/new"
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition duration-150"
        >
          Add New Exam
        </Link>
      </div>

      <div className="overflow-x-auto shadow-md rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Name
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Category
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Section
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Practice Mode
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
            {exams.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                  No exams found.
                </td>
              </tr>
            ) : (
              exams.map((exam) => (
                <tr key={exam.exam_id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {exam.exam_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {exam.test_category}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {exam.section_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {exam.allow_practice_mode ? "Yes" : "No"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                    <Link
                      to={`/admin/exams/edit/${exam.exam_id}`}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      Edit
                    </Link>
                    <Link
                      to={`/admin/exams/manage/${exam.exam_id}`}
                      className="text-green-600 hover:text-green-900"
                    >
                      Manage Questions
                    </Link>
                    <button
                      onClick={() => handleDelete(exam.exam_id, exam.exam_name)}
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
export default ExamList;
