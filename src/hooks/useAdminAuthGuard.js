// src/hooks/useAdminAuthGuard.js
import { useEffect, useState } from "react";
import { navigate } from "gatsby";
import { useAuth } from "../context/AuthContext";

const useAdminAuthGuard = (location) => {
  // Pass location for redirect state
  const { user, isAdmin, loading: authLoading } = useAuth();
  const [isChecking, setIsChecking] = useState(true);
  const [isAllowed, setIsAllowed] = useState(false);

  useEffect(() => {
    if (!authLoading) {
      // Only check after auth state is determined
      let allowed = false;
      if (!user) {
        console.log("useAdminAuthGuard: Not logged in, redirecting to login.");
        // Use location.pathname if available
        const intendedPath = location?.pathname || "/admin/";
        navigate("/login/", { state: { from: intendedPath }, replace: true });
      } else if (!isAdmin) {
        console.log("useAdminAuthGuard: Not admin, redirecting to home.");
        navigate("/", { replace: true }); // Use replace to prevent history buildup
      } else {
        // User is logged in AND is admin
        console.log("useAdminAuthGuard: Admin access verified.");
        allowed = true;
      }
      setIsAllowed(allowed);
      setIsChecking(false); // Finished check
    } else {
      // Still waiting for auth context to load
      setIsChecking(true);
      setIsAllowed(false);
    }
  }, [user, isAdmin, authLoading, location]);

  // Return status flags
  return { isChecking, isAllowed };
};

export default useAdminAuthGuard;
