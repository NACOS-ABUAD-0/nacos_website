import axios from 'axios';

import { clearTokens, getAccessToken, getRefreshToken, setTokens } from './tokenStorage';

// ─── URL CONSTRUCTION ───────────────────────────────────────────────────────

function buildBaseURL(): string {
  const raw = (process.env.EXPO_PUBLIC_API_URL || 'http://127.0.0.1:8000')
    .replace(/\/+$/, '')
    .replace(/\/api$/, '');
  return `${raw}/api`;
}

const BASE_URL = buildBaseURL();

// ─── AXIOS INSTANCES ────────────────────────────────────────────────────────

/** Authenticated instance — attaches JWT and handles silent token refresh. */
const api = axios.create({ baseURL: BASE_URL });

/** Public instance — no auth headers, no refresh logic. */
export const publicApi = axios.create({ baseURL: BASE_URL });

// ─── REQUEST INTERCEPTOR: attach JWT ────────────────────────────────────────

api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ─── RESPONSE INTERCEPTOR: silent token refresh ─────────────────────────────
// Refresh rotation is on server-side (ROTATE_REFRESH_TOKENS +
// BLACKLIST_AFTER_ROTATION), so every refresh call returns a *new* refresh
// token too — both must be persisted or the next refresh will fail against
// an already-blacklisted token.

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = getRefreshToken();
        if (!refreshToken) {
          throw new Error('No refresh token stored');
        }

        const response = await axios.post(`${BASE_URL}/auth/token/refresh/`, {
          refresh: refreshToken,
        });

        const { access, refresh } = response.data;
        if (!access || !refresh) {
          throw new Error('Refresh endpoint did not return both tokens');
        }

        await setTokens(access, refresh);
        originalRequest.headers.Authorization = `Bearer ${access}`;
        return api(originalRequest);
      } catch (refreshError) {
        await clearTokens();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

// ─── ERROR UNWRAPPER ────────────────────────────────────────────────────────

export function unwrapApiError(error: unknown): any {
  const axiosError = error as { response?: { data?: unknown } };
  if (axiosError?.response?.data) return axiosError.response.data;
  return { detail: 'Something went wrong. Please try again.' };
}

// ─── AUTH ───────────────────────────────────────────────────────────────────

export const authAPI = {
  checkEmail: (email: string) => api.post('/auth/check-email/', { email }),

  verifyStudent: (email: string, fullName: string, matricNumber: string) =>
    api.post('/auth/verify-student/', {
      email,
      full_name: fullName,
      matric_number: matricNumber.toUpperCase(),
    }),

  register: (
    email: string,
    fullName: string,
    matricNumber: string,
    password: string,
    password2: string,
    verificationToken?: string,
  ) =>
    api.post('/auth/register/', {
      email,
      full_name: fullName,
      matric_number: matricNumber.toUpperCase(),
      password,
      password2,
      ...(verificationToken ? { verification_token: verificationToken } : {}),
    }),

  login: (email: string, password: string) => api.post('/auth/login/', { email, password }),

  logout: (refreshToken: string) => api.post('/auth/logout/', { refresh: refreshToken }),

  getProfile: () => api.get('/auth/me/'),

  updateProfile: (data: unknown) => api.patch('/auth/me/', data),

  requestPasswordReset: (email: string, matricNumber?: string) =>
    api.post('/auth/password-reset/', {
      email,
      ...(matricNumber ? { matric_number: matricNumber.toUpperCase() } : {}),
    }),

  confirmPasswordReset: (uid: string, token: string, password: string, password2: string) =>
    api.post('/auth/password-reset/confirm/', { uid, token, password, password2 }),

  verifyEmail: (uid: string, token: string) => api.post('/auth/verify-email/', { uid, token }),

  resendVerification: () => api.post('/auth/resend-verification/'),

  changePassword: (currentPassword: string, newPassword: string, newPassword2: string) =>
    api.post('/auth/change-password/', {
      current_password: currentPassword,
      new_password: newPassword,
      new_password2: newPassword2,
    }),
};

// ─── NOTIFICATIONS ──────────────────────────────────────────────────────────

export interface NotificationData {
  id: number;
  title: string;
  message: string;
  notification_type: 'committee' | 'system';
  is_read: boolean;
  data: Record<string, unknown>;
  created_at: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export const notificationsAPI = {
  getAll: () => api.get<PaginatedResponse<NotificationData>>('/notifications/'),
  markRead: (id: number) => api.patch(`/notifications/${id}/read/`),
  deleteNotification: (id: number) => api.delete(`/notifications/${id}/`),
};

// ─── EVENTS ─────────────────────────────────────────────────────────────────

export interface EventData {
  id: number;
  title: string;
  start_time: string;
  end_time: string;
  location: string;
  is_remote: boolean;
  poster_url: string | null;
  description: string;
  registration_url: string | null;
  contact_email: string | null;
  is_published: boolean;
  status: 'upcoming' | 'ongoing' | 'completed';
  media: { poster: string | null };
  created_at: string;
  updated_at: string;
}

export interface EventRegistrationData {
  id: number;
  token: string;
  checked_in_at: string | null;
  created_at: string;
}

export const eventsAPI = {
  getEvents: (params?: Record<string, unknown>) =>
    api.get<PaginatedResponse<EventData>>('/events/', { params }),

  getEvent: (id: number | string) => api.get<EventData>(`/events/${id}/`),

  register: (id: number | string) => api.post<EventRegistrationData>(`/events/${id}/register/`),

  getMyRegistration: (id: number | string) =>
    api.get<EventRegistrationData>(`/events/${id}/my-registration/`),
};

// ─── RESOURCES ──────────────────────────────────────────────────────────────

export interface ResourceCategoryData {
  id: number;
  name: string;
  description: string;
}

export interface ResourceTagData {
  id: number;
  name: string;
}

export interface ResourceData {
  id: number;
  title: string;
  description: string;
  url: string;
  download_url: string | null;
  course_code: string | null;
  year: string | null;
  category: ResourceCategoryData | null;
  tags: ResourceTagData[];
  file_type: string;
  file_size: number | null;
  file_size_display: string;
  file_icon: string;
  download_count: number;
  status: 'pending' | 'approved' | 'rejected';
  submitted_by: { id: number; full_name: string } | null;
  created_at: string;
}

export const resourcesAPI = {
  getResources: (params?: Record<string, unknown>) =>
    api.get<PaginatedResponse<ResourceData>>('/resources/', { params }),

  getResource: (id: number | string) => api.get<ResourceData>(`/resources/${id}/`),

  getCategories: () => api.get<ResourceCategoryData[]>('/resource-categories/'),

  getTags: () => api.get<ResourceTagData[]>('/resource-tags/'),

  trackDownload: (id: number | string) => api.post(`/resources/${id}/track_download/`),

  submit: (payload: Record<string, unknown>) => api.post('/resources/submit/', payload),
};

// ─── CLOUDINARY (resource file uploads) ─────────────────────────────────────
// Mirrors the web app's signed-upload flow: the backend signs a folder +
// timestamp, and the file goes straight from the device to Cloudinary,
// bypassing our own backend entirely for the actual bytes.

export const cloudinaryAPI = {
  uploadResourceFile: async (file: { uri: string; name: string; mimeType: string }) => {
    const { data } = await api.post<{
      cloud_name: string;
      api_key: string;
      timestamp: number;
      signature: string;
      folder: string;
    }>('/cloudinary/sign-resource/');

    const formData = new FormData();
    // React Native's FormData accepts this shape (uri/name/type) for file
    // parts — it is not a real Blob/File like on web.
    formData.append('file', { uri: file.uri, name: file.name, type: file.mimeType } as any);
    formData.append('api_key', data.api_key);
    formData.append('timestamp', String(data.timestamp));
    formData.append('signature', data.signature);
    formData.append('folder', data.folder);

    const response = await fetch(`https://api.cloudinary.com/v1_1/${data.cloud_name}/auto/upload`, {
      method: 'POST',
      body: formData,
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err?.error?.message || 'Upload failed');
    }
    return response.json() as Promise<{ secure_url: string }>;
  },
};

// ─── PROJECTS ───────────────────────────────────────────────────────────────

export interface ProjectOwner {
  id: number;
  email: string;
  full_name: string;
  matric_number: string;
  is_staff: boolean;
  role: string;
}

export interface SkillTagData {
  id: number;
  name: string;
  created_at: string;
}

export interface CollaborationNeedData {
  id?: number;
  skill_type: 'frontend' | 'backend' | 'ui_ux' | 'ai_ml' | 'documentation' | 'others';
  skill_type_display?: string;
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

export interface ProjectData {
  id: number;
  owner: ProjectOwner;
  title: string;
  description: string;
  tags: SkillTagData[];
  images: string[];
  links: Record<string, string>;
  live_url: string;
  created_at: string;
  updated_at: string;
  is_featured: boolean;
  status: 'draft' | 'published';
  like_count: number;
  is_liked_by_user: boolean;
  collaboration_needs: CollaborationNeedData[];
  has_collaboration_needs: boolean;
}

export const projectsAPI = {
  getProjects: (params?: Record<string, unknown>) =>
    api.get<PaginatedResponse<ProjectData>>('/projects/', { params }),

  getProject: (id: number | string) => api.get<ProjectData>(`/projects/${id}/`),

  getMyProjects: () => api.get<PaginatedResponse<ProjectData> | ProjectData[]>('/projects/my-projects/'),

  getLiked: () => api.get<PaginatedResponse<ProjectData> | ProjectData[]>('/projects/liked/'),

  likeProject: (id: number | string) => api.post(`/projects/${id}/like/`),
  unlikeProject: (id: number | string) => api.post(`/projects/${id}/unlike/`),
};

export const collaborationAPI = {
  apply: (
    projectId: number | string,
    payload: { need_id?: number | null; phone_number: string; message: string },
  ) => api.post(`/projects/${projectId}/apply_collaborate/`, payload),

  getRequests: (projectId: number | string) =>
    api.get<PaginatedResponse<CollaborationRequestData>>(`/projects/${projectId}/collaboration_requests/`),

  acceptRequest: (projectId: number | string, requestId: number) =>
    api.patch(`/projects/${projectId}/requests/${requestId}/accept/`),

  rejectRequest: (projectId: number | string, requestId: number) =>
    api.patch(`/projects/${projectId}/requests/${requestId}/reject/`),

  getMyCollaborations: () =>
    api.get<PaginatedResponse<ProjectData> | ProjectData[]>('/projects/my-collaborations/'),
};

// ─── ASSISTANT ──────────────────────────────────────────────────────────────

export interface AssistantMessage {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export const assistantAPI = {
  sendMessage: (message: string) => api.post<AssistantMessage>('/assistant/chat/', { message }),
  getMessages: () => api.get<AssistantMessage[]>('/assistant/messages/'),
  clearConversation: () => api.post('/assistant/clear/'),
};

export default api;
export { api };
