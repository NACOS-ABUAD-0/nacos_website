// src/lib/api.ts

import axios from "axios";

// ─── URL CONSTRUCTION ────────────────────────────────────────────────────────
//
// VITE_API_URL should be the bare origin: http://127.0.0.1:8000
// We always append /api ourselves.
//
// Common mistake: setting VITE_API_URL=http://127.0.0.1:8000/api
// That produces baseURL = "http://127.0.0.1:8000/api/api" → every request 404s.
//
// This helper strips any trailing /api (or /api/) so the file is
// self-healing even if the env var is set incorrectly.
// ─────────────────────────────────────────────────────────────────────────────

function buildBaseURL(): string {
  const raw = (import.meta.env.VITE_API_URL || "http://127.0.0.1:8000")
    .replace(/\/+$/, "")      // strip trailing slashes
    .replace(/\/api$/, "");   // strip accidental /api suffix

  return `${raw}/api`;
}

const BASE_URL = buildBaseURL();

// ─── AXIOS INSTANCE ──────────────────────────────────────────────────────────
//
// All endpoint paths below are relative to BASE_URL.
// They MUST start with "/" so axios's combineURLs helper strips the
// leading slash and appends correctly:
//
//   combineURLs("http://host/api", "/projects/")
//   → "http://host/api/projects/"  ✅
//
// ─────────────────────────────────────────────────────────────────────────────
const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: false,
});

// ─── REQUEST INTERCEPTOR: attach JWT ─────────────────────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── RESPONSE INTERCEPTOR: silent token refresh ──────────────────────────────
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem("refreshToken");
        if (!refreshToken) throw new Error("No refresh token");

        // Use a plain axios call (not the `api` instance) to avoid
        // triggering this interceptor again on a 401 from /token/refresh/.
        const response = await axios.post(
          `${BASE_URL}/auth/token/refresh/`,
          { refresh: refreshToken }
        );

        const { access, refresh } = response.data;
        localStorage.setItem("accessToken", access);
        if (refresh) localStorage.setItem("refreshToken", refresh);

        originalRequest.headers.Authorization = `Bearer ${access}`;
        return api(originalRequest);
      } catch {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);

// ─── ERROR UNWRAPPER ─────────────────────────────────────────────────────────
// DRF returns validation errors as { field: ["message"] } or { detail: "..." }.
// Re-throwing error.response.data lets callers do:
//   catch (err) { setErrors(err) }
// ─────────────────────────────────────────────────────────────────────────────
const handleApiError = (error: unknown) => {
  const axiosError = error as { response?: { data?: unknown } };
  if (axiosError.response?.data) throw axiosError.response.data;
  throw { detail: "Something went wrong. Please try again." };
};

// ─────────────────────────────────────────────────────────────────────────────
// TYPE INTERFACES
// ─────────────────────────────────────────────────────────────────────────────

export interface StudentProfileData {
  id: number;
  full_name: string;
  email: string;
  matric_number: string;
  department: string;
  level: string;
  phone_number: string;
  last_synced_at: string;
  created_at: string;
}

export interface CommitteeData {
  id: number;
  name: string;
  description: string;
  created_at: string;
}

export interface CommitteeApplicationData {
  id: number;
  committee: CommitteeData;
  phone_number: string;
  reason: string;
  offer: string;
  status: "pending" | "approved" | "rejected";
  admin_note: string;
  created_at: string;
}

export interface NotificationData {
  id: number;
  title: string;
  message: string;
  notification_type: "committee" | "system";
  is_read: boolean;
  data: Record<string, any>;
  created_at: string;
}

export interface CollaborationNeedData {
  id?: number;
  skill_type: 'frontend' | 'backend' | 'ui_ux' | 'ai_ml' | 'documentation' | 'others';
  custom_skill?: string;
  description?: string;
  is_filled?: boolean;
}

