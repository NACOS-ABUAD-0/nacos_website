// frontend/src/App.tsx
import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { AuthProvider, useAuth } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import RequireAdmin from "./components/RequireAdmin";

// ── Page imports ───────────────────────────────────────────────────────────────
import { LoginPage } from "./pages/login";
import { RegisterPage } from "./pages/register";
import { DashboardPage } from "./pages/dashboard";
import { ProfilePage } from "./pages/profile";
import { VerifyEmailPage } from "./pages/verify-email";
import Homepage from "./pages/homepage";
import MyProjectsPage from "./pages/MyProjectsPage";
import Executives from "./components/Executives";
import { ProjectsGallery } from "./pages/ProjectsGallery";
import { ProjectDetail } from "./pages/project-detail";
import { ProjectFormPage } from "./pages/ProjectFormPage";
import { ResourcesPage } from "./pages/resources";
import Events from "./pages/events";
import EventDetail from "./pages/event-detail";
import Gallery from "./pages/gallery";
import ContactPage from "./pages/contact";
import { ForgotPasswordPage } from "./pages/forgot-password";
import { ResetPasswordPage }  from "./pages/reset-password";
import { CollaborationHubPage } from './pages/CollaborationHubPage';
import { MyCollaborationsPage } from "./pages/MyCollaborationsPage";
import { CollaborationRequestsPage } from "./pages/CollaborationRequestsPage";


// ── NEW: Student feature pages ─────────────────────────────────────────────────
import { LikedProjectsPage } from "./pages/LikedProjectsPage";
import { CommitteesPage } from "./pages/CommitteesPage";
import { CommitteeApplicationPage } from "./pages/CommitteeApplicationPage";

// ── Admin page imports ─────────────────────────────────────────────────────────
import AdminHome from "./admin1/pages/Home";
import AdminApproval from "./admin1/pages/Approval";
import AdminEvents from "./admin1/pages/Event";
import AdminSettings from "./admin1/pages/Settings";
import AdminStudentProfile from "./admin1/pages/StudentProfile";
import AdminMetrics from "./admin1/pages/Metrics";
import AdminGallery from "./admin1/pages/Gallery";
import AdminInquiries from "./admin1/pages/Inquiries";
// ── NEW: Admin committee applications ──────────────────────────────────────────
import AdminCommitteeApplications from "./admin1/pages/CommitteeApplications";

// ─── Query Client ──────────────────────────────────────────────────────────────

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// ─── RequireAuth ───────────────────────────────────────────────────────────────

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

// ─── PublicRoute ───────────────────────────────────────────────────────────────

const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600" />
      </div>
    );
  }

  return !isAuthenticated ? <>{children}</> : <Navigate to="/dashboard" replace />;
};

// ─── Routes ────────────────────────────────────────────────────────────────────

function AppRoutes() {
  return (
    <Routes>
      {/* ── Public ───────────────────────────────────────────────────── */}
      <Route path="/" element={<Homepage />} />
      <Route path="/executives" element={<Executives isHome={false} />} />
      <Route path="/contact" element={<ContactPage />} />

      {/* ── Projects ─────────────────────────────────────────────────── */}
      <Route path="/projects" element={<ProjectsGallery />} />
      <Route
        path="/my-projects"
        element={
          <RequireAuth>
            <MyProjectsPage />
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
      <Route path="/projects/:id" element={<ProjectDetail />} />

      {/* ── NEW: Liked Projects ──────────────────────────────────────── */}
      <Route
        path="/liked-projects"
        element={
          <RequireAuth>
            <LikedProjectsPage />
          </RequireAuth>
        }
      />

      <Route path="/collaboration-hub" element={
        <RequireAuth>
        <CollaborationHubPage />
        </RequireAuth>
        }
        />
     {/* ── Collaborations ───────────────────────────────────────────── */}
<Route
  path="/my-collaborations"
  element={
    <RequireAuth>
      <MyCollaborationsPage />
    </RequireAuth>
  }
/>
<Route
  path="/collaboration-requests"
  element={
    <RequireAuth>
      <CollaborationRequestsPage />
    </RequireAuth>
  }
/>

      {/* ── NEW: Committees ──────────────────────────────────────────── */}
      <Route
        path="/committees"
        element={
          <RequireAuth>
            <CommitteesPage />
          </RequireAuth>
        }
      />
      <Route
        path="/committees/:id/apply"
        element={
          <RequireAuth>
            <CommitteeApplicationPage />
          </RequireAuth>
        }
      />

      {/* ── Events ───────────────────────────────────────────────────── */}
      <Route path="/events" element={<Events isHome={false} />} />
      <Route path="/events/:id" element={<EventDetail />} />

      {/* ── Gallery ──────────────────────────────────────────────────── */}
      <Route path="/gallery" element={<Gallery isHome={false} />} />

      {/* ── Email Verification ───────────────────────────────────────── */}
      <Route path="/verify-email/:uid/:token" element={<VerifyEmailPage />} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />

      {/* ── Auth ─────────────────────────────────────────────────────── */}
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
      <Route
        path="/forgot-password"
        element={
          <PublicRoute>
            <ForgotPasswordPage />
          </PublicRoute>
        }
      />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      {/* ── Protected ────────────────────────────────────────────────── */}
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

      {/* ── Admin ────────────────────────────────────────────────────── */}
      <Route
        path="/admin"
        element={
          <RequireAdmin>
            <AdminHome />
          </RequireAdmin>
        }
      />
      <Route
        path="/admin/dashboard"
        element={
          <RequireAdmin>
            <AdminHome />
          </RequireAdmin>
        }
      />
      <Route
        path="/admin/approvals"
        element={
          <RequireAdmin>
            <AdminApproval />
          </RequireAdmin>
        }
      />
      <Route
        path="/admin/approvals/:id"
        element={
          <RequireAdmin>
            <AdminStudentProfile />
          </RequireAdmin>
        }
      />
      <Route
        path="/admin/events"
        element={
          <RequireAdmin>
            <AdminEvents />
          </RequireAdmin>
        }
      />
      <Route
        path="/admin/settings"
        element={
          <RequireAdmin>
            <AdminSettings />
          </RequireAdmin>
        }
      />
      <Route
        path="/admin/metrics"
        element={
          <RequireAdmin>
            <AdminMetrics />
          </RequireAdmin>
        }
      />
      <Route
        path="/admin/gallery"
        element={
          <RequireAdmin>
            <AdminGallery />
          </RequireAdmin>
        }
      />
      <Route
        path="/admin/inquiries"
        element={
          <RequireAdmin>
            <AdminInquiries />
          </RequireAdmin>
        }
      />
      {/* ── NEW: Admin Committee Applications ────────────────────────── */}
      <Route
        path="/admin/committee-applications"
        element={
          <RequireAdmin>
            <AdminCommitteeApplications />
          </RequireAdmin>
        }
      />

      {/* ── Catch-all ────────────────────────────────────────────────── */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

// ─── App ───────────────────────────────────────────────────────────────────────

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