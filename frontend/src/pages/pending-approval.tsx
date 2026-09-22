// frontend/src/pages/pending-approval.tsx
//
// Shown to a staff account (account_type='staff') that has logged in but
// hasn't yet been assigned a role by an Admin/Super Admin. It replaces every
// other protected page until then — see RequireAuth in App.tsx.

import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock3, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const PendingApprovalPage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // If an admin approves them while this tab is open, send them straight in
  // the next time this page re-renders (e.g. after a manual refresh).
  useEffect(() => {
    if (user && user.account_type !== 'staff') {
      navigate('/dashboard', { replace: true });
    }
    if (user?.is_approved) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
        <div className="mx-auto mb-5 w-14 h-14 rounded-full bg-green-50 flex items-center justify-center">
          <Clock3 className="w-7 h-7 text-green-600" />
        </div>
        <h1 className="text-xl font-bold text-gray-800 mb-2">Awaiting Admin Approval</h1>
        <p className="text-sm text-gray-500 mb-1">
          Hi {user?.full_name ?? 'there'}, your staff account has been created.
        </p>
        <p className="text-sm text-gray-500 mb-6">
          An admin still needs to review your account and assign you a role
          (Admin, Lecturer, or Technician) before you can access the site.
          Check back soon.
        </p>
        <button
          onClick={handleLogout}
          className="inline-flex items-center gap-2 justify-center w-full border border-gray-300
            text-gray-600 font-semibold py-2.5 rounded-lg hover:bg-gray-50 transition-colors duration-200"
        >
          <LogOut className="w-4 h-4" />
          Log out
        </button>
      </div>
    </div>
  );
};

export default PendingApprovalPage;
