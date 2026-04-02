// src/admin1/pages/Inquiries.tsx

import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Navbar from '../components/Navbar'
import { Footer } from '../../components/Footer'
import { api } from '../../lib/api'
import toast from 'react-hot-toast'

// ── Types ──────────────────────────────────────────────────────
interface Inquiry {
  id: number
  name: string
  email: string
  organization?: string
  website_url?: string
  budget_range?: string
  package_interest?: string
  subject?: string
  message: string
  type: 'general' | 'sponsorship' | 'partnership' | 'recruitment'
  status: 'new' | 'read' | 'responded' | 'archived'
  admin_notes?: string
  created_at: string
}

const STATUS_COLORS: Record<string, string> = {
  new:       'bg-blue-100 text-blue-700',
  read:      'bg-yellow-100 text-yellow-700',
  responded: 'bg-green-100 text-green-700',
  archived:  'bg-gray-100 text-gray-500',
}

const TYPE_COLORS: Record<string, string> = {
  general:     'bg-purple-100 text-purple-700',
  sponsorship: 'bg-orange-100 text-orange-700',
  partnership: 'bg-teal-100 text-teal-700',
  recruitment: 'bg-pink-100 text-pink-700',
}

const STATUS_OPTIONS = ['new', 'read', 'responded', 'archived'] as const
const TYPE_FILTERS   = ['all', 'general', 'sponsorship', 'partnership', 'recruitment'] as const

// ── Row helper ─────────────────────────────────────────────────
interface RowProps {
  label: string
  value: React.ReactNode
}

const Row: React.FC<RowProps> = ({ label, value }) => (
  <div className="flex justify-between items-start gap-4 text-sm">
    <span className="text-gray-400 font-medium shrink-0">{label}</span>
    <span className="text-gray-800 font-medium text-right">{value}</span>
  </div>
)

// ── Detail drawer ──────────────────────────────────────────────
interface InquiryDrawerProps {
  inquiry: Inquiry
  onClose: () => void
  onStatusUpdate: (id: number, status: string, notes: string) => Promise<void>
}

