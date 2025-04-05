// src/pages/login.js
import React, { useState, useEffect } from "react";
import { navigate } from "gatsby";
import { Link } from "gatsby"; // Make sure Link is imported
import { useAuth } from "../context/AuthContext"; // Import the hook

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  // Use correct method names from context
  const { signIn: signInWithEmail, signInWithProvider, user } = useAuth();

  // Redirect if user is already logged in
  useEffect(() => {
    if (user) {
      navigate("/exams/"); // Or to a profile page, e.g., /app/profile
    }
  }, [user]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      // Pass email and password object to v2 method
      const { error: signInError } = await signInWithEmail({ email, password });
      if (signInError) throw signInError;
      // Navigation is handled by the effect checking the user state
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthLogin = async (provider) => {
    setLoading(true);
    setError(""); // Clear previous errors
    try {
      // Pass provider option object to v2 method
      const { error } = await signInWithProvider({ provider });
      if (error) throw error;
      // Supabase handles the redirect flow for OAuth
    } catch (err) {
      setError(err.message);
      setLoading(false); // Only set loading false if error occurs, otherwise Supabase redirects
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 border rounded shadow">
      <h1 className="text-2xl font-bold mb-6 text-center">Login</h1>
      {error && <p className="text-red-500 mb-4 text-center">{error}</p>}
      <form onSubmit={handleLogin}>
        {/* Email and Password Inputs remain the same */}
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
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition duration-200 disabled:opacity-50"
        >
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>
      <div className="mt-6 text-center">
        <p className="text-gray-600 mb-4">Or sign in with</p>
        <button
          onClick={() => handleOAuthLogin("google")}
          className="w-full mb-3 py-2 px-4 border rounded shadow-sm hover:shadow-md transition duration-150 flex items-center justify-center"
          disabled={loading}
        >
          Sign in with Google
        </button>
        {/* <button
          onClick={() => handleOAuthLogin("facebook")}
          className="w-full py-2 px-4 border rounded shadow-sm hover:shadow-md transition duration-150 flex items-center justify-center"
          disabled={loading}
        >
          Sign in with Facebook
        </button> */}
      </div>
      {/* <p className="mt-6 text-center">
        Don't have an account?{" "}
        <Link to="/signup/" className="text-blue-600 hover:underline">
          Sign Up
        </Link>
      </p> */}
    </div>
  );
};

export default LoginPage;
