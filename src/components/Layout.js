// src/components/Layout.js
import React from "react";
import { Link, navigate } from "gatsby";
import { useAuth } from "../context/AuthContext";

const Layout = ({ children, maxWidth = "max-w-7xl" }) => {
  const { user, signOut, role, isAdmin } = useAuth();

  const handleLogout = async () => {
    try {
      console.log("Logging out...");
      await signOut();
      navigate("/login/");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  return (
    <div
      className={`min-h-screen flex flex-col p-4 sm:p-6 lg:p-8 font-sans text-gray-800 antialiased`}
    >
      {/* Header */}
      <header
        className={`w-full ${maxWidth} mx-auto mb-8 pb-4 border-b border-gray-200`}
      >
        <div className="flex flex-wrap justify-between items-center gap-4">
          {" "}
          {/* Added gap for spacing */}
          <Link
            to="/"
            className="text-xl sm:text-2xl font-bold text-gray-800 hover:text-blue-700 transition-colors"
          >
            SAT PEAK
          </Link>
          <nav className="flex items-center space-x-3 sm:space-x-4">
            {" "}
            {/* Adjusted spacing slightly */}
            {user ? (
              <>
                {/* Conditionally render Admin link */}
                {isAdmin && ( // Check if user role is 'admin'
                  <Link
                    to="/admin/" // Link to your admin page
                    className="text-sm sm:text-base text-blue-600 hover:underline hidden sm:inline" // Hide on xs screens if needed, adjust as preferred
                  >
                    Admin
                  </Link>
                )}

                {/* Display user email and role as a link */}
                <Link
                  to="/user-profile"
                  className="text-sm sm:text-base text-gray-600 hover:text-blue-700 hover:underline hidden sm:inline whitespace-nowrap transition-colors"
                >
                  {user.email} ({role}) {/* Display role if it exists */}
                </Link>

                {/* Logout Button */}
                <button
                  onClick={handleLogout}
                  className="px-3 py-1.5 text-sm sm:text-base rounded bg-red-500 text-white hover:bg-red-600 transition duration-150 whitespace-nowrap" // Added whitespace-nowrap
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                {/* Login/Signup Links */}
                <Link
                  to="/login/"
                  className="text-sm sm:text-base text-blue-600 hover:underline"
                >
                  Login
                </Link>
                <Link
                  to="/signup/"
                  className="text-sm sm:text-base text-blue-600 hover:underline"
                >
                  Sign Up
                </Link>
              </>
            )}
          </nav>
        </div>
        {/* Mobile specific links if needed - e.g., show Admin link always on mobile */}
        {user && user.role === "admin" && (
          <Link
            to="/admin/"
            className="text-sm text-blue-600 hover:underline sm:hidden mt-2 block" // Show only on xs screens, display as block
          >
            Admin Panel
          </Link>
        )}
      </header>

      {/* Main content area */}
      {/* Added flex-grow to make main content push footer down */}
      <main className={`w-full ${maxWidth} mx-auto flex-grow`}>{children}</main>

      {/* Footer */}
      <footer
        className={`w-full ${maxWidth} mx-auto mt-12 pt-4 border-t border-gray-200 text-center text-gray-500 text-sm`}
      >
        © {new Date().getFullYear()} Your Exam Platform. All rights reserved.
      </footer>
    </div>
  );
};

export default Layout;
