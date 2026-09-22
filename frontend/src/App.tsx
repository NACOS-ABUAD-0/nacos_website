// frontend/src/App.tsx
import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { motion, MotionConfig } from "framer-motion";
import { Toaster } from "react-hot-toast";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { AuthProvider, useAuth } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import RequireAdmin from "./components/RequireAdmin";
import RequireFullAdmin from "./components/RequireFullAdmin";
import ClickSpark from "./components/reactbits/ClickSpark";
import ScrollProgress from "./components/ScrollProgress";

// ── Page imports ───────────────────────────────────────────────────────────────
import { LoginPage } from "./pages/login";
import { RegisterPage } from "./pages/register";
import { DashboardPage } from "./pages/dashboard";
import { ProfilePage } from "./pages/profile";
import { VerifyEmailPage } from "./pages/verify-email";
import ScanAttendance from "./pages/ScanAttendance";
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
import { PendingApprovalPage } from "./pages/pending-approval";
import { CollaborationHubPage } from './pages/CollaborationHubPage';
import { MyCollaborationsPage } from "./pages/MyCollaborationsPage";
import { CollaborationRequestsPage } from "./pages/CollaborationRequestsPage";

// ── NEW: Lecturers ─────────────────────────────────────────────────────────────
import LecturersPage from "./pages/LecturersPage";

// ── NEW: Student feature pages ─────────────────────────────────────────────────
import { LikedProjectsPage } from "./pages/LikedProjectsPage";
import { CommitteesPage } from "./pages/CommitteesPage";
import { CommitteeApplicationPage } from "./pages/CommitteeApplicationPage";
import { ComplaintPage } from "./pages/ComplaintPage";
import { AssistantPage } from "./pages/AssistantPage";

// ── Admin page imports ─────────────────────────────────────────────────────────
import AdminHome from "./admin1/pages/Home";
import AdminApproval from "./admin1/pages/Approval";
import AdminEvents from "./admin1/pages/Event";
import AdminEventCheckIn from "./admin1/pages/EventCheckIn";
import AdminClassAttendance from "./admin1/pages/ClassAttendance";
import AdminSettings from "./admin1/pages/Settings";
import AdminStudentProfile from "./admin1/pages/StudentProfile";
import AdminMetrics from "./admin1/pages/Metrics";
import AdminGallery from "./admin1/pages/Gallery";
import AdminExecutives from "./admin1/pages/Executives";
import AdminInquiries from "./admin1/pages/Inquiries";
import UserManagement from "./admin1/pages/UserManagement";
// ── Admin committee applications ───────────────────────────────────────────────
import AdminCommitteeApplications from "./admin1/pages/CommitteeApplications";
import AdminComplaints from "./admin1/pages/Complaints";
import AdminResources from "./admin1/pages/Resources";
// ── NEW: Admin featured projects ───────────────────────────────────────────────
import AdminFeaturedProjects from "./admin1/pages/FeaturedProjects";

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
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

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

  // Staff accounts can log in immediately but see a limited "pending
  // approval" view of the site until an Admin/Super Admin assigns them a
  // role. Every RequireAuth-wrapped route falls through to that page.
  const isPendingStaff = user?.account_type === "staff" && user?.is_approved === false;
  if (isPendingStaff && location.pathname !== "/pending-approval") {
    return <Navigate to="/pending-approval" replace />;
  }

  return <>{children}</>;
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

