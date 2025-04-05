import React from "react";

// Simple inline SVG for the Google G logo
const GoogleLogo = () => (
  <svg
    width="18"
    height="18"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 48 48"
  >
    <path
      fill="#EA4335"
      d="M24 9.5c3.46 0 6.47 1.19 8.88 3.45l6.58-6.58C35.37 2.31 30.06 0 24 0 14.52 0 6.44 5.64 2.88 13.62l7.92 6.18C12.43 13.72 17.74 9.5 24 9.5z"
    ></path>
    <path
      fill="#4285F4"
      d="M46.98 24.55c0-1.57-.14-3.08-.4-4.55H24v8.51h12.8c-.55 2.76-2.18 5.1-4.64 6.7l7.3 5.64C43.97 37.6 46.98 31.61 46.98 24.55z"
    ></path>
    <path
      fill="#FBBC05"
      d="M10.8 19.8c-.48 1.45-.76 2.99-.76 4.6s.28 3.15.76 4.6l-7.92 6.18C1.06 30.79 0 27.51 0 24s1.06-6.79 2.88-9.98l7.92 5.8z"
    ></path>
    <path
      fill="#34A853"
      d="M24 48c6.06 0 11.37-1.99 15.18-5.45l-7.3-5.64c-2.01 1.35-4.6 2.15-7.88 2.15-6.26 0-11.57-4.22-13.45-9.88l-7.92 6.18C6.44 42.36 14.52 48 24 48z"
    ></path>
    <path fill="none" d="M0 0h48v48H0z"></path>
  </svg>
);

const GoogleSignInButton = ({
  onClick,
  label = "Sign in with Google",
  disabled = false,
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-full shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition duration-150 ease-in-out"
    >
      <GoogleLogo />
      <span className="ml-3">{label}</span>
    </button>
  );
};

export default GoogleSignInButton;
