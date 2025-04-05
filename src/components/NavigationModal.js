// src/components/NavigationModal.js
import React from "react";
import clsx from "clsx";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLocationDot } from "@fortawesome/free-solid-svg-icons";

const NavigationModal = ({
  isOpen,
  onClose,
  examName,
  totalQuestions,
  currentQuestionOrder,
  questionStatuses, // Expects { answers: {...}, marked: {...} } from LS
  onNavigateToQuestion,
  onNavigateToReview,
}) => {
  // Return null if the modal is not open
  if (!isOpen) return null;

  // Function to determine the styling and status of each question button in the grid
  const getStatusClass = (qNum) => {
    const isCurrent = qNum === currentQuestionOrder;
    // Get status for THIS specific question number (qNum) from the passed 'questionStatuses' prop
    const isMarkedForReview = questionStatuses?.marked?.[qNum];
    const isAnswered =
      questionStatuses?.answers?.[qNum] !== undefined &&
      questionStatuses?.answers?.[qNum] !== null;

    // Base classes for all buttons
    let classes =
      "w-10 h-10 border border-gray-400 flex items-center justify-center rounded text-sm font-medium cursor-pointer transition-colors duration-150 relative ";

    // Apply status-specific background/border colors
    if (isMarkedForReview) {
      // Yellow if marked
      classes += " bg-yellow-300 border-yellow-500 hover:bg-yellow-400 ";
    } else if (isAnswered) {
      // Blue if answered (and not marked)
      classes += " bg-blue-500 border-blue-700 text-white hover:bg-blue-600 ";
    } else {
      // White if neither answered nor marked
      classes += " bg-white hover:bg-gray-100 ";
    }

    // Add a ring indicator if it's the currently viewed question
    if (isCurrent) {
      classes += " ring-2 ring-offset-1 ring-black ";
    }

    return classes;
  };

  // Render the modal structure
  return (
    // Overlay div to cover the screen and handle closing on outside click
    <div
      className="fixed inset-0 bg-black bg-opacity-60 z-40 flex items-center justify-center p-4 backdrop-blur-sm"
      onClick={onClose} // Close the modal when clicking the overlay
    >
      {/* Modal Content Box - prevent clicks inside from closing the modal */}
      <div
        className="bg-white rounded-lg shadow-xl p-5 sm:p-6 w-full max-w-lg"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-200">
          <h2 className="text-base sm:text-lg font-semibold">
            {examName} - Navigation
          </h2>
          {/* Close Button (Top Right) */}
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-800 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Question Number Grid - Added max-h and overflow */}
        <div className="grid grid-cols-5 xs:grid-cols-6 sm:grid-cols-7 md:grid-cols-8 gap-2 mb-6 max-h-[60vh] overflow-y-auto">
          {/* Create a button for each question number */}
          {Array.from({ length: totalQuestions }, (_, i) => i + 1).map(
            (qNum) => (
              <button
                key={qNum}
                className={getStatusClass(qNum)} // Apply dynamic styling
                onClick={() => onNavigateToQuestion(qNum)} // Navigate on click
                aria-label={`Go to question ${qNum}`}
              >
                {qNum} {/* Display question number */}
                {/* Location Icon: Show only if this question is Current AND Not Marked AND Not Answered */}
                {qNum === currentQuestionOrder &&
                  !questionStatuses?.marked?.[qNum] && // Check marked status for THIS qNum
                  (questionStatuses?.answers?.[qNum] === undefined ||
                    questionStatuses?.answers?.[qNum] === null) && ( // Check answered status for THIS qNum
                    <FontAwesomeIcon
                      icon={faLocationDot}
                      className="absolute top-0 right-0 text-red-600 text-xs -mt-1 -mr-1" // Position icon
                    />
                  )}
              </button>
            )
          )}
        </div>

        {/* Legend for Status Colors */}
        <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-gray-600 mb-5 border-t pt-3">
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
          <div className="flex items-center">
            <span className="relative mr-1.5">
              <FontAwesomeIcon icon={faLocationDot} className="text-red-600" />
            </span>{" "}
            Current (Unanswered/Unmarked)
          </div>
        </div>

        {/* Button to navigate to the main Review Page */}
        <button
          onClick={onNavigateToReview}
          className="w-full px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition duration-200 font-medium"
        >
          Go to Review Page
        </button>
      </div>
    </div>
  );
};

export default NavigationModal; // Export the component for use elsewhere
