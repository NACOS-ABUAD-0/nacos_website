// src/admin1/pages/Approval.tsx

import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { Footer } from '../../components/Footer'
import { useAdminUsers } from '../../lib/hooks/useAdminUsers'
import type { UserRecord } from '../../services/adminUserService'

// ── Status Badge ───────────────────────────────────────────────
const StatusBadge: React.FC<{ isActive: boolean }> = ({ isActive }) => (
  <span
    className={`px-3 py-1 rounded-full text-xs font-semibold ${
      isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
    }`}
  >
    {isActive ? 'Active' : 'Banned'}
  </span>
)

// ── Three-dot Action Menu ──────────────────────────────────────
interface ActionMenuProps {
  user: UserRecord
  onView: (user: UserRecord) => void
  onBan: (user: UserRecord) => void
  onUnban: (user: UserRecord) => void
}

const ActionMenu: React.FC<ActionMenuProps> = ({ user, onView, onBan, onUnban }) => {
  const [open, setOpen] = useState<boolean>(false)

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((p) => !p)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="12" cy="5" r="1.5" />
          <circle cx="12" cy="12" r="1.5" />
          <circle cx="12" cy="19" r="1.5" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-8 z-50 w-40 bg-white border border-gray-100 rounded-xl shadow-lg overflow-hidden">
          <button
            onClick={() => { onView(user); setOpen(false) }}
            className="w-full text-left px-4 py-2.5 text-[13px] text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            View Profile
          </button>
          {user.is_active ? (
            <button
              onClick={() => { onBan(user); setOpen(false) }}
              className="w-full text-left px-4 py-2.5 text-[13px] text-red-500 hover:bg-red-50 transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
              Ban Student
            </button>
          ) : (
            <button
              onClick={() => { onUnban(user); setOpen(false) }}
              className="w-full text-left px-4 py-2.5 text-[13px] text-[#1a7a3f] hover:bg-green-50 transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Unban Student
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ── Pagination ─────────────────────────────────────────────────
interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}

const Pagination: React.FC<PaginationProps> = ({ currentPage, totalPages, onPageChange }) => {
  const getPages = (): (number | string)[] => {
    if (totalPages <= 6) return Array.from({ length: totalPages }, (_, i) => i + 1)
    if (currentPage <= 3) return [1, 2, 3, '...', totalPages - 1, totalPages]
    if (currentPage >= totalPages - 2) return [1, 2, '...', totalPages - 2, totalPages - 1, totalPages]
    return [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages]
  }

  const btnBase = 'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] border transition-colors'

  return (
    <div className="flex items-center justify-between pt-4">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={`${btnBase} ${currentPage === 1 ? 'border-gray-100 text-gray-300 cursor-not-allowed' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Previous
      </button>

      <div className="flex gap-1">
        {getPages().map((p, i) =>
          p === '...' ? (
            <span key={`dots-${i}`} className="px-2 py-1.5 text-[13px] text-gray-400">...</span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p as number)}
              className={`w-8 h-8 rounded-lg text-[13px] font-medium transition-colors ${
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
        disabled={currentPage === totalPages}
        className={`${btnBase} ${currentPage === totalPages ? 'border-gray-100 text-gray-300 cursor-not-allowed' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
      >
        Next
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  )
}

// ── Toast ──────────────────────────────────────────────────────
interface ToastProps {
  message: string
  onClose: () => void
}

const Toast: React.FC<ToastProps> = ({ message, onClose }) => {
  useState(() => { setTimeout(onClose, 3000) })
  return (
    <div className="fixed bottom-6 right-6 z-50 bg-[#1a7a3f] text-white text-sm font-medium px-5 py-3 rounded-xl shadow-lg animate-bounce-in">
      {message}
    </div>
  )
}

// ── Main Component ─────────────────────────────────────────────

const ApprovalPage: React.FC = () => {
  const navigate = useNavigate()
  const [toast, setToast] = useState<string | null>(null)

  const {
    users,
    loading,
    pagination,
    searchQuery,
    levelFilter,
    statusFilter,
    setSearchQuery,
    setLevelFilter,
    setStatusFilter,
    goToPage,
    handleBanUser,
    handleUnbanUser,
  } = useAdminUsers()

  const handleBan = async (user: UserRecord): Promise<void> => {
    const ok = await handleBanUser(user.id)
    setToast(ok ? `${user.full_name} has been banned.` : 'Failed to ban student.')
  }

  const handleUnban = async (user: UserRecord): Promise<void> => {
    const ok = await handleUnbanUser(user.id)
    setToast(ok ? `${user.full_name} has been unbanned.` : 'Failed to unban student.')
  }

  return (
    <div className="min-h-screen bg-[#f9fafb]">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 md:px-6 py-8">

        {/* Header */}
        <div className="mb-7">
          <h1 className="text-[28px] md:text-[32px] font-extrabold text-[#1a7a3f] tracking-wide mb-1">
            APPROVAL
          </h1>
          <p className="text-sm text-gray-500">Review and manage student accounts</p>
        </div>

        {/* Controls Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          {/* Tabs */}
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setStatusFilter('active')}
              className={`px-4 py-2 rounded-md text-[13px] font-semibold transition-all duration-200 ${
                statusFilter === 'active'
                  ? 'bg-[#1a7a3f] text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Active Students
            </button>
            <button
              onClick={() => setStatusFilter('banned')}
              className={`px-4 py-2 rounded-md text-[13px] font-semibold transition-all duration-200 ${
                statusFilter === 'banned'
                  ? 'bg-red-500 text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Banned Students
            </button>
          </div>

          {/* Search */}
          <div className="relative flex-1 max-w-xs md:max-w-sm">
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search"
              className="w-full pl-4 pr-10 py-2.5 border border-gray-200 rounded-lg text-[13px] text-gray-700 bg-white focus:outline-none focus:border-[#1a7a3f] transition-colors"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
              </svg>
            </span>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-3 mb-5">
          <div className="relative">
            <select
              value={levelFilter || 'all'}
              onChange={(e) => setLevelFilter(e.target.value === 'all' ? '' : e.target.value)}
              className="appearance-none pl-3 pr-8 py-2 border border-gray-200 rounded-lg text-[13px] text-gray-600 bg-white focus:outline-none focus:border-[#1a7a3f] cursor-pointer transition-colors"
            >
              <option value="all">Level</option>
              {[100, 200, 300, 400, 500].map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
            <svg className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-100 border-b border-gray-200">
                  {['Matric No', 'Full name', 'Email', 'Level', 'Date registered', 'Status', ''].map((h, i) => (
                    <th
                      key={i}
                      className="px-4 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-16 text-center text-sm text-gray-400">
                      Loading…
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-16 text-center text-sm text-gray-400">
                      No students found.
                    </td>
                  </tr>
                ) : (
                  users.map((user, i) => (
                    <tr
                      key={user.id}
                      className={`transition-colors hover:bg-green-50 ${i < users.length - 1 ? 'border-b border-gray-50' : ''}`}
                    >
                      <td className="px-4 py-4 text-[13px] text-gray-600 whitespace-nowrap">
                        {user.matric_number || '—'}
                      </td>
                      <td className="px-4 py-4 text-[13px] font-medium text-[#1a7a3f] whitespace-nowrap">
                        {user.full_name}
                      </td>
                      <td className="px-4 py-4 text-[13px] text-[#1a7a3f] whitespace-nowrap">
                        {user.email}
                      </td>
                      <td className="px-4 py-4 text-[13px] text-gray-600">
                        {user.level || '—'}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <p className="text-[13px] text-gray-700">{user.date_joined}</p>
                      </td>
                      <td className="px-4 py-4">
                        <StatusBadge isActive={user.is_active} />
                      </td>
                      <td className="px-4 py-4">
                        <ActionMenu
                          user={user}
                          onView={(u) => navigate(`/admin/approvals/${u.id}`)}
                          onBan={handleBan}
                          onUnban={handleUnban}
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        <Pagination
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          onPageChange={goToPage}
        />
      </main>

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
      <Footer />
    </div>
  )
}

export default ApprovalPage
