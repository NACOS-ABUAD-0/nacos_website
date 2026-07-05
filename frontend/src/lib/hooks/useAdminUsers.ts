// src/lib/hooks/useAdminUsers.ts

/**
 * Custom hook for admin user management state and operations.
 * Provides paginated data fetching, search, filtering, and deletion.
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import type {
  PaginatedUserResponse,
  UserRecord,
  DeleteUserPayload,
  UserListParams,
} from '../../services/adminUserService'
import { fetchUsers, deleteUser, banUser, unbanUser } from '../../services/adminUserService'

// ─── Return Type ───────────────────────────────────────────────────────────────

interface UseAdminUsersReturn {
  users: UserRecord[]
  loading: boolean
  deleting: boolean
  banning: boolean
  error: string | null
  deleteError: string | null
  banError: string | null
  pagination: {
    count: number
    totalPages: number
    currentPage: number
    pageSize: number
    hasNext: boolean
    hasPrevious: boolean
  }
  searchQuery: string
  levelFilter: string
  roleFilter: string
  statusFilter: 'all' | 'active' | 'banned'
  setSearchQuery: (q: string) => void
  setLevelFilter: (level: string) => void
  setRoleFilter: (role: string) => void
  setStatusFilter: (status: 'all' | 'active' | 'banned') => void
  goToPage: (page: number) => void
  refreshUsers: () => Promise<void>
  handleDeleteUser: (userId: number, payload: DeleteUserPayload) => Promise<boolean>
  handleBanUser: (userId: number) => Promise<boolean>
  handleUnbanUser: (userId: number) => Promise<boolean>
  clearErrors: () => void
}

// ─── Hook ──────────────────────────────────────────────────────────────────────

export const useAdminUsers = (): UseAdminUsersReturn => {
  const [users, setUsers] = useState<UserRecord[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [deleting, setDeleting] = useState<boolean>(false)
  const [banning, setBanning] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [banError, setBanError] = useState<string | null>(null)

  const [currentPage, setCurrentPage] = useState<number>(1)
  const pageSize = 10
  const [count, setCount] = useState<number>(0)
  const [totalPages, setTotalPages] = useState<number>(1)
  const [hasNext, setHasNext] = useState<boolean>(false)
  const [hasPrevious, setHasPrevious] = useState<boolean>(false)

  // Displayed value updates immediately; the debounced version drives API calls.
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [debouncedSearch, setDebouncedSearch] = useState<string>('')
  const [levelFilter, setLevelFilter] = useState<string>('')
  const [roleFilter, setRoleFilter] = useState<string>('')
  // Defaults to 'all' so existing consumers (e.g. UserManagement.tsx) keep
  // seeing every user regardless of ban status unless they opt into a filter.
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'banned'>('all')

  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── loadUsers ────────────────────────────────────────────────────────────────
  // currentPage is NOT in the dependency array; it is always passed explicitly
  // as a parameter so the function stays stable across page-change transitions.

  const loadUsers = useCallback(async (page: number): Promise<void> => {
    setLoading(true)
    setError(null)

    try {
      const params: UserListParams = {
        page,
        page_size: pageSize,
        ...(debouncedSearch.trim() && { search: debouncedSearch.trim() }),
        ...(levelFilter && { level: levelFilter }),
        ...(roleFilter && { role: roleFilter }),
        ...(statusFilter !== 'all' && { is_active: statusFilter === 'active' ? 'true' : 'false' }),
      }

      const data: PaginatedUserResponse = await fetchUsers(params)

      setUsers(data.results)
      setCount(data.count)
      setTotalPages(data.total_pages)
      setCurrentPage(data.current_page)
      setHasNext(data.has_next)
      setHasPrevious(data.has_previous)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load users'
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [pageSize, debouncedSearch, levelFilter, roleFilter, statusFilter])

  // ── Reset to page 1 whenever filters/search change ───────────────────────────

  useEffect(() => {
    setCurrentPage(1)
    loadUsers(1)
  }, [debouncedSearch, levelFilter, roleFilter, statusFilter]) // eslint-disable-line react-hooks/exhaustive-deps
  // loadUsers is intentionally omitted: we only want this to fire when the
  // filter values themselves change, not every time loadUsers is recreated.

  // ── Re-fetch when page changes (triggered by goToPage) ───────────────────────

  useEffect(() => {
    loadUsers(currentPage)
  }, [currentPage]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Debounced search ─────────────────────────────────────────────────────────
  // Updates the displayed input immediately; defers the API-driving value by
  // 300 ms so we don't fire a request on every keystroke.

  const handleSearchChange = useCallback((q: string) => {
    setSearchQuery(q)

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearch(q)
    }, 300)
  }, [])

  // ── handleDeleteUser ─────────────────────────────────────────────────────────

  const handleDeleteUser = useCallback(async (
    userId: number,
    payload: DeleteUserPayload,
  ): Promise<boolean> => {
    setDeleting(true)
    setDeleteError(null)

    try {
      await deleteUser(userId, payload)
      // Refresh the current page after a successful deletion.
      await loadUsers(currentPage)
      return true
    } catch (err) {
      let message = 'Failed to delete user. Please try again.'

      if (err instanceof Error) {
        message = err.message
      }

      // Surface the backend's descriptive error message when available.
      if (typeof err === 'object' && err !== null && 'response' in err) {
        const axiosErr = err as { response?: { data?: { error?: string } } }
        if (axiosErr.response?.data?.error) {
          message = axiosErr.response.data.error
        }
      }

      setDeleteError(message)
      return false
    } finally {
      setDeleting(false)
    }
  }, [currentPage, loadUsers])

  // ── handleBanUser / handleUnbanUser ──────────────────────────────────────────

  const runBanAction = useCallback(async (
    action: (userId: number) => Promise<UserRecord>,
    userId: number,
  ): Promise<boolean> => {
    setBanning(true)
    setBanError(null)

    try {
      await action(userId)
      await loadUsers(currentPage)
      return true
    } catch (err) {
      let message = 'Action failed. Please try again.'

      if (err instanceof Error) {
        message = err.message
      }

      if (typeof err === 'object' && err !== null && 'response' in err) {
        const axiosErr = err as { response?: { data?: { error?: string } } }
        if (axiosErr.response?.data?.error) {
          message = axiosErr.response.data.error
        }
      }

      setBanError(message)
      return false
    } finally {
      setBanning(false)
    }
  }, [currentPage, loadUsers])

  const handleBanUser = useCallback(
    (userId: number) => runBanAction(banUser, userId),
    [runBanAction],
  )

  const handleUnbanUser = useCallback(
    (userId: number) => runBanAction(unbanUser, userId),
    [runBanAction],
  )

  // ── goToPage ─────────────────────────────────────────────────────────────────

  const goToPage = useCallback((page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
    }
  }, [totalPages])

  // ── clearErrors ──────────────────────────────────────────────────────────────

  const clearErrors = useCallback(() => {
    setError(null)
    setDeleteError(null)
    setBanError(null)
  }, [])

  // ── Return ────────────────────────────────────────────────────────────────────

  return {
    users,
    loading,
    deleting,
    banning,
    error,
    deleteError,
    banError,
    pagination: {
      count,
      totalPages,
      currentPage,
      pageSize,
      hasNext,
      hasPrevious,
    },
    searchQuery,
    levelFilter,
    roleFilter,
    statusFilter,
    setSearchQuery: handleSearchChange,
    setLevelFilter,
    setRoleFilter,
    setStatusFilter,
    goToPage,
    refreshUsers: () => loadUsers(currentPage),
    handleDeleteUser,
    handleBanUser,
    handleUnbanUser,
    clearErrors,
  }
}