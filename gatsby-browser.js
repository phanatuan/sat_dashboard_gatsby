// gatsby-browser.js
import React from "react";
import { AuthProvider } from "./src/context/AuthContext";
import { ExamTimerProvider } from "./src/context/ExamTimerContext";
import "./src/styles/global.css"; // Keep existing CSS import

// Regex to match exam question pages
const examQuestionPathRegex = /^\/exams\/([^/]+)\/questions\/([^/]+)\/?$/;

export const wrapPageElement = ({ element, props }) => {
  const match = props.location.pathname.match(examQuestionPathRegex);
  const currentExamId = match ? match[1] : null; // Extract exam_id from path

  // Wrap with AuthProvider always
  // Wrap with ExamTimerProvider only on exam question pages, passing the examId
  return (
    <AuthProvider>
      {currentExamId ? (
        <ExamTimerProvider currentExamId={currentExamId}>
          {element}
        </ExamTimerProvider>
      ) : (
        element // Don't wrap non-exam pages with timer context
      )}
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
