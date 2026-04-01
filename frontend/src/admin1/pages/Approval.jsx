// src/admin1/pages/Approval.jsx

import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar.jsx'
import { Footer } from '../../components/Footer.tsx'

// ── Mock Data ──────────────────────────────────────────────────
const NAMES = [
  'Boluwatife Oluwabukola', 'Chukwuemeka Adebayo', 'Fatima Al-Hassan',
  'Oluwaseun Akinwale', 'Precious Nwosu', 'Samuel Okafor',
  'Amaka Eze', 'David Adeyemi', 'Grace Okonkwo', 'Ibrahim Musa',
  'Juliet Ogundele', 'Kelvin Nwachukwu', 'Lara Fashola',
  'Michael Afolabi', 'Ngozi Ike',
]
const LEVELS = [100, 200, 300, 400]

const generateStudents = () =>
  Array.from({ length: 45 }, (_, i) => ({
    id: i + 1,
    matricNo: `${20 + Math.floor(Math.random() * 4)}/SCI01/${String(i + 1).padStart(3, '0')}`,
    fullName: NAMES[i % NAMES.length],
    email: `${NAMES[i % NAMES.length].split(' ')[0]}Nissi@gmail.com`,
    level: LEVELS[Math.floor(Math.random() * LEVELS.length)],
    dateRegistered: new Date(2024, 0, Math.floor(Math.random() * 28) + 1),
    status: i < 35 ? 'Active' : i < 40 ? 'Pending' : 'Banned',
  }))

const ALL_STUDENTS = generateStudents()

const formatDate = (date) => {
  const d = String(date.getDate()).padStart(2, '0')
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const y = date.getFullYear()
  return { date: `${d} / ${m}/ ${y}`, time: '05.30 PM' }
}

const ITEMS_PER_PAGE = 7

