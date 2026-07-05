// src/admin1/pages/ManageAdmins.tsx
import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Navbar from '../components/Navbar'
import { Footer } from '../../components/Footer'
import { api } from '../../lib/api'
import toast from 'react-hot-toast'

interface AdminRecord {
  id: number
  email: string
  full_name: string
  matric_number: string | null
  is_staff: boolean
  role: 'user' | 'admin' | 'super_admin'
}

interface AdminListResponse {
  admins: AdminRecord[]
  count: number
  max: number
  slots_remaining: number
}

const ROLE_LABELS: Record<string, string> = {
  super_admin: 'Super Admin',
  admin: 'Admin',
}

const fetchAdminList = (): Promise<AdminListResponse> =>
  api.get('/admin/roles/').then(r => r.data)

const ManageAdmins: React.FC = () => {
  const qc = useQueryClient()
  const [matricNumber, setMatricNumber] = useState('')
  const [fullName, setFullName] = useState('')

  const { data, isLoading, error, refetch } = useQuery<AdminListResponse>({
    queryKey: ['admin-roles-list'],
    queryFn: fetchAdminList,
  })

  const promoteMutation = useMutation({
    mutationFn: () => api.post('/admin/roles/assign/', { matric_number: matricNumber, full_name: fullName }),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['admin-roles-list'] })
      setMatricNumber('')
      setFullName('')
      toast.success(res.data?.message ?? 'Promoted to admin!')
    },
    onError: (err: any) => {
      const data = err?.response?.data
      toast.error(data?.error ?? Object.values(data ?? {})[0]?.toString() ?? 'Failed to promote user.')
    },
  })

  const revokeMutation = useMutation({
    mutationFn: (matric: string) => api.delete('/admin/roles/revoke/', { data: { matric_number: matric } }),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['admin-roles-list'] })
      toast.success(res.data?.message ?? 'Admin access revoked.')
    },
    onError: (err: any) => toast.error(err?.response?.data?.error ?? 'Failed to revoke admin.'),
  })

  const handlePromote = (): void => {
    if (!matricNumber.trim() || !fullName.trim()) {
      toast.error('Matric number and full name are both required.')
      return
    }
    promoteMutation.mutate()
  }

  const handleRevoke = (admin: AdminRecord): void => {
    if (!admin.matric_number) return
    if (window.confirm(`Revoke admin access from ${admin.full_name}?`)) {
      revokeMutation.mutate(admin.matric_number)
    }
  }

  return (
    <div className="min-h-screen bg-[#f9fafb]">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 md:px-6 py-6 md:py-8">
        <div className="bg-white rounded-2xl border border-gray-100 px-8 py-7 mb-6">
          <h1 className="text-[28px] font-extrabold text-[#1a7a3f] mb-1">MANAGE ADMINS</h1>
          <p className="text-sm text-gray-500">
            Promote a student to admin, or revoke an existing admin's access. Only the super admin can do this.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 px-6 py-5 mb-6">
          <h2 className="text-sm font-semibold text-gray-700 uppercase mb-4">Promote to Admin</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
            <input
              value={matricNumber}
              onChange={e => setMatricNumber(e.target.value)}
              placeholder="Matric number (e.g. 23/SCI01/002)"
              className="border p-2 rounded-lg text-sm"
            />
            <input
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              placeholder="Full name (must match records)"
              className="border p-2 rounded-lg text-sm"
            />
          </div>
          <button
            onClick={handlePromote}
            disabled={promoteMutation.isPending}
            className="bg-[#1a7a3f] text-white text-sm px-5 py-2 rounded-lg hover:bg-[#155f32] disabled:opacity-50"
          >
            {promoteMutation.isPending ? 'Promoting…' : 'Promote'}
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 px-6 py-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-700 uppercase">Current Admins</h2>
            {data && (
              <span className="text-xs text-gray-400">{data.count} / {data.max} admin slots used</span>
            )}
          </div>

          {isLoading ? (
            <div className="flex justify-center py-10">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1a7a3f]" />
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-3">Failed to load admins.</p>
              <button onClick={() => refetch()} className="bg-[#1a7a3f] text-white px-5 py-2 rounded-lg text-sm">
                Try Again
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {data?.admins.map(admin => (
                <div key={admin.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{admin.full_name}</p>
                    <p className="text-xs text-gray-500">{admin.email} · {admin.matric_number ?? '—'}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                      admin.role === 'super_admin' ? 'bg-amber-100 text-amber-700' : 'bg-purple-100 text-purple-700'
                    }`}>
                      {ROLE_LABELS[admin.role] ?? admin.role}
                    </span>
                    {admin.role === 'admin' && (
                      <button
                        onClick={() => handleRevoke(admin)}
                        disabled={revokeMutation.isPending}
                        className="text-xs font-medium text-red-500 hover:text-red-600 disabled:opacity-50"
                      >
                        Revoke
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}

export default ManageAdmins
