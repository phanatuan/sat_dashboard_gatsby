// src/pages/exam-results/[exam_id].js

import React, { useState, useEffect } from "react";
import { Link } from "gatsby";
import Layout from "../../components/Layout"; // Adjust path if needed
import { supabase } from "../../supabaseClient"; // Adjust path if needed
import { useAuth } from "../../context/AuthContext"; // Adjust path if needed

// Props will contain 'params' with the dynamic segment from the filename
const ExamResultPage = (props) => {
  // Get the exam_id from the URL parameter provided by Gatsby/Reach Router
  const { exam_id } = props.params;

  const { user, loading: authLoading } = useAuth();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Your existing client-side fetching logic is perfect here!
    // It uses the exam_id from the URL (props.params) and the logged-in user.
    if (authLoading) return;
    if (!user) {
      // Optional: Redirect to login or show message
      // navigate('/login/');
      setLoading(false);
      setError("You must be logged in to view results.");
      return;
    }
    if (!exam_id) {
      // Add a check in case the param is missing somehow
      setLoading(false);
      setError("Exam ID not found in URL.");
      return;
    }

    const fetchResult = async () => {
      setLoading(true);
      setError(null);
      try {
        // This query runs in the browser using the live user session
        const { data: resultData, error: resultError } = await supabase
          .from("exam_results")
          .select("*")
          .eq("user_id", user.id) // User-specific!
          .eq("exam_id", exam_id) // Dynamic from URL!
          .order("submitted_at", { ascending: false })
          .limit(1)
          .single();

        if (resultError) {
          if (resultError.code === "PGRST116") {
            setError(`No results found for exam ${exam_id} for your account.`);
          } else {
            throw resultError; // Throw other Supabase errors
          }
        }
        setResult(resultData);
      } catch (err) {
        console.error("Error fetching exam result:", err);
        setError(err.message || "Failed to load results.");
      } finally {
        setLoading(false);
      }
    };

    fetchResult();
  }, [user, exam_id, authLoading]); // Dependencies are correct

  // ... rest of your JSX to display loading, error, result, links etc.
  // This part doesn't need to change.

  return (
    <Layout>
      <h1 className="text-2xl font-bold mb-4">Exam Results</h1>
      {loading && <p>Loading results for Exam {exam_id}...</p>}
      {error && <p className="text-red-600">{error}</p>}
      {/* ... display result if !loading && !error && result ... */}
      {result && (
        <div className="p-4 border rounded shadow">
          <p className="mb-1">
            <span className="font-semibold">Exam ID:</span> {result.exam_id}
          </p>
          <p className="mb-2">
            <span className="font-semibold">Submitted:</span>{" "}
            {new Date(result.submitted_at).toLocaleString()}
          </p>
          <p className="text-xl font-semibold mb-1">
            Score: {result.score_percentage}%
          </p>
          <p className="text-gray-700">
            ({result.correct_count} out of {result.total_questions} correct)
          </p>
        </div>
      )}
      {
        !loading && !result && !error && (
          <p>No results found for this exam.</p>
        ) /* Message if fetch succeeded but no data */
      }

      <Link
        to="/exams/"
        className="text-blue-600 hover:underline mt-6 inline-block"
      >
        ← Back to Exams
      </Link>
    </Layout>
  );
};

export default ExamResultPage;
