// src/services/adminUserService.ts

/**
 * Admin User Management API Service
 *
 * Handles all API interactions for the admin user dashboard.
 * All requests include JWT auth headers via the centralized Axios instance.
 */

import axios, { AxiosError } from 'axios'

// ─── Types ─────────────────────────────────────────────────────────────────

export interface UserRecord {
  id: number
  email: string
  full_name: string
  matric_number: string | null
  level: string
  department: string
  role: 'user' | 'admin'
  is_staff: boolean
  is_active: boolean
  is_email_verified: boolean
  date_joined: string
  face_login_enabled: boolean
}

export interface PaginatedUserResponse {
  results: UserRecord[]
  count: number
  total_pages: number
  current_page: number
  page_size: number
  has_next: boolean
  has_previous: boolean
}

export interface UserListParams {
  page?: number
  page_size?: number
  search?: string
  level?: string
  role?: string
}

export interface DeleteUserPayload {
  matric_number: string
  full_name: string
}

export interface ApiErrorResponse {
  error?: string
  detail?: string
  [key: string]: unknown
}

// ─── Axios Instance ──────────────────────────────────────────────────────────

/**
 * Reuse your existing Axios instance with auth interceptors.
 * Ensure this is the same instance used throughout your app.
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to attach JWT access token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token')
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor to handle 401 and token refresh
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiErrorResponse>) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && originalRequest) {
      // Token expired — attempt refresh
      try {
        const refreshToken = localStorage.getItem('refresh_token')
        if (!refreshToken) throw new Error('No refresh token')

        const refreshResponse = await axios.post(
          `${api.defaults.baseURL}/auth/token/refresh/`,
          { refresh: refreshToken }
        )

        const newAccess = refreshResponse.data.access
        localStorage.setItem('access_token', newAccess)

        // Retry original request
        originalRequest.headers.Authorization = `Bearer ${newAccess}`
        return api(originalRequest)
      } catch (refreshError) {
        // Refresh failed — clear auth and redirect
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        window.location.href = '/login'
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  }
)

// ─── Service Functions ───────────────────────────────────────────────────────

/**
 * Fetch paginated list of all users (admin only).
 */
export const fetchUsers = async (
  params: UserListParams = {}
): Promise<PaginatedUserResponse> => {
  const response = await api.get<PaginatedUserResponse>('/admin/users/', {
    params: {
      page: params.page || 1,
      page_size: params.page_size || 10,
      ...(params.search && { search: params.search }),
      ...(params.level && { level: params.level }),
      ...(params.role && { role: params.role }),
    },
  })
  return response.data
}

/**
 * Securely delete a user by ID.
 * Requires exact matric_number and full_name for confirmation.
 */
export const deleteUser = async (
  userId: number,
  payload: DeleteUserPayload
): Promise<void> => {
  await api.delete(`/admin/users/${userId}/delete/`, {
    data: payload,
  })
}

export default api