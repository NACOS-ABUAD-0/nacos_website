// src/admin1/pages/UserManagement.tsx

/**
 * Admin User Management Dashboard
 *
 * Main page for managing all registered users. Provides:
 * - Paginated, searchable user table
 * - Level and role filtering
 * - Secure deletion with credential verification
 * - Responsive design with loading states
 */

import React, { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { Footer } from '../../components/Footer'
import { useAdminUsers } from '../../lib/hooks/useAdminUsers'
import DeleteConfirmationModal from '../components/DeleteConfirmationModal'
import UserTableSkeleton from '../components/UserTableSkeleton'
import Toast from '../components/Toast'
import type { UserRecord } from '../../services/adminUserService'

// ─── Types ─────────────────────────────────────────────────────────────────

type RoleBadgeVariant = 'super_admin' | 'admin' | 'user'
type StatusBadgeVariant = 'active' | 'inactive' | 'verified' | 'unverified'

// ─── Sub-Components ────────────────────────────────────────────────────────

const ROLE_LABELS: Record<RoleBadgeVariant, string> = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  user: 'User',
}

const RoleBadge: React.FC<{ role: RoleBadgeVariant }> = ({ role }) => {
  const styles: Record<RoleBadgeVariant, string> = {
    super_admin: 'bg-amber-100 text-amber-700 border-amber-200',
    admin: 'bg-purple-100 text-purple-700 border-purple-200',
    user: 'bg-gray-100 text-gray-600 border-gray-200',
  }
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${styles[role]}`}>
      {ROLE_LABELS[role]}
    </span>
  )
}

const StatusBadge: React.FC<{ isActive: boolean; isVerified: boolean }> = ({
  isActive,
  isVerified
}) => {
  if (!isActive) {
    return (
      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-600 border border-red-200">
        Inactive
      </span>
    )
  }
  return isVerified ? (
    <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700 border border-green-200">
      Verified
    </span>
  ) : (
    <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700 border border-yellow-200">
      Unverified
    </span>
  )
}

// ─── Pagination Component ──────────────────────────────────────────────────

interface PaginationProps {
  currentPage: number
  totalPages: number
  hasNext: boolean
  hasPrevious: boolean
  onPageChange: (page: number) => void
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  hasNext,
  hasPrevious,
  onPageChange,
}) => {
  const getPages = (): (number | string)[] => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1)
    }
    if (currentPage <= 4) {
      return [1, 2, 3, 4, 5, '...', totalPages]
    }
    if (currentPage >= totalPages - 3) {
      return [1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages]
    }
    return [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages]
  }

  return (
    <div className="flex items-center justify-between pt-5">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={!hasPrevious}
        className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm border transition-colors disabled:opacity-40 disabled:cursor-not-allowed border-gray-200 text-gray-600 hover:bg-gray-50"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Previous
      </button>

      <div className="flex gap-1">
        {getPages().map((p, i) =>
          p === '...' ? (
            <span key={`dots-${i}`} className="px-2 py-2 text-sm text-gray-400">...</span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p as number)}
              className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                p === currentPage
                  ? 'bg-[#1a7a3f] text-white'
                  : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {p}
            </button>
          )
        )}
      </div>

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={!hasNext}
        className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm border transition-colors disabled:opacity-40 disabled:cursor-not-allowed border-gray-200 text-gray-600 hover:bg-gray-50"
      >
        Next
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  )
}

// ─── Main Page Component ───────────────────────────────────────────────────

const UserManagement: React.FC = () => {
  const navigate = useNavigate()
  const {
    users,
    loading,
    deleting,
    error,
    deleteError,
    pagination,
    searchQuery,
    levelFilter,
    roleFilter,
    setSearchQuery,
    setLevelFilter,
    setRoleFilter,
    goToPage,
    handleDeleteUser,
    clearErrors,
  } = useAdminUsers()

  const [deleteModalOpen, setDeleteModalOpen] = useState<boolean>(false)
  const [selectedUser, setSelectedUser] = useState<UserRecord | null>(null)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const handleDeleteClick = useCallback((user: UserRecord) => {
    setSelectedUser(user)
    setDeleteModalOpen(true)
    clearErrors()
  }, [clearErrors])

  const handleConfirmDelete = useCallback(async (matricNumber: string, fullName: string) => {
    if (!selectedUser) return

    const success = await handleDeleteUser(selectedUser.id, {
      matric_number: matricNumber,
      full_name: fullName,
    })

    if (success) {
      setDeleteModalOpen(false)
      setSelectedUser(null)
      setToast({ message: `User ${selectedUser.full_name} has been deleted.`, type: 'success' })
    }
    // Error is handled via deleteError state and displayed in modal
  }, [selectedUser, handleDeleteUser])

  const handleCloseModal = useCallback(() => {
    setDeleteModalOpen(false)
    setSelectedUser(null)
    clearErrors()
  }, [clearErrors])

  const handleViewProfile = useCallback((user: UserRecord) => {
    navigate(`/admin/approvals/${user.id}`)
  }, [navigate])

  return (
    <div className="min-h-screen bg-[#f9fafb]">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-[28px] md:text-[32px] font-extrabold text-[#1a7a3f] tracking-wide mb-1">
            USER MANAGEMENT
          </h1>
          <p className="text-sm text-gray-500">
            Manage all registered students and administrators
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total Users', value: pagination.count, color: 'bg-blue-50 text-blue-700' },
            { label: 'Admins', value: users.filter(u => u.role === 'admin' || u.role === 'super_admin').length, color: 'bg-purple-50 text-purple-700' },
            { label: 'Verified', value: users.filter(u => u.is_email_verified).length, color: 'bg-green-50 text-green-700' },
            { label: 'This Page', value: users.length, color: 'bg-gray-50 text-gray-700' },
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{stat.label}</p>
              <p className={`text-2xl font-bold mt-1 ${stat.color.split(' ')[1]}`}>
                {loading ? '-' : stat.value}
              </p>
            </div>
          ))}
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          {/* Search */}
          <div className="relative flex-1 max-w-md min-w-[200px]">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, matric, or email..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-700 bg-white focus:outline-none focus:border-[#1a7a3f] focus:ring-2 focus:ring-[#1a7a3f]/10 transition-all"
            />
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
          </div>

          {/* Filters */}
          <div className="flex gap-2">
            <div className="relative">
              <select
                value={levelFilter}
                onChange={(e) => setLevelFilter(e.target.value)}
                className="appearance-none pl-3 pr-8 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-600 bg-white focus:outline-none focus:border-[#1a7a3f] cursor-pointer"
              >
                <option value="">All Levels</option>
                <option value="100">100 Level</option>
                <option value="200">200 Level</option>
                <option value="300">300 Level</option>
                <option value="400">400 Level</option>
                <option value="500">500 Level</option>
              </select>
              <svg className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </div>

            <div className="relative">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="appearance-none pl-3 pr-8 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-600 bg-white focus:outline-none focus:border-[#1a7a3f] cursor-pointer"
              >
                <option value="">All Roles</option>
                <option value="user">Users Only</option>
                <option value="admin">Admins Only</option>
              </select>
              <svg className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>

        {/* Error State */}
        {error && !loading && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
            <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1">
              <p className="text-sm text-red-700 font-medium">Failed to load users</p>
              <p className="text-xs text-red-600 mt-0.5">{error}</p>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="px-3 py-1.5 bg-red-100 text-red-700 text-xs font-medium rounded-lg hover:bg-red-200 transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {/* Table */}
        {loading ? (
          <UserTableSkeleton />
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    {['Matric Number', 'Full Name', 'Email', 'Level', 'Role', 'Status', 'Actions'].map((h) => (
                      <th
                        key={h}
                        className="px-4 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-16 text-center">
                        <div className="flex flex-col items-center gap-2">
                          <svg className="w-12 h-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                          </svg>
                          <p className="text-sm text-gray-500 font-medium">No users found</p>
                          <p className="text-xs text-gray-400">Try adjusting your search or filters</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    users.map((user, i) => (
                      <tr
                        key={user.id}
                        className={`transition-colors hover:bg-green-50/50 ${i < users.length - 1 ? 'border-b border-gray-50' : ''}`}
                      >
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className="text-[13px] font-mono text-gray-600 bg-gray-50 px-2 py-1 rounded">
                            {user.matric_number || '—'}
                          </span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <p className="text-[13px] font-semibold text-gray-900">{user.full_name}</p>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <p className="text-[13px] text-gray-600">{user.email}</p>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <p className="text-[13px] text-gray-600">{user.level || '—'}</p>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <RoleBadge role={user.role as RoleBadgeVariant} />
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <StatusBadge isActive={user.is_active} isVerified={user.is_email_verified} />
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleViewProfile(user)}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-[#1a7a3f] hover:bg-green-50 transition-colors"
                              title="View Profile"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDeleteClick(user)}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                              title="Delete User"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Pagination */}
        {!loading && users.length > 0 && (
          <Pagination
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            hasNext={pagination.hasNext}
            hasPrevious={pagination.hasPrevious}
            onPageChange={goToPage}
          />
        )}
      </main>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        onClose={handleCloseModal}
        onConfirm={handleConfirmDelete}
        targetUser={selectedUser ? {
          id: selectedUser.id,
          full_name: selectedUser.full_name,
          matric_number: selectedUser.matric_number,
          email: selectedUser.email,
        } : null}
        isDeleting={deleting}
        error={deleteError}
      />

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <Footer />
    </div>
  )
}

export default UserManagement