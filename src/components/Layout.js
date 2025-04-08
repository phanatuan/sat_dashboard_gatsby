// src/components/Layout.js
import React, { useEffect } from "react"; // Import useEffect
import { Link, navigate } from "gatsby";
import { Helmet } from "react-helmet"; // Import Helmet
import { useAuth } from "../context/AuthContext";
import GoogleSignInButton from "./GoogleSignInButton"; // Import the button

const Layout = ({ children, maxWidth = "max-w-7xl" }) => {
  // Get necessary functions/state from context, including new ones
  const {
    user,
    signOut,
    role,
    isAdmin,
    signInWithProvider,
    signInWithGoogleIdToken,
  } = useAuth();

  // Google Client ID from environment variables
  const googleClientId = process.env.GATSBY_GOOGLE_CLIENT_ID;

  useEffect(() => {
    // Ensure Client ID is set
    if (!googleClientId) {
      console.warn(
        "Google Client ID (GATSBY_GOOGLE_CLIENT_ID) is not set. Google One Tap will not function."
      );
      return;
    }

    // Check if user is already logged in or if google object isn't loaded yet
    // Need to check window.google as the script loads asynchronously
    console.log("User state:", user);
    if (user || typeof window === "undefined" || !window.google?.accounts?.id) {
      return; // Don't initialize or prompt if logged in or script not ready
    }

    const handleGoogleOneTapCallback = async (response) => {
      console.log("Google One Tap response received");
      try {
        const { error } = await signInWithGoogleIdToken(response.credential);
        if (error) {
          console.error(
            "Error signing in with Google One Tap ID token:",
            error.message
          );
          // Optionally show an error message to the user via state
        } else {
          console.log("Successfully signed in with Google One Tap.");
          // Navigation should be handled by AuthContext's onAuthStateChange effect
          // which redirects to /exams/ upon successful login.
        }
      } catch (err) {
        console.error("Exception during Google One Tap sign in:", err);
      }
    };

    // Initialize Google Identity Services
    try {
      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: handleGoogleOneTapCallback,
        // auto_select: true, // Consider enabling this for smoother auto-login after first approval
      });

      // Prompt the user with One Tap, only if not logged in
      window.google.accounts.id.prompt((notification) => {
        if (notification.isNotDisplayed()) {
          console.log(
            "Google One Tap prompt was not displayed:",
            notification.getNotDisplayedReason()
          );
        } else if (notification.isSkippedMoment()) {
          console.log(
            "Google One Tap prompt was skipped:",
            notification.getSkippedReason()
          );
        } else if (notification.isDismissedMoment()) {
          console.log(
            "Google One Tap prompt was dismissed:",
            notification.getDismissedReason()
          );
        }
      });
    } catch (error) {
      console.error("Error initializing or prompting Google One Tap:", error);
    }

    // No specific cleanup needed for GIS initialize/prompt
  }, [user, googleClientId, signInWithGoogleIdToken]); // Add dependencies

  const handleLogout = async () => {
    try {
      console.log("Logging out...");
      await signOut();
      // Navigate after sign out is confirmed by onAuthStateChange ideally,
      // but navigating here is common practice too.
      navigate("/"); // Navigate to home or login page after logout
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  return (
    <div
      className={`min-h-screen flex flex-col p-4 sm:p-6 lg:p-8 font-sans text-gray-800 antialiased`}
    >
      {/* Add Helmet for the script tag */}
      <Helmet>
        {googleClientId && ( // Only add script if Client ID is configured
          <script
            src="https://accounts.google.com/gsi/client"
            async
            defer
          ></script>
        )}
      </Helmet>

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
            {/* Exams dropdown */}
            <div className="relative group">
              <button className="text-sm sm:text-base text-gray-600 hover:text-blue-700 transition-colors focus:outline-none px-2 py-1">
                Exams
              </button>
              <div className="absolute left-0 top-full mt-0 w-48 bg-white border border-gray-200 rounded shadow-lg opacity-0 invisible group-hover:visible group-hover:opacity-100 transition-opacity duration-200 delay-75 z-50">
                <Link
                  to="/exams/ssqb"
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 whitespace-nowrap"
                >
                  SSQB Exams
                </Link>
                <Link
                  to="/exams/synthesis"
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 whitespace-nowrap"
                >
                  Synthesis Exams
                </Link>
              </div>
            </div>

            {user ? (
              <>
                {/* Conditionally render Admin link */}
                {isAdmin && (
                  <Link
                    to="/admin/"
                    className="text-sm sm:text-base text-blue-600 hover:underline hidden sm:inline"
                  >
                    Admin
                  </Link>
                )}

                {/* Display user avatar and name as a link */}
                <Link
                  to="/user-profile"
                  className="text-sm sm:text-base text-gray-600 hover:text-blue-700 transition-colors hidden sm:inline"
                >
                  {user.user_metadata?.avatar_url ? (
                    <img
                      src={user.user_metadata.avatar_url}
                      alt="User avatar"
                      className="w-6 h-6 rounded-full inline-block align-middle mr-2"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <span className="w-6 h-6 rounded-full bg-gray-300 inline-flex items-center justify-center text-xs font-semibold text-gray-600 align-middle mr-2">
                      {user.email?.[0]?.toUpperCase() || "?"}
                    </span>
                  )}
                  <span className="whitespace-nowrap inline-block align-middle">
                    {user.user_metadata?.full_name ||
                      user.user_metadata?.name ||
                      user.email}
                  </span>
                </Link>

                <button
                  onClick={handleLogout}
                  className="px-3 py-1.5 text-sm sm:text-base rounded bg-red-500 text-white hover:bg-red-600 transition duration-150 whitespace-nowrap"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                {googleClientId ? (
                  <div className="w-auto">
                    <GoogleSignInButton
                      onClick={() =>
                        signInWithProvider({
                          provider: "google",
                          options: {
                            redirectTo: window.location.origin,
                          },
                        })
                      }
                      label="Sign in with Google"
                    />
                  </div>
                ) : (
                  <span className="text-sm text-red-500">
                    Google Sign-In not configured
                  </span>
                )}
                {/* Signup link is removed/commented */}
                {/* <Link
                  to="/signup/"
                  className="text-sm sm:text-base text-blue-600 hover:underline"
                >
                  Sign Up
                </Link> */}
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
