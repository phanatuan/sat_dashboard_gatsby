// src/components/Layout.js
import React from "react";
import { Link, navigate } from "gatsby"; // Import Link and navigate
import { useAuth } from "../context/AuthContext"; // Import useAuth

const Layout = ({ children, maxWidth = "max-w-6xl" }) => {
  // Added maxWidth prop with default
  const { user, signOut } = useAuth(); // Get user and signOut

  const handleLogout = async () => {
    try {
      await signOut();
      navigate("/login/"); // Redirect to login after logout
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  return (
    <div
      className={`p-5 ${maxWidth} mx-auto font-sans text-gray-800 antialiased`}
    >
      {" "}
      {/* Use maxWidth prop */}
      {/* Standard Header */}
      <header className="flex flex-wrap justify-between items-center mb-8 pb-4 border-b border-gray-200">
        <Link
          to="/exams/"
          className="text-2xl font-bold text-gray-800 hover:text-blue-700"
        >
          Exam Platform
        </Link>
        <nav className="flex items-center space-x-4 mt-2 sm:mt-0">
          {user ? (
            <>
              {/* Optional: Link to a profile or dashboard page */}
              {/* <Link to="/app/profile" className="text-gray-600 hover:text-blue-600">Profile</Link> */}
              <span className="text-gray-600 hidden sm:inline">
                {/* Display user email or name if available */}
                {user.email}
              </span>
              <button
                onClick={handleLogout}
                className="px-3 py-1 rounded bg-red-500 text-white hover:bg-red-600 transition duration-150"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login/" className="text-blue-600 hover:underline">
                Login
              </Link>
              <Link to="/signup/" className="text-blue-600 hover:underline">
                Sign Up
              </Link>
            </>
          )}
        </nav>
      </header>
      {/* End Header */}
      {/* Main content passed as children */}
      <main>{children}</main>
      {/* Optional Footer */}
      <footer className="mt-12 pt-4 border-t border-gray-200 text-center text-gray-500 text-sm">
        © {new Date().getFullYear()} Your Exam Platform. All rights reserved.
      </footer>
    </div>
  );
};

export default Layout; // Export the component
