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
      .filter(Boolean);
    return [...new Set(categories)].sort();
  }, [userExams]);

  // --- Data Fetching Effect ---
  useEffect(() => {
    if (!authLoading && !user) {
      console.log("[Auth Effect] No user, navigating to login.");
      navigate("/login/");
      return;
    }

    if (!authLoading && user && typeof isAdmin === "boolean") {
      const fetchExamsData = async () => {
        if (!initialLoadComplete.current) {
          setIsFetchingExams(true);
        }
        setFetchError(null);

        try {
          let query;
          // *** MODIFIED: Added total_number_questions ***
          const selectFields = `
            exam_id,
            exam_name,
            section_name,
            test_category,
            total_number_questions,
            allow_practice_mode
          `;

          if (isAdmin) {
            query = supabase.from("exams").select(selectFields);
          } else {
            query = supabase
              .from("user_exam_access")
              .select(`exams (${selectFields})`)
              .eq("user_id", user.id);
          }

          const { data, error } = await query;

          if (error) {
            console.error("Supabase fetch error:", error);
            setUserExams([]);
            setFetchError(`Error loading exams: ${error.message}`);
            initialLoadComplete.current = true;
          } else {
            const exams = isAdmin
              ? data || []
              : data
              ? data.map((item) => item.exams).filter(Boolean)
              : [];

            setUserExams(exams);
            setFetchError(null);
            initialLoadComplete.current = true;
          }
        } catch (error) {
          console.error("Error fetching or processing exams:", error);
          setFetchError(
            "Failed to load exams. Please refresh or try again later."
          );
          setUserExams([]);
          initialLoadComplete.current = true;
        } finally {
          console.log("[Fetch Finally] Setting isFetchingExams to false.");
          setIsFetchingExams(false);
        }
      };

      fetchExamsData();
    } else if (!authLoading && !user) {
      console.log("[Fetch Effect] No user, resetting state.");
      setIsFetchingExams(false);
      setUserExams([]);
      setFetchError(null);
    } else {
      console.log(
        `[Fetch Effect] Skipping fetch. AuthLoading: ${authLoading}, User Exists: ${!!user}, IsAdmin Type: ${typeof isAdmin}`
      );
      if (user && typeof isAdmin !== "boolean") {
        setIsFetchingExams(authLoading);
      } else if (!user) {
        setIsFetchingExams(false);
      }
    }
  }, [user, authLoading, isAdmin]); // Dependencies remain the same

  // --- Loading State ---
  if (
    authLoading ||
    (!initialLoadComplete.current &&
      (isFetchingExams || (user && typeof isAdmin !== "boolean")))
  ) {
    return (
      <Layout maxWidth="max-w-4xl">
        {" "}
        {/* Slightly wider layout for table */}
        <p>Loading User Data...</p>
      </Layout>
    );
  }

  // --- Post-Loading, Pre-Render Checks ---
  if (!user) {
    return (
      <Layout maxWidth="max-w-4xl">
        <p>Please log in to view exams.</p>
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
    setCurrentPage(1);
  };
  const handleExamsPerPageChange = (event) => {
    setExamsPerPage(parseInt(event.target.value, 10));
    setCurrentPage(1);
  };
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  // --- Filtering and Pagination Logic (Remains the same) ---
  const filteredExams = userExams
    ? userExams.filter((exam) => {
        if (!exam) return false;
        const searchMatch =
          searchTerm === "" ||
          (exam.exam_name &&
            exam.exam_name.toLowerCase().includes(searchTerm.toLowerCase()));
        const sectionMatch =
          selectedSection === "All" || exam.section_name === selectedSection;
        const categoryMatch =
          selectedCategory === "All" || exam.test_category === selectedCategory;
        return searchMatch && sectionMatch && categoryMatch;
      })
    : [];

  const indexOfLastExam = currentPage * examsPerPage;
  const indexOfFirstExam = indexOfLastExam - examsPerPage;
  const currentExams = filteredExams.slice(indexOfFirstExam, indexOfLastExam);
  const totalPages = Math.ceil(filteredExams.length / examsPerPage);

  // --- Render Logic ---
  return (
    // *** MODIFIED: Increased max-width slightly for table display ***
    <Layout maxWidth="max-w-5xl">
      <h1 className="text-2xl sm:text-3xl font-bold mb-6">Available Exams</h1>

      {/* --- Search and Filter UI (Remains the same) --- */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center gap-4 flex-wrap">
        {/* Search Input */}
        <div className="relative w-full sm:flex-1 sm:min-w-[200px]">
          {/* Search Input JSX ... */}
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
          {/* Section Filter Select JSX ... */}
          <select
            value={selectedSection}
            onChange={handleSectionChange}
            className="block appearance-none w-full sm:w-40 md:w-48 bg-white border border-gray-400 hover:border-gray-500 px-4 py-2 pr-8 rounded shadow leading-tight focus:outline-none focus:shadow-outline"
          >
            <option value="All">All Sections</option>
            <option value="English">English</option>
            <option value="Math">Math</option>
            {/* Add other sections dynamically if needed */}
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
      {/* Check AFTER loading is false AND no error occurred */}
      {!isFetchingExams && !fetchError && currentExams.length === 0 && (
        <p className="text-center text-gray-500 mt-6">
          {isAdmin
            ? "No exams found matching your criteria."
            : "You currently don't have access to any exams, or none match your filters."}
        </p>
      )}

      {/* Only render table if NOT loading, NO error, AND exams exist */}
      {!isFetchingExams && !fetchError && currentExams.length > 0 && (
        // *** MODIFIED: Added responsive wrapper and table structure ***
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
                  className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider" // Centered
                >
                  Questions
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider" // Centered
                >
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentExams.map((exam) =>
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
                      {" "}
                      {/* Centered */}
                      {exam.total_number_questions ?? "N/A"}{" "}
                      {/* Use nullish coalescing for 0 or null/undefined */}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                      {" "}
                      {/* Centered */}
                      <Link
                        to={`/exams/${exam.exam_id}/questions/1/`} // Link remains the same
                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-150 ease-in-out"
                      >
                        Start Exam
                      </Link>
                    </td>
                  </tr>
                ) : null
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* --- Pagination (Remains the same) --- */}
      {!isFetchingExams && totalPages > 1 && (
        <div className="flex justify-center flex-wrap gap-2 mt-8 pb-4">
          {/* Pagination buttons JSX ... */}
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
