// frontend/src/components/RequireSuperAdmin.tsx
//
// ─── IMPORTANT ────────────────────────────────────────────────────────────────
// This component is a UX layer only. It prevents unauthorized users from
// SEEING super-admin-only UI, but it does NOT replace backend authorization.
// The promote/revoke endpoints enforce IsSuperAdmin server-side regardless.
// ──────────────────────────────────────────────────────────────────────────────

import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

interface RequireSuperAdminProps {
  children: React.ReactNode;
}

const RequireSuperAdmin: React.FC<RequireSuperAdminProps> = ({ children }) => {
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

  // Not the super admin → silently redirect to the regular admin home,
  // same "don't reveal what exists" approach as RequireAdmin.
  if (user?.role !== "super_admin") {
    return <Navigate to="/admin" replace />;
  }

  return <>{children}</>;
};

export default RequireSuperAdmin;
