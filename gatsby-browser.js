// gatsby-browser.js
import React from "react";
import { AuthProvider } from "./src/context/AuthContext";
import { ExamTimerProvider } from "./src/context/ExamTimerContext";
import "./src/styles/global.css"; // Keep existing CSS import

export const wrapPageElement = ({ element, props }) => {
  // Attempt to get the exam_id from the page's context
  // It might be undefined on pages that don't have it (like the homepage)
  // The ExamTimerProvider itself handles null/undefined exam IDs gracefully.
  const currentExamId = props.pageContext?.exam_id;

  // Wrap with AuthProvider always
  // Wrap with ExamTimerProvider always, passing the examId (or null)
  return (
    <AuthProvider>
      <ExamTimerProvider currentExamId={currentExamId}>
        {element}
      </ExamTimerProvider>
    </AuthProvider>
  );
};

// Optional: You might have wrapRootElement for providers that ALWAYS wrap
// export const wrapRootElement = ({ element }) => {
//   return (
//     <AuthProvider> // If AuthProvider should always be present
//       {element}
//     </AuthProvider>
//   );
// };
