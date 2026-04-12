// frontend/src/components/RequireAdmin.tsx
//
// ─── IMPORTANT ────────────────────────────────────────────────────────────────
// This component is a UX layer only. It prevents unauthorized users from
// SEEING admin UI, but it does NOT replace backend authorization.
// Every admin API endpoint enforces its own permission checks server-side.
// Never rely solely on this component for security.
// ──────────────────────────────────────────────────────────────────────────────

import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

interface RequireAdminProps {
  children: React.ReactNode;
}

const RequireAdmin: React.FC<RequireAdminProps> = ({ children }) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  // ── While session is being restored (page refresh), show a neutral spinner.
  // This prevents a flash-redirect to "/" before auth state is initialized.
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600" />
      </div>
    );
  }

  // ── Not logged in at all → redirect to login, preserve intended destination.
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // ── Logged in but not an admin → silently redirect to homepage.
  // We do NOT show a "403 Forbidden" page to avoid leaking that an admin
  // panel exists. The user simply ends up on the public homepage.
  const isAdmin = user?.role === "admin" || user?.is_staff === true;
  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  // ── Authorized admin → render children.
  return <>{children}</>;
};

export default RequireAdmin;