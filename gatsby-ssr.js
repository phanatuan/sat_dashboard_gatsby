// gatsby-ssr.js
import React from "react";
import { AuthProvider } from "./src/context/AuthContext";
import { ExamTimerProvider } from "./src/context/ExamTimerContext";

// Note: No CSS import needed in gatsby-ssr.js

export const wrapPageElement = ({ element, props }) => {
  // Attempt to get the exam_id from the page's context in SSR
  // It might be undefined on pages that don't have it.
  // The ExamTimerProvider handles null/undefined exam IDs.
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

// Optional: Matching wrapRootElement if you have one in gatsby-browser.js
// export const wrapRootElement = ({ element }) => {
//   return (
//     <AuthProvider>
//       {element}
//     </AuthProvider>
//   );
// };
