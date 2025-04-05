// src/context/AuthContext.js
import React, { createContext, useState, useEffect, useContext } from "react";
import { supabase } from "../supabaseClient";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchUserRole = async (userId) => {
    /* ... (keep existing fetchUserRole) ... */
    if (!userId) {
      setRole(null);
      setIsAdmin(false);
      return;
    }
    try {
      const { data, error } = await supabase
        .from("user_profiles")
        .select("role")
        .eq("id", userId)
        .single();
      if (error && error.code !== "PGRST116") {
        console.error("Error fetching user role:", error.message);
        throw error;
      }
      const userRole = data?.role || "student";
      setRole(userRole);
      setIsAdmin(userRole === "admin");
    } catch (error) {
      console.error(
        "Setting role to default due to error or no role found:",
        error.message
      );
      setRole("student");
      setIsAdmin(false);
    }
  };

  useEffect(() => {
    setLoading(true);

    // Listen for changes on auth state
    const { data } = supabase.auth.onAuthStateChange(
      // <-- Just get 'data'
      async (_event, session) => {
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        if (currentUser) {
          await fetchUserRole(currentUser.id);
        } else {
          setRole(null);
          setIsAdmin(false);
        }
        setLoading(false);
        // console.log('Auth State Changed:', session, 'Role:', role, 'IsAdmin:', isAdmin); // Keep console log if helpful
      }
    );

    // Get the subscription object from the data
    const subscription = data?.subscription; // <-- Access the subscription object

    // Cleanup function: unsubscribe using the subscription object
    return () => {
      subscription?.unsubscribe(); // <-- Call unsubscribe on the subscription object
    };
  }, []);

  // Function to handle sign-in using Google ID token (from One Tap)
  const signInWithGoogleIdToken = async (id_token) => {
    return supabase.auth.signInWithIdToken({
      provider: "google",
      token: id_token,
    });
  };

  // Value provided to consuming components
  const value = {
    signUp: (data) => supabase.auth.signUp(data),
    signIn: (data) => supabase.auth.signInWithPassword(data),
    signInWithProvider: (options) => supabase.auth.signInWithOAuth(options),
    signInWithGoogleIdToken, // Add the new function here
    signOut: () => supabase.auth.signOut(),
    user,
    role,
    isAdmin,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Hook to use the auth context
export const useAuth = () => {
  return useContext(AuthContext);
};
