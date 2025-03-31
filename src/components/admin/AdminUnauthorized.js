// src/components/admin/AdminUnauthorized.js
import React from "react";
import { Link } from "gatsby"; // Use Gatsby link here

const AdminUnauthorized = () => {
  return (
    <div>
      <h2 className="text-xl font-semibold mb-4 text-red-600">Unauthorized</h2>
      <p>
        You do not have permission to access this admin area or the requested
        page was not found.
      </p>
      <Link to="/" className="text-blue-600 hover:underline mt-4 inline-block">
        Go to Homepage
      </Link>
    </div>
  );
};

export default AdminUnauthorized;
