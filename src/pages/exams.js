// src/pages/exams.js - Make sure it's in the pages directory!
import React, { useEffect, useState, useRef, useMemo } from "react";
import { Link, navigate } from "gatsby";
import Layout from "../components/Layout";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../supabaseClient";

const ExamsPage = () => {
  // Destructure isAdmin from useAuth
  const { user, loading: authLoading, isAdmin } = useAuth();

  const [userExams, setUserExams] = useState([]);
  const [isFetchingExams, setIsFetchingExams] = useState(true); // Start as true
  const [fetchError, setFetchError] = useState(null);
  // useRef to track if the *first* successful load (or error) has happened
  const initialLoadComplete = useRef(false);

  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSection, setSelectedSection] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [examsPerPage, setExamsPerPage] = useState(10);

  const uniqueCategories = useMemo(() => {
    if (!userExams || userExams.length === 0) {
      return [];
    }
    // Extract all categories, filter out null/undefined, get unique values, sort
    const categories = userExams
      .map((exam) => exam?.test_category)
      .filter(Boolean); // Remove null/undefined categories
    return [...new Set(categories)].sort(); // Get unique and sort
  }, [userExams]); // Recalculate only when userExams changes

  useEffect(() => {
    // Redirect check (runs whenever authLoading or user changes)
    if (!authLoading && !user) {
      console.log(
        "[Auth Effect] No user and not loading, navigating to login."
      );
      navigate("/login/");
      return;
    }

    // Fetch exams only when authentication is resolved, user exists, and admin status is known
    // Check if isAdmin is explicitly true or false (not null/undefined)
    if (!authLoading && user && typeof isAdmin === "boolean") {
      console.log(
        `[Fetch Effect] Conditions met. User: ${user.id}, IsAdmin: ${isAdmin}. Fetching exams...`
      );
      const fetchExamsData = async () => {
        if (!initialLoadComplete.current) {
          setIsFetchingExams(true);
        }
        setFetchError(null);

        try {
          let query;
          const selectFields = `
            exam_id,
            exam_name,
            section_name,
            test_category,
            allow_practice_mode
          `;

          if (isAdmin) {
            // --- ADMIN PATH ---
            console.log(
              "[Fetch Logic] User is ADMIN. Querying 'exams' table directly."
            );
            query = supabase.from("exams").select(selectFields);
          } else {
            // --- REGULAR USER PATH ---
            console.log(
              "[Fetch Logic] User is REGULAR. Querying via 'user_exam_access'."
            );
            query = supabase
              .from("user_exam_access")
              .select(`exams (${selectFields})`) // Fetch nested exam data
              .eq("user_id", user.id);
          }

          // Execute the query
          const { data, error } = await query;
          console.log("[Fetch Result] Data:", data, "Error:", error);

          if (error) {
            setUserExams([]); // Clear exams on error
            setFetchError(/* error message */);
            initialLoadComplete.current = true; // Mark attempt complete
          } else {
            // Process the data based on whether user is admin or not
            const exams = isAdmin
              ? data || [] // Admin query returns array directly, ensure it's an array
              : data
              ? data.map((item) => item.exams).filter(Boolean)
              : []; // User query needs mapping

            console.log("[Fetch Processed] Exams state set to:", exams);
            setUserExams(exams);
            setFetchError(null); // Clear any previous error
            // Mark initial load complete AFTER success
            initialLoadComplete.current = true;
          }
        } catch (error) {
          console.error("Error fetching or processing exams:", error);
          setFetchError(
            "Failed to load exams. Please refresh or try again later."
          );
          setUserExams([]); // Ensure exams are empty on error
          initialLoadComplete.current = true; // Mark attempt complete
        } finally {
          console.log("[Fetch Finally] Setting isFetchingExams to false.");
          setIsFetchingExams(false);
        }
      };

      fetchExamsData();
    } else if (!authLoading && !user) {
      // This case is handled by the redirect logic above, but good for clarity
      console.log("[Fetch Effect] No user, resetting state.");
      setIsFetchingExams(false); // Ensure loading stops if user logs out
      setUserExams([]);
      setFetchError(null);
    } else {
      console.log(
        `[Fetch Effect] Skipping fetch. AuthLoading: ${authLoading}, User Exists: ${!!user}, IsAdmin Type: ${typeof isAdmin}`
      );
      // If user exists but isAdmin isn't boolean yet, we might still be loading role info
      if (user && typeof isAdmin !== "boolean") {
        // Optionally keep loading state true, or set based on authLoading only
        setIsFetchingExams(authLoading); // Keep fetching if auth is still loading role?
      } else if (!user) {
        setIsFetchingExams(false); // Definitively stop fetching if no user
      }
    }
    // Depend on user, loading status, AND admin status
  }, [user, authLoading, isAdmin]);

  // --- Loading State ---
  // Show loading if auth isn't finished, OR if auth IS finished but we are actively fetching exams
  // OR if user exists but admin role isn't determined yet
  if (
    authLoading ||
    (!initialLoadComplete.current &&
      (isFetchingExams || (user && typeof isAdmin !== "boolean")))
  ) {
    return (
      <Layout maxWidth="max-w-3xl">
        <p>Loading User Data...</p>
      </Layout>
    );
  }

  // --- Post-Loading, Pre-Render Checks ---
  // If loading is done, but there's no user (should have been redirected, safety net)
  if (!user) {
    return (
      <Layout maxWidth="max-w-3xl">
        <p>Please log in to view exams.</p>{" "}
        {/* More informative than redirect message */}
      </Layout>
    );
  }

  // --- Event Handlers (Remain the same) ---
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

  const handleCategoryChange = (event) => {
    setSelectedCategory(event.target.value);
    setCurrentPage(1); // Reset page when filter changes
  };

  const handleExamsPerPageChange = (event) => {
    setExamsPerPage(parseInt(event.target.value, 10));
    setCurrentPage(1);
  };
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  // --- Filtering and Pagination Logic (Uses userExams state) ---
  const filteredExams = userExams
    ? userExams.filter((exam) => {
        if (!exam) return false;
        // Match Search Term
        const searchMatch =
          searchTerm === "" ||
          (exam.exam_name &&
            exam.exam_name.toLowerCase().includes(searchTerm.toLowerCase()));
        // Match Section
        const sectionMatch =
          selectedSection === "All" || exam.section_name === selectedSection;
        // Match Category (New)
        const categoryMatch =
          selectedCategory === "All" || exam.test_category === selectedCategory;

        // Return true only if ALL filters match
        return searchMatch && sectionMatch && categoryMatch;
      })
    : [];

  const indexOfLastExam = currentPage * examsPerPage;
  const indexOfFirstExam = indexOfLastExam - examsPerPage;
  const currentExams = filteredExams.slice(indexOfFirstExam, indexOfLastExam);
  const totalPages = Math.ceil(filteredExams.length / examsPerPage);

  // --- Render Logic ---
  return (
    <Layout>
      {/* UI Elements remain largely the same, using 'currentExams' */}
      <h1 className="text-2xl sm:text-3xl font-bold mb-6">Available Exams</h1>

      {/* --- Search and Filter UI --- */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center gap-4">
        {/* Search Input */}
        <div className="relative w-full sm:flex-1">
          {/* ... Search Input JSX ... */}
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <svg
              className="w-5 h-5 text-gray-500"
              fill="currentColor"
              viewBox="0 0 20 20"
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
              aria-label="Clear search"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
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
        <div className="relative w-full sm:w-48 md:w-64">
          {/* ... Section Filter Select JSX ... */}
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

        {/* Category Filter */}
        <div className="relative w-full sm:w-auto">
          <select
            value={selectedCategory}
            onChange={handleCategoryChange}
            className="block appearance-none w-full sm:w-48 md:w-56 bg-white border border-gray-400 hover:border-gray-500 px-4 py-2 pr-8 rounded shadow leading-tight focus:outline-none focus:shadow-outline"
            aria-label="Filter by category" // Accessibility
          >
            <option value="All">All Categories</option>
            {uniqueCategories.map((category) => (
              <option key={category} value={category}>
                {category} {/* Display the category name */}
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
      </div>

      {/* Exams Per Page Select */}
      <div className="mb-4 flex items-center gap-2">
        {/* ... Exams Per Page Select JSX ... */}
        <label htmlFor="examsPerPage" className="flex-shrink-0">
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

      {/* --- Display Fetch Error --- */}
      {fetchError && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {fetchError}
        </div>
      )}

      {/* --- Exam List or Empty State --- */}
      {/* Check AFTER loading is false AND no error occurred */}
      {!isFetchingExams && !fetchError && currentExams.length === 0 && (
        <p>
          {isAdmin
            ? "No exams found matching your criteria." // Admin message
            : "You currently don't have access to any exams, or none match your filters."}{" "}
          {/* User message */}
        </p>
      )}

      {/* Only map if NOT loading, NO error, AND exams exist */}
      {!isFetchingExams && !fetchError && currentExams.length > 0 && (
        <ul className="list-none p-0 space-y-4">
          {currentExams.map(
            (exam) =>
              // Add a check here in case filtering resulted in undefined/null somehow
              exam ? (
                <li
                  key={exam.exam_id}
                  className="border border-gray-300 p-4 rounded shadow hover:shadow-md transition-shadow duration-200"
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
                    className="inline-block mt-3 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-200"
                  >
                    Start Exam
                  </Link>
                </li>
              ) : null // Don't render if exam object is unexpectedly null/undefined
          )}
        </ul>
      )}

      {/* --- Pagination --- */}
      {/* Show pagination only if not loading AND there are multiple pages */}
      {!isFetchingExams && totalPages > 1 && (
        <div className="flex justify-center flex-wrap gap-2 mt-8">
          {/* ... Pagination buttons JSX ... */}
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
