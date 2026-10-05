// src/admin1/pages/Event.tsx

import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Navbar from '../components/Navbar'
import { Footer } from '../../components/Footer'
import { api, cloudinaryAPI } from '../../lib/api'
import { optimizeImage } from '../../lib/cloudinary'
import { formatNaira, type TicketType } from '../../lib/hooks/useEvents'
import { useAuth } from '../../context/AuthContext'
import { isExecutiveTier } from '../../lib/roles'
import toast from 'react-hot-toast'

// ─── Types ────────────────────────────────────────────────────────────────────
type EventStatus = 'upcoming' | 'ongoing' | 'completed'

interface EventMedia {
  poster?: string
}

interface EventItem {
  id: number
  title: string
  start_time: string
  end_time?: string | null
  location?: string
  is_remote: boolean
  poster_url?: string
  description?: string
  contact_email?: string
  capacity?: number | null
  ticket_types?: TicketType[]
  is_paid?: boolean
  price_from?: number
  is_published: boolean
  status?: EventStatus
  media?: EventMedia
}

// Form inputs are strings while editing; converted to numbers on save.
interface TicketTypeRow {
  id?: number
  name: string
  price: string
  capacity: string
  venue: string
}

interface EventFormData {
  title: string
  start_time: string
  end_time: string
  location: string
  is_remote: boolean
  poster_url: string
  description: string
  contact_email: string
  capacity: string
  ticket_types: TicketTypeRow[]
  is_published: boolean
}

interface EventPayload extends Omit<EventFormData, 'capacity' | 'ticket_types'> {
  capacity: number | null
  ticket_types: { id?: number; name: string; price: number; capacity: number | null; venue: string }[]
}

const MAX_POSTER_BYTES = 5 * 1024 * 1024

// DRF errors come back as { detail } or { field: [messages] }.
const apiErrorMessage = (error: unknown, fallback: string): string => {
  const data = (error as { response?: { data?: unknown } })?.response?.data
  if (data && typeof data === 'object') {
    const record = data as Record<string, unknown>
    if (typeof record.detail === 'string') return record.detail
    for (const value of Object.values(record)) {
      if (typeof value === 'string') return value
      if (Array.isArray(value) && typeof value[0] === 'string') return value[0]
      if (Array.isArray(value) && value[0] && typeof value[0] === 'object') {
        const nested = Object.values(value[0] as Record<string, unknown>)[0]
        if (Array.isArray(nested) && typeof nested[0] === 'string') return nested[0]
      }
    }
  }
  return fallback
}

// ─── API helpers ──────────────────────────────────────────────────────────────
const fetchEvents = (): Promise<EventItem[]> => api.get('/events/').then(r => {
  const data = r.data
  return Array.isArray(data) ? data : (data?.results ?? [])
})

const EMPTY_FORM: EventFormData = {
  title: '', start_time: '', end_time: '', location: '',
  is_remote: false, poster_url: '', description: '',
  contact_email: '', capacity: '', ticket_types: [], is_published: true,
}

const priceLabel = (event: EventItem): string => {
  const types = event.ticket_types ?? []
  if (!types.length || !event.is_paid) return 'Free'
  const prices = types.map(t => Number(t.price))
  return Math.min(...prices) === Math.max(...prices) ? formatNaira(prices[0]) : `From ${formatNaira(Math.min(...prices))}`
}

// ─── Three-dot menu ───────────────────────────────────────────────────────────
interface DotsMenuProps {
  open: boolean
  onToggle: () => void
  onEdit: () => void
  onDelete: () => void
  // Omitted for excos: the check-in screen is full-admin only.
  onCheckIn?: () => void
}

