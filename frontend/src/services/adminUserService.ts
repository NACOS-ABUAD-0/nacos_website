// src/services/adminUserService.ts

import { api } from '../lib/api'
import type { UserRole, AccountType } from '../lib/roles'

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface UserListParams {
  page: number
  page_size: number
  search?: string
  level?: string
  role?: string
  is_active?: 'true' | 'false'
  is_approved?: 'true' | 'false'
  account_type?: AccountType
}

export interface UserRecord {
  id: number
  email: string
  full_name: string
  matric_number: string
  level: string
  department: string
  role: UserRole
  account_type: AccountType
  is_approved: boolean
  is_staff: boolean
  is_active: boolean
  is_email_verified: boolean
  matric_edit_allowed: boolean
  date_joined: string
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

/**
 * Assigns a role to a user from their profile. Only Admin/Super Admin may
 * call this (enforced server-side). If the target was a pending staff
 * signup, this also approves them. Requires admin authentication.
 */
export async function assignUserRole(userId: number, role: UserRole): Promise<UserRecord> {
  const response = await api.patch<UserRecord>(`/admin/users/${userId}/role/`, { role })
  return response.data
}

/**
 * Switches matric-number editing on/off for one user. While on, the user can
 * set or change their own matric number from their profile. Super Admin only.
 */
export async function setUserMatricEdit(userId: number, allowed: boolean): Promise<UserRecord> {
  const response = await api.patch<UserRecord>(`/admin/users/${userId}/matric-edit/`, { allowed })
  return response.data
}

/** Levels that currently have matric editing open for every student. Super Admin only. */
export async function fetchMatricEditLevels(): Promise<string[]> {
  const response = await api.get<{ open_levels: string[] }>('/admin/matric-edit-levels/')
  return response.data.open_levels
}

/** Opens/closes matric editing for every student at a level. Super Admin only. */
export async function setLevelMatricEdit(level: string, open: boolean): Promise<string[]> {
  const response = await api.patch<{ open_levels: string[] }>('/admin/matric-edit-levels/', { level, open })
  return response.data.open_levels
}
