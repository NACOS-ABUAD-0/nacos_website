// src/admin1/pages/Executives.tsx
import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Navbar from '../components/Navbar'
import { Footer } from '../../components/Footer'
import { api } from '../../lib/api'
import toast from 'react-hot-toast'

// ─── Types ────────────────────────────────────────────────────────────────────
interface Executive {
  id: number
  name: string
  title: string
  job_description: string
  email: string
  phone: string
  website: string
  linkedin_url: string
  photo_url: string | null
  display_order: number
  is_active: boolean
}

interface ExecutiveFormData {
  name: string
  title: string
  job_description: string
  email: string
  phone: string
  website: string
  linkedin_url: string
  display_order: number
  is_active: boolean
  photoFile: File | null
}

const fetchAllExecutives = (): Promise<Executive[]> =>
  api.get('/executives/', { params: { page_size: 200 } }).then(r => {
    const data = r.data
    return Array.isArray(data) ? data : (data?.results ?? [])
  })

const EMPTY_FORM: ExecutiveFormData = {
  name: '', title: '', job_description: '', email: '', phone: '',
  website: '', linkedin_url: '', display_order: 0, is_active: true, photoFile: null,
}

const buildFormData = (form: ExecutiveFormData): FormData => {
  const fd = new FormData()
  fd.append('name', form.name)
  fd.append('title', form.title)
  fd.append('job_description', form.job_description)
  fd.append('email', form.email)
  fd.append('phone', form.phone)
  fd.append('website', form.website)
  fd.append('linkedin_url', form.linkedin_url)
  fd.append('display_order', String(form.display_order))
  fd.append('is_active', String(form.is_active))
  if (form.photoFile) fd.append('photo', form.photoFile)
  return fd
}

// ─── Three-dot menu ───────────────────────────────────────────────────────────
interface DotsMenuProps {
  open: boolean
  onToggle: () => void
  onEdit: () => void
  onDelete: () => void
}

const DotsMenu: React.FC<DotsMenuProps> = ({ open, onToggle, onEdit, onDelete }) => (
  <div className="relative">
    <button
      onClick={onToggle}
      className="text-gray-400 hover:text-gray-600 p-1 bg-white/80 backdrop-blur-sm rounded-full"
    >
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <circle cx="5" cy="12" r="1.5" />
        <circle cx="12" cy="12" r="1.5" />
        <circle cx="19" cy="12" r="1.5" />
      </svg>
    </button>
    {open && (
      <div className="absolute right-0 top-8 w-36 bg-white rounded-xl shadow-lg border border-gray-100 z-50">
        <button onClick={onEdit} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 rounded-t-xl">
          Edit
        </button>
        <button onClick={onDelete} className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50 rounded-b-xl">
          Delete
        </button>
      </div>
    )}
  </div>
)

// ─── Executive card ───────────────────────────────────────────────────────────
interface ExecutiveCardProps {
  executive: Executive
  onEdit: (executive: Executive) => void
  onDelete: (id: number) => void
}

