// src/components/QuestionEditModal.js
import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient"; // Import supabase client

const QuestionEditModal = ({
  isOpen,
  onClose,
  onSave, // Expect a function to handle the actual saving
  initialQuestionData,
  isSaving, // Prop to indicate saving in progress
}) => {
  const [formData, setFormData] = useState({});
  const [error, setError] = useState(null); // Local error state for the modal form

  // Initialize form data when the modal opens or initial data changes
  useEffect(() => {
    if (initialQuestionData) {
      // Ensure we only populate fields that exist in the initial data
      const fieldsToEdit = {
        question_html: initialQuestionData.question_html || "",
        leading_sentence: initialQuestionData.leading_sentence || "",
        answer_a: initialQuestionData.answer_a || "",
        answer_b: initialQuestionData.answer_b || "",
        answer_c: initialQuestionData.answer_c || "",
        answer_d: initialQuestionData.answer_d || "",
        correct_answer: initialQuestionData.correct_answer || "A", // Default to A if missing
        explanation: initialQuestionData.explanation || "",
        domain: initialQuestionData.domain || "",
        skill: initialQuestionData.skill || "",
        difficulty: initialQuestionData.difficulty || "",
        // Add other editable fields from your 'questions' table schema if needed
      };
      setFormData(fieldsToEdit);
      setError(null); // Clear previous errors when data loads
    } else {
      setFormData({}); // Reset if no data
    }
  }, [initialQuestionData, isOpen]); // Rerun effect if data or open state changes

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveClick = async () => {
    setError(null); // Clear previous errors
    if (!initialQuestionData?.question_id) {
      setError("Missing question ID. Cannot save.");
      return;
    }
    // Basic validation (optional, add more as needed)
    if (!formData.question_html?.trim()) {
      setError("Question HTML cannot be empty.");
      return;
    }
    // ... add validation for other fields ...

    // Call the onSave function passed from the parent, providing the data
    await onSave(initialQuestionData.question_id, formData);
    // Parent component (question-page) will handle closing the modal on success/failure if needed
  };

  if (!isOpen || !initialQuestionData) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4 transition-opacity duration-300 ease-in-out">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto transform transition-all duration-300 ease-in-out scale-100">
        {/* Modal Header */}
        <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-200">
          <h3 className="text-xl font-semibold">
            Edit Question (ID: {initialQuestionData.question_id})
          </h3>
          <button
            onClick={onClose}
            disabled={isSaving}
            className="text-gray-500 hover:text-gray-800 text-3xl leading-none font-semibold outline-none focus:outline-none disabled:opacity-50"
            aria-label="Close modal"
          >
            ×
          </button>
        </div>

        {/* Modal Body - Form */}
        <form onSubmit={(e) => e.preventDefault()}>
          {" "}
          {/* Prevent default form submission */}
          {/* Question HTML (Consider using a Rich Text Editor later) */}
          <div className="mb-4">
            <label
              htmlFor="question_html"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Question HTML
            </label>
            <textarea
              id="question_html"
              name="question_html"
              rows="6"
              value={formData.question_html || ""}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          {/* Leading Sentence */}
          <div className="mb-4">
            <label
              htmlFor="leading_sentence"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Leading Sentence (Optional)
            </label>
            <input
              type="text"
              id="leading_sentence"
              name="leading_sentence"
              value={formData.leading_sentence || ""}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          {/* Answer Options */}
          {["a", "b", "c", "d"].map((choice) => (
            <div className="mb-4" key={choice}>
              <label
                htmlFor={`answer_${choice}`}
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Answer {choice.toUpperCase()} HTML
              </label>
              <textarea
                id={`answer_${choice}`}
                name={`answer_${choice}`}
                rows="2"
                value={formData[`answer_${choice}`] || ""}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          ))}
          {/* Correct Answer */}
          <div className="mb-4">
            <label
              htmlFor="correct_answer"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Correct Answer
            </label>
            <select
              id="correct_answer"
              name="correct_answer"
              value={formData.correct_answer || ""}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded bg-white focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="A">A</option>
              <option value="B">B</option>
              <option value="C">C</option>
              <option value="D">D</option>
            </select>
          </div>
          {/* Explanation */}
          <div className="mb-4">
            <label
              htmlFor="explanation"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Explanation (Optional)
            </label>
            <textarea
              id="explanation"
              name="explanation"
              rows="4"
              value={formData.explanation || ""}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          {/* Other Fields (Domain, Skill, Difficulty etc.) - Add as needed */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label
                htmlFor="domain"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Domain
              </label>
              <input
                type="text"
                name="domain"
                id="domain"
                value={formData.domain || ""}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded"
              />
            </div>
            <div>
              <label
                htmlFor="skill"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Skill
              </label>
              <input
                type="text"
                name="skill"
                id="skill"
                value={formData.skill || ""}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded"
              />
            </div>
            <div>
              <label
                htmlFor="difficulty"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Difficulty
              </label>
              <input
                type="text"
                name="difficulty"
                id="difficulty"
                value={formData.difficulty || ""}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded"
              />
              {/* Consider a select if difficulty has fixed values */}
            </div>
          </div>
          {/* Error Display Area */}
          {error && (
            <div className="my-3 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              <strong>Error:</strong> {error}
            </div>
          )}
        </form>

        {/* Modal Footer */}
        <div className="mt-6 pt-4 border-t border-gray-200 flex justify-end items-center space-x-3">
          <button
            onClick={onClose}
            disabled={isSaving}
            className="px-5 py-2 bg-gray-200 text-gray-700 text-sm font-medium rounded hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition duration-150 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSaveClick}
            disabled={isSaving}
            className="px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-150 disabled:opacity-50 disabled:bg-blue-400"
          >
            {isSaving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuestionEditModal;
