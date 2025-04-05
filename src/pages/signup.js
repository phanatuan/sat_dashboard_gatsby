// src/pages/signup.js
import React, { useState, useEffect } from "react";
import { Link, navigate } from "gatsby";
import { useAuth } from "../context/AuthContext";

const SignUpPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState(""); // <-- Add state for name
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  // Destructure signInWithProvider along with signUp and user
  const { signUp, signInWithProvider, user } = useAuth();

  useEffect(() => {
    if (user) {
      navigate("/exams/");
    }
  }, [user]);

  const handleSignUp = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");
    setLoading(true);
    try {
      // Pass name in options.data
      const { error: signUpError } = await signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName, // <-- Pass the name here
          },
        },
      });

      if (signUpError) throw signUpError;
      setMessage("Check your email for the confirmation link!");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Add OAuth handler similar to login page
  const handleOAuthLogin = async (provider) => {
    setLoading(true);
    setError(""); // Clear previous errors
    try {
      // Pass provider option object to v2 method
      const { error } = await signInWithProvider({ provider });
      if (error) throw error;
      // Supabase handles the redirect flow for OAuth, navigation handled by useEffect
    } catch (err) {
      setError(err.message);
      setLoading(false); // Only set loading false if error occurs, otherwise Supabase redirects
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 border rounded shadow">
      <h1 className="text-2xl font-bold mb-6 text-center">Sign Up</h1>
      {message && <p className="text-green-600 mb-4 text-center">{message}</p>}
      {error && <p className="text-red-500 mb-4 text-center">{error}</p>}
      <form onSubmit={handleSignUp}>
        {/* Name Input Field */}
        <div className="mb-4">
          <label className="block text-gray-700 mb-2" htmlFor="full_name">
            Full Name
          </label>
          <input
            type="text"
            id="full_name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Email Input Field */}
        <div className="mb-4">
          <label className="block text-gray-700 mb-2" htmlFor="email">
            Email
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Password Input Field */}
        <div className="mb-6">
          <label className="block text-gray-700 mb-2" htmlFor="password">
            Password
          </label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition duration-200 disabled:opacity-50"
        >
          {loading ? "Signing up..." : "Sign Up"}
        </button>
      </form>
      <p className="mt-6 text-center">
        Already have an account?{" "}
        <Link to="/login/" className="text-blue-600 hover:underline">
          Login
        </Link>
      </p>

      {/* Add OAuth Sign in options */}
      <div className="mt-6 text-center border-t pt-6">
        <p className="text-gray-600 mb-4">Or sign up with</p>
        <button
          onClick={() => handleOAuthLogin("google")}
          className="w-full mb-3 py-2 px-4 border rounded shadow-sm hover:shadow-md transition duration-150 flex items-center justify-center"
          disabled={loading}
        >
          Sign up with Google
        </button>
        {/* You can add other providers similarly if needed */}
        {/* <button
          onClick={() => handleOAuthLogin("facebook")}
          className="w-full py-2 px-4 border rounded shadow-sm hover:shadow-md transition duration-150 flex items-center justify-center"
          disabled={loading}
        >
          Sign up with Facebook
        </button> */}
      </div>
    </div>
  );
};

export default SignUpPage;