// Fades/slides each page in on navigation. Keyed by the first path segment so
// moving between sibling routes (e.g. /projects/1 -> /projects/2) or changing
// query strings doesn't re-run the entrance. Enter-only: no exit animation, so
// route changes are never delayed.
function AppRoutes() {
  const { pathname } = useLocation();
  const section = pathname.split("/")[1] ?? "";

  return (
    <motion.div
      key={section}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
    <Routes>
      {/* ── Public ───────────────────────────────────────────────────── */}
      <Route path="/" element={<Homepage />} />
      <Route path="/executives" element={<Executives isHome={false} />} />
      <Route path="/contact" element={<ContactPage />} />

      {/* ── NEW: Lecturers ───────────────────────────────────────────── */}
      <Route path="/lecturers" element={<LecturersPage />} />

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

      {/* ── NEW: Complaints ──────────────────────────────────────────── */}
      <Route
        path="/complaints"
        element={
          <RequireAuth>
            <ComplaintPage />
          </RequireAuth>
        }
      />

      {/* ── NEW: AI Assistant ────────────────────────────────────────── */}
      <Route
        path="/assistant"
        element={
          <RequireAuth>
            <AssistantPage />
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

      {/* ── Pending staff approval ──────────────────────────────────────── */}
      <Route
        path="/pending-approval"
        element={
          <RequireAuth>
            <PendingApprovalPage />
          </RequireAuth>
        }
      />

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
        path="/attendance/scan"
        element={
          <RequireAuth>
            <ScanAttendance />
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
      {/* ── The routes below use RequireFullAdmin: Admin/Super Admin/Lecturer
          only. Executives get staff-area access (RequireAdmin, above) but
          are redirected away from these — they're limited to Home,
          Committee Applications, and Settings. ─────────────────────────── */}
      <Route
        path="/admin/approvals"
        element={
          <RequireFullAdmin>
            <AdminApproval />
          </RequireFullAdmin>
        }
      />
      <Route
        path="/admin/approvals/:id"
        element={
          <RequireFullAdmin>
            <AdminStudentProfile />
          </RequireFullAdmin>
        }
      />
      <Route
        path="/admin/events"
        element={
          <RequireFullAdmin>
            <AdminEvents />
          </RequireFullAdmin>
        }
      />
      <Route
        path="/admin/events/:id/checkin"
        element={
          <RequireFullAdmin>
            <AdminEventCheckIn />
          </RequireFullAdmin>
        }
      />
      <Route
        path="/admin/class-attendance"
        element={
          <RequireFullAdmin>
            <AdminClassAttendance />
          </RequireFullAdmin>
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
          <RequireFullAdmin>
            <AdminMetrics />
          </RequireFullAdmin>
        }
      />
      <Route
        path="/admin/gallery"
        element={
          <RequireFullAdmin>
            <AdminGallery />
          </RequireFullAdmin>
        }
      />
      <Route
        path="/admin/executives"
        element={
          <RequireFullAdmin>
            <AdminExecutives />
          </RequireFullAdmin>
        }
      />
      <Route
        path="/admin/inquiries"
        element={
          <RequireFullAdmin>
            <AdminInquiries />
          </RequireFullAdmin>
        }
      />
      <Route
        path="/admin/users"
        element={
          <RequireFullAdmin>
            <UserManagement />
          </RequireFullAdmin>
        }
      />
      {/* ── Admin Committee Applications — Executives can reach this one ── */}
      <Route
        path="/admin/committee-applications"
        element={
          <RequireAdmin>
            <AdminCommitteeApplications />
          </RequireAdmin>
        }
      />
      {/* ── NEW: Admin Complaints ──────────────────────────────────────── */}
      <Route
        path="/admin/complaints"
        element={
          <RequireFullAdmin>
            <AdminComplaints />
          </RequireFullAdmin>
        }
      />
      {/* ── NEW: Admin Resources ────────────────────────────────────────── */}
      <Route
        path="/admin/resources"
        element={
          <RequireFullAdmin>
            <AdminResources />
          </RequireFullAdmin>
        }
      />
      {/* ── NEW: Admin Featured Projects ──────────────────────────────── */}
      <Route
        path="/admin/featured-projects"
        element={
          <RequireFullAdmin>
            <AdminFeaturedProjects />
          </RequireFullAdmin>
        }
      />

      {/* ── Catch-all ────────────────────────────────────────────────── */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </motion.div>
  );
}

// ─── App ───────────────────────────────────────────────────────────────────────

function App() {
  return (
    <MotionConfig reducedMotion="user">
    <ThemeProvider>
      <AuthProvider>
        <QueryClientProvider client={queryClient}>
          <Router>
            <div className="App">
              <ScrollProgress />
              <AppRoutes />
              <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
              <ClickSpark sparkColor="#006E3A" sparkSize={9} sparkRadius={16} sparkCount={8} duration={450} />
            </div>
          </Router>
        </QueryClientProvider>
      </AuthProvider>
    </ThemeProvider>
    </MotionConfig>
  );
}

export default App;