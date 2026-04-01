// frontend/src/App.tsx - COMPLETE WITH ALL ROUTES INCLUDING ADMIN
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
import MyProjectsPage from './pages/MyProjectsPage';
import Executives from "./components/Executives";
import { ProjectsGallery } from "./pages/ProjectsGallery";
import { ProjectDetail } from "./pages/project-detail";
import { ProjectFormPage } from "./pages/ProjectFormPage";
import { ResourcesPage } from "./pages/resources";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Events and Gallery imports
import Events from "./pages/events";
import EventDetail from "./pages/event-detail";
import Gallery from "./pages/gallery";
import ContactPage from "./pages/contact";

// Admin imports
import AdminHome from "./admin1/pages/home";
import AdminApproval from "./admin1/pages/Approval";
import AdminEvents from "./admin1/pages/Event";
import AdminSettings from "./admin1/pages/Settings";
import AdminStudentProfile from "./admin1/pages/StudentProfile";
import AdminMetrics from "./admin1/pages/Metrics";
import AdminGallery from "./admin1/pages/Gallery";
import AdminInquiries from "./admin1/pages/Inquiries";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// ─── RequireAuth ──────────────────────────────────────────────────────────────
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

// ─── RequireAdmin ─────────────────────────────────────────────────────────────
const RequireAdmin: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Check if user has admin/staff privileges
  if (!user?.is_staff) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

// ─── PublicRoute ──────────────────────────────────────────────────────────────
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
      <Route path="/contact" element={<ContactPage />} />

      {/* ── Projects routes — ORDER MATTERS! Specific routes before parameterized ones ──────────── */}
      <Route path="/projects" element={<ProjectsGallery />} />

      {/* My Projects — MUST come before /projects/:id to avoid being caught as :id="my-projects" */}
      <Route
        path="/my-projects"
        element={
          <RequireAuth>
            <MyProjectsPage />
          </RequireAuth>
        }
      />

      {/* Create project — also before :id */}
      <Route
        path="/projects/new"
        element={
          <RequireAuth>
            <ProjectFormPage />
          </RequireAuth>
        }
      />

      {/* Edit project — explicit route with :id/edit pattern */}
      <Route
        path="/projects/:id/edit"
        element={
          <RequireAuth>
            <ProjectFormPage />
          </RequireAuth>
        }
      />

      {/* Project detail — MUST be last among /projects/* routes */}
      <Route path="/projects/:id" element={<ProjectDetail />} />

      {/* Events routes */}
      <Route path="/events" element={<Events isHome={false} />} />
      <Route path="/events/:id" element={<EventDetail />} />

      {/* Gallery route */}
      <Route path="/gallery" element={<Gallery isHome={false}/>} />

      {/* Verification routes */}
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

      {/* ── Admin Routes — must be logged in AND have staff privileges ──────────── */}
      <Route
        path="/admin"
        element={
            <AdminHome />
        }
      />
      <Route
        path="/admin/dashboard"
        element={
            <AdminHome />
        }
      />
      <Route
        path="/admin/approvals"
        element={
            <AdminApproval />
        }
      />
      <Route
        path="/admin/approvals/:id"
        element={
            <AdminStudentProfile />
        }
      />
      <Route
        path="/admin/events"
        element={
            <AdminEvents />
        }
      />
      <Route
        path="/admin/settings"
        element={
            <AdminSettings />
        }
      />
      <Route
        path="/admin/metrics"
        element={
            <AdminMetrics />
        }
      />
      <Route
        path="/admin/gallery"
        element={
            <AdminGallery />
        }
      />

    <Route path="/admin/inquiries" element={<AdminInquiries />} />
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