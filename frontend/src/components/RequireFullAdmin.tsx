// frontend/src/components/RequireFullAdmin.tsx
//
// ─── IMPORTANT ────────────────────────────────────────────────────────────────
// This component is a UX layer only. It prevents unauthorized users from
// SEEING admin UI, but it does NOT replace backend authorization.
// Every admin API endpoint enforces its own permission checks server-side.
// Never rely solely on this component for security.
// ──────────────────────────────────────────────────────────────────────────────
//
// Stricter sibling of RequireAdmin: only full admin-tier roles (Admin, Super
// Admin, Lecturer) pass. Executives have staff-area access (RequireAdmin)
// but not this — they're redirected to the limited admin home instead of the
// public site, since they DO belong in the admin area, just not this page.

import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { isFullAdminTier, isStaffAreaRole } from "../lib/roles";

interface RequireFullAdminProps {
  children: React.ReactNode;
}

const RequireFullAdmin: React.FC<RequireFullAdminProps> = ({ children }) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const isFullAdmin = isFullAdminTier(user?.role) || user?.is_staff === true;
  if (!isFullAdmin) {
    // Executives (and anyone else with plain staff-area access) belong in
    // the admin area, just not here — send them to their limited home
    // instead of leaking nothing/redirecting to the public site.
    if (isStaffAreaRole(user?.role)) {
      return <Navigate to="/admin" replace />;
    }
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default RequireFullAdmin;
