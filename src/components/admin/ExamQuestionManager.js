// src/components/admin/ExamQuestionManager.js
import React, { useState, useEffect, useCallback } from "react";
import { Link } from "@reach/router";
import useAdminAuthGuard from "../../hooks/useAdminAuthGuard";
import AdminUnauthorized from "./AdminUnauthorized";
import { supabase } from "../../supabaseClient";
// --- Import Drag and Drop components ---
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";

const ExamQuestionManager = (props) => {
  // ... (state variables: examDetails, assignedQuestions, availableQuestions, etc. remain the same) ...
  const { isChecking, isAllowed } = useAdminAuthGuard(props.location);
  const { examId } = props;
  const [examDetails, setExamDetails] = useState(null);
  const [assignedQuestions, setAssignedQuestions] = useState([]);
  const [availableQuestions, setAvailableQuestions] = useState([]);
  const [initialAssignedIds, setInitialAssignedIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const createSnippet = (html, length = 100) => {
    /* ... same ... */
    if (!html) return "";
    const text = html.replace(/<[^>]*>?/gm, " ");
    const cleanedText = text.replace(/\s+/g, " ").trim();
    return cleanedText.length > length
      ? cleanedText.substring(0, length) + "..."
      : cleanedText;
  };

  // --- Fetch Initial Data (remains the same) ---
  const fetchData = useCallback(async () => {
    /* ... */
    if (!isAllowed || !examId) return;
    setLoading(true);
    setError(null);
    try {
      const { data: examData, error: examError } = await supabase
        .from("exams")
        .select("exam_id, exam_name")
        .eq("exam_id", examId)
        .single();
      if (examError) throw examError;
      if (!examData) throw new Error(`Exam not found: ${examId}`);
      setExamDetails(examData);
      const { data: allQuestionsData, error: allQError } = await supabase
        .from("questions")
        .select("question_id, question_html");
      if (allQError) throw allQError;
      const allQuestionsMap = new Map(
        allQuestionsData.map((q) => [
          q.question_id,
          { snippet: createSnippet(q.question_html) },
        ])
      );
      const { data: assignedData, error: assignedError } = await supabase
        .from("exam_questions")
        .select("question_id, question_order")
        .eq("exam_id", examId)
        .order("question_order", { ascending: true });
      if (assignedError) throw assignedError;
      const currentAssigned = [];
      const assignedIds = new Set();
      assignedData.forEach((aq) => {
        if (allQuestionsMap.has(aq.question_id)) {
          currentAssigned.push({
            question_id: aq.question_id,
            snippet: allQuestionsMap.get(aq.question_id).snippet,
          });
          assignedIds.add(aq.question_id);
        }
      });
      setAssignedQuestions(currentAssigned);
      setInitialAssignedIds(assignedIds);
      const currentAvailable = allQuestionsData
        .filter((q) => !assignedIds.has(q.question_id))
        .map((q) => ({
          question_id: q.question_id,
          snippet: allQuestionsMap.get(q.question_id).snippet,
        }));
      setAvailableQuestions(currentAvailable);
    } catch (err) {
      console.error("Error fetching data for manager:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [examId, isAllowed]);
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // --- Add/Remove Logic (remains the same) ---
  const handleAddQuestion = (questionToAdd) => {
    /* ... */
    setAvailableQuestions((prev) =>
      prev.filter((q) => q.question_id !== questionToAdd.question_id)
    );
    setAssignedQuestions((prev) => [...prev, questionToAdd]);
  };
  const handleRemoveQuestion = (questionToRemove) => {
    /* ... */
    setAssignedQuestions((prev) =>
      prev.filter((q) => q.question_id !== questionToRemove.question_id)
    );
    setAvailableQuestions((prev) => [...prev, questionToRemove]);
  };

  // --- Drag and Drop Handler ---
  const onDragEnd = (result) => {
    const { source, destination } = result;

    // Dropped outside the list
    if (!destination) {
      return;
    }

    // Dropped in the same place
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    // Reordering within the Assigned Questions list
    if (source.droppableId === "assignedQuestionsDroppable") {
      const items = Array.from(assignedQuestions);
      const [reorderedItem] = items.splice(source.index, 1);
      items.splice(destination.index, 0, reorderedItem);

      setAssignedQuestions(items); // Update state with the new order
    }

    // Logic for dragging between lists could be added here if needed,
    // but Add/Remove buttons handle that currently.
  };

  // --- Save Changes Logic (remains the same - uses assignedQuestions state) ---
  const handleSaveChanges = async () => {
    /* ... */
    setIsSaving(true);
    setError(null);
    console.log("Saving changes...");
    try {
      const insertData = assignedQuestions.map((q, index) => ({
        exam_id: examId,
        question_id: q.question_id,
        question_order: index + 1,
      }));
      console.log("Data to Insert:", insertData);
      const { error: deleteError } = await supabase
        .from("exam_questions")
        .delete()
        .eq("exam_id", examId);
      if (deleteError)
        throw new Error(
          `Failed to clear existing assignments: ${deleteError.message}`
        );
      if (insertData.length > 0) {
        const { error: insertError } = await supabase
          .from("exam_questions")
          .insert(insertData);
        if (insertError)
          throw new Error(
            `Failed to insert new assignments: ${insertError.message}`
          );
      }
      alert("Changes saved successfully!");
      setInitialAssignedIds(
        new Set(assignedQuestions.map((q) => q.question_id))
      );
    } catch (err) {
      console.error("Error saving changes:", err);
      setError(err.message);
      alert(`Error saving changes: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  // --- Render Logic ---
  if (isChecking || loading) return <p>Loading data...</p>;
  if (!isAllowed) return <AdminUnauthorized />;
  if (error && !examDetails)
    return <p className="text-red-600">Error loading exam data: {error}</p>;
  if (!examDetails) return <p>Exam details could not be loaded.</p>;

  return (
    // --- Wrap relevant part with DragDropContext ---
    <DragDropContext onDragEnd={onDragEnd}>
      <div>
        {" "}
        {/* Keep overall structure */}
        <h2 className="text-xl font-semibold mb-1">Manage Questions For:</h2>
        <h3 className="text-lg font-medium text-indigo-700 mb-6">
          {examDetails.exam_name} (ID: {examId})
        </h3>
        {error && (
          <p className="text-red-500 bg-red-100 p-2 rounded mb-4">
            Save Error: {error}
          </p>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Assigned Questions Column - Apply Droppable */}
          <div className="border rounded p-4 shadow min-h-[200px]">
            <h4 className="font-semibold mb-3 border-b pb-2">
              Assigned Questions (Drag to Reorder)
            </h4>

            {/* --- Droppable area for assigned questions --- */}
            <Droppable droppableId="assignedQuestionsDroppable">
              {(provided, snapshot) => (
                <ul
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className={`space-y-2 min-h-[100px] rounded ${
                    snapshot.isDraggingOver ? "bg-blue-50" : ""
                  }`} // Add visual feedback for drop zone
                >
                  {assignedQuestions.length === 0
                    ? !snapshot.isDraggingOver && (
                        <p className="text-gray-500 italic text-center mt-4">
                          Drag or add questions here
                        </p>
                      )
                    : // --- Map over assigned questions and make them Draggable ---
                      assignedQuestions.map((q, index) => (
                        <Draggable
                          key={q.question_id}
                          draggableId={q.question_id}
                          index={index}
                        >
                          {(provided, snapshot) => (
                            <li
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps} // The drag handle
                              className={`flex justify-between items-center p-2 border rounded hover:bg-gray-100 ${
                                snapshot.isDragging
                                  ? "bg-blue-100 shadow-lg"
                                  : "bg-gray-50"
                              }`} // Style when dragging
                            >
                              <span className="text-sm flex items-center">
                                <span className="text-gray-400 mr-2 text-xs w-4">
                                  {index + 1}.
                                </span>
                                <span title={q.question_id}>{q.snippet}</span>
                              </span>
                              <button
                                onClick={() => handleRemoveQuestion(q)}
                                className="text-red-500 hover:text-red-700 text-xs ml-2 px-1 py-0.5 rounded hover:bg-red-100"
                              >
                                Remove
                              </button>
                            </li>
                          )}
                        </Draggable>
                      ))}
                  {provided.placeholder}{" "}
                  {/* Important for spacing during drag */}
                </ul>
              )}
            </Droppable>
          </div>

          {/* Available Questions Column (remains largely the same, no drag/drop needed here) */}
          <div className="border rounded p-4 shadow bg-gray-50 min-h-[200px]">
            {/* ... (Available questions list rendering remains the same) ... */}
            <h4 className="font-semibold mb-3 border-b pb-2">
              Available Questions
            </h4>
            {availableQuestions.length === 0 ? (
              <p className="text-gray-500 italic text-center mt-4">
                No more questions available.
              </p>
            ) : (
              <ul className="space-y-2 max-h-96 overflow-y-auto">
                {availableQuestions.map((q) => (
                  <li
                    key={q.question_id}
                    className="flex justify-between items-center p-2 border rounded bg-white hover:bg-gray-50"
                  >
                    <span className="text-sm" title={q.question_id}>
                      {q.snippet}
                    </span>
                    <button
                      onClick={() => handleAddQuestion(q)}
                      className="text-green-600 hover:text-green-800 text-xs ml-2 px-1 py-0.5 rounded hover:bg-green-100"
                    >
                      Add
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        {/* Save Button & Back Link (remain the same) */}
        <div className="mt-6 text-right">
          {/* ... Save Button ... */}
          <button
            onClick={handleSaveChanges}
            disabled={isSaving}
            className="px-5 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {" "}
            {isSaving ? "Saving..." : "Save Changes"}{" "}
          </button>
        </div>
        <Link
          to="/admin/exams"
          className="text-blue-600 hover:underline mt-6 inline-block"
        >
          Back to Exam List
        </Link>
      </div>
    </DragDropContext> // --- End DragDropContext ---
  );
};

export default ExamQuestionManager;
