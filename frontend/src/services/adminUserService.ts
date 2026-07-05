// src/services/adminUserService.ts

import { api } from '../lib/api'

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface UserListParams {
  page: number
  page_size: number
  search?: string
  level?: string
  role?: string
  is_active?: 'true' | 'false'
}

export interface UserRecord {
  id: number
  email: string
  full_name: string
  matric_number: string
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

export interface DeleteUserPayload {
  matric_number: string
  full_name: string
}

// ─── API Calls ─────────────────────────────────────────────────────────────────

/**
 * Fetches a paginated, optionally filtered list of all registered users.
 * Requires admin authentication.
 */
export async function fetchUsers(params: UserListParams): Promise<PaginatedUserResponse> {
  const response = await api.get<PaginatedUserResponse>('/admin/users/', { params })
  return response.data
}

/**
 * Deletes a user by ID. Requires exact matric_number and full_name
 * matching the target user's stored record (enforced by the backend).
 * Requires admin authentication.
 */
export async function deleteUser(userId: number, payload: DeleteUserPayload): Promise<void> {
  await api.delete(`/admin/users/${userId}/delete/`, { data: payload })
}

/**
 * Fetches a single user by ID. Requires admin authentication.
 */
export async function fetchUser(userId: number): Promise<UserRecord> {
  const response = await api.get<UserRecord>(`/admin/users/${userId}/`)
  return response.data
}

/**
 * Deactivates a user's account, blocking login. Cannot ban yourself or
 * another admin (enforced by the backend). Requires admin authentication.
 */
export async function banUser(userId: number): Promise<UserRecord> {
  const response = await api.patch<UserRecord>(`/admin/users/${userId}/ban/`)
  return response.data
}

/**
 * Reactivates a previously banned account. Requires admin authentication.
 */
export async function unbanUser(userId: number): Promise<UserRecord> {
  const response = await api.patch<UserRecord>(`/admin/users/${userId}/unban/`)
  return response.data
}