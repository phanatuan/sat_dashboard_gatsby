// src/components/admin/UserForm.js
import React, { useState, useEffect, useCallback } from "react";
import { Link, navigate } from "@reach/router";
import useAdminAuthGuard from "../../hooks/useAdminAuthGuard";
import AdminUnauthorized from "./AdminUnauthorized";
import { supabase } from "../../supabaseClient";

const UserForm = (props) => {
  // --- Auth & Routing ---
  const { isChecking, isAllowed } = useAdminAuthGuard(props.location);
  const { userId } = props; // Get userId from props passed by Reach Router

  // --- State ---
  const [formData, setFormData] = useState({
    full_name: "",
    email: "", // Display only, not editable
    role: "student", // Default role
  });
  const [loading, setLoading] = useState(true); // Start loading true for fetch
  const [isSubmitting, setIsSubmitting] = useState(false); // Specific state for submission
  const [error, setError] = useState(null);

  // --- Fetch User Profile Data ---
  const fetchUserProfile = useCallback(async () => {
    if (!isAllowed || !userId) return;
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from("user_profiles")
        .select("id, full_name, email, role")
        .eq("id", userId)
        .single(); // Use single as ID must exist

      if (fetchError) throw fetchError;

      if (data) {
        setFormData({
          full_name: data.full_name || "",
          email: data.email || "N/A", // Show email but don't allow edit
          role: data.role || "student",
        });
      } else {
        setError(`User profile with ID ${userId} not found.`);
      }
    } catch (err) {
      console.error("Error fetching user profile:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [userId, isAllowed]);

  useEffect(() => {
    fetchUserProfile();
  }, [fetchUserProfile]);

  // --- Handlers ---
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isAllowed) return;

    setIsSubmitting(true);
    setError(null);

    try {
      // Prepare data for update (only editable fields)
      const updateData = {
        full_name: formData.full_name,
        role: formData.role,
        updated_at: new Date(), // Optionally update timestamp
      };

      const { error: updateError } = await supabase
        .from("user_profiles")
        .update(updateData)
        .eq("id", userId); // Target the specific user

      if (updateError) throw updateError;

      alert(`User profile updated successfully!`);
      navigate("/admin/users"); // Redirect back to list on success
    } catch (err) {
      console.error("Error updating user profile:", err);
      const userMessage = `Failed to update user profile: ${
        err.message || "Unknown error"
      }`;
      setError(userMessage);
      alert(`Error: ${userMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Render Logic ---
  if (isChecking || loading) return <p>Loading user profile...</p>;
  if (!isAllowed) return <AdminUnauthorized />;
  if (error && formData.email === "N/A")
    return <p className="text-red-600">Error: {error}</p>; // Show error if profile wasn't found

  return (
    <div>
      <h2 className="text-xl font-semibold mb-6">Edit User Profile</h2>
      <p className="text-sm text-gray-500 mb-4">Editing User ID: {userId}</p>

      {error && !isSubmitting && (
        <p className="text-red-600 mb-4 p-3 bg-red-100 border border-red-400 rounded">
          Error: {error}
        </p>
      )}

      <form
        onSubmit={handleSubmit}
        className="space-y-4 max-w-lg bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4"
      >
        {/* Email (Display Only) */}
        <div>
          <label
            htmlFor="email"
            className="block text-gray-700 text-sm font-bold mb-2"
          >
            Email
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            readOnly // Make it read-only
            disabled // Visually indicate disabled
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 bg-gray-100 leading-tight focus:outline-none focus:shadow-outline cursor-not-allowed"
          />
        </div>

        {/* Full Name */}
        <div>
          <label
            htmlFor="full_name"
            className="block text-gray-700 text-sm font-bold mb-2"
          >
            Full Name
          </label>
          <input
            type="text"
            id="full_name"
            name="full_name"
            value={formData.full_name}
            onChange={handleChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          />
        </div>

        {/* Role */}
        <div>
          <label
            htmlFor="role"
            className="block text-gray-700 text-sm font-bold mb-2"
          >
            Role
          </label>
          <select
            id="role"
            name="role"
            value={formData.role}
            onChange={handleChange}
            required
            className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          >
            <option value="student">student</option>
            <option value="admin">admin</option>
            {/* Add other future roles here */}
          </select>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end space-x-3 pt-6">
          <Link
            to="/admin/users" // Navigate back using Reach Router Link
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            type="button"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting} // Use submitting state
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Saving..." : "Update Profile"}
          </button>
        </div>
      </form>

      <Link
        to="/admin/users"
        className="text-blue-600 hover:underline mt-6 inline-block"
      >
        Back to User List
      </Link>
    </div>
  );
};
export default UserForm;
