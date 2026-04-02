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
// ENDPOINT MODULES
// Each group of related endpoints lives in its own exported object.
// Import exactly what you need:
//   import { projectsAPI } from "@/lib/api";
// ─────────────────────────────────────────────────────────────────────────────

// ── AUTH ─────────────────────────────────────────────────────────────────────
export const authAPI = {
  register: (
    email: string,
    fullName: string,
    matricNumber: string | undefined,
    password: string,
    password2: string
  ) =>
    api
      .post("/auth/register/", {
        email,
        full_name: fullName,
        matric_number: matricNumber || null,
        password,
        password2,
      })
      .catch(handleApiError),

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
};

// ── USERS (count) ────────────────────────────────────────────────────────────
export const usersAPI = {
  getCount: () => api.get("/users/count/"),
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

  toggleFeatured: (id: string | number) =>
    api.post(`/projects/${id}/toggle_featured/`),

  // ADDED: like/unlike endpoints
  likeProject: (id: string | number) => api.post(`/projects/${id}/like/`),
  unlikeProject: (id: string | number) => api.post(`/projects/${id}/unlike/`),
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

  getCount: () => api.get("/resources/count/"),   // <-- ADDED
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