// ── Status Badge ───────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const styles = {
    Active:  'bg-green-100 text-green-700',
    Pending: 'bg-yellow-100 text-yellow-700',
    Banned:  'bg-red-100 text-red-600',
  }
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${styles[status] || styles.Pending}`}>
      {status}
    </span>
  )
}

// ── Three-dot Action Menu ──────────────────────────────────────
const ActionMenu = ({ student, onAction }) => {
  const [open, setOpen] = useState(false)
  const isBanned = student.status === 'Banned'

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((p) => !p)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="12" cy="5"  r="1.5" />
          <circle cx="12" cy="12" r="1.5" />
          <circle cx="12" cy="19" r="1.5" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-8 z-50 w-40 bg-white border border-gray-100 rounded-xl shadow-lg overflow-hidden">
          <button
            onClick={() => { onAction('view', student); setOpen(false) }}
            className="w-full text-left px-4 py-2.5 text-[13px] text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            View Profile
          </button>
          {!isBanned ? (
            <button
              onClick={() => { onAction('ban', student); setOpen(false) }}
              className="w-full text-left px-4 py-2.5 text-[13px] text-red-500 hover:bg-red-50 transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
              Ban Student
            </button>
          ) : (
            <button
              onClick={() => { onAction('unban', student); setOpen(false) }}
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
const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  const getPages = () => {
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
              onClick={() => onPageChange(p)}
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
const Toast = ({ message, onClose }) => {
  useState(() => { setTimeout(onClose, 3000) })
  return (
    <div className="fixed bottom-6 right-6 z-50 bg-[#1a7a3f] text-white text-sm font-medium px-5 py-3 rounded-xl shadow-lg animate-bounce-in">
      {message}
    </div>
  )
}

// ── Main Component ─────────────────────────────────────────────
export default function ApprovalPage() {
  const navigate = useNavigate()
  const [activeTab,    setActiveTab]    = useState('approved')
  const [search,       setSearch]       = useState('')
  const [levelFilter,  setLevelFilter]  = useState('all')
  const [dateFilter,   setDateFilter]   = useState('all')
  const [currentPage,  setCurrentPage]  = useState(1)
  const [students,     setStudents]     = useState(ALL_STUDENTS)
  const [toast,        setToast]        = useState(null)

  const handleAction = (action, student) => {
    if (action === 'ban') {
      setStudents((prev) => prev.map((s) => s.id === student.id ? { ...s, status: 'Banned' } : s))
      setToast(`${student.fullName} has been banned.`)
    } else if (action === 'unban') {
      setStudents((prev) => prev.map((s) => s.id === student.id ? { ...s, status: 'Active' } : s))
      setToast(`${student.fullName} has been unbanned.`)
    } else if (action === 'view') {
      navigate(`/admin/approvals/${student.id}`, { state: { student } })
    }
  }

  const filtered = useMemo(() => {
    let list = students.filter((s) =>
      activeTab === 'approved' ? s.status !== 'Banned' : s.status === 'Banned'
    )
    if (search) {
      const q = search.toLowerCase()
      list = list.filter((s) =>
        s.fullName.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        s.matricNo.toLowerCase().includes(q)
      )
    }
    if (levelFilter !== 'all') list = list.filter((s) => String(s.level) === levelFilter)
    if (dateFilter !== 'all') {
      const now = new Date()
      list = list.filter((s) => {
        const diff = (now - s.dateRegistered) / (1000 * 60 * 60 * 24)
        if (dateFilter === '7')  return diff <= 7
        if (dateFilter === '30') return diff <= 30
        if (dateFilter === '90') return diff <= 90
        return true
      })
    }
    return list
  }, [students, activeTab, search, levelFilter, dateFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE))
  const paginated  = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)

  const handleTabChange = (tab) => { setActiveTab(tab); setCurrentPage(1) }

  return (
    <div className="min-h-screen bg-[#f9fafb]">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 md:px-6 py-8">

        {/* Header */}
        <div className="mb-7">
          <h1 className="text-[28px] md:text-[32px] font-extrabold text-[#1a7a3f] tracking-wide mb-1">
            APPROVAL
          </h1>
          <p className="text-sm text-gray-500">Review and manage student enrollments</p>
        </div>

        {/* Controls Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          {/* Tabs */}
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => handleTabChange('approved')}
              className={`px-4 py-2 rounded-md text-[13px] font-semibold transition-all duration-200 ${
                activeTab === 'approved'
                  ? 'bg-[#1a7a3f] text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Approved Students
            </button>
            <button
              onClick={() => handleTabChange('banned')}
              className={`px-4 py-2 rounded-md text-[13px] font-semibold transition-all duration-200 ${
                activeTab === 'banned'
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
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1) }}
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
              value={levelFilter}
              onChange={(e) => { setLevelFilter(e.target.value); setCurrentPage(1) }}
              className="appearance-none pl-3 pr-8 py-2 border border-gray-200 rounded-lg text-[13px] text-gray-600 bg-white focus:outline-none focus:border-[#1a7a3f] cursor-pointer transition-colors"
            >
              <option value="all">Level</option>
              {[100, 200, 300, 400, 500].map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
            <svg className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </div>

          <div className="relative">
            <select
              value={dateFilter}
              onChange={(e) => { setDateFilter(e.target.value); setCurrentPage(1) }}
              className="appearance-none pl-3 pr-8 py-2 border border-gray-200 rounded-lg text-[13px] text-gray-600 bg-white focus:outline-none focus:border-[#1a7a3f] cursor-pointer transition-colors"
            >
              <option value="all">All dates</option>
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
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
                {paginated.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-16 text-center text-sm text-gray-400">
                      No students found.
                    </td>
                  </tr>
                ) : (
                  paginated.map((student, i) => {
                    const { date, time } = formatDate(student.dateRegistered)
                    return (
                      <tr
                        key={student.id}
                        className={`transition-colors hover:bg-green-50 ${i < paginated.length - 1 ? 'border-b border-gray-50' : ''}`}
                      >
                        <td className="px-4 py-4 text-[13px] text-gray-600 whitespace-nowrap">
                          {student.matricNo}
                        </td>
                        <td className="px-4 py-4 text-[13px] font-medium text-[#1a7a3f] whitespace-nowrap">
                          {student.fullName}
                        </td>
                        <td className="px-4 py-4 text-[13px] text-[#1a7a3f] whitespace-nowrap">
                          {student.email}
                        </td>
                        <td className="px-4 py-4 text-[13px] text-gray-600">
                          {student.level}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <p className="text-[13px] text-gray-700">{date}</p>
                          <p className="text-[12px] text-gray-400 mt-0.5">{time}</p>
                        </td>
                        <td className="px-4 py-4">
                          <StatusBadge status={student.status} />
                        </td>
                        <td className="px-4 py-4">
                          <ActionMenu student={student} onAction={handleAction} />
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </main>

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
         <Footer />
    </div>

    
  )
 
}