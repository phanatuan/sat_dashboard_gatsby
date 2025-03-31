// src/components/admin/ExamForm.js
import React, { useState, useEffect, useCallback } from "react";
import { Link, navigate } from "@reach/router";
import useAdminAuthGuard from "../../hooks/useAdminAuthGuard";
import AdminUnauthorized from "./AdminUnauthorized";
import { supabase } from "../../supabaseClient";
import { v4 as uuidv4 } from "uuid"; // Import uuid

const ExamForm = (props) => {
  // --- Auth & Routing ---
  const { isChecking, isAllowed } = useAdminAuthGuard(props.location);
  const { examId } = props; // Get examId from props passed by Reach Router
  const isEditing = !!examId;

  // --- State ---
  const [formData, setFormData] = useState({
    exam_name: "",
    section_name: "",
    test_category: "",
    allow_practice_mode: true, // Default to true
  });
  const [loading, setLoading] = useState(false); // For fetching/submitting
  const [error, setError] = useState(null);

  // --- Fetch Exam Data for Editing ---
  const fetchExam = useCallback(async () => {
    if (!isEditing || !isAllowed) return; // Only fetch if editing and allowed
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from("exams")
        .select("*")
        .eq("exam_id", examId)
        .maybeSingle(); // Use maybeSingle as ID might be invalid

      if (fetchError) throw fetchError;

      if (data) {
        setFormData({
          exam_name: data.exam_name || "",
          section_name: data.section_name || "",
          test_category: data.test_category || "",
          allow_practice_mode: data.allow_practice_mode ?? true, // Handle null
        });
      } else {
        setError(`Exam with ID ${examId} not found.`);
        // Optional: Redirect if exam not found
        // navigate('/admin/exams/');
      }
    } catch (err) {
      console.error("Error fetching exam:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [examId, isEditing, isAllowed]); // Dependencies for fetching

  useEffect(() => {
    // Fetch data only when allowed and editing
    if (isAllowed && isEditing) {
      fetchExam();
    } else if (isAllowed && !isEditing) {
      // Reset form for 'create new' if allowed
      setFormData({
        exam_name: "",
        section_name: "",
        test_category: "",
        allow_practice_mode: true,
      });
      setLoading(false); // Ensure loading is false for create form
    }
  }, [isAllowed, isEditing, fetchExam]); // Run fetch/reset logic based on auth and edit state

  // --- Handlers ---
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isAllowed) return; // Extra check

    setLoading(true);
    setError(null);

    try {
      let result;
      // Create a copy to avoid potential state mutation issues if needed later
      const examData = { ...formData };

      if (isEditing) {
        // --- Update existing exam ---
        // We don't send exam_id itself in the update payload
        result = await supabase
          .from("exams")
          .update(examData)
          .eq("exam_id", examId)
          .select() // Optionally select to confirm update
          .single(); // Expect single result
      } else {
        // --- Insert new exam ---
        // Generate a unique ID for the new exam
        examData.exam_id = uuidv4(); // Assign the generated UUID

        result = await supabase
          .from("exams")
          .insert(examData) // examData now includes the generated exam_id
          .select()
          .single();
      }

      // Check for errors from Supabase
      const { error: submitError } = result;
      if (submitError) throw submitError;

      alert(`Exam ${isEditing ? "updated" : "created"} successfully!`);
      navigate("/admin/exams"); // Redirect back to list on success
    } catch (err) {
      console.error("Error submitting exam:", err);
      const userMessage = `Failed to ${isEditing ? "update" : "create"} exam: ${
        err.message || "Unknown error"
      }`;
      setError(userMessage);
      alert(`Error: ${userMessage}`); // Show error to user
    } finally {
      setLoading(false);
    }
  };

  // --- Render Logic ---
  if (isChecking) return <p>Loading admin section...</p>;
  if (!isAllowed) return <AdminUnauthorized />;
  // Show specific loading state only when fetching data for editing
  if (loading && isEditing) return <p>Loading exam data...</p>;

  return (
    <div>
      <h2 className="text-xl font-semibold mb-6">
        {isEditing ? `Edit Exam` : "Create New Exam"}
      </h2>
      {isEditing && (
        <p className="text-sm text-gray-500 mb-4">Editing Exam ID: {examId}</p>
      )}

      {error && (
        <p className="text-red-600 mb-4 p-3 bg-red-100 border border-red-400 rounded">
          Error: {error}
        </p>
      )}

      <form
        onSubmit={handleSubmit}
        className="space-y-4 max-w-lg bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4"
      >
        {/* Exam Name */}
        <div>
          <label
            htmlFor="exam_name"
            className="block text-gray-700 text-sm font-bold mb-2"
          >
            Exam Name
          </label>
          <input
            type="text"
            id="exam_name"
            name="exam_name"
            value={formData.exam_name}
            onChange={handleChange}
            required
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          />
        </div>

        {/* Section Name */}
        <div>
          <label
            htmlFor="section_name"
            className="block text-gray-700 text-sm font-bold mb-2"
          >
            Section Name
          </label>
          <input
            type="text"
            id="section_name"
            name="section_name"
            value={formData.section_name}
            onChange={handleChange}
            required
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          />
        </div>

        {/* Test Category */}
        <div>
          <label
            htmlFor="test_category"
            className="block text-gray-700 text-sm font-bold mb-2"
          >
            Test Category
          </label>
          <input
            type="text"
            id="test_category"
            name="test_category"
            value={formData.test_category}
            onChange={handleChange}
            required
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          />
        </div>

        {/* Allow Practice Mode Checkbox */}
        <div className="flex items-center mt-4">
          <input
            id="allow_practice_mode"
            name="allow_practice_mode"
            type="checkbox"
            checked={formData.allow_practice_mode}
            onChange={handleChange}
            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
          />
          <label
            htmlFor="allow_practice_mode"
            className="ml-2 block text-sm text-gray-900"
          >
            Allow Practice Mode (Show Explanation)
          </label>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end space-x-3 pt-6">
          <Link
            to="/admin/exams" // Navigate back using Reach Router Link for client-side nav
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            type="button" // Optional: Explicitly set type for non-submit buttons
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Saving..." : isEditing ? "Update Exam" : "Create Exam"}
          </button>
        </div>
      </form>

      <Link
        to="/admin/exams"
        className="text-blue-600 hover:underline mt-6 inline-block"
      >
        Back to Exam List
      </Link>
    </div>
  );
};
export default ExamForm;
