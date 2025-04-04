import React from "react";
import clsx from "clsx";

const QuestionReviewModal = ({ isOpen, onClose, questionData }) => {
  // Don't render anything if the modal isn't open or has no data
  if (!isOpen || !questionData) {
    return null;
  }

  // Destructure for easier access
  const {
    question_order,
    question_html,
    correct_answer,
    user_answer,
    explanation,
  } = questionData;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4 transition-opacity duration-300 ease-in-out">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto transform transition-all duration-300 ease-in-out scale-100">
        {/* Modal Header */}
        <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-200">
          <h3 className="text-xl font-semibold">
            Review Question {question_order}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-800 text-3xl leading-none font-semibold outline-none focus:outline-none"
            aria-label="Close modal"
          >
            ×
          </button>
        </div>

        {/* Modal Body */}
        <div>
          {/* Question Content */}
          <div
            className="mb-5 prose max-w-none" // Using prose for HTML rendering
            dangerouslySetInnerHTML={{ __html: question_html }}
          />

          {/* Options */}
          <div className="space-y-3 mb-5">
            {["A", "B", "C", "D"].map((choice) => {
              const answerText = questionData[`answer_${choice.toLowerCase()}`]; // Access via questionData
              if (!answerText) return null;
              const isCorrect = choice === correct_answer;
              const isUserChoice = choice === user_answer;

              return (
                <div
                  key={choice}
                  className={clsx(
                    "p-3 border rounded flex items-start", // items-start for better alignment with indicators
                    isCorrect
                      ? "border-green-500 bg-green-50"
                      : "border-gray-300",
                    isUserChoice && !isCorrect ? "border-red-500 bg-red-50" : "" // Highlight user's wrong choice
                  )}
                >
                  {/* Choice Letter */}
                  <strong
                    className={clsx(
                      "mr-2 flex-shrink-0 font-bold w-5 text-center", // Added width and centering
                      isCorrect ? "text-green-700" : "",
                      isUserChoice && !isCorrect ? "text-red-700" : ""
                    )}
                  >
                    {choice}.
                  </strong>
                  {/* Answer Text */}
                  <div
                    className={clsx(
                      "flex-grow prose prose-sm max-w-none",
                      isCorrect ? "text-green-800" : "",
                      isUserChoice && !isCorrect ? "text-red-800" : ""
                    )}
                    dangerouslySetInnerHTML={{ __html: answerText }}
                  />
                  {/* Indicators */}
                  <div className="ml-auto pl-2 flex flex-col space-y-1 flex-shrink-0">
                    {" "}
                    {/* Changed to flex-col */}
                    {isCorrect && (
                      <span className="text-xs font-semibold text-green-600 bg-green-100 px-1.5 py-0.5 rounded inline-block">
                        Correct
                      </span>
                    )}
                    {isUserChoice && (
                      <span className="text-xs font-semibold text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded inline-block">
                        Your Answer
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
            {/* Handle Omitted Case */}
            {user_answer === null && (
              <div className="p-3 border rounded border-gray-400 bg-gray-100 text-gray-600 italic">
                You did not select an answer for this question.
              </div>
            )}
          </div>

          {/* Explanation */}
          {explanation && (
            <div className="mt-4 p-3 border-t border-gray-200 bg-gray-50 rounded">
              <p className="font-semibold mb-1">Explanation:</p>
              <div
                className="prose prose-sm max-w-none text-gray-700"
                // Allow HTML in explanations if needed, otherwise just use <p>
                dangerouslySetInnerHTML={{ __html: explanation }}
                // Or safer: <p className="text-sm text-gray-700">{explanation}</p>
              />
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="mt-6 pt-3 border-t border-gray-200 text-right">
          <button
            onClick={onClose} // Use the onClose prop function
            className="px-5 py-2 bg-gray-600 text-white text-sm font-medium rounded hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition duration-150"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuestionReviewModal;
