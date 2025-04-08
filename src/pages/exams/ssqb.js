// src/pages/exams/ssqb.js
import React, {
  useEffect,
  useState,
  useRef,
  useMemo,
  useCallback,
} from "react";
import { Link } from "gatsby";
import clsx from "clsx";
import Layout from "../../components/Layout";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../supabaseClient";
import RestrictedAccessMessage from "../../components/RestrictedAccessMessage";

const SSQBExamsPage = () => {
  const { user, loading: authLoading, isAdmin } = useAuth();
  const [userExams, setUserExams] = useState([]);
  const [userExamResults, setUserExamResults] = useState({});
  const [isFetchingExams, setIsFetchingExams] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const initialLoadComplete = useRef(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSection, setSelectedSection] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [examsPerPage, setExamsPerPage] = useState(10);

  // Unique sections for filter (optional, can be enhanced)
  const uniqueSections = useMemo(() => {
    if (!userExams || userExams.length === 0) return [];
    const sections = userExams
      .map((exam) => exam?.section_name)
      .filter(Boolean);
    return [...new Set(sections)].sort();
  }, [userExams]);

  useEffect(() => {
    if (!authLoading && user && typeof isAdmin === "boolean") {
      const fetchExamsAndResults = async () => {
        if (!initialLoadComplete.current) {
          setIsFetchingExams(true);
        }
        setFetchError(null);
        setUserExamResults({});

        try {
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
            examQuery = supabase
              .from("exams")
              .select(selectFields)
              .eq("test_category", "SSQB");
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
            setIsFetchingExams(false);
            initialLoadComplete.current = true;
            return;
          }

          let exams = [];
          if (isAdmin) {
            exams = examData ? examData : [];
          } else {
            exams = examData
              ? examData
                  .map((item) => item.exams)
                  .filter(Boolean)
                  .filter((exam) => exam.test_category === "SSQB")
              : [];
          }
          setUserExams(exams);

          if (exams.length > 0) {
            const examIds = exams.map((exam) => exam.exam_id);

            const { data: resultsData, error: resultsError } = await supabase
              .from("exam_results")
              .select("exam_id, user_answers, current_progress")
              .eq("user_id", user.id)
              .in("exam_id", examIds);

            if (resultsError) {
              console.error("Supabase results fetch error:", resultsError);
            } else if (resultsData) {
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
          initialLoadComplete.current = true;
          setIsFetchingExams(false);
        }
      };

      fetchExamsAndResults();
    } else if (!authLoading && !user) {
      setIsFetchingExams(false);
      setUserExams([]);
      setUserExamResults({});
      setFetchError(null);
      initialLoadComplete.current = true;
    } else if (authLoading || (user && typeof isAdmin !== "boolean")) {
      setIsFetchingExams(true);
    }
  }, [user, authLoading, isAdmin]);

  if (authLoading || !initialLoadComplete.current) {
    return (
      <Layout>
        <p>Đang tải dữ liệu người dùng...</p>
      </Layout>
    );
  }

  if (!user) {
    return (
      <Layout>
        <RestrictedAccessMessage />
      </Layout>
    );
  }

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };
  const handleClearSearch = () => {
    setSearchTerm("");
    setCurrentPage(1);
  };
  const handleSectionChange = (e) => {
    setSelectedSection(e.target.value);
    setCurrentPage(1);
  };
  const handleExamsPerPageChange = (e) => {
    setExamsPerPage(parseInt(e.target.value, 10));
    setCurrentPage(1);
  };
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const filteredExams = userExams.filter((exam) => {
    if (!exam) return false;
    const searchMatch =
      searchTerm === "" ||
      (exam.exam_name &&
        exam.exam_name.toLowerCase().includes(searchTerm.toLowerCase()));
    const sectionMatch =
      selectedSection === "All" || exam.section_name === selectedSection;
    return searchMatch && sectionMatch;
  });

  const indexOfLastExam = currentPage * examsPerPage;
  const indexOfFirstExam = indexOfLastExam - examsPerPage;
  const currentExams = filteredExams.slice(indexOfFirstExam, indexOfLastExam);
  const totalPages = Math.ceil(filteredExams.length / examsPerPage);

  return (
    <Layout>
      <h1 className="text-2xl sm:text-3xl font-bold mb-6">Các bài thi SSQB</h1>

      <div className="mb-6 flex flex-col sm:flex-row sm:items-center gap-4 flex-wrap">
        {/* Search */}
        <div className="relative w-full sm:flex-1 sm:min-w-[200px]">
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
        <div className="relative w-full sm:w-auto">
          <select
            value={selectedSection}
            onChange={handleSectionChange}
            className="block appearance-none w-full sm:w-40 md:w-48 bg-white border border-gray-400 hover:border-gray-500 px-4 py-2 pr-8 rounded shadow leading-tight focus:outline-none focus:shadow-outline"
            aria-label="Lọc theo phần thi"
          >
            <option value="All">Tất cả các phần</option>
            {uniqueSections.map((section) => (
              <option key={section} value={section}>
                {section}
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

        {/* Exams Per Page */}
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

      {fetchError && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {fetchError.startsWith("Error loading exams:")
            ? `Lỗi tải bài thi: ${fetchError.substring(
                "Error loading exams:".length
              )}`
            : fetchError ===
              "Failed to load exams. Please refresh or try again later."
            ? "Không thể tải bài thi. Vui lòng làm mới hoặc thử lại sau."
            : fetchError}
        </div>
      )}

      {!isFetchingExams && !fetchError && filteredExams.length === 0 && (
        <p className="text-center text-gray-500 mt-6">
          {userExams.length === 0 && initialLoadComplete.current
            ? isAdmin
              ? "Không tìm thấy bài thi SSQB nào trong hệ thống."
              : "Bạn hiện không có quyền truy cập vào bài thi SSQB nào."
            : "Không tìm thấy bài thi nào phù hợp với tiêu chí của bạn."}
        </p>
      )}

      {!isFetchingExams && !fetchError && currentExams.length > 0 && (
        <div className="overflow-x-auto shadow border-b border-gray-200 rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tên (Bài thi)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Phần thi
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Số câu hỏi
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tiến độ
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hành động
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentExams.map((exam) => {
                if (!exam) return null;

                const result = userExamResults[exam.exam_id];
                let progressText = "Chưa bắt đầu";
                let actionButtonText = "Bắt đầu";
                let actionButtonLink = `/exam/${exam.exam_id}/question/1/`;

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
                    progressText = `${answeredCount}/? (?%)`;
                  }

                  actionButtonText = "Tiếp tục";
                  const nextQuestionOrder = result.current_progress
                    ? result.current_progress + 1
                    : 1;
                  const finalNextOrder = Math.min(
                    nextQuestionOrder,
                    totalQuestions || nextQuestionOrder
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                      {exam.total_number_questions ?? "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {progressText}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                      <Link
                        to={actionButtonLink}
                        className={clsx(
                          "inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white focus:outline-none focus:ring-2 focus:ring-offset-2 transition duration-150 ease-in-out",
                          result
                            ? "bg-green-600 hover:bg-green-700 focus:ring-green-500"
                            : "bg-blue-600 hover:bg-blue-700 focus:ring-blue-500"
                        )}
                      >
                        {actionButtonText}
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

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

export default SSQBExamsPage;
