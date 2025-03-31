// src/components/admin/AdminIndex.js
import React from "react";
import { Link } from "@reach/router";
import useAdminAuthGuard from "../../hooks/useAdminAuthGuard"; // Import the hook
import AdminUnauthorized from "./AdminUnauthorized"; // Import Unauthorized component

// Component receives props from Reach Router (like location, path)
const AdminIndex = (props) => {
  const { isChecking, isAllowed } = useAdminAuthGuard(props.location); // Use the hook

  if (isChecking) {
    return <p>Loading admin dashboard...</p>; // Or a spinner
  }

  if (!isAllowed) {
    // Although the hook redirects, render unauthorized just in case.
    return <AdminUnauthorized />;
  }

  // --- Render actual content only if allowed ---
  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Dashboard</h2>
      <p>Welcome to the admin area.</p>
      <nav className="mt-4 space-x-4">
        <Link to="/admin/exams" className="text-blue-600 hover:underline">
          Manage Exams
        </Link>
        <Link to="/admin/questions" className="text-blue-600 hover:underline">
          Manage Questions
        </Link>
        <Link to="/admin/users" className="text-blue-600 hover:underline">
          Manage Users
        </Link>

        {/* Add links to other sections later */}
      </nav>
    </div>
  );
};
export default AdminIndex;