const DotsMenu: React.FC<DotsMenuProps> = ({ open, onToggle, onEdit, onDelete, onCheckIn }) => (
  <div className="relative">
    <button
      onClick={(e) => { e.stopPropagation(); onToggle() }}
      className="text-gray-400 hover:text-gray-600 p-1"
    >
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <circle cx="5" cy="12" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="19" cy="12" r="1.5" />
      </svg>
    </button>
    {open && (
      <div className="absolute right-0 top-7 w-36 bg-white rounded-xl shadow-lg border border-gray-100 z-50">
        {onCheckIn && (
          <button onClick={(e) => { e.stopPropagation(); onCheckIn() }} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50">Check-in</button>
        )}
        <button onClick={(e) => { e.stopPropagation(); onEdit() }}   className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50">Edit</button>
        <button onClick={(e) => { e.stopPropagation(); onDelete() }} className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50">Delete</button>
      </div>
    )}
  </div>
)

// ─── Status badge ─────────────────────────────────────────────────────────────
const StatusBadge: React.FC<{ status?: EventStatus }> = ({ status }) => {
  const map: Record<string, string> = {
    upcoming:  'bg-blue-100 text-blue-700',
    ongoing:   'bg-green-100 text-green-700',
    completed: 'bg-gray-100 text-gray-600',
  }
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${status ? (map[status] ?? 'bg-gray-100 text-gray-500') : 'bg-gray-100 text-gray-500'}`}>
      {status}
    </span>
  )
}

// ─── Event card ───────────────────────────────────────────────────────────────
interface EventCardProps {
  event: EventItem
  onEdit: (event: EventItem) => void
  onDelete: (event: EventItem) => void
  onCheckIn?: (event: EventItem) => void
}

const EventCard: React.FC<EventCardProps> = ({ event, onEdit, onDelete, onCheckIn }) => {
  const [menuOpen, setMenuOpen] = useState<boolean>(false)

  const handleCardClick = (): void => {
    if (menuOpen) setMenuOpen(false)
  }

  return (
    <div
      className="relative bg-[#eef6f3] rounded-lg flex flex-col max-w-[300px] w-full h-[420px] mb-8 mx-auto hover:shadow-md transition"
      onClick={handleCardClick}
    >
      <div className="relative overflow-hidden rounded-t-lg">
        {event.media?.poster ? (
          <img src={event.media.poster} alt={event.title} className="w-full h-48 object-cover" />
        ) : (
          <div className="w-full h-48 bg-[#dcebe5] flex items-center justify-center text-gray-400">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}

        <div className="absolute top-3 right-3 z-50" onClick={e => e.stopPropagation()}>
          <DotsMenu
            open={menuOpen}
            onToggle={() => setMenuOpen(o => !o)}
            onEdit={() => { setMenuOpen(false); onEdit(event) }}
            onDelete={() => { setMenuOpen(false); onDelete(event) }}
            onCheckIn={onCheckIn && (() => { setMenuOpen(false); onCheckIn(event) })}
          />
        </div>

        {!event.is_published && (
          <span className="absolute top-3 left-3 bg-yellow-100 text-yellow-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
            Draft
          </span>
        )}
        <span className="absolute bottom-3 left-3 bg-white/90 text-[#1a7a3f] text-[11px] font-bold px-2 py-0.5 rounded-full shadow-sm">
          {priceLabel(event)}
        </span>
      </div>

      <div className="p-4 flex flex-col flex-1">
        <div className="flex justify-between items-start mb-2 gap-2">
          <h3 className="text-[15px] font-bold text-black line-clamp-2">{event.title}</h3>
          <StatusBadge status={event.status} />
        </div>
        <p className="text-[12px] text-gray-500 mb-1">
          {new Date(event.start_time).toLocaleDateString()} &nbsp;·&nbsp;
          {new Date(event.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
        <p className="text-[12px] text-gray-500 mb-3">
          {event.is_remote ? '🌐 Remote' : `📍 ${event.location}`}
        </p>
        {!!event.ticket_types?.length && (
          <p className="text-[11px] text-gray-500 mb-2">
            {event.ticket_types.map(t => `${t.name} ${formatNaira(Number(t.price))}${t.venue ? ` @ ${t.venue}` : ''}`).join(' · ')}
          </p>
        )}
        <p className="text-[13px] text-gray-700 line-clamp-2 flex-1">{event.description}</p>
      </div>
    </div>
  )
}

// ─── Event form modal ─────────────────────────────────────────────────────────
interface EventModalProps {
  initial: EventFormData | null
  onSave: (data: EventPayload) => void
  onClose: () => void
  isSaving: boolean
}

const EventModal: React.FC<EventModalProps> = ({ initial, onSave, onClose, isSaving }) => {
  const [form, setForm] = useState<EventFormData>(initial ?? EMPTY_FORM)
  const [uploading, setUploading] = useState<boolean>(false)
  const set = <K extends keyof EventFormData>(field: K, value: EventFormData[K]): void =>
    setForm(f => ({ ...f, [field]: value }))

  // datetime-local wants local time; the API stores UTC.
  const toLocal = (iso: string): string => {
    if (!iso) return ''
    if (!iso.endsWith('Z') && !/[+-]\d\d:\d\d$/.test(iso)) return iso.slice(0, 16)
    const date = new Date(iso)
    return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
  }
  const fromLocal = (local: string): string => local ? new Date(local).toISOString() : ''

  const handlePosterChange = async (e: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) return void toast.error('Poster must be a JPG, PNG or WebP image.')
    if (file.size > MAX_POSTER_BYTES) return void toast.error('Poster must be 5 MB or smaller.')
    setUploading(true)
    try {
      const { secure_url } = await cloudinaryAPI.upload(file)
      set('poster_url', secure_url)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Poster upload failed.')
    } finally {
      setUploading(false)
    }
  }

  const setTicketType = (index: number, field: keyof TicketTypeRow, value: string): void =>
    setForm(f => ({ ...f, ticket_types: f.ticket_types.map((t, i) => (i === index ? { ...t, [field]: value } : t)) }))
  const addTicketType = (): void =>
    setForm(f => ({ ...f, ticket_types: [...f.ticket_types, { name: f.ticket_types.length ? '' : 'Regular', price: '', capacity: '', venue: '' }] }))
  const removeTicketType = (index: number): void =>
    setForm(f => ({ ...f, ticket_types: f.ticket_types.filter((_, i) => i !== index) }))

  const handleSubmit = (): void => {
    if (!form.title || !form.start_time) return void toast.error('Title and start time are required.')
    if (uploading) return void toast.error('Wait for the poster to finish uploading.')
    for (const t of form.ticket_types) {
      if (!t.name.trim()) return void toast.error('Every ticket type needs a name.')
      if (t.price.trim() === '' || Number(t.price) < 0 || Number.isNaN(Number(t.price))) {
        return void toast.error(`Enter a price for ${t.name} (0 for free).`)
      }
    }
    onSave({
      ...form,
      start_time: fromLocal(form.start_time),
      end_time: form.end_time ? fromLocal(form.end_time) : '',
      capacity: form.capacity.trim() ? Number(form.capacity) : null,
      ticket_types: form.ticket_types.map(t => ({
        ...(t.id ? { id: t.id } : {}),
        name: t.name.trim(),
        price: Number(t.price),
        capacity: t.capacity.trim() ? Number(t.capacity) : null,
        venue: t.venue.trim(),
      })),
    })
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="font-bold text-lg mb-5">{initial ? 'Edit Event' : 'Add Event'}</h2>

        <div className="flex flex-col gap-3">
          <label className="text-xs font-semibold text-gray-500 uppercase">Title *</label>
          <input value={form.title} onChange={e => set('title', e.target.value)}
            placeholder="Event title" className="border p-2 rounded-lg text-sm" />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase">Start *</label>
              <input type="datetime-local" value={toLocal(form.start_time)}
                onChange={e => set('start_time', e.target.value)}
                className="border p-2 rounded-lg text-sm w-full mt-1" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase">End</label>
              <input type="datetime-local" value={toLocal(form.end_time)}
                onChange={e => set('end_time', e.target.value)}
                className="border p-2 rounded-lg text-sm w-full mt-1" />
            </div>
          </div>

          <label className="text-xs font-semibold text-gray-500 uppercase">Location</label>
          <input value={form.location} onChange={e => set('location', e.target.value)}
            placeholder="Venue name" className="border p-2 rounded-lg text-sm"
            disabled={form.is_remote} />

          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={form.is_remote}
              onChange={e => set('is_remote', e.target.checked)} />
            Remote / Online event
          </label>

          <label className="text-xs font-semibold text-gray-500 uppercase">Poster</label>
          {form.poster_url ? (
            <div className="relative">
              <img src={optimizeImage(form.poster_url, 800)} alt="Event poster" className="w-full max-h-56 object-cover rounded-lg border" />
              <div className="absolute top-2 right-2 flex gap-2">
                <label className="bg-white/90 text-xs font-semibold px-3 py-1 rounded-lg shadow cursor-pointer hover:bg-white">
                  Change
                  <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handlePosterChange} />
                </label>
                <button type="button" onClick={() => set('poster_url', '')}
                  className="bg-white/90 text-xs font-semibold text-red-500 px-3 py-1 rounded-lg shadow hover:bg-white">
                  Remove
                </button>
              </div>
            </div>
          ) : (
            <label className={`flex flex-col items-center justify-center gap-1 border-2 border-dashed rounded-lg py-6 text-sm text-gray-500 ${uploading ? 'opacity-60' : 'cursor-pointer hover:border-[#1a7a3f] hover:text-[#1a7a3f]'}`}>
              {uploading ? 'Uploading…' : 'Upload poster from your device'}
              <span className="text-xs text-gray-400">JPG, PNG or WebP, up to 5 MB</span>
              <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
                disabled={uploading} onChange={handlePosterChange} />
            </label>
          )}

          <label className="text-xs font-semibold text-gray-500 uppercase">Description</label>
          <textarea value={form.description} onChange={e => set('description', e.target.value)}
            rows={3} placeholder="Event description..." className="border p-2 rounded-lg text-sm resize-none" />

          <div className="flex items-center justify-between mt-2">
            <label className="text-xs font-semibold text-gray-500 uppercase">Tickets</label>
            <button type="button" onClick={addTicketType} className="text-xs font-semibold text-[#1a7a3f] hover:underline">
              + Add ticket type
            </button>
          </div>
          {form.ticket_types.length === 0 ? (
            <p className="text-xs text-gray-500 -mt-1">
              Free for everyone. Add ticket types (e.g. Regular and VIP) to charge for entry through Paystack.
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              <div className="grid grid-cols-[1fr_90px_80px_24px] gap-2 text-[10px] font-semibold text-gray-400 uppercase">
                <span>Name</span><span>Price (₦)</span><span>Seats</span><span />
              </div>
              {form.ticket_types.map((t, i) => (
                <div key={t.id ?? `new-${i}`} className="flex flex-col gap-1.5 pb-2 border-b border-gray-100 last:border-0">
                  <div className="grid grid-cols-[1fr_90px_80px_24px] gap-2 items-center">
                    <input value={t.name} onChange={e => setTicketType(i, 'name', e.target.value)}
                      placeholder="e.g. VIP" className="border p-2 rounded-lg text-sm min-w-0" />
                    <input type="number" min="0" step="0.01" value={t.price} onChange={e => setTicketType(i, 'price', e.target.value)}
                      placeholder="0 = free" className="border p-2 rounded-lg text-sm min-w-0" />
                    <input type="number" min="1" value={t.capacity} onChange={e => setTicketType(i, 'capacity', e.target.value)}
                      placeholder="No limit" className="border p-2 rounded-lg text-sm min-w-0" />
                    <button type="button" onClick={() => removeTicketType(i)} aria-label={`Remove ${t.name || 'ticket type'}`}
                      className="text-gray-400 hover:text-red-500 text-lg leading-none">×</button>
                  </div>
                  <input value={t.venue} onChange={e => setTicketType(i, 'venue', e.target.value)}
                    placeholder={`Venue for ${t.name || 'this ticket'} (leave blank to use the event location)`}
                    className="border p-2 rounded-lg text-xs text-gray-700" />
                </div>
              ))}
              <p className="text-xs text-gray-500">
                A type's price can't change once someone has a ticket of that type.
              </p>
            </div>
          )}

          <label className="text-xs font-semibold text-gray-500 uppercase">Total capacity</label>
          <input type="number" min="1" value={form.capacity} onChange={e => set('capacity', e.target.value)}
            placeholder="No limit" className="border p-2 rounded-lg text-sm" />

          <label className="text-xs font-semibold text-gray-500 uppercase">Contact Email</label>
          <input type="email" value={form.contact_email} onChange={e => set('contact_email', e.target.value)}
            placeholder="nacos@abuad.edu.ng" className="border p-2 rounded-lg text-sm" />

          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={form.is_published}
              onChange={e => set('is_published', e.target.checked)} />
            Published (visible to everyone)
          </label>
        </div>

        <div className="flex gap-2 mt-5">
          <button onClick={onClose} className="flex-1 border p-2 rounded-lg text-sm hover:bg-gray-50">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSaving || uploading}
            className="flex-1 bg-[#1a7a3f] text-white p-2 rounded-lg text-sm hover:bg-[#155f32] disabled:opacity-50"
          >
            {isSaving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Delete Confirmation Modal ─────────────────────────────────────────────────
interface DeleteModalProps {
  event: EventItem | null
  onConfirm: () => void
  onCancel: () => void
  isDeleting: boolean
}

const DeleteModal: React.FC<DeleteModalProps> = ({ event, onConfirm, onCancel, isDeleting }) => (
  <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={onCancel}>
    <div className="bg-white rounded-2xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
      <h3 className="font-bold text-lg mb-2">Delete Event?</h3>
      <p className="text-gray-500 text-sm mb-5">
        Are you sure you want to delete "<span className="font-semibold text-gray-700">{event?.title}</span>"?
        This action cannot be undone.
      </p>
      <div className="flex gap-2">
        <button onClick={onCancel} className="flex-1 border p-2 rounded-lg text-sm hover:bg-gray-50">
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={isDeleting}
          className="flex-1 bg-red-500 text-white p-2 rounded-lg text-sm hover:bg-red-600 disabled:opacity-50"
        >
          {isDeleting ? 'Deleting…' : 'Delete'}
        </button>
      </div>
    </div>
  </div>
)

// ─── Main component ───────────────────────────────────────────────────────────
const Events: React.FC = () => {
  const qc = useQueryClient()
  const navigate = useNavigate()
  const { user } = useAuth()
  const isExecutive = isExecutiveTier(user?.role)
  const [modal, setModal] = useState<'add' | EventItem | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<EventItem | null>(null)

  const { data: events = [], isLoading, error, refetch } = useQuery<EventItem[]>({
    queryKey: ['admin-events'],
    queryFn: fetchEvents,
  })

  const createMutation = useMutation({
    mutationFn: (data: EventPayload) => api.post('/events/', data).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-events'] }); setModal(null); toast.success('Event created!') },
    onError:   (error) => toast.error(apiErrorMessage(error, 'Failed to create event.')),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: EventPayload }) =>
      api.patch(`/events/${id}/`, data).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-events'] }); setModal(null); toast.success('Event updated!') },
    onError:   (error) => toast.error(apiErrorMessage(error, 'Failed to update event.')),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/events/${id}/`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-events'] })
      setDeleteTarget(null)
      toast.success('Event deleted.')
    },
    onError: (error) => toast.error(apiErrorMessage(error, 'Failed to delete event.'), { duration: 6000 }),
  })

  const handleSave = (formData: EventPayload): void => {
    if (modal === 'add') {
      createMutation.mutate(formData)
    } else if (modal && typeof modal === 'object') {
      updateMutation.mutate({ id: modal.id, data: formData })
    }
  }

  const handleDeleteConfirm = (): void => {
    if (deleteTarget?.id) {
      deleteMutation.mutate(deleteTarget.id)
    }
  }

  const isSaving = createMutation.isPending || updateMutation.isPending

  const editInitial: EventFormData | null = modal && modal !== 'add'
    ? {
        title:             (modal as EventItem).title ?? '',
        start_time:        (modal as EventItem).start_time ?? '',
        end_time:          (modal as EventItem).end_time ?? '',
        location:          (modal as EventItem).location ?? '',
        is_remote:         (modal as EventItem).is_remote ?? false,
        poster_url:        (modal as EventItem).poster_url ?? '',
        description:       (modal as EventItem).description ?? '',
        contact_email:     (modal as EventItem).contact_email ?? '',
        capacity:          (modal as EventItem).capacity != null ? String((modal as EventItem).capacity) : '',
        ticket_types:      ((modal as EventItem).ticket_types ?? []).map(t => ({
          id: t.id,
          name: t.name,
          price: String(Number(t.price)),
          capacity: t.capacity != null ? String(t.capacity) : '',
          venue: t.venue ?? '',
        })),
        is_published:      (modal as EventItem).is_published ?? true,
      }
    : null

  return (
    <div className="min-h-screen bg-[#f9fafb]">
      <Navbar />

      <main className="max-w-5xl mx-auto px-4 md:px-6 py-6 md:py-8">

        {/* Header */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-xs px-8 py-7 mb-10 flex justify-between items-start">
          <div>
            <h1 className="text-[30px] font-extrabold text-[#1a7a3f] mb-2">EVENTS</h1>
            <p className="text-sm text-gray-500 max-w-md">
              Manage NACOS events — changes reflect on the homepage and events page immediately.
            </p>
          </div>
          <button
            onClick={() => setModal('add')}
            className="flex items-center gap-2 bg-[#1a7a3f] text-white px-4 py-2 rounded-lg text-sm shrink-0 hover:bg-[#155f32]"
          >
            <span className="text-base leading-none">+</span>
            Add Event
          </button>
        </div>

        {isLoading && (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1a7a3f]" />
          </div>
        )}

        {error && (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">Failed to load events.</p>
            <button onClick={() => refetch()} className="bg-[#1a7a3f] text-white px-6 py-2 rounded-lg hover:bg-[#155f32]">
              Try Again
            </button>
          </div>
        )}

        {!isLoading && !error && events.length === 0 && (
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-200">
            <p className="text-gray-500 mb-4">No events yet.</p>
            <button onClick={() => setModal('add')} className="bg-[#1a7a3f] text-white px-6 py-2 rounded-lg hover:bg-[#155f32]">
              Create First Event
            </button>
          </div>
        )}

        {!isLoading && events.length > 0 && (
          <>
            <p className="text-sm text-gray-500 mb-4">{events.length} event{events.length !== 1 ? 's' : ''}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {events.map(event => (
                <EventCard
                  key={event.id}
                  event={event}
                  onEdit={setModal}
                  onDelete={setDeleteTarget}
                  onCheckIn={isExecutive ? undefined : (e) => navigate(`/admin/events/${e.id}/checkin`)}
                />
              ))}
            </div>
          </>
        )}
      </main>

      {modal && (
        <EventModal
          initial={editInitial}
          onSave={handleSave}
          onClose={() => setModal(null)}
          isSaving={isSaving}
        />
      )}

      {deleteTarget && (
        <DeleteModal
          event={deleteTarget}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteTarget(null)}
          isDeleting={deleteMutation.isPending}
        />
      )}

      <Footer />
    </div>
  )
}

export default Events