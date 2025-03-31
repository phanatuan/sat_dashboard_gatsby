// src/components/AdminRouteGuard.js
import React, { useEffect } from "react";
import { navigate } from "gatsby";
import { useAuth } from "../context/AuthContext";

// Receives props intended for the wrapped component (path, examId, etc.)
// The 'children' prop here is the actual component to render (e.g., <AdminIndex>)
const AdminRouteGuard = ({ children, ...props }) => {
  // Use rest syntax for props
  const { user, isAdmin, loading: authLoading } = useAuth();
  const { path } = props; // Extract path for redirect state if needed

  useEffect(() => {
    if (!authLoading) {
      // Only check after auth state is determined
      if (!user) {
        console.log("Admin Guard: Not logged in, redirecting to login.");
        navigate("/login/", { state: { from: path } });
      } else if (!isAdmin) {
        console.log("Admin Guard: Not admin, redirecting to home.");
        navigate("/"); // Or '/exams/'
      }
    }
  }, [user, isAdmin, authLoading, path]);

  // While loading auth or if not authorized yet, show nothing or a loader
  if (authLoading || !user || !isAdmin) {
    return <p>Checking admin permissions...</p>; // Or loading spinner
  }

  // If authorized, render the children (the actual component like AdminIndex, ExamList)
  // Clone the child element and pass down the router props (like path, examId, etc.)
  return React.cloneElement(children, props);
};

export default AdminRouteGuard;
