// gatsby-ssr.js
import React from "react";
import { AuthProvider } from "./src/context/AuthContext";
import { ExamTimerProvider } from "./src/context/ExamTimerContext";

const examQuestionPathRegex = /^\/exams\/([^/]+)\/questions\/([^/]+)\/?$/;

export const wrapPageElement = ({ element, props }) => {
  const match = props.path.match(examQuestionPathRegex); // Use props.path in SSR
  const currentExamId = match ? match[1] : null;

  return (
    <AuthProvider>
      {currentExamId ? (
        <ExamTimerProvider currentExamId={currentExamId}>
          {element}
        </ExamTimerProvider>
      ) : (
        element
      )}
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
