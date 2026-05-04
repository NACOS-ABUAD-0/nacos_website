// src/lib/api.ts

import axios from "axios";

// URL CONSTRUCTION

function buildBaseURL(): string {
  const raw = (import.meta.env.VITE_API_URL || "http://127.0.0.1:8000")
    .replace(/\/+$/, "")
    .replace(/\/api$/, "");
  return `${raw}/api`;
}

const BASE_URL = buildBaseURL();

// AXIOS INSTANCE

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: false,
});

// REQUEST INTERCEPTOR: attach JWT

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

// ERROR UNWRAPPER

const handleApiError = (error: unknown) => {
  const axiosError = error as { response?: { data?: unknown } };
  if (axiosError.response?.data) throw axiosError.response.data;
  throw { detail: "Something went wrong. Please try again." };
};

// TYPES
export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

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
  need_skill: string | null;
  applicant: number;
  applicant_name: string;
  applicant_email: string;
  phone_number: string;
  message: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  updated_at: string;
}

// ─── AUTH ────────────────────────────────────────────────────────────────────

export const authAPI = {
  checkEmail: (email: string) =>
    api.post("/auth/check-email/", { email }),

  verifyStudent: (email: string, fullName: string, matricNumber: string) =>
    api.post("/auth/verify-student/", {
      email,
      full_name: fullName,
      matric_number: matricNumber,
    }),

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

  requestPasswordReset: (email: string, matricNumber?: string) =>
    api.post("/auth/password-reset/", {
      email,
      ...(matricNumber ? { matric_number: matricNumber } : {}),
    }),

  confirmPasswordReset: (uid: string, token: string, password: string, password2: string) =>
    api.post("/auth/password-reset/confirm/", { uid, token, password, password2 }),

  verifyEmail: (uid: string, token: string) =>
    api.post("/auth/verify-email/", { uid, token }).catch(handleApiError),

  resendVerification: () =>
    api.post("/auth/resend-verification/").catch(handleApiError),
};

// ─── USERS ────────────────────────────────────────────────────────────────────

export const usersAPI = {
  getCount: () => api.get("/users/count/"),
};

// ─── STUDENT PROFILE ──────────────────────────────────────────────────────────

export const studentAPI = {
  getProfile: () => api.get<StudentProfileData>("/student/profile/"),
  updateProfile: (data: Partial<StudentProfileData>) =>
    api.patch<StudentProfileData>("/student/profile/", data),
};

// ─── PROJECTS ────────────────────────────────────────────────────────────────

export const projectsAPI = {
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

// ─── COMMITTEES ───────────────────────────────────────────────────────────────

export const committeesAPI = {
  getAll: () => api.get<PaginatedResponse<CommitteeData>>("/committees/"),
  apply: (payload: {
    committee_id: number;
    phone_number: string;
    reason: string;
    offer: string;
  }) => api.post("/committee-applications/", payload),
  getMyApplications: () =>
    api.get<PaginatedResponse<CommitteeApplicationData>>("/committee-applications/my-applications/"),
};

// ─── NOTIFICATIONS ────────────────────────────────────────────────────────────

export const notificationsAPI = {
  getAll: () => api.get<PaginatedResponse<NotificationData>>("/notifications/"),
  markRead: (id: number) => api.patch(`/notifications/${id}/read/`),
  deleteNotification: (id: number) => api.delete(`/notifications/${id}/`),
};

// ─── ADMIN COMMITTEE ──────────────────────────────────────────────────────────

export const adminCommitteeAPI = {
  getApplications: () =>
    api.get<PaginatedResponse<CommitteeApplicationData>>("/admin/committee-applications/"),
  approve: (id: number, admin_note?: string) =>
    api.patch(`/admin/committee-applications/${id}/approve/`, { admin_note }),
  reject: (id: number, admin_note?: string) =>
    api.patch(`/admin/committee-applications/${id}/reject/`, { admin_note }),
};

// ─── CLOUDINARY ───────────────────────────────────────────────────────────────

export const cloudinaryAPI = {
  upload: async (file: File, uploadPreset: string = 'nacos_projects') => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset);
    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'your_cloud_name';
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      { method: 'POST', body: formData }
    );
    if (!response.ok) throw new Error('Upload failed');
    return response.json();
  },
};

// ─── COLLABORATION ────────────────────────────────────────────────────────────

export const collaborationAPI = {
  apply: (projectId: number | string, payload: {
    need_id?: number | null;
    phone_number: string;
    message: string;
  }) => api.post(`/projects/${projectId}/apply_collaborate/`, payload),


  getRequests: (projectId: number | string) =>
    api.get<PaginatedResponse<CollaborationRequestData>>(
      `/projects/${projectId}/collaboration_requests/`
    ),

  acceptRequest: (projectId: number | string, requestId: number) =>
    api.patch(`/projects/${projectId}/requests/${requestId}/accept/`),

  rejectRequest: (projectId: number | string, requestId: number) =>
    api.patch(`/projects/${projectId}/requests/${requestId}/reject/`),

  deleteRequest: (projectId: number | string, requestId: number) =>
    api.delete(`/projects/${projectId}/requests/${requestId}/delete/`),

  // BUG 3 FIX: Pass page_size=200 so pagination doesn't silently truncate
  // results to the first page (typically 10–20 items).
  // needs_help is passed as the string "true" — the backend checks `== "true"`.
  getProjectsNeedingHelp: (skillType?: string) =>
    api.get('/projects/', {
      params: {
        needs_help: 'true',
        page_size: 200,
        ...(skillType ? { skill_type: skillType } : {}),
      },
    }),

  getMyCollaborations: () => api.get('/projects/my-collaborations/'),
};

// ─── SKILLS / TAGS ────────────────────────────────────────────────────────────

export const skillsAPI = {
  getSkills: () => api.get("/skilltags/"),
};

// ─── RESOURCES ────────────────────────────────────────────────────────────────

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

// ─── HOMEPAGE ─────────────────────────────────────────────────────────────────

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