const InquiryDrawer: React.FC<InquiryDrawerProps> = ({ inquiry, onClose, onStatusUpdate }) => {
  const [status, setStatus] = useState<string>(inquiry.status)
  const [notes,  setNotes]  = useState<string>(inquiry.admin_notes ?? '')
  const [saving, setSaving] = useState<boolean>(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      await onStatusUpdate(inquiry.id, status, notes)
      toast.success('Updated!')
      onClose()
    } catch {
      toast.error('Failed to update.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex justify-end" onClick={onClose}>
      <div
        className="bg-white w-full max-w-lg h-full overflow-y-auto shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <h2 className="font-bold text-gray-900 text-lg">Inquiry Detail</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 px-6 py-5 space-y-5">
          <div className="flex gap-2 flex-wrap">
            <span className={`text-xs font-bold px-3 py-1 rounded-full ${TYPE_COLORS[inquiry.type]}`}>
              {inquiry.type}
            </span>
            <span className={`text-xs font-bold px-3 py-1 rounded-full ${STATUS_COLORS[inquiry.status]}`}>
              {inquiry.status}
            </span>
          </div>

          <div className="bg-gray-50 rounded-xl p-4 space-y-2">
            <Row label="Name"  value={inquiry.name} />
            <Row label="Email" value={<a href={`mailto:${inquiry.email}`} className="text-[#006E3A] underline">{inquiry.email}</a>} />
            {inquiry.organization && <Row label="Organization" value={inquiry.organization} />}
            {inquiry.website_url  && <Row label="Website" value={<a href={inquiry.website_url} target="_blank" rel="noopener noreferrer" className="text-[#006E3A] underline truncate">{inquiry.website_url}</a>} />}
            {inquiry.budget_range && <Row label="Budget"  value={inquiry.budget_range} />}
            {inquiry.package_interest && <Row label="Package" value={inquiry.package_interest} />}
            <Row label="Received" value={new Date(inquiry.created_at).toLocaleString()} />
          </div>

          {inquiry.subject && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase mb-1">Subject</p>
              <p className="text-sm font-medium text-gray-800">{inquiry.subject}</p>
            </div>
          )}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase mb-1">Message</p>
            <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed bg-gray-50 rounded-xl p-4">
              {inquiry.message}
            </p>
          </div>

          <div className="border-t border-gray-100 pt-4 space-y-3">
            <p className="text-xs font-semibold text-gray-400 uppercase">Admin Actions</p>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full border border-gray-200 rounded-xl p-2.5 text-sm bg-white focus:outline-none focus:border-[#006E3A]"
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Internal Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Add private notes here..."
                className="w-full border border-gray-200 rounded-xl p-2.5 text-sm resize-none focus:outline-none focus:border-[#006E3A]"
              />
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
          <a
            href={`mailto:${inquiry.email}?subject=Re: ${inquiry.subject || 'Your NACOS inquiry'}`}
            className="flex-1 flex items-center justify-center gap-2 border border-[#006E3A] text-[#006E3A] font-bold py-2.5 rounded-xl hover:bg-green-50 transition-colors text-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Reply via Email
          </a>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 bg-[#006E3A] text-white font-bold py-2.5 rounded-xl hover:bg-green-800 disabled:opacity-50 transition-colors text-sm"
          >
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Inquiry row card ───────────────────────────────────────────
interface InquiryRowProps {
  inquiry: Inquiry
  onClick: () => void
  onDelete: (id: number) => void
}

const InquiryRow: React.FC<InquiryRowProps> = ({ inquiry, onClick, onDelete }) => (
  <div
    onClick={onClick}
    className="bg-white rounded-2xl border border-gray-100 p-5 hover:border-[#006E3A] hover:shadow-md transition-all cursor-pointer group"
  >
    <div className="flex items-start justify-between gap-4">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${TYPE_COLORS[inquiry.type]}`}>
            {inquiry.type}
          </span>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_COLORS[inquiry.status]}`}>
            {inquiry.status}
          </span>
          {inquiry.status === 'new' && (
            <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
          )}
        </div>
        <p className="font-bold text-gray-900 text-sm truncate">{inquiry.name}</p>
        <p className="text-xs text-gray-500 truncate">{inquiry.email}</p>
        {inquiry.organization && (
          <p className="text-xs text-gray-400 truncate">{inquiry.organization}</p>
        )}
        <p className="text-xs text-gray-600 mt-2 line-clamp-2">{inquiry.message}</p>
      </div>
      <div className="flex flex-col items-end gap-2 shrink-0">
        <span className="text-[11px] text-gray-400">
          {new Date(inquiry.created_at).toLocaleDateString()}
        </span>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(inquiry.id) }}
          className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-all p-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  </div>
)

// ── Main component ─────────────────────────────────────────────
const Inquiries: React.FC = () => {
  const qc = useQueryClient()
  const [typeFilter,   setTypeFilter]   = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selected,     setSelected]     = useState<Inquiry | null>(null)

  const params: Record<string, string> = {}
  if (typeFilter   !== 'all') params.type   = typeFilter
  if (statusFilter !== 'all') params.status = statusFilter

  const { data: inquiries = [], isLoading, error, refetch } = useQuery<Inquiry[]>({
    queryKey: ['inquiries', params],
    queryFn: () => api.get('/inquiries/', { params }).then((r) =>
      Array.isArray(r.data) ? r.data : (r.data?.results ?? [])
    ),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, status, admin_notes }: { id: number; status: string; admin_notes: string }) =>
      api.patch(`/inquiries/${id}/update_status/`, { status, admin_notes }).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['inquiries'] }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/inquiries/${id}/`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inquiries'] })
      toast.success('Inquiry deleted.')
    },
    onError: () => toast.error('Failed to delete.'),
  })

  const handleDelete = (id: number) => {
    if (window.confirm('Delete this inquiry?')) deleteMutation.mutate(id)
  }

  const handleStatusUpdate = (id: number, status: string, admin_notes: string): Promise<void> =>
    updateMutation.mutateAsync({ id, status, admin_notes })

  const newCount     = inquiries.filter((i) => i.status === 'new').length
  const sponsorCount = inquiries.filter((i) => i.type === 'sponsorship' || i.type === 'partnership').length

  return (
    <div className="min-h-screen bg-[#f9fafb]">
      <Navbar />

      <main className="max-w-5xl mx-auto px-4 md:px-6 py-6 md:py-8">

        {/* Header */}
        <div className="bg-white rounded-2xl border border-gray-100 px-8 py-7 mb-8">
          <div className="flex justify-between items-start flex-wrap gap-4">
            <div>
              <h1 className="text-[28px] font-extrabold text-[#1a7a3f] mb-1">INQUIRIES</h1>
              <p className="text-sm text-gray-500">Contact form submissions and sponsorship applications.</p>
            </div>
            <div className="flex gap-3">
              <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-2 text-center">
                <p className="text-xl font-bold text-blue-700">{newCount}</p>
                <p className="text-[11px] text-blue-500 font-medium">New</p>
              </div>
              <div className="bg-orange-50 border border-orange-100 rounded-xl px-4 py-2 text-center">
                <p className="text-xl font-bold text-orange-700">{sponsorCount}</p>
                <p className="text-[11px] text-orange-500 font-medium">Sponsorship</p>
              </div>
              <div className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-2 text-center">
                <p className="text-xl font-bold text-gray-700">{inquiries.length}</p>
                <p className="text-[11px] text-gray-500 font-medium">Total</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="flex gap-2 flex-wrap">
            <span className="text-xs font-semibold text-gray-400 self-center uppercase">Type:</span>
            {TYPE_FILTERS.map((t) => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                  typeFilter === t
                    ? 'bg-[#1a7a3f] text-white'
                    : 'bg-white border border-gray-200 text-gray-600 hover:border-[#1a7a3f]'
                }`}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
          <div className="flex gap-2 flex-wrap">
            <span className="text-xs font-semibold text-gray-400 self-center uppercase">Status:</span>
            {(['all', ...STATUS_OPTIONS] as string[]).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                  statusFilter === s
                    ? 'bg-[#1a7a3f] text-white'
                    : 'bg-white border border-gray-200 text-gray-600 hover:border-[#1a7a3f]'
                }`}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {isLoading && (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1a7a3f]" />
          </div>
        )}

        {error && (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">Failed to load inquiries.</p>
            <button onClick={() => refetch()} className="bg-[#1a7a3f] text-white px-6 py-2 rounded-lg">
              Try Again
            </button>
          </div>
        )}

        {!isLoading && !error && inquiries.length === 0 && (
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-200">
            <p className="text-2xl mb-2">📭</p>
            <p className="text-gray-500">No inquiries yet.</p>
          </div>
        )}

        {!isLoading && inquiries.length > 0 && (
          <div className="space-y-3">
            {inquiries.map((inquiry) => (
              <InquiryRow
                key={inquiry.id}
                inquiry={inquiry}
                onClick={() => setSelected(inquiry)}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </main>

      {selected && (
        <InquiryDrawer
          inquiry={selected}
          onClose={() => setSelected(null)}
          onStatusUpdate={handleStatusUpdate}
        />
      )}

      <Footer />
    </div>
  )
}

export default Inquiries