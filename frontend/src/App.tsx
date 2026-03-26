// frontend/src/App.tsx
import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { LoginPage } from "./pages/login";
import { RegisterPage } from "./pages/register";
import { DashboardPage } from "./pages/dashboard";
import { ProfilePage } from "./pages/profile";
import { VerifyEmailPage } from "./pages/verify-email";
import Homepage from "./pages/homepage";
import Executives from "./components/Executives";
import { ProjectsGallery } from "./pages/ProjectsGallery";
import { ProjectDetail } from "./pages/project-detail";
import { ProjectFormPage } from "./pages/ProjectFormPage";
import { ResourcesPage } from "./pages/resources";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// ─── RequireAuth ──────────────────────────────────────────────────────────────
// Wraps routes that need a logged-in user.
// Unauthenticated → /login
// ─────────────────────────────────────────────────────────────────────────────
const RequireAuth: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600" />
      </div>
    );
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

// ─── PublicRoute ──────────────────────────────────────────────────────────────
// ONLY for auth pages (login, register).
// Authenticated users who visit /login or /register get sent to /dashboard.
//
// ⚠️  Do NOT wrap general public pages (executives, events, gallery, etc.)
//     in this component — that would redirect logged-in users away from them.
// ─────────────────────────────────────────────────────────────────────────────
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600" />
      </div>
    );
  }

  return !isAuthenticated ? (
    <>{children}</>
  ) : (
    <Navigate to="/dashboard" replace />
  );
};

function AppRoutes() {
  return (
    <Routes>
      {/* ── Fully public — anyone can visit, logged-in or not ──────────── */}
      <Route path="/" element={<Homepage />} />
      <Route path="/executives" element={<Executives isHome={false} />} />
      <Route path="/projects" element={<ProjectsGallery />} />
      <Route path="/projects/:id" element={<ProjectDetail />} />
      <Route path="/verify-email/:uid/:token" element={<VerifyEmailPage />} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />

      {/* ── Auth pages — redirect to /dashboard if already logged in ────── */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoute>
            <RegisterPage />
          </PublicRoute>
        }
      />

      {/* ── Protected — must be logged in ──────────────────────────────── */}
      <Route
        path="/dashboard"
        element={
          <RequireAuth>
            <DashboardPage />
          </RequireAuth>
        }
      />
      <Route
        path="/profile"
        element={
          <RequireAuth>
            <ProfilePage />
          </RequireAuth>
        }
      />
      <Route
        path="/resources"
        element={
          <RequireAuth>
            <ResourcesPage />
          </RequireAuth>
        }
      />
      <Route
        path="/projects/new"
        element={
          <RequireAuth>
            <ProjectFormPage />
          </RequireAuth>
        }
      />
      <Route
        path="/projects/:id/edit"
        element={
          <RequireAuth>
            <ProjectFormPage />
          </RequireAuth>
        }
      />

      {/* ── Catch-all ──────────────────────────────────────────────────── */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <QueryClientProvider client={queryClient}>
          <Router>
            <div className="App">
              <AppRoutes />
              <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
            </div>
          </Router>
        </QueryClientProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;