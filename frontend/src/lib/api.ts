// frontend/src/lib/api.ts
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

// Create axios instance with consistent base URL
const api = axios.create({
  baseURL: `${API_URL}/api`, // ✅ Add /api prefix here
  withCredentials: false,
});

// ✅ Add access token to requests
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

// ✅ Refresh token flow
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem("refreshToken");
        if (refreshToken) {
          const response = await axios.post(
            `${API_URL}/api/auth/token/refresh/`,
            { refresh: refreshToken },
            { withCredentials: false }
          );

          const { access, refresh } = response.data;
          localStorage.setItem("accessToken", access);
          localStorage.setItem("refreshToken", refresh);

          originalRequest.headers.Authorization = `Bearer ${access}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// ✅ Helper: unwrap validation errors
const handleApiError = (error: any) => {
  if (error.response?.data) {
    throw error.response.data;
  }
  throw { detail: "Something went wrong. Please try again." };
};

// ================== AUTH ==================
export const authAPI = {
  register: (
    email: string,
    fullName: string,
    matricNumber: string | undefined,
    password: string,
    password2: string
  ) =>
    api
      .post("/auth/register/", { // ✅ Remove /api prefix since baseURL has it
        email,
        full_name: fullName,
        matric_number: matricNumber || null,
        password,
        password2,
      })
      .catch(handleApiError),

  login: (email: string, password: string) =>
    axios
      .post(
        `${API_URL}/api/auth/login/`, // ✅ Keep full URL for direct axios call
        { email, password },
        { withCredentials: false }
      )
      .catch(handleApiError),

  logout: () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    return Promise.resolve({ detail: "Logged out" });
  },

  getProfile: () => api.get("/auth/me/").catch(handleApiError), // ✅ Remove /api prefix
  updateProfile: (data: any) => api.patch("/auth/me/", data).catch(handleApiError), // ✅ Remove /api prefix

  refreshToken: (refreshToken: string) =>
    api.post("/auth/token/refresh/", { refresh: refreshToken }), // ✅ Remove /api prefix
};

// ================== PROJECTS ==================
export const projectsAPI = {
  getProjects: (params?: any) => api.get("/projects/", { params }), // ✅ Remove /api prefix
  getProject: (id: string | number) => api.get(`/projects/${id}/`), // ✅ Remove /api prefix
  createProject: (data: any) => api.post("/projects/", data), // ✅ Remove /api prefix
  updateProject: (id: string | number, data: any) => api.patch(`/projects/${id}/`, data), // ✅ Remove /api prefix
  deleteProject: (id: string | number) => api.delete(`/projects/${id}/`), // ✅ Remove /api prefix
  getMyProjects: () => api.get("/projects/my_projects/"), // ✅ Remove /api prefix
  toggleFeatured: (id: string | number) => api.post(`/projects/${id}/toggle_featured/`), // ✅ Remove /api prefix
};

// ================== SKILLS ==================
export const skillsAPI = {
  getSkills: () => api.get("/skills/"), // ✅ Remove /api prefix
};

// ================== RESOURCES ==================
export const resourcesAPI = {
  getResources: (params?: any) => api.get("/resources/", { params }), // ✅ Remove /api prefix
  getResource: (id: string | number) => api.get(`/resources/${id}/`), // ✅ Remove /api prefix
  getResourceCategories: () => api.get("/resource-categories/"), // ✅ Remove /api prefix
  getResourceTags: () => api.get("/resource-tags/"), // ✅ Remove /api prefix
  trackDownload: (id: string | number) => api.post(`/resources/${id}/track_download/`), // ✅ Remove /api prefix
};

// ================== HOMEPAGE ==================
export const homepageAPI = {
  getStats: () => api.get("/admin/stats/"),
  getFeaturedProjects: () => api.get("/projects/?featured=true&limit=6"), // ✅ Remove /api prefix
  getUpcomingEvents: () => api.get("/events/?upcoming=true&limit=3"), // ✅ Remove /api prefix
  getExecutives: () => api.get("/executives/"),
  getLatestResources: () => api.get("/resources/?limit=6"), // ✅ Remove /api prefix
  getLatestGallery: () => api.get("/gallery/?limit=12"), // ✅ Remove /api prefix
};

export default api;
export { api };