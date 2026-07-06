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

export default api;
export { api };
