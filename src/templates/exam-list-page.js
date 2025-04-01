// src/templates/exam-list-page.js
import React, { useEffect, useState } from "react";
import { Link, navigate } from "gatsby";
import Layout from "../components/Layout";
import { useAuth } from "../context/AuthContext";

const ExamListPage = ({ pageContext }) => {
  const { allExams } = pageContext;
  const { user, loading } = useAuth();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSection, setSelectedSection] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [examsPerPage, setExamsPerPage] = useState(10);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login/");
    }
  }, [user, loading]);

  if (loading) {
    return (
      <Layout maxWidth="max-w-3xl">
        <p>Loading...</p>
      </Layout>
    );
  }

  if (!user) {
    return null; // Or redirect logic handled by useEffect
  }

  // --- Event Handlers ---
  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
    setCurrentPage(1);
  };

  const handleClearSearch = () => {
    setSearchTerm("");
    setCurrentPage(1);
  };

  const handleSectionChange = (event) => {
    setSelectedSection(event.target.value);
    setCurrentPage(1);
  };

  const handleExamsPerPageChange = (event) => {
    setExamsPerPage(parseInt(event.target.value, 10));
    setCurrentPage(1);
  };

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  // --- Filtering and Pagination Logic ---
  const filteredExams = allExams
    ? allExams.filter((exam) => {
        const searchMatch =
          searchTerm === "" ||
          exam.exam_name.toLowerCase().includes(searchTerm.toLowerCase());
        const sectionMatch =
          selectedSection === "All" || exam.section_name === selectedSection;
        return searchMatch && sectionMatch;
      })
    : [];

  const indexOfLastExam = currentPage * examsPerPage;
  const indexOfFirstExam = indexOfLastExam - examsPerPage;
  const currentExams = filteredExams.slice(indexOfFirstExam, indexOfLastExam);
  const totalPages = Math.ceil(filteredExams.length / examsPerPage);

  // --- Render ---
  if (!allExams || allExams.length === 0) {
    return (
      <Layout maxWidth="max-w-3xl">
        <h1 className="text-3xl font-bold mb-6">Available Exams</h1>
        <p>No exams available at the moment.</p>
      </Layout>
    );
  }

  return (
    // Assuming Layout component handles basic padding (like px-4)
    <Layout maxWidth="max-w-3xl">
      {/* Adjusted heading size slightly for smaller screens */}
      <h1 className="text-2xl sm:text-3xl font-bold mb-6">Available Exams</h1>

      {/* Search and Filter - Made Responsive */}
      {/* Stacks vertically on small screens, row on sm+ screens */}
      {/* Uses gap for spacing, works in both flex directions */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center gap-4">
        {/* Search Input */}
        <div className="relative w-full sm:flex-1">
          {" "}
          {/* Takes available space on larger screens */}
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <svg
              className="w-5 h-5 text-gray-500"
              fill="currentColor"
              viewBox="0 0 20 20"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                clipRule="evenodd"
              ></path>
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search exams..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 pl-10 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          />
          {searchTerm && (
            <button
              className="absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 hover:text-gray-900 focus:outline-none"
              onClick={handleClearSearch}
              aria-label="Clear search" // Added aria-label for accessibility
            >
              <svg
                className="w-4 h-4"
                fill="currentColor"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                ></path>
              </svg>
            </button>
          )}
        </div>

        {/* Section Filter - Made Responsive */}
        {/* Full width on small screens, fixed width on sm+ */}
        <div className="relative w-full sm:w-48 md:w-64">
          {" "}
          {/* Adjusted width steps */}
          <select
            value={selectedSection}
            onChange={handleSectionChange}
            className="block appearance-none w-full bg-white border border-gray-400 hover:border-gray-500 px-4 py-2 pr-8 rounded shadow leading-tight focus:outline-none focus:shadow-outline"
          >
            <option value="All">All Sections</option>
            {/* Consider dynamically populating these options */}
            <option value="English">English</option>
            <option value="Math">Math</option>
            {/* Add other sections as needed */}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
            <svg
              className="fill-current h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
            >
              <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Exams Per Page Select */}
      {/* Added flex and items-center for better alignment, especially if label wraps */}
      <div className="mb-4 flex items-center gap-2">
        <label htmlFor="examsPerPage" className="flex-shrink-0">
          {" "}
          {/* Prevent label from shrinking too much */}
          Exams per page:
        </label>
        <select
          id="examsPerPage"
          value={examsPerPage}
          onChange={handleExamsPerPageChange}
          className="shadow appearance-none border rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
        >
          <option value="10">10</option>
          <option value="20">20</option>
          <option value="50">50</option>
        </select>
      </div>

      {/* Exam List */}
      {/* Consider adding grid layout for larger screens if needed */}
      <ul className="list-none p-0 space-y-4">
        {" "}
        {/* Added space-y for consistent vertical spacing */}
        {currentExams.map((exam) => (
          <li
            key={exam.exam_id}
            className="border border-gray-300 p-4 rounded shadow hover:shadow-md transition-shadow duration-200" // Added hover effect
          >
            <h2 className="text-lg sm:text-xl font-semibold mb-2">
              {exam.exam_name}
            </h2>
            <p className="text-sm sm:text-base text-gray-700 mb-1">
              Category: {exam.test_category}
            </p>
            <p className="text-sm sm:text-base text-gray-700 mb-1">
              Section: {exam.section_name}
            </p>
            <Link
              to={`/exams/${exam.exam_id}/questions/1/`}
              className="inline-block mt-3 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-200" // Added focus styles
            >
              Start Exam
            </Link>
          </li>
        ))}
      </ul>

      {/* Pagination - Made Responsive */}
      {/* Allows buttons to wrap onto the next line on small screens */}
      {totalPages > 1 && (
        <div className="flex justify-center flex-wrap gap-2 mt-8">
          {" "}
          {/* Use gap and flex-wrap */}
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(
            (pageNumber) => (
              <button
                key={pageNumber}
                onClick={() => handlePageChange(pageNumber)}
                className={`px-3 py-1 rounded text-sm font-medium transition duration-150 ease-in-out ${
                  // Base styles
                  currentPage === pageNumber
                    ? "bg-blue-600 text-white shadow-sm" // Active styles
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300" // Inactive styles
                }`}
                aria-current={currentPage === pageNumber ? "page" : undefined} // Accessibility for current page
              >
                {pageNumber}
              </button>
            )
          )}
        </div>
      )}
    </Layout>
  );
};

export default ExamListPage;
