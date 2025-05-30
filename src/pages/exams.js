// src/pages/exams.js (or wherever your exams page lives)
import React, {
  useEffect,
  useState,
  useRef,
  useMemo,
  useCallback,
} from "react"; // Added useCallback
import { Link } from "gatsby";
import clsx from "clsx"; // *** IMPORT clsx ***
import Layout from "../components/Layout";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../supabaseClient";
// GoogleSignInButton is now used within RestrictedAccessMessage
// import GoogleSignInButton from "../components/GoogleSignInButton";
import RestrictedAccessMessage from "../components/RestrictedAccessMessage"; // Import the new component

const ExamsPage = () => {
  const { user, loading: authLoading, isAdmin } = useAuth(); // Removed signInWithProvider if not used here
  const [userExams, setUserExams] = useState([]);
  const [userExamResults, setUserExamResults] = useState({}); // State for exam results { exam_id: latest_result }
  const [isFetchingExams, setIsFetchingExams] = useState(true); // Tracks fetching exams AND results now
  const [fetchError, setFetchError] = useState(null);
  const initialLoadComplete = useRef(false); // Tracks completion of initial data load (exams + results)

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

  // --- Data Fetching Effect (Exams and Results - Optimized) ---
  useEffect(() => {
    // if (!authLoading && !user) {
    //   // console.log("[Auth Effect] No user, navigating to login.");
    //   // navigate("/login/"); // <<< REMOVED THIS LINE
    //   return;
    if (!authLoading && user && typeof isAdmin === "boolean") {
      const fetchExamsAndResults = async () => {
        // Set loading state only on initial load
        if (!initialLoadComplete.current) {
          setIsFetchingExams(true);
        }
        setFetchError(null);
        setUserExamResults({}); // Clear previous results

        try {
          // 1. Fetch Exams
          let examQuery;
          const selectFields = `
            exam_id,
            exam_name,
            section_name,
            test_category,
            total_number_questions,
            allow_practice_mode
          `;

          if (isAdmin) {
            examQuery = supabase.from("exams").select(selectFields);
          } else {
            examQuery = supabase
              .from("user_exam_access")
              .select(`exams (${selectFields})`)
              .eq("user_id", user.id);
          }

          const { data: examData, error: examError } = await examQuery;

          if (examError) {
            console.error("Supabase exam fetch error:", examError);
            setUserExams([]);
            setFetchError(`Error loading exams: ${examError.message}`);
            setIsFetchingExams(false); // Stop loading on error
            initialLoadComplete.current = true;
            return; // Stop if exams fail to load
          }

          const exams = isAdmin
            ? examData || []
            : examData
            ? examData.map((item) => item.exams).filter(Boolean)
            : [];
          setUserExams(exams);

          // 2. Fetch Results in Bulk (Optimized)
          //    Only fetch results if user is not admin and exams were loaded.
          //    (Admins don't have personal results in this context)
          if (exams.length > 0) {
            const examIds = exams.map((exam) => exam.exam_id);

            const { data: resultsData, error: resultsError } = await supabase
              .from("exam_results")
              .select("exam_id, user_answers, current_progress") // Select needed fields
              .eq("user_id", user.id) // Filter by current user
              .in("exam_id", examIds); // Filter by accessible exam IDs

            if (resultsError) {
              console.error("Supabase results fetch error:", resultsError);
              // Decide if this is critical. Maybe just log and continue without results?
              // For now, we'll log the error but not set the main fetchError
              // setFetchError(`Error loading exam results: ${resultsError.message}`);
            } else if (resultsData) {
              // Map results data into the state object { exam_id: result }
              const resultsMap = resultsData.reduce((acc, result) => {
                acc[result.exam_id] = result;
                return acc;
              }, {});
              setUserExamResults(resultsMap);
            }
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

      fetchExamsAndResults(); // *** CORRECT FUNCTION CALL ***
    } else if (!authLoading && !user) {
      // If logged out, clear state
      // console.log("[Fetch Effect] No user, resetting state.");
      setIsFetchingExams(false); // Ensure loading stops
      setUserExams([]);
      setUserExamResults({}); // Clear results
      setFetchError(null);
      initialLoadComplete.current = true; // Mark load complete even if no user
    }
    // Handle initial loading state while auth context resolves
    else if (authLoading || (user && typeof isAdmin !== "boolean")) {
      setIsFetchingExams(true); // Stay in loading state
    }
    // Removed fetchLatestResult from dependencies
  }, [user, authLoading, isAdmin]);

  // --- Loading State ---
  // Show loading if auth is loading OR initial fetch (exams + results) hasn't completed
  if (authLoading || !initialLoadComplete.current) {
    return (
      <Layout>
        <p>Đang tải dữ liệu người dùng...</p>
      </Layout>
    );
  }

  // --- Post-Loading, Pre-Render Checks ---
  // If not loading and still no user, show the reusable restricted access message
  if (!user) {
    return (
      <Layout>
        {/* Use the new component. Pass custom props if needed, otherwise defaults are used. */}
        {/* Example with custom props: <RestrictedAccessMessage title="Exams Access Denied" message="Please log in to view exams." /> */}
        <RestrictedAccessMessage />
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
    <Layout>
      {/* Using wider layout */}
      <h1 className="text-2xl sm:text-3xl font-bold mb-6">
        Các bài thi hiện có
      </h1>
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
            placeholder="Tìm kiếm bài thi..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 pl-10 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            aria-label="Tìm kiếm bài thi theo tên"
          />
          {searchTerm && (
            <button
              className="absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 hover:text-gray-900 focus:outline-none"
              onClick={handleClearSearch}
              aria-label="Xóa tìm kiếm"
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
            aria-label="Lọc theo phần thi"
          >
            <option value="All">Tất cả các phần</option>
            <option value="English">Tiếng Anh</option>
            <option value="Math">Toán</option>
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
            aria-label="Lọc theo danh mục"
          >
            <option value="All">Tất cả danh mục</option>
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
            Hiển thị:
          </label>
          <select
            id="examsPerPage"
            value={examsPerPage}
            onChange={handleExamsPerPageChange}
            className="text-sm shadow-sm appearance-none border rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            aria-label="Chọn số lượng bài thi mỗi trang"
          >
            <option value="10">10</option>
            <option value="20">20</option>
            <option value="50">50</option>
          </select>
        </div>
      </div>
      {/* --- Display Fetch Error --- */}
      {/* --- Display Fetch Error --- */}
      {fetchError && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {
            fetchError.startsWith("Error loading exams:") // Check if it's the specific error we modified
              ? `Lỗi tải bài thi: ${fetchError.substring(
                  "Error loading exams:".length
                )}`
              : fetchError ===
                "Failed to load exams. Please refresh or try again later."
              ? "Không thể tải bài thi. Vui lòng làm mới hoặc thử lại sau."
              : fetchError /* Keep other potential errors as is */
          }
        </div>
      )}
      {/* --- Exam Table or Empty State --- */}
      {/* Show empty state only if NOT loading AND NO error AND NO filtered exams */}
      {!isFetchingExams && !fetchError && filteredExams.length === 0 && (
        <p className="text-center text-gray-500 mt-6">
          {userExams.length === 0 && initialLoadComplete.current // Distinguish between no access and no matches
            ? isAdmin
              ? "Không tìm thấy bài thi nào trong hệ thống."
              : "Bạn hiện không có quyền truy cập vào bài thi nào."
            : "Không tìm thấy bài thi nào phù hợp với tiêu chí của bạn."}
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
                  Tên (Bài thi)
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Phần thi
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Danh mục
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Số câu hỏi
                </th>
                {/* --- NEW PROGRESS COLUMN --- */}
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Tiến độ
                </th>
                {/* --- END NEW COLUMN --- */}
                <th
                  scope="col"
                  className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Hành động
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentExams.map((exam) => {
                if (!exam) return null; // Skip if exam data is missing

                const result = userExamResults[exam.exam_id]; // Get result for this exam
                let progressText = "Chưa bắt đầu";
                let actionButtonText = "Bắt đầu";
                let actionButtonLink = `/exam/${exam.exam_id}/question/1/`; // Default start link

                if (result) {
                  const answeredCount = result.user_answers
                    ? Object.keys(result.user_answers).length
                    : 0;
                  const totalQuestions = exam.total_number_questions;
                  if (totalQuestions > 0) {
                    const percentage = Math.round(
                      (answeredCount / totalQuestions) * 100
                    );
                    progressText = `${answeredCount}/${totalQuestions} (${percentage}%)`;
                  } else {
                    progressText = `${answeredCount}/? (?%)`; // Handle case where total questions might be missing
                  }

                  // Update action button if progress exists
                  actionButtonText = "Tiếp tục";
                  // Link to the question *after* the last answered one
                  const nextQuestionOrder = result.current_progress
                    ? result.current_progress + 1
                    : 1; // Default to 1 if progress is 0 or null
                  // Ensure next question doesn't exceed total
                  const finalNextOrder = Math.min(
                    nextQuestionOrder,
                    totalQuestions || nextQuestionOrder // Use total if available, else cap at next calculated
                  );
                  actionButtonLink = `/exam/${exam.exam_id}/question/${finalNextOrder}/`;
                }

                return (
                  <tr key={exam.exam_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {exam.exam_name || "Không có"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {exam.section_name || "Không có"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {exam.test_category || "Không có"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                      {exam.total_number_questions ?? "N/A"}
                    </td>
                    {/* --- PROGRESS CELL --- */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {progressText}
                    </td>
                    {/* --- END PROGRESS CELL --- */}
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                      {/* --- UPDATED ACTION BUTTON --- */}
                      <Link
                        to={actionButtonLink}
                        className={clsx(
                          "inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white focus:outline-none focus:ring-2 focus:ring-offset-2 transition duration-150 ease-in-out",
                          result
                            ? "bg-green-600 hover:bg-green-700 focus:ring-green-500" // Continue button style
                            : "bg-blue-600 hover:bg-blue-700 focus:ring-blue-500" // Start button style
                        )}
                      >
                        {actionButtonText}
                      </Link>
                      {/* --- END UPDATED ACTION BUTTON --- */}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {/* --- Pagination --- */}
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
                aria-label={`Đi đến trang ${pageNumber}`}
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
