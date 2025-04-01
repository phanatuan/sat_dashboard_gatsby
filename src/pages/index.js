// src/pages/index.js
import React from "react";
import { Link } from "gatsby";
import Layout from "../components/Layout";
// Optional: You might want to import useAuth to customize based on login status
// import { useAuth } from "../context/AuthContext";

// Example simple SVG icons (replace with your preferred icon library or actual SVGs)
const PracticeIcon = () => (
  <svg
    className="w-12 h-12 text-blue-600 mb-4 mx-auto md:mx-0"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
    ></path>
  </svg>
);

const VarietyIcon = () => (
  <svg
    className="w-12 h-12 text-blue-600 mb-4 mx-auto md:mx-0"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
    ></path>
  </svg>
);

const ProgressIcon = () => (
  <svg
    className="w-12 h-12 text-blue-600 mb-4 mx-auto md:mx-0"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
    ></path>
  </svg>
);

const HomePage = () => {
  // const { user } = useAuth(); // Optional: Get user status

  return (
    // Using Layout for consistent header/footer and overall structure
    // You might want a slightly wider max-width for the homepage content sections
    <Layout maxWidth="max-w-5xl">
      {" "}
      {/* Adjusted maxWidth */}
      {/* --- Hero Section --- */}
      <section className="text-center py-16 md:py-24 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg shadow-sm mb-16">
        <div className="max-w-3xl mx-auto px-4">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-800 mb-4">
            Ace Your SATs
          </h1>
          <p className="text-lg md:text-xl text-gray-600 mb-8">
            Practice with realistic digital SAT tests and track your progress.
            Get ready for exam day!
          </p>
          <Link
            to="/exams/" // Link to the exam list page
            className="inline-block px-8 py-3 bg-blue-600 text-white text-lg font-semibold rounded-md shadow-md hover:bg-blue-700 transition duration-300 ease-in-out transform hover:-translate-y-1"
          >
            View Available Exams
          </Link>
          {/* Optional: Show different CTA if logged out */}
          {/* {!user && (
            <Link to="/login/" className="...">Login to Practice</Link>
          )} */}
        </div>
      </section>
      {/* --- Features Section --- */}
      <section className="py-16 md:py-20">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl font-semibold text-center text-gray-800 mb-12">
            Why Practice With Us?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
            {/* Feature 1 */}
            <div className="text-center md:text-left">
              <PracticeIcon />
              <h3 className="text-xl font-medium text-gray-800 mb-2">
                Realistic Practice
              </h3>
              <p className="text-gray-600">
                Experience the digital SAT format with authentic practice tests
                designed to mimic the real exam.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="text-center md:text-left">
              <VarietyIcon />
              <h3 className="text-xl font-medium text-gray-800 mb-2">
                Variety of Sections
              </h3>
              <p className="text-gray-600">
                Access practice modules for both English and Math sections,
                covering a range of topics.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="text-center md:text-left">
              <ProgressIcon />
              <h3 className="text-xl font-medium text-gray-800 mb-2">
                Track Your Progress
              </h3>
              <p className="text-gray-600">
                (Coming Soon!) Monitor your performance, identify weak areas,
                and see your improvement over time.
              </p>
            </div>
          </div>
        </div>
      </section>
      {/* --- Call to Action Section --- */}
      <section className="py-16 bg-gray-100 rounded-lg shadow-inner mt-16">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-semibold text-gray-800 mb-4">
            Ready to Start Practicing?
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            Browse our available exams and take the first step towards your
            target score.
          </p>
          <Link
            to="/exams/"
            className="inline-block px-8 py-3 bg-blue-600 text-white text-lg font-semibold rounded-md shadow-md hover:bg-blue-700 transition duration-300 ease-in-out transform hover:-translate-y-1"
          >
            Browse Exams Now
          </Link>
        </div>
      </section>
    </Layout>
  );
};

export default HomePage;
