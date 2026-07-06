// src/lib/api.ts

import axios from "axios";

// ─── URL CONSTRUCTION ────────────────────────────────────────────────────────

export function buildBaseURL(): string {
  const raw = (import.meta.env.VITE_API_URL || "http://127.0.0.1:8000")
    .replace(/\/+$/, "")
    .replace(/\/api$/, "");
  return `${raw}/api`;
}

const BASE_URL = buildBaseURL();

// ─── HELPERS ─────────────────────────────────────────────────────────────────

/**
 * Returns true if the JWT access token stored in localStorage is expired
 * (or malformed). We check this before attaching the header so we never
 * send a token we already know is stale — which would cause the server to
 * return 401 even on AllowAny endpoints.
 */
function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    // `exp` is in seconds; Date.now() is in milliseconds.
    return typeof payload.exp === "number" && payload.exp * 1000 < Date.now();
  } catch {
    // Malformed token — let the server decide.
    return false;
  }
}

// ─── AXIOS INSTANCES ──────────────────────────────────────────────────────────

/**
 * Authenticated instance — attaches JWT and handles silent token refresh.
 * Use for any endpoint that requires a logged-in user.
 */
const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: false,
});

/**
 * Public instance — no auth headers, no token refresh logic.
 * Use for read-only endpoints open to unauthenticated users
 * (e.g. gallery, homepage stats, resources).
 */
export const publicApi = axios.create({
  baseURL: BASE_URL,
  withCredentials: false,
});

