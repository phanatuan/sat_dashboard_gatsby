// src/templates/exam-list-page.js
import React, { useEffect } from "react"; // Import useEffect
import { Link, navigate } from "gatsby"; // Import navigate
import Layout from "../components/Layout";
import { useAuth } from "../context/AuthContext"; // Import useAuth

const ExamListPage = ({ pageContext }) => {
  const { allExams } = pageContext;
  const { user, loading } = useAuth(); // Get user and loading status

  useEffect(() => {
    // If the context is done loading and there's no user, redirect to login
    if (!loading && !user) {
      navigate("/login/");
    }
  }, [user, loading]); // Re-run effect if user or loading state changes

  // Optional: Show loading state while auth check is happening
  if (loading) {
    return (
      <Layout maxWidth="max-w-3xl">
        <p>Loading...</p>
      </Layout>
    );
  }

  // If user is null after loading, the effect will redirect,
  // so we might briefly render this before redirecting, or just return null.
  if (!user) {
    return null; // Or a placeholder while redirecting
  }

  // --- Render exam list only if user is logged in ---
  if (!allExams || allExams.length === 0) {
    return (
      <Layout maxWidth="max-w-3xl">
        <h1 className="text-3xl font-bold mb-6">Available Exams</h1>
        <p>No exams available at the moment.</p>
      </Layout>
    );
  }

  return (
    <Layout maxWidth="max-w-3xl">
      <h1 className="text-3xl font-bold mb-6">Available Exams</h1>
      <ul className="list-none p-0">
        {allExams.map((exam) => (
          <li
            key={exam.exam_id}
            className="mb-4 border border-gray-300 p-4 rounded shadow"
          >
            <h2 className="text-xl font-semibold mb-2">{exam.exam_name}</h2>
            <p className="text-gray-700 mb-1">Category: {exam.test_category}</p>
            <p className="text-gray-700 mb-1">Section: {exam.section_name}</p>
            {/* Make sure user has access before showing the link? Or handle on next page */}
            <Link
              to={`/exams/${exam.exam_id}/questions/1/`}
              className="inline-block mt-3 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition duration-200"
            >
              Start Exam
            </Link>
          </li>
        ))}
      </ul>
    </Layout>
  );
};

export default ExamListPage;
