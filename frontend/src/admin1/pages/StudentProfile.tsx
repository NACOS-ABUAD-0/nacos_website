// src/admin1/pages/StudentProfile.tsx

import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import Navbar from '../components/Navbar'
import { Footer } from '../../components/Footer'
import { fetchUser, setUserMatricEdit } from '../../services/adminUserService'
import { useAdminUsers } from '../../lib/hooks/useAdminUsers'
import { useProjects } from '../../lib/hooks/useProjects'
import { useAuth } from '../../context/AuthContext'
import { ROLE_OPTION_GROUPS, ROLE_LABELS, canAssignRoles, roleBadgeClass, type UserRole } from '../../lib/roles'

const InfoRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="flex items-start gap-4 mb-4">
    <span className="text-[13px] text-gray-400 w-28 shrink-0">{label}</span>
    <span className="text-[13px] text-gray-800 font-medium">{value}</span>
  </div>
)

export default function StudentProfile(): React.ReactElement {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const { user: viewer } = useAuth()
  const { handleBanUser, handleUnbanUser, handleAssignRole, assigningRole } = useAdminUsers()

  const { data: student, isLoading, error, refetch } = useQuery({
    queryKey: ['admin-user', id],
    queryFn: () => fetchUser(Number(id)),
    enabled: !!id,
  })

  const { data: projects = [], isLoading: projectsLoading } = useProjects({ owner: id })

  const [selectedRole, setSelectedRole] = useState<UserRole | ''>('')
  useEffect(() => {
    setSelectedRole(student?.role ?? '')
  }, [student?.role])

  const [togglingMatric, setTogglingMatric] = useState(false)
  const viewerIsSuperAdmin = viewer?.role === 'super_admin'

  const handleToggleMatricEdit = async (): Promise<void> => {
    if (!student) return
    const next = !student.matric_edit_allowed
    setTogglingMatric(true)
    try {
      await setUserMatricEdit(student.id, next)
      toast.success(
        next
          ? `${student.full_name} can now enter/change their matric number.`
          : `Matric editing turned off for ${student.full_name}.`
      )
      refetch()
    } catch {
      toast.error('Failed to update matric editing.')
    } finally {
      setTogglingMatric(false)
    }
  }

  const isPendingStaff = student?.account_type === 'staff' && student?.is_approved === false
  const viewerCanAssign =
    canAssignRoles(viewer?.role) &&
    !!student &&
    student.role !== 'super_admin' &&
    student.id !== viewer?.id

  const handleSaveRole = async (): Promise<void> => {
    if (!student || !selectedRole || selectedRole === student.role) return
    const updated = await handleAssignRole(student.id, selectedRole)
    if (updated) {
      toast.success(
        isPendingStaff
          ? `${student.full_name} approved as ${ROLE_LABELS[selectedRole]}.`
          : `${student.full_name}'s role updated to ${ROLE_LABELS[selectedRole]}.`
      )
      refetch()
    } else {
      toast.error('Failed to update role.')
    }
  }

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

        {isPendingStaff && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl px-6 py-4 mb-6 flex items-center gap-3">
            <svg className="w-5 h-5 text-amber-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-sm font-semibold text-amber-800">Pending Staff Approval</p>
              <p className="text-xs text-amber-700">
                This staff account can log in but has no role yet. Assign a role below to approve it.
              </p>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl p-6 md:p-8 mb-8">
          <div className="flex flex-col sm:flex-row items-center sm:items-stretch gap-5 sm:gap-8">
            <div className="flex items-center justify-center shrink-0">
              <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center border-2 border-gray-200 overflow-hidden">
                <svg className="w-10 h-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            </div>
            <div className="hidden sm:block w-px bg-gray-200 self-stretch" />
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-x-16 pt-1">
              <div>
                <InfoRow label="Name" value={student.full_name} />
                <InfoRow label="Email" value={student.email} />
                <InfoRow label="Matric Number" value={student.matric_number || '—'} />
                <div className="flex items-start gap-4 mb-4">
                  <span className="text-[13px] text-gray-400 w-28 shrink-0">Role</span>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${roleBadgeClass(student.role)}`}>
                    {ROLE_LABELS[student.role] ?? student.role}
                  </span>
                </div>
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

        {viewerIsSuperAdmin && student.account_type === 'student' && (
          <div className="bg-white rounded-2xl p-6 md:p-8 mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-[15px] font-semibold text-gray-900 mb-1">Matric Number Editing</h2>
                <p className="text-[13px] text-gray-500">
                  {student.matric_edit_allowed
                    ? `${student.full_name} can currently set or change their matric number from their profile. Turn this off once they're done.`
                    : `Turn on to let ${student.full_name} set or change their matric number from their profile.`}
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={student.matric_edit_allowed}
                aria-label="Allow matric number editing"
                onClick={handleToggleMatricEdit}
                disabled={togglingMatric}
                className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors disabled:opacity-50 ${
                  student.matric_edit_allowed ? 'bg-[#1a7a3f]' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                    student.matric_edit_allowed ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        )}

        {viewerCanAssign && (
          <div className="bg-white rounded-2xl p-6 md:p-8 mb-8">
            <h2 className="text-[15px] font-semibold text-gray-900 mb-1">Assign Role</h2>
            <p className="text-[13px] text-gray-500 mb-4">
              {isPendingStaff
                ? 'Choose a role to approve this staff account and grant access.'
                : `Change ${student.full_name}'s role. This takes effect immediately.`}
            </p>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value as UserRole)}
                className="flex-1 border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-700 bg-white focus:outline-none focus:border-[#1a7a3f]"
              >
                {ROLE_OPTION_GROUPS.map((group) => (
                  <optgroup key={group.label} label={group.label}>
                    {group.roles.map((role) => (
                      <option key={role} value={role}>{ROLE_LABELS[role]}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
              <button
                onClick={handleSaveRole}
                disabled={assigningRole || !selectedRole || selectedRole === student.role}
                className="bg-[#1a7a3f] hover:bg-[#155f32] disabled:opacity-50 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors whitespace-nowrap"
              >
                {assigningRole ? 'Saving…' : isPendingStaff ? 'Approve' : 'Save Role'}
              </button>
            </div>
          </div>
        )}

        <h2 className="text-[18px] font-semibold text-gray-900 mb-4">Projects Submitted</h2>
        {projectsLoading ? (
          <div className="flex justify-center py-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1a7a3f]" />
          </div>
        ) : projects.length === 0 ? (
          <p className="text-gray-500 bg-white rounded-2xl p-6 text-center">No projects submitted yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {projects.map((project) => (
              <div key={project.id} className="bg-white rounded-2xl border border-gray-100 p-5">
                <h3 className="text-[15px] font-bold text-gray-900 mb-1">{project.title}</h3>
                <p className="text-[13px] text-gray-500 line-clamp-3 mb-3">{project.description}</p>
                {project.tags && project.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {project.tags.map((tag) => (
                      <span key={tag.id} className="text-[11px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                        {tag.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  )
}
