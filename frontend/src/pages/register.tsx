// frontend/src/pages/register.tsx
import React from 'react';
import { Navigate } from 'react-router-dom';

// Signup lives in the login page's signup panel (RegisterFlow), which verifies
// the student's identity first. This route only exists so old /register links
// keep working.
export const RegisterPage: React.FC = () => (
  <Navigate to="/login?mode=signup" replace />
);
