// src/pages/exams.js (or wherever your exams page lives)
import React, { useEffect, useState, useRef, useMemo } from "react";
import { Link, navigate } from "gatsby";
import Layout from "../components/Layout";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../supabaseClient";

const ExamsPage = () => {
  const { user, loading: authLoading, isAdmin } = useAuth();
  const [userExams, setUserExams] = useState([]);
  const [isFetchingExams, setIsFetchingExams] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const initialLoadComplete = useRef(false);

  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSection, setSelectedSection] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [examsPerPage, setExamsPerPage] = useState(10);

  // Calculate unique categories for the filter dropdown
  const uniqueCategories = useMemo(() => {
    if (!userExams || userExams.length === 0) return [];
    const categories = userExams
      .map((exam) => exam?.test_category)
      .filter(Boolean); // Filter out null/undefined categories
    return [...new Set(categories)].sort();
  }, [userExams]);

  // --- Data Fetching Effect ---
  useEffect(() => {
    if (!authLoading && !user) {
      // console.log("[Auth Effect] No user, navigating to login.");
      navigate("/login/");
      return;
    }

    if (!authLoading && user && typeof isAdmin === "boolean") {
      const fetchExamsData = async () => {
        // Avoid setting loading state on subsequent fetches unless necessary
        if (!initialLoadComplete.current) {
          setIsFetchingExams(true);
        }
        setFetchError(null);

        try {
          let query;
          // Select fields needed for the table and linking
          const selectFields = `
            exam_id,
            exam_name,
            section_name,
            test_category,
            total_number_questions,
            allow_practice_mode
          `;

          if (isAdmin) {
            // Admin fetches all exams directly
            query = supabase.from("exams").select(selectFields);
          } else {
            // Non-admin fetches exams they have access to via junction table
            query = supabase
              .from("user_exam_access")
              .select(`exams (${selectFields})`) // Select nested exam data
              .eq("user_id", user.id);
          }

          const { data, error } = await query;

          if (error) {
            console.error("Supabase fetch error:", error);
            setUserExams([]);
            setFetchError(`Error loading exams: ${error.message}`);
          } else {
            // Process data based on admin status
            const exams = isAdmin
              ? data || [] // Admin gets direct array
              : data // Non-admin gets array of objects { exams: { ... } }
              ? data.map((item) => item.exams).filter(Boolean) // Extract nested exam data and filter nulls
              : [];
            setUserExams(exams);
            setFetchError(null);
          }
        } catch (error) {
          console.error("Error fetching or processing exams:", error);
          setFetchError(
            "Failed to load exams. Please refresh or try again later."
          );
          setUserExams([]);
        } finally {
          // Mark initial load as complete and set fetching state to false
          initialLoadComplete.current = true;
          setIsFetchingExams(false);
          // console.log("[Fetch Finally] Setting isFetchingExams to false.");
        }
      };

      fetchExamsData();
    } else if (!authLoading && !user) {
      // If logged out, clear state
      // console.log("[Fetch Effect] No user, resetting state.");
      setIsFetchingExams(false); // Ensure loading stops
      setUserExams([]);
      setFetchError(null);
      initialLoadComplete.current = true; // Mark load complete even if no user
    }
    // Handle initial loading state while auth context resolves
    else if (authLoading || (user && typeof isAdmin !== "boolean")) {
      setIsFetchingExams(true); // Stay in loading state
    }
  }, [user, authLoading, isAdmin]); // Dependencies

  // --- Loading State ---
  // Show loading if auth is loading OR initial fetch hasn't completed AND
  // (either fetch is in progress OR user exists but admin status isn't resolved yet)
  if (
    authLoading ||
    (!initialLoadComplete.current &&
      (isFetchingExams || (user && typeof isAdmin !== "boolean")))
  ) {
    return (
      <Layout maxWidth="max-w-5xl">
        <p>Loading User Data...</p>
      </Layout>
    );
  }

  // --- Post-Loading, Pre-Render Checks ---
  // If not loading and still no user, prompt login (should have navigated already, but safe check)
  if (!user) {
    return (
      <Layout maxWidth="max-w-5xl">
        <p>Please log in to view exams.</p>
      </Layout>
    );
  }

  // --- Event Handlers ---
  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
    setCurrentPage(1); // Reset page on search
  };
  const handleClearSearch = () => {
    setSearchTerm("");
    setCurrentPage(1); // Reset page on clear
  };
  const handleSectionChange = (event) => {
    setSelectedSection(event.target.value);
    setCurrentPage(1); // Reset page on filter change
  };
  const handleCategoryChange = (event) => {
    setSelectedCategory(event.target.value);
    setCurrentPage(1); // Reset page on filter change
  };
  const handleExamsPerPageChange = (event) => {
    setExamsPerPage(parseInt(event.target.value, 10));
    setCurrentPage(1); // Reset page on per-page change
  };
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  // --- Filtering and Pagination Logic ---
  const filteredExams = userExams
    ? userExams.filter((exam) => {
        if (!exam) return false; // Skip if exam data is missing
        // Check if exam name matches search term (case-insensitive)
        const searchMatch =
          searchTerm === "" ||
          (exam.exam_name &&
            exam.exam_name.toLowerCase().includes(searchTerm.toLowerCase()));
        // Check if section matches filter (or 'All')
        const sectionMatch =
          selectedSection === "All" || exam.section_name === selectedSection;
        // Check if category matches filter (or 'All')
        const categoryMatch =
          selectedCategory === "All" || exam.test_category === selectedCategory;
        return searchMatch && sectionMatch && categoryMatch;
      })
    : []; // Default to empty array if userExams is null/undefined

  // Calculate exams for the current page
  const indexOfLastExam = currentPage * examsPerPage;
  const indexOfFirstExam = indexOfLastExam - examsPerPage;
  const currentExams = filteredExams.slice(indexOfFirstExam, indexOfLastExam);
  const totalPages = Math.ceil(filteredExams.length / examsPerPage);

  // --- Render Logic ---
  return (
    <Layout maxWidth="max-w-5xl">
      {" "}
      {/* Using wider layout */}
      <h1 className="text-2xl sm:text-3xl font-bold mb-6">Available Exams</h1>
      {/* --- Search and Filter UI --- */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center gap-4 flex-wrap">
        {/* Search Input */}
        <div className="relative w-full sm:flex-1 sm:min-w-[200px]">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <svg
              className="w-5 h-5 text-gray-500"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              {" "}
              <path
                fillRule="evenodd"
                d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                clipRule="evenodd"
              ></path>{" "}
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search exams..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 pl-10 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            aria-label="Search exams by name"
          />
          {searchTerm && (
            <button
              className="absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 hover:text-gray-900 focus:outline-none"
              onClick={handleClearSearch}
              aria-label="Clear search"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                {" "}
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                ></path>{" "}
              </svg>
            </button>
          )}
        </div>
        {/* Section Filter */}
        <div className="relative w-full sm:w-auto">
          <select
            value={selectedSection}
            onChange={handleSectionChange}
            className="block appearance-none w-full sm:w-40 md:w-48 bg-white border border-gray-400 hover:border-gray-500 px-4 py-2 pr-8 rounded shadow leading-tight focus:outline-none focus:shadow-outline"
            aria-label="Filter by section"
          >
            <option value="All">All Sections</option>
            <option value="English">English</option>
            <option value="Math">Math</option>
            {/* Add other sections if needed */}
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
        {/* Category Filter */}
        <div className="relative w-full sm:w-auto">
          <select
            value={selectedCategory}
            onChange={handleCategoryChange}
            className="block appearance-none w-full sm:w-40 md:w-48 bg-white border border-gray-400 hover:border-gray-500 px-4 py-2 pr-8 rounded shadow leading-tight focus:outline-none focus:shadow-outline"
            aria-label="Filter by category"
          >
            <option value="All">All Categories</option>
            {uniqueCategories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
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
        {/* Exams Per Page Select */}
        <div className="flex items-center gap-2">
          <label
            htmlFor="examsPerPage"
            className="flex-shrink-0 text-sm text-gray-700"
          >
            Show:
          </label>
          <select
            id="examsPerPage"
            value={examsPerPage}
            onChange={handleExamsPerPageChange}
            className="text-sm shadow-sm appearance-none border rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            aria-label="Select number of exams per page"
          >
            <option value="10">10</option>
            <option value="20">20</option>
            <option value="50">50</option>
          </select>
        </div>
      </div>
      {/* --- Display Fetch Error --- */}
      {fetchError && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {fetchError}
        </div>
      )}
      {/* --- Exam Table or Empty State --- */}
      {/* Show empty state only if NOT loading AND NO error AND NO filtered exams */}
      {!isFetchingExams && !fetchError && filteredExams.length === 0 && (
        <p className="text-center text-gray-500 mt-6">
          {userExams.length === 0 && initialLoadComplete.current // Distinguish between no access and no matches
            ? isAdmin
              ? "No exams found in the system."
              : "You currently don't have access to any exams."
            : "No exams found matching your criteria."}
        </p>
      )}
      {/* Render table only if NOT loading, NO error, AND there ARE exams to show on the current page */}
      {!isFetchingExams && !fetchError && currentExams.length > 0 && (
        <div className="overflow-x-auto shadow border-b border-gray-200 rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Name (Exam)
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Section
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Category
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Questions
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentExams.map(
                (exam) =>
                  exam ? ( // Extra check for safety
                    <tr key={exam.exam_id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {exam.exam_name || "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {exam.section_name || "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {exam.test_category || "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                        {exam.total_number_questions ?? "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                        {/* --- CORRECTED LINK --- */}
                        {/* Links to the first question using the path structure generated in gatsby-node.js */}
                        <Link
                          to={`/exam/${exam.exam_id}/question/1/`}
                          className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-150 ease-in-out"
                        >
                          Start Exam
                        </Link>
                        {/* --- END CORRECTION --- */}
                      </td>
                    </tr>
                  ) : null // Skip rendering if exam data is somehow null in the array
              )}
            </tbody>
          </table>
        </div>
      )}
      {/* --- Pagination --- */}
      {/* Show pagination only if NOT loading AND there is more than one page */}
      {!isFetchingExams && totalPages > 1 && (
        <div className="flex justify-center flex-wrap gap-2 mt-8 pb-4">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(
            (pageNumber) => (
              <button
                key={pageNumber}
                onClick={() => handlePageChange(pageNumber)}
                className={`px-3 py-1 rounded text-sm font-medium transition duration-150 ease-in-out ${
                  currentPage === pageNumber
                    ? "bg-blue-600 text-white shadow-sm"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
                aria-current={currentPage === pageNumber ? "page" : undefined}
                aria-label={`Go to page ${pageNumber}`}
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

export default ExamsPage;
