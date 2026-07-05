// src/admin1/pages/StudentProfile.tsx

import React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import Navbar from '../components/Navbar'
import { Footer } from '../../components/Footer'
import { fetchUser } from '../../services/adminUserService'
import { useAdminUsers } from '../../lib/hooks/useAdminUsers'

const InfoRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="flex items-start gap-4 mb-4">
    <span className="text-[13px] text-gray-400 w-28 shrink-0">{label}</span>
    <span className="text-[13px] text-gray-800 font-medium">{value}</span>
  </div>
)

export default function StudentProfile(): React.ReactElement {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const { handleBanUser, handleUnbanUser } = useAdminUsers()

  const { data: student, isLoading, error, refetch } = useQuery({
    queryKey: ['admin-user', id],
    queryFn: () => fetchUser(Number(id)),
    enabled: !!id,
  })

  const handleBan = async (): Promise<void> => {
    if (!student) return
    const ok = await handleBanUser(student.id)
    if (ok) { toast.success(`${student.full_name} has been banned.`); refetch() }
    else toast.error('Failed to ban student.')
  }

  const handleUnban = async (): Promise<void> => {
    if (!student) return
    const ok = await handleUnbanUser(student.id)
    if (ok) { toast.success(`${student.full_name} has been unbanned.`); refetch() }
    else toast.error('Failed to unban student.')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f9fafb] flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#1a7a3f]" />
      </div>
    )
  }

  if (error || !student) {
    return (
      <div className="min-h-screen bg-[#f9fafb] flex flex-col items-center justify-center gap-4">
        <p className="text-gray-500">Student not found.</p>
        <button onClick={() => navigate('/admin/approvals')} className="text-[#1a7a3f] underline">
          Back to Approvals
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f9fafb]">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 md:px-6 py-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 hover:text-[#1a7a3f] text-[20px] font-semibold mb-6 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          {student.full_name}
        </button>

        <div className="bg-white rounded-2xl p-6 md:p-8 mb-8">
          <div className="flex flex-row items-stretch gap-8">
            <div className="flex items-center justify-center shrink-0">
              <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center border-2 border-gray-200 overflow-hidden">
                <svg className="w-10 h-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            </div>
            <div className="w-px bg-gray-200 self-stretch" />
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-x-16 pt-1">
              <div>
                <InfoRow label="Name" value={student.full_name} />
                <InfoRow label="Email" value={student.email} />
                <InfoRow label="Matric Number" value={student.matric_number || '—'} />
              </div>
              <div>
                <InfoRow label="Level" value={student.level || '—'} />
                <InfoRow label="Department" value={student.department || '—'} />
                <div className="flex items-start gap-4 mt-0 mb-4">
                  <span className="text-[13px] text-gray-400 w-28 shrink-0">Status</span>
                  <span className={`px-3 py-0.5 rounded-full text-xs font-semibold ${
                    student.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                  }`}>
                    {student.is_active ? 'Active' : 'Banned'}
                  </span>
                </div>
                <button
                  onClick={student.is_active ? handleBan : handleUnban}
                  className={`text-sm font-medium px-4 py-2 rounded-lg transition-colors ${
                    student.is_active
                      ? 'bg-red-500 hover:bg-red-600 text-white'
                      : 'bg-[#1a7a3f] hover:bg-[#155f32] text-white'
                  }`}
                >
                  {student.is_active ? 'Ban Student' : 'Unban Student'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
