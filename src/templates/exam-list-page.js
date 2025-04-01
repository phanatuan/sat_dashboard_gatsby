// src/templates/exam-list-page.js
import React, { useEffect, useState } from "react"; // Import useEffect
import { Link, navigate } from "gatsby"; // Import navigate
import Layout from "../components/Layout";
import { useAuth } from "../context/AuthContext"; // Import useAuth

const ExamListPage = ({ pageContext }) => {
  const { allExams } = pageContext;
  const { user, loading } = useAuth();

  // State variables for filtering, searching, and pagination
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSection, setSelectedSection] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [examsPerPage, setExamsPerPage] = useState(10); // Default: 10 exams per page

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

  if (!user) {
    return null;
  }

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
    setCurrentPage(1); // Reset to first page when search term changes
  };

  const handleClearSearch = () => {
    setSearchTerm("");
    setCurrentPage(1);
  };

  const handleSectionChange = (event) => {
    setSelectedSection(event.target.value);
    setCurrentPage(1); // Reset to first page when section changes
  };

  const handleExamsPerPageChange = (event) => {
    setExamsPerPage(parseInt(event.target.value, 10));
    setCurrentPage(1); // Reset to first page when items per page change
  };

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

  // Pagination Logic
  const indexOfLastExam = currentPage * examsPerPage;
  const indexOfFirstExam = indexOfLastExam - examsPerPage;
  const currentExams = filteredExams.slice(indexOfFirstExam, indexOfLastExam);

  const totalPages = Math.ceil(filteredExams.length / examsPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

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
      {/* Search and Filter */}
      <div className="mb-4 flex items-center space-x-4">
        {/* Search Input */}
        <div className="relative w-full">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            {/* Search Icon */}
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
            >
              {/* Clear Icon (X) */}
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

        {/* Section Filter */}
        <div className="inline-block relative w-64">
          <select
            value={selectedSection}
            onChange={handleSectionChange}
            className="block appearance-none w-full bg-white border border-gray-400 hover:border-gray-500 px-4 py-2 pr-8 rounded shadow leading-tight focus:outline-none focus:shadow-outline"
          >
            <option value="All">All Sections</option>
            <option value="English">English</option>
            <option value="Math">Math</option>
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
      <div className="mb-4">
        <label htmlFor="examsPerPage" className="mr-2">
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

      <ul className="list-none p-0">
        {currentExams.map((exam) => (
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-8">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(
            (pageNumber) => (
              <button
                key={pageNumber}
                onClick={() => handlePageChange(pageNumber)}
                className={`mx-1 px-3 py-1 rounded ${
                  currentPage === pageNumber
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
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
