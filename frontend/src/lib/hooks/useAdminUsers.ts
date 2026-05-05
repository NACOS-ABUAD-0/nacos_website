/**
 * Custom hook for admin user management state and operations.
 * Provides paginated data fetching, search, filtering, and deletion.
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import type { deleteUser, UserListParams, PaginatedUserResponse, UserRecord} from '../../services/adminUserService'
import type{ DeleteUserPayload } from '../../services/adminUserService'
import {fetchUsers } from '../../services/adminUserService'

interface UseAdminUsersReturn {
  users: UserRecord[]
  loading: boolean
  deleting: boolean
  error: string | null
  deleteError: string | null
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
  setSearchQuery: (q: string) => void
  setLevelFilter: (level: string) => void
  setRoleFilter: (role: string) => void
  goToPage: (page: number) => void
  refreshUsers: () => Promise<void>
  handleDeleteUser: (userId: number, payload: DeleteUserPayload) => Promise<boolean>
  clearErrors: () => void
}

export const useAdminUsers = (): UseAdminUsersReturn => {
  const [users, setUsers] = useState<UserRecord[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [deleting, setDeleting] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const [currentPage, setCurrentPage] = useState<number>(1)
  const [pageSize] = useState<number>(10)
  const [count, setCount] = useState<number>(0)
  const [totalPages, setTotalPages] = useState<number>(1)
  const [hasNext, setHasNext] = useState<boolean>(false)
  const [hasPrevious, setHasPrevious] = useState<boolean>(false)

  const [searchQuery, setSearchQuery] = useState<string>('')
  const [levelFilter, setLevelFilter] = useState<string>('')
  const [roleFilter, setRoleFilter] = useState<string>('')

  // Debounce search to avoid excessive API calls
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const loadUsers = useCallback(async (page: number = currentPage) => {
    setLoading(true)
    setError(null)

    try {
      const params: UserListParams = {
        page,
        page_size: pageSize,
        ...(searchQuery.trim() && { search: searchQuery.trim() }),
        ...(levelFilter && { level: levelFilter }),
        ...(roleFilter && { role: roleFilter }),
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
  }, [currentPage, pageSize, searchQuery, levelFilter, roleFilter])

  // Initial load and when filters change
  useEffect(() => {
    // Reset to page 1 when filters change
    setCurrentPage(1)
  }, [searchQuery, levelFilter, roleFilter])

  useEffect(() => {
    loadUsers(currentPage)
  }, [loadUsers, currentPage])

  const handleSearchChange = useCallback((q: string) => {
    setSearchQuery(q)
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }
    searchTimeoutRef.current = setTimeout(() => {
      setCurrentPage(1)
    }, 300)
  }, [])

  const handleDeleteUser = useCallback(async (
    userId: number,
    payload: DeleteUserPayload
  ): Promise<boolean> => {
    setDeleting(true)
    setDeleteError(null)

    try {
      await deleteUser(userId, payload)
      // Refresh current page after deletion
      await loadUsers(currentPage)
      return true
    } catch (err) {
      let message = 'Failed to delete user. Please try again.'
      if (err instanceof Error) {
        message = err.message
      }
      // Try to extract backend error message
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

  const goToPage = useCallback((page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
    }
  }, [totalPages])

  const clearErrors = useCallback(() => {
    setError(null)
    setDeleteError(null)
  }, [])

  return {
    users,
    loading,
    deleting,
    error,
    deleteError,
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
    setSearchQuery: handleSearchChange,
    setLevelFilter,
    setRoleFilter,
    goToPage,
    refreshUsers: () => loadUsers(currentPage),
    handleDeleteUser,
    clearErrors,
  }
}