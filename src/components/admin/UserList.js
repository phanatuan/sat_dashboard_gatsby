// src/components/admin/UserList.js
import React, { useState, useEffect, useCallback } from "react";
import { Link } from "@reach/router";
import useAdminAuthGuard from "../../hooks/useAdminAuthGuard";
import AdminUnauthorized from "./AdminUnauthorized";
import { supabase } from "../../supabaseClient";

const UserList = (props) => {
  const { isChecking, isAllowed } = useAdminAuthGuard(props.location);
  const [users, setUsers] = useState([]); // Will store {id, full_name, role, email}
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Function to fetch users - combines profiles and auth data
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Now just fetch directly from user_profiles
      const { data, error: fetchError } = await supabase
        .from("user_profiles")
        .select("id, full_name, role, email") // Select email too
        .order("full_name", { ascending: true }); // Order by name

      if (fetchError) throw fetchError;

      setUsers(data || []); // Set the data directly
    } catch (err) {
      console.error("Error fetching users:", err);
      setError(`Failed to fetch user data: ${err.message}.`);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, []); // Keep useCallback dependency array empty

  useEffect(() => {
    if (isAllowed) {
      fetchUsers();
    } else {
      setLoading(false);
      setUsers([]);
      setError(null);
    }
  }, [isAllowed, fetchUsers]);

  // --- Placeholder for Role Change ---
  const handleRoleChange = async (userId, newRole) => {
    // Add logic here later to update user_profiles role
    alert(`Role change to ${newRole} for ${userId} not implemented yet.`);
  };

  // --- Render Logic ---
  if (isChecking) return <p>Loading admin section...</p>;
  if (!isAllowed) return <AdminUnauthorized />;
  if (loading) return <p>Loading users...</p>;
  if (error) return <p className="text-red-600">Error: {error}</p>;

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Manage Users</h2>

      <div className="overflow-x-auto shadow-md rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Full Name
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Email
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Role
              </th>
              {/* Add more columns as needed */}
              <th
                scope="col"
                className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.length === 0 ? (
              <tr>
                <td colSpan="4" className="px-6 py-4 text-center text-gray-500">
                  No users found.
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {user.full_name || "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.role}
                    </td>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                    <Link
                      to={`/admin/users/edit/${user.id}`}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      Edit Profile/Role
                    </Link>
                    <button
                      className="text-red-600 hover:text-red-900 disabled:opacity-50"
                      disabled
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <Link
        to="/admin/"
        className="text-blue-600 hover:underline mt-6 inline-block"
      >
        Back to Admin Home
      </Link>
    </div>
  );
};
export default UserList;