const ExecutiveCard: React.FC<ExecutiveCardProps> = ({ executive, onEdit, onDelete }) => {
  const [menuOpen, setMenuOpen] = useState<boolean>(false)

  return (
    <div
      className="relative bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
      onClick={() => menuOpen && setMenuOpen(false)}
    >
      <div className="relative aspect-square bg-gray-100">
        {executive.photo_url ? (
          <img src={executive.photo_url} alt={executive.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
        )}
        {!executive.is_active && (
          <span className="absolute top-2 left-2 bg-yellow-100 text-yellow-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
            Inactive
          </span>
        )}
        <div className="absolute top-2 right-2" onClick={e => e.stopPropagation()}>
          <DotsMenu
            open={menuOpen}
            onToggle={() => setMenuOpen(o => !o)}
            onEdit={() => { setMenuOpen(false); onEdit(executive) }}
            onDelete={() => { setMenuOpen(false); onDelete(executive.id) }}
          />
        </div>
      </div>
      <div className="p-4">
        <h3 className="text-[15px] font-bold text-black">{executive.name}</h3>
        <p className="text-[13px] text-[#1a7a3f] font-medium">{executive.title}</p>
      </div>
    </div>
  )
}

// ─── Modal ────────────────────────────────────────────────────────────────────
interface ExecutiveModalProps {
  initial: Executive | null
  onSave: (form: ExecutiveFormData) => void
  onClose: () => void
  isSaving: boolean
}

const ExecutiveModal: React.FC<ExecutiveModalProps> = ({ initial, onSave, onClose, isSaving }) => {
  const [form, setForm] = useState<ExecutiveFormData>(
    initial
      ? {
          name: initial.name, title: initial.title, job_description: initial.job_description,
          email: initial.email, phone: initial.phone, website: initial.website,
          linkedin_url: initial.linkedin_url, display_order: initial.display_order,
          is_active: initial.is_active, photoFile: null,
        }
      : EMPTY_FORM
  )
  const [preview, setPreview] = useState<string | null>(initial?.photo_url ?? null)

  const set = <K extends keyof ExecutiveFormData>(field: K, value: ExecutiveFormData[K]): void =>
    setForm(f => ({ ...f, [field]: value }))

  const handlePhotoChange = (file: File | null): void => {
    set('photoFile', file)
    setPreview(file ? URL.createObjectURL(file) : (initial?.photo_url ?? null))
  }

  const handleSubmit = (): void => {
    if (!form.name.trim() || !form.title.trim()) {
      toast.error('Name and title are required.')
      return
    }
    onSave(form)
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <h2 className="font-bold text-lg mb-5">{initial ? 'Edit Executive' : 'Add Executive'}</h2>

        <div className="flex flex-col gap-4">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-500 uppercase">Photo</label>
            {preview && (
              <div className="w-24 h-24 rounded-full overflow-hidden border border-gray-200">
                <img src={preview} alt="Preview" className="w-full h-full object-cover" />
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={e => handlePhotoChange(e.target.files?.[0] ?? null)}
              className="text-sm"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase">Name *</label>
            <input value={form.name} onChange={e => set('name', e.target.value)}
              placeholder="Full name" className="border p-2 rounded-lg text-sm w-full mt-1" />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase">Title *</label>
            <input value={form.title} onChange={e => set('title', e.target.value)}
              placeholder="President, Vice President, ..." className="border p-2 rounded-lg text-sm w-full mt-1" />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase">Bio</label>
            <textarea value={form.job_description} onChange={e => set('job_description', e.target.value)}
              rows={3} placeholder="Short bio..." className="border p-2 rounded-lg text-sm w-full mt-1 resize-none" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase">Email</label>
              <input type="email" value={form.email} onChange={e => set('email', e.target.value)}
                className="border p-2 rounded-lg text-sm w-full mt-1" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase">Phone</label>
              <input value={form.phone} onChange={e => set('phone', e.target.value)}
                className="border p-2 rounded-lg text-sm w-full mt-1" />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase">Website</label>
            <input value={form.website} onChange={e => set('website', e.target.value)}
              placeholder="https://..." className="border p-2 rounded-lg text-sm w-full mt-1" />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase">LinkedIn</label>
            <input value={form.linkedin_url} onChange={e => set('linkedin_url', e.target.value)}
              placeholder="https://linkedin.com/in/..." className="border p-2 rounded-lg text-sm w-full mt-1" />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase">Display Order</label>
            <input type="number" min={0} value={form.display_order}
              onChange={e => set('display_order', Number(e.target.value))}
              className="border p-2 rounded-lg text-sm w-full mt-1" />
          </div>

          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={form.is_active} onChange={e => set('is_active', e.target.checked)} />
            Active (visible to everyone)
          </label>
        </div>

        <div className="flex gap-2 mt-6">
          <button onClick={onClose} className="flex-1 border p-2 rounded-lg text-sm hover:bg-gray-50">Cancel</button>
          <button
            onClick={handleSubmit}
            disabled={isSaving}
            className="flex-1 bg-[#1a7a3f] text-white p-2 rounded-lg text-sm hover:bg-[#155f32] disabled:opacity-50"
          >
            {isSaving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
const Executives: React.FC = () => {
  const qc = useQueryClient()
  const [modal, setModal] = useState<'add' | Executive | null>(null)

  const { data: executives = [], isLoading, error, refetch } = useQuery<Executive[]>({
    queryKey: ['admin-executives'],
    queryFn: fetchAllExecutives,
  })

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['admin-executives'] })
    qc.invalidateQueries({ queryKey: ['executives'] })
  }

  const createMutation = useMutation({
    mutationFn: (form: ExecutiveFormData) =>
      api.post('/executives/', buildFormData(form), { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => r.data),
    onSuccess: () => { invalidate(); setModal(null); toast.success('Executive added!') },
    onError: (err: any) => toast.error(err?.response?.data?.detail ?? 'Failed to add executive.'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, form }: { id: number; form: ExecutiveFormData }) =>
      api.patch(`/executives/${id}/`, buildFormData(form), { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => r.data),
    onSuccess: () => { invalidate(); setModal(null); toast.success('Executive updated!') },
    onError: (err: any) => toast.error(err?.response?.data?.detail ?? 'Failed to update executive.'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/executives/${id}/`),
    onSuccess: () => { invalidate(); toast.success('Executive deleted.') },
    onError: () => toast.error('Failed to delete executive.'),
  })

  const handleSave = (form: ExecutiveFormData): void => {
    if (modal === 'add') createMutation.mutate(form)
    else if (modal && typeof modal === 'object') updateMutation.mutate({ id: modal.id, form })
  }

  const handleDelete = (id: number): void => {
    if (window.confirm('Delete this executive? This cannot be undone.')) {
      deleteMutation.mutate(id)
    }
  }

  const isSaving = createMutation.isPending || updateMutation.isPending
  const editInitial: Executive | null = modal && modal !== 'add' ? modal : null

  return (
    <div className="min-h-screen bg-[#f9fafb]">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-8">
        <div className="bg-white rounded-2xl border border-gray-100 px-8 py-7 mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-[28px] font-extrabold text-[#1a7a3f] mb-1">EXECUTIVES</h1>
            <p className="text-sm text-gray-500 max-w-md">
              Manage NACOS executives — changes reflect on the public executives page immediately.
            </p>
          </div>
          <button
            onClick={() => setModal('add')}
            className="flex items-center gap-2 bg-[#1a7a3f] text-white px-4 py-2 rounded-lg text-sm shrink-0 hover:bg-[#155f32]"
          >
            <span className="text-base leading-none">+</span>
            Add Executive
          </button>
        </div>

        {isLoading && (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1a7a3f]" />
          </div>
        )}

        {error && (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">Failed to load executives.</p>
            <button onClick={() => refetch()} className="bg-[#1a7a3f] text-white px-6 py-2 rounded-lg">Try Again</button>
          </div>
        )}

        {!isLoading && !error && executives.length === 0 && (
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-200">
            <p className="text-gray-500 mb-4">No executives yet.</p>
            <button onClick={() => setModal('add')} className="bg-[#1a7a3f] text-white px-6 py-2 rounded-lg hover:bg-[#155f32]">
              Add First Executive
            </button>
          </div>
        )}

        {!isLoading && executives.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {executives.map(executive => (
              <ExecutiveCard key={executive.id} executive={executive} onEdit={setModal} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </main>

      {modal && (
        <ExecutiveModal initial={editInitial} onSave={handleSave} onClose={() => setModal(null)} isSaving={isSaving} />
      )}

      <Footer />
    </div>
  )
}

export default Executives