// ─── REQUEST INTERCEPTOR: attach JWT (api instance only) ─────────────────────

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");

    if (token) {
      if (isTokenExpired(token)) {
        // Remove the stale token immediately so we don't keep sending it.
        // The response interceptor below will handle silent refresh when
        // the server returns 401 for protected endpoints.
        localStorage.removeItem("accessToken");
      } else {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ─── RESPONSE INTERCEPTOR: silent token refresh (api instance only) ───────────

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem("refreshToken");
        if (!refreshToken) {
          throw new Error("No refresh token in localStorage");
        }

        const response = await axios.post(
          `${BASE_URL}/auth/token/refresh/`,
          { refresh: refreshToken }
        );

        const { access } = response.data;
        if (!access) {
          throw new Error("Refresh endpoint did not return access token");
        }

        localStorage.setItem("accessToken", access);
        originalRequest.headers.Authorization = `Bearer ${access}`;
        return api(originalRequest);

      } catch (refreshError: unknown) {
        // Clear tokens — DON'T redirect here; let the UI handle it.
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// ─── ERROR UNWRAPPER ──────────────────────────────────────────────────────────

const handleApiError = (error: unknown) => {
  const axiosError = error as { response?: { data?: unknown } };
  if (axiosError.response?.data) throw axiosError.response.data;
  throw { detail: "Something went wrong. Please try again." };
};

// ─── TYPES ────────────────────────────────────────────────────────────────────

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

export interface CommitteeMemberData {
  id: number;
  full_name: string;
}

export interface CommitteeData {
  id: number;
  name: string;
  description: string;
  leader: CommitteeMemberData | null;
  member_count: number;
  members: CommitteeMemberData[];
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

export interface ComplaintData {
  id: number;
  subject: string;
  message: string;
  is_anonymous: boolean;
  status: "new" | "in_progress" | "resolved" | "dismissed";
  created_at: string;
}

export interface AdminComplaintData {
  id: number;
  user: { id: number; full_name: string; email: string; matric_number: string } | null;
  is_anonymous: boolean;
  subject: string;
  message: string;
  status: "new" | "in_progress" | "resolved" | "dismissed";
  admin_note: string;
  created_at: string;
  updated_at: string;
}

export interface AssistantMessageData {
  id: number;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

export interface NotificationData {
  id: number;
  title: string;
  message: string;
  notification_type: "committee" | "system";
  is_read: boolean;
  data: Record<string, unknown>;
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

  verifyStudent: (
    email: string,
    fullName: string,
    matricNumber: string
  ) =>
    api.post("/auth/verify-student/", {
      email,
      full_name: fullName,
      matric_number: matricNumber.toUpperCase(), // ✅ normalize
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
      matric_number: matricNumber.toUpperCase(), // ✅ normalize
      password,
      password2,
      ...(verificationToken
        ? { verification_token: verificationToken }
        : {}),
    }).catch(handleApiError),

  login: (email: string, password: string) =>
    api.post("/auth/login/", {
      email,
      password,
    }).catch(handleApiError),

  logout: () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");

    return Promise.resolve({
      detail: "Logged out",
    });
  },

  getProfile: () =>
    api.get("/auth/me/").catch(handleApiError),

  updateProfile: (data: unknown) =>
    api.patch("/auth/me/", data).catch(handleApiError),

  refreshToken: (refreshToken: string) =>
    api.post("/auth/token/refresh/", {
      refresh: refreshToken,
    }),

  requestPasswordReset: (
    email: string,
    matricNumber?: string
  ) =>
    api.post("/auth/password-reset/", {
      email,
      ...(matricNumber
        ? {
            matric_number:
              matricNumber.toUpperCase(), // ✅ normalize
          }
        : {}),
    }),

  confirmPasswordReset: (
    uid: string,
    token: string,
    password: string,
    password2: string
  ) =>
    api.post("/auth/password-reset/confirm/", {
      uid,
      token,
      password,
      password2,
    }),

  verifyEmail: (uid: string, token: string) =>
    api.post("/auth/verify-email/", {
      uid,
      token,
    }).catch(handleApiError),

  resendVerification: () =>
    api.post("/auth/resend-verification/")
      .catch(handleApiError),

  changePassword: (currentPassword: string, newPassword: string, newPassword2: string) =>
    api.post("/auth/change-password/", {
      current_password: currentPassword,
      new_password: newPassword,
      new_password2: newPassword2,
    }),
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

// ─── COMPLAINTS ───────────────────────────────────────────────────────────────

export const complaintsAPI = {
  submit: (payload: { subject: string; message: string; is_anonymous: boolean }) =>
    api.post("/complaints/", payload),
  getMyComplaints: () =>
    api.get<ComplaintData[]>("/complaints/my-complaints/"),
};

// ─── ADMIN COMPLAINTS ─────────────────────────────────────────────────────────

export const adminComplaintAPI = {
  getAll: () => api.get<PaginatedResponse<AdminComplaintData>>("/admin/complaints/"),
  updateStatus: (id: number, statusValue: string, admin_note?: string) =>
    api.patch(`/admin/complaints/${id}/update-status/`, { status: statusValue, admin_note }),
};

// ─── AI ASSISTANT ─────────────────────────────────────────────────────────────

export const assistantAPI = {
  sendMessage: (message: string) =>
    api.post<AssistantMessageData>("/assistant/chat/", { message }),
  getMessages: () => api.get<AssistantMessageData[]>("/assistant/messages/"),
  clearConversation: () => api.post("/assistant/clear/"),
};

// ─── EVENTS (student-facing registration) ─────────────────────────────────────

export const eventsAPI = {
  register: (eventId: number | string) => api.post(`/events/${eventId}/register/`),
  getMyRegistration: (eventId: number | string) => api.get(`/events/${eventId}/my-registration/`),
};

// ─── ADMIN EVENT ATTENDANCE ────────────────────────────────────────────────────

export const adminAttendanceAPI = {
  getRegistrations: (eventId: number | string, search?: string) =>
    api.get("/admin/event-registrations/", { params: { event: eventId, search } }),
  checkIn: (registrationId: number) =>
    api.post(`/admin/event-registrations/${registrationId}/check-in/`),
  checkInByToken: (eventId: number | string, token: string) =>
    api.post("/admin/event-registrations/check-in-by-token/", { event: eventId, token }),
};

// ─── CLASS ATTENDANCE ──────────────────────────────────────────────────────────

export const classAttendanceAPI = {
  createSession: (courseCode: string) =>
    api.post("/attendance/class-sessions/", { course_code: courseCode }),
  getSessions: (courseCode?: string) =>
    api.get("/attendance/class-sessions/", { params: { course_code: courseCode } }),
  getSession: (id: number | string) => api.get(`/attendance/class-sessions/${id}/`),
  closeSession: (id: number | string) => api.post(`/attendance/class-sessions/${id}/close/`),
  scan: (token: string) => api.post("/attendance/scan/", { token }),
};

// ─── ADMIN USERS ─────────────────────────────────────────────────────────────

export const adminUsersAPI = {
  /**
   * Fetches a paginated, optionally filtered list of all registered users.
   * Maps directly to GET /api/admin/users/.
   */
  getUsers: (params?: {
    page?: number;
    page_size?: number;
    search?: string;
    level?: string;
    role?: string;
  }) => api.get("/admin/users/", { params }),

  /**
   * Deletes a user by primary key.
   * Requires matric_number and full_name in the request body for
   * backend credential verification.
   * Maps directly to DELETE /api/admin/users/<id>/delete/.
   */
  deleteUser: (
    id: number,
    payload: { matric_number: string; full_name: string }
  ) => api.delete(`/admin/users/${id}/delete/`, { data: payload }),
};

// ─── CLOUDINARY ───────────────────────────────────────────────────────────────

export const cloudinaryAPI = {
  /**
   * Uploads to Cloudinary. Default: signed upload via POST /api/cloudinary/sign/.
   * Set VITE_CLOUDINARY_UPLOAD_PRESET to use unsigned preset uploads instead.
   */
  upload: async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET?.trim();
    let cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME?.trim() || "";

    if (uploadPreset) {
      if (!cloudName) {
        throw new Error(
          "VITE_CLOUDINARY_CLOUD_NAME is not set. Add it to frontend/.env and restart the dev server."
        );
      }
      formData.append("upload_preset", uploadPreset);
    } else {
      const { data } = await api.post<{
        cloud_name: string;
        api_key: string;
        timestamp: number;
        signature: string;
        folder: string;
      }>("/cloudinary/sign/");
      cloudName = data.cloud_name;
      formData.append("api_key", data.api_key);
      formData.append("timestamp", String(data.timestamp));
      formData.append("signature", data.signature);
      formData.append("folder", data.folder);
    }

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      { method: "POST", body: formData }
    );
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(
        (err as { error?: { message?: string } })?.error?.message || "Upload failed"
      );
    }
    return response.json() as Promise<{ secure_url: string }>;
  },

  /**
   * Uploads a non-image resource file (PDF/doc/zip/etc.) via a separate
   * signed folder (POST /api/cloudinary/sign-resource/) and Cloudinary's
   * /auto/upload endpoint, which auto-detects the file's resource type
   * instead of assuming "image" like the upload() method above.
   */
  uploadResourceFile: async (file: File) => {
    const { data } = await api.post<{
      cloud_name: string;
      api_key: string;
      timestamp: number;
      signature: string;
      folder: string;
    }>("/cloudinary/sign-resource/");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("api_key", data.api_key);
    formData.append("timestamp", String(data.timestamp));
    formData.append("signature", data.signature);
    formData.append("folder", data.folder);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${data.cloud_name}/auto/upload`,
      { method: "POST", body: formData }
    );
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(
        (err as { error?: { message?: string } })?.error?.message || "Upload failed"
      );
    }
    return response.json() as Promise<{ secure_url: string }>;
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

  // Pass page_size=200 so pagination doesn't silently truncate results to
  // the first page. needs_help is passed as the string "true" — the backend
  // checks `== "true"`.
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

  submit: (payload: Record<string, unknown>) =>
    api.post("/resources/submit/", payload),
};

export const adminResourceAPI = {
  getAll: (params?: Record<string, unknown>) =>
    api.get("/admin/resources/", { params }),

  create: (payload: Record<string, unknown>) =>
    api.post("/admin/resources/", payload),

  update: (id: string | number, payload: Record<string, unknown>) =>
    api.patch(`/admin/resources/${id}/`, payload),

  delete: (id: string | number) => api.delete(`/admin/resources/${id}/`),

  approve: (id: string | number) =>
    api.patch(`/admin/resources/${id}/approve/`),

  reject: (id: string | number, admin_note?: string) =>
    api.patch(`/admin/resources/${id}/reject/`, { admin_note }),
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