export interface CollaborationRequestData {
  id: number;
  project: number;
  project_title: string;
  need: number | null;
  need_skill: string;
  applicant: number;
  applicant_name: string;
  applicant_email: string;
  phone_number: string;
  message: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  updated_at: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// ENDPOINT MODULES
// Each group of related endpoints lives in its own exported object.
// Import exactly what you need:
//   import { projectsAPI } from "@/lib/api";
// ─────────────────────────────────────────────────────────────────────────────

// ── AUTH ─────────────────────────────────────────────────────────────────────
export const authAPI = {
  // Step 1: Email gate
  checkEmail: (email: string) =>
    api.post("/auth/check-email/", { email }),

  // Step 2: Student identity gate → returns { verification_token, student }
  verifyStudent: (email: string, fullName: string, matricNumber: string) =>
    api.post("/auth/verify-student/", {
      email,
      full_name: fullName,
      matric_number: matricNumber,
    }),

  // Registration (now accepts optional verification token)
  register: (
    email: string,
    fullName: string,
    matricNumber: string,
    password: string,
    password2: string,
    verificationToken?: string,
  ) =>
    api.post("/auth/register/", {
      email,
      full_name: fullName,
      matric_number: matricNumber,
      password,
      password2,
      ...(verificationToken ? { verification_token: verificationToken } : {}),
    }).catch(handleApiError),

  login: (email: string, password: string) =>
    api.post("/auth/login/", { email, password }).catch(handleApiError),

  logout: () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    return Promise.resolve({ detail: "Logged out" });
  },

  getProfile: () => api.get("/auth/me/").catch(handleApiError),
  updateProfile: (data: unknown) =>
    api.patch("/auth/me/", data).catch(handleApiError),

  refreshToken: (refreshToken: string) =>
    api.post("/auth/token/refresh/", { refresh: refreshToken }),

  // Forgot password — request reset link
  requestPasswordReset: (email: string, matricNumber?: string) =>
    api.post("/auth/password-reset/", {
      email,
      ...(matricNumber ? { matric_number: matricNumber } : {}),
    }),

  // Forgot password — confirm with token
  confirmPasswordReset: (
    uid: string,
    token: string,
    password: string,
    password2: string,
  ) =>
    api.post("/auth/password-reset/confirm/", { uid, token, password, password2 }),
};

// ── USERS ────────────────────────────────────────────────────────────────────
export const usersAPI = {
  getCount: () => api.get("/users/count/"),
};

// ── STUDENT PROFILE ────────────────────────────────────────────────────────────
export const studentAPI = {
  getProfile: () => api.get<StudentProfileData>("/student/profile/"),
  updateProfile: (data: Partial<StudentProfileData>) =>
    api.patch<StudentProfileData>("/student/profile/", data),
};

// ── PROJECTS ─────────────────────────────────────────────────────────────────
export const projectsAPI = {
  // Pass params as an object — axios serialises them correctly:
  //   getProjects({ featured: true, limit: 6 })
  //   → GET /api/projects/?featured=true&limit=6
  // Avoid baking query strings into the URL string itself.
  getProjects: (params?: Record<string, unknown>) =>
    api.get("/projects/", { params }),

  getProject: (id: string | number) => api.get(`/projects/${id}/`),

  createProject: (data: unknown) => api.post("/projects/", data),

  updateProject: (id: string | number, data: unknown) =>
    api.patch(`/projects/${id}/`, data),

  deleteProject: (id: string | number) => api.delete(`/projects/${id}/`),

  getMyProjects: () => api.get("/projects/my-projects/"),

  getLiked: () => api.get("/projects/liked/"),

  toggleFeatured: (id: string | number) =>
    api.post(`/projects/${id}/toggle_featured/`),

  likeProject: (id: string | number) => api.post(`/projects/${id}/like/`),
  unlikeProject: (id: string | number) => api.post(`/projects/${id}/unlike/`),
};

// ── COMMITTEES ───────────────────────────────────────────────────────────────
export const committeesAPI = {
  getAll: () => api.get<CommitteeData[]>("/committees/"),
  apply: (payload: {
    committee_id: number;
    phone_number: string;
    reason: string;
    offer: string;
  }) => api.post("/committee-applications/", payload),
  getMyApplications: () =>
    api.get<CommitteeApplicationData[]>("/committee-applications/my-applications/"),
};

// ── NOTIFICATIONS ──────────────────────────────────────────────────────────────
export const notificationsAPI = {
  getAll: () => api.get<NotificationData[]>("/notifications/"),
  markRead: (id: number) => api.patch(`/notifications/${id}/read/`),
};

// ── ADMIN COMMITTEE ──────────────────────────────────────────────────────────
export const adminCommitteeAPI = {
  getApplications: () =>
    api.get<CommitteeApplicationData[]>("/admin/committee-applications/"),
  approve: (id: number, admin_note?: string) =>
    api.patch(`/admin/committee-applications/${id}/approve/`, { admin_note }),
  reject: (id: number, admin_note?: string) =>
    api.patch(`/admin/committee-applications/${id}/reject/`, { admin_note }),
};

// ── CLOUDINARY UPLOAD (new) ──────────────────────────────────────────────────
export const cloudinaryAPI = {
  upload: async (file: File, uploadPreset: string = 'nacos_projects') => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset);

    // Use your Cloudinary cloud name
    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'your_cloud_name';

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      { method: 'POST', body: formData }
    );

    if (!response.ok) throw new Error('Upload failed');
    return response.json();
  },
};

// ── COLLABORATION (new) ──────────────────────────────────────────────────────
export const collaborationAPI = {
  // Apply to collaborate on a project
  apply: (projectId: number | string, payload: {
    need_id?: number;
    phone_number: string;
    message: string;
  }) => api.post(`/projects/${projectId}/apply_collaborate/`, payload),

  // Get collaboration requests for a project (owner only)
  getRequests: (projectId: number | string) =>
    api.get<CollaborationRequestData[]>(`/projects/${projectId}/collaboration_requests/`),

  // Accept a request
  acceptRequest: (projectId: number | string, requestId: number) =>
    api.patch(`/projects/${projectId}/requests/${requestId}/accept/`),

  // Reject a request
  rejectRequest: (projectId: number | string, requestId: number) =>
    api.patch(`/projects/${projectId}/requests/${requestId}/reject/`),

  // Get projects needing help
  getProjectsNeedingHelp: (skillType?: string) =>
    api.get('/projects/', {
      params: { needs_help: true, ...(skillType ? { skill_type: skillType } : {}) }
    }),

  // Get my collaborations
  getMyCollaborations: () => api.get('/projects/my-collaborations/'),
};

// ── SKILLS / TAGS ─────────────────────────────────────────────────────────────
export const skillsAPI = {
  getSkills: () => api.get("/skilltags/"),
};

// ── RESOURCES ────────────────────────────────────────────────────────────────
export const resourcesAPI = {
  getResources: (params?: Record<string, unknown>) =>
    api.get("/resources/", { params }),

  getResource: (id: string | number) => api.get(`/resources/${id}/`),

  getResourceCategories: () => api.get("/resource-categories/"),

  getResourceTags: () => api.get("/resource-tags/"),

  getResourcesByUrl: (url: string) => axios.get(url),

  trackDownload: (id: string | number) =>
    api.post(`/resources/${id}/track_download/`),

  getCount: () => api.get("/resources/count/"),
};

// ── HOMEPAGE ─────────────────────────────────────────────────────────────────
// NOTE: Pass filters as `params` objects, never as inline query strings.
// Inline strings are opaque to TypeScript and hard to test.
export const homepageAPI = {
  getStats: () => api.get("/admin/stats/"),

  getFeaturedProjects: () =>
    api.get("/projects/", { params: { is_featured: true, page_size: 6 } }),

  getUpcomingEvents: () =>
    api.get("/events/", { params: { upcoming: true, page_size: 3 } }),

  getExecutives: () => api.get("/executives/"),

  getLatestResources: () =>
    api.get("/resources/", { params: { page_size: 6 } }),

  getLatestGallery: () =>
    api.get("/gallery/", { params: { page_size: 12 } }),
};

export default api;
export { api };