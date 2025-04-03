// src/components/admin/QuestionForm.js
import React, { useState, useEffect, useCallback } from "react";
import { Link, navigate } from "@reach/router";
import useAdminAuthGuard from "../../hooks/useAdminAuthGuard";
import AdminUnauthorized from "./AdminUnauthorized";
import { supabase } from "../../supabaseClient";
import { v4 as uuidv4 } from "uuid"; // Import uuid

const QuestionForm = (props) => {
  // --- Auth & Routing ---
  const { isChecking, isAllowed } = useAdminAuthGuard(props.location);
  const { questionId } = props; // Get questionId from props passed by Reach Router
  const isEditing = !!questionId;

  // --- State ---
  const [formData, setFormData] = useState({
    question_html: "",
    leading_sentence: "",
    answer_a: "",
    answer_b: "",
    answer_c: "",
    answer_d: "",
    correct_answer: "A", // Default correct answer
    explanation: "",
    domain: "",
    skill: "",
  });
  const [loading, setLoading] = useState(false); // For fetching/submitting
  const [error, setError] = useState(null);

  // --- Fetch Question Data for Editing ---
  const fetchQuestion = useCallback(async () => {
    if (!isEditing || !isAllowed) return;
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from("questions")
        .select("*")
        .eq("question_id", questionId)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (data) {
        setFormData({
          question_html: data.question_html || "",
          leading_sentence: data.leading_sentence || "",
          answer_a: data.answer_a || "",
          answer_b: data.answer_b || "",
          answer_c: data.answer_c || "",
          answer_d: data.answer_d || "",
          correct_answer: data.correct_answer || "A",
          explanation: data.explanation || "",
          skill: data.skill || "",
          domain: data.domain || "",
        });
      } else {
        setError(`Question with ID ${questionId} not found.`);
      }
    } catch (err) {
      console.error("Error fetching question:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [questionId, isEditing, isAllowed]);

  useEffect(() => {
    if (isAllowed && isEditing) {
      fetchQuestion();
    } else if (isAllowed && !isEditing) {
      // Reset form for 'create new'
      setFormData({
        question_html: "",
        leading_sentence: "",
        answer_a: "",
        answer_b: "",
        answer_c: "",
        answer_d: "",
        correct_answer: "A",
        explanation: "",
        skill: "",
        domain: "",
      });
      setLoading(false); // Ensure loading is false for create form
    }
  }, [isAllowed, isEditing, fetchQuestion]);

  // --- Handlers ---
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isAllowed) return;

    // Basic validation (e.g., at least A and B must exist)
    if (!formData.answer_a || !formData.answer_b) {
      alert("Answers A and B are required.");
      return;
    }
    if (!["A", "B", "C", "D"].includes(formData.correct_answer)) {
      alert("Correct Answer must be A, B, C, or D.");
      return;
    }
    // Ensure correct answer corresponds to an existing option
    if (formData.correct_answer === "C" && !formData.answer_c) {
      alert("Cannot set correct answer to C if Answer C is empty.");
      return;
    }
    if (formData.correct_answer === "D" && !formData.answer_d) {
      alert("Cannot set correct answer to D if Answer D is empty.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let result;
      const questionData = { ...formData };

      // Clean up empty optional answers before saving
      if (questionData.answer_c === "") questionData.answer_c = null;
      if (questionData.answer_d === "") questionData.answer_d = null;

      if (isEditing) {
        // Update existing question
        result = await supabase
          .from("questions")
          .update(questionData)
          .eq("question_id", questionId)
          .select()
          .single();
      } else {
        // Insert new question
        // Generate a unique ID for the new question
        questionData.question_id = uuidv4();

        result = await supabase
          .from("questions")
          .insert(questionData) // Includes generated question_id
          .select()
          .single();
      }

      const { error: submitError } = result;
      if (submitError) throw submitError;

      alert(`Question ${isEditing ? "updated" : "created"} successfully!`);
      navigate("/admin/questions"); // Redirect back to list
    } catch (err) {
      console.error("Error submitting question:", err);
      const userMessage = `Failed to ${
        isEditing ? "update" : "create"
      } question: ${err.message || "Unknown error"}`;
      setError(userMessage);
      alert(`Error: ${userMessage}`);
    } finally {
      setLoading(false);
    }
  };

  // --- Render Logic ---
  if (isChecking) return <p>Loading admin section...</p>;
  if (!isAllowed) return <AdminUnauthorized />;
  if (loading && isEditing) return <p>Loading question data...</p>;

  return (
    <div>
      <h2 className="text-xl font-semibold mb-6">
        {isEditing ? `Edit Question` : "Create New Question"}
      </h2>
      {isEditing && (
        <p className="text-sm text-gray-500 mb-4">
          Editing Question ID: {questionId}
        </p>
      )}

      {error && (
        <p className="text-red-600 mb-4 p-3 bg-red-100 border border-red-400 rounded">
          Error: {error}
        </p>
      )}

      {/* Consider using react-hook-form for more complex validation */}
      <form
        onSubmit={handleSubmit}
        className="space-y-4 max-w-2xl bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4"
      >
        {/* Question HTML */}
        <div>
          <label
            htmlFor="question_html"
            className="block text-gray-700 text-sm font-bold mb-2"
          >
            Question Content (HTML)
          </label>
          <textarea
            id="question_html"
            name="question_html"
            rows="6"
            value={formData.question_html}
            onChange={handleChange}
            required
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            placeholder="Enter question content using HTML tags..."
          />
          {/* Corrected Comment */}
          <p className="text-xs text-gray-500 mt-1">
            Use HTML for formatting (e.g., p, strong, br, img tags).
          </p>
        </div>

        {/* Leading Sentence */}
        <div>
          <label
            htmlFor="leading_sentence"
            className="block text-gray-700 text-sm font-bold mb-2"
          >
            Leading Sentence (Optional)
          </label>
          <input
            type="text"
            id="leading_sentence"
            name="leading_sentence"
            value={formData.leading_sentence}
            onChange={handleChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            placeholder="Sentence appearing before choices..."
          />
        </div>

        {/* Answers A-D */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="answer_a"
              className="block text-gray-700 text-sm font-bold mb-2"
            >
              Answer A <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="answer_a"
              name="answer_a"
              value={formData.answer_a}
              onChange={handleChange}
              required
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>
          <div>
            <label
              htmlFor="answer_b"
              className="block text-gray-700 text-sm font-bold mb-2"
            >
              Answer B <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="answer_b"
              name="answer_b"
              value={formData.answer_b}
              onChange={handleChange}
              required
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>
          <div>
            <label
              htmlFor="answer_c"
              className="block text-gray-700 text-sm font-bold mb-2"
            >
              Answer C <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="answer_c"
              name="answer_c"
              value={formData.answer_c}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>
          <div>
            <label
              htmlFor="answer_d"
              className="block text-gray-700 text-sm font-bold mb-2"
            >
              Answer D <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="answer_d"
              name="answer_d"
              value={formData.answer_d}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>
        </div>

        {/* Correct Answer */}
        <div>
          <label
            htmlFor="correct_answer"
            className="block text-gray-700 text-sm font-bold mb-2"
          >
            Correct Answer <span className="text-red-500">*</span>
          </label>
          <select
            id="correct_answer"
            name="correct_answer"
            value={formData.correct_answer}
            onChange={handleChange}
            required
            className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          >
            <option value="A">A</option>
            <option value="B">B</option>
            <option value="C">C</option>
            <option value="D">D</option>
          </select>
        </div>

        {/* Explanation */}
        <div>
          <label
            htmlFor="explanation"
            className="block text-gray-700 text-sm font-bold mb-2"
          >
            Explanation
          </label>
          <textarea
            id="explanation"
            name="explanation"
            rows="4"
            value={formData.explanation}
            onChange={handleChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            placeholder="Explanation for the correct answer..."
          />
        </div>

        {/* Question Type */}
        <div>
          <label
            htmlFor="skill"
            className="block text-gray-700 text-sm font-bold mb-2"
          >
            Skill (Optional)
          </label>
          <input
            type="text"
            id="skill"
            name="skill"
            value={formData.skill}
            onChange={handleChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            placeholder="e.g., Reading Comprehension, Math - Algebra"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end space-x-3 pt-6">
          <Link
            to="/admin/questions" // Navigate back using Reach Router Link
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            type="button"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading
              ? "Saving..."
              : isEditing
              ? "Update Question"
              : "Create Question"}
          </button>
        </div>
      </form>

      <Link
        to="/admin/questions"
        className="text-blue-600 hover:underline mt-6 inline-block"
      >
        Back to Question List
      </Link>
    </div>
  );
};
export default QuestionForm;
