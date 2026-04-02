// src/admin1/pages/Gallery.tsx

import React, { useState, useRef} from 'react'
import type { ChangeEvent } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Navbar from '../components/Navbar'
import { Footer } from '../../components/Footer'
import { api } from '../../lib/api'
import toast from 'react-hot-toast'

// ─── Types ────────────────────────────────────────────────────────────────────
type GalleryCategory = 'Hackathons' | 'Workshops' | 'Socials' | 'Others'

interface GalleryImage {
  id: number
  caption?: string
  alt_text?: string
  category: GalleryCategory
  display_order: number
  is_published: boolean
  resolved_url?: string
  image_url_field?: string
}

interface GalleryFormData {
  caption: string
  alt_text: string
  category: GalleryCategory
  display_order: number
  is_published: boolean
  image_url_field: string
}

const CATEGORIES: GalleryCategory[] = ['Hackathons', 'Workshops', 'Socials', 'Others']

// ─── API helpers ──────────────────────────────────────────────────────────────
const fetchAllGallery = (): Promise<GalleryImage[]> =>
  api.get('/gallery/').then(r => {
    const data = r.data
    return Array.isArray(data) ? data : (data?.results ?? [])
  })

const EMPTY_FORM: GalleryFormData = {
  caption: '',
  alt_text: '',
  category: 'Others',
  display_order: 0,
  is_published: true,
  image_url_field: '',
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
        <button
          onClick={onEdit}
          className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 rounded-t-xl"
        >
          Edit
        </button>
        <button
          onClick={onDelete}
          className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50 rounded-b-xl"
        >
          Delete
        </button>
      </div>
    )}
  </div>
)

// ─── Gallery card ─────────────────────────────────────────────────────────────
interface GalleryCardProps {
  image: GalleryImage
  onEdit: (image: GalleryImage) => void
  onDelete: (id: number) => void
}

const GalleryCard: React.FC<GalleryCardProps> = ({ image, onEdit, onDelete }) => {
  const [menuOpen, setMenuOpen] = useState<boolean>(false)

  return (
    <div
      className="relative group rounded-2xl overflow-hidden shadow-sm bg-gray-100 aspect-square"
      onClick={() => menuOpen && setMenuOpen(false)}
    >
      {/* Image */}
      {image.resolved_url ? (
        <img
          src={image.resolved_url}
          alt={image.alt_text || image.caption}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-gray-300">
          <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
      )}

      {/* Hover overlay */}
      <div className="absolute inset-0 bg-[#006E3A]/75 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4 text-white">
        <span className="text-[10px] uppercase tracking-widest opacity-80 mb-1">
          {image.category}
        </span>
        <p className="font-bold text-sm line-clamp-2">{image.caption || 'No caption'}</p>
      </div>

      {/* Draft badge */}
      {!image.is_published && (
        <span className="absolute top-2 left-2 bg-yellow-100 text-yellow-700 text-[10px] font-bold px-2 py-0.5 rounded-full z-10">
          Draft
        </span>
      )}

      {/* Three-dot menu */}
      <div className="absolute top-2 right-2 z-20" onClick={e => e.stopPropagation()}>
        <DotsMenu
          open={menuOpen}
          onToggle={() => setMenuOpen(o => !o)}
          onEdit={() => { setMenuOpen(false); onEdit(image) }}
          onDelete={() => { setMenuOpen(false); onDelete(image.id) }}
        />
      </div>
    </div>
  )
}

// ─── Image upload / URL input ─────────────────────────────────────────────────
interface ImageInputProps {
  previewUrl: string | null
  onFileChange: (e: ChangeEvent<HTMLInputElement>) => void
  onUrlChange: (url: string) => void
  urlValue: string
}

const ImageInput: React.FC<ImageInputProps> = ({ previewUrl, onFileChange, onUrlChange, urlValue }) => {
  const fileRef = useRef<HTMLInputElement>(null)

  return (
    <div className="space-y-2">
      <label className="text-xs font-semibold text-gray-500 uppercase">
        Image (upload file or paste URL)
      </label>

      {/* Preview */}
      {previewUrl && (
        <div className="w-full h-40 rounded-lg overflow-hidden border border-gray-200">
          <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
        </div>
      )}

      {/* File upload */}
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        className="w-full border-2 border-dashed border-gray-300 rounded-lg p-4 text-sm text-gray-500 hover:border-[#1a7a3f] hover:text-[#1a7a3f] transition-colors text-center"
      >
        📁 Click to upload image file
      </button>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onFileChange}
      />

      {/* URL fallback */}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-px bg-gray-200" />
        <span className="text-xs text-gray-400">or</span>
        <div className="flex-1 h-px bg-gray-200" />
      </div>
      <input
        value={urlValue}
        onChange={e => onUrlChange(e.target.value)}
        placeholder="https://example.com/image.jpg"
        className="border p-2 rounded-lg text-sm w-full"
      />
    </div>
  )
}

// ─── Modal ────────────────────────────────────────────────────────────────────
interface GalleryModalProps {
  initial: GalleryImage | null
  onSave: (fd: FormData) => void
  onClose: () => void
  isSaving: boolean
}

const GalleryModal: React.FC<GalleryModalProps> = ({ initial, onSave, onClose, isSaving }) => {
  const [form, setForm] = useState<GalleryFormData>(
    initial
      ? {
          caption:         initial.caption         ?? '',
          alt_text:        initial.alt_text         ?? '',
          category:        initial.category         ?? 'Others',
          display_order:   initial.display_order    ?? 0,
          is_published:    initial.is_published     ?? true,
          image_url_field: initial.resolved_url     ?? '',
        }
      : EMPTY_FORM
  )
  const [file, setFile]           = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(initial?.resolved_url ?? null)

  const set = <K extends keyof GalleryFormData>(field: K, value: GalleryFormData[K]): void =>
    setForm(f => ({ ...f, [field]: value }))

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>): void => {
    const f = e.target.files?.[0]
    if (!f) return
    setFile(f)
    setPreviewUrl(URL.createObjectURL(f))
    set('image_url_field', '')
  }

  const handleUrlChange = (url: string): void => {
    set('image_url_field', url)
    setFile(null)
    setPreviewUrl(url || null)
  }

  const handleSubmit = (): void => {
    if (!file && !form.image_url_field && !initial?.resolved_url) {
      toast.error('Please upload an image or provide an image URL.')
      return
    }

    const fd = new FormData()
    if (file) fd.append('image', file)
    fd.append('image_url_field', form.image_url_field)
    fd.append('caption', form.caption)
    fd.append('alt_text', form.alt_text)
    fd.append('category', form.category)
    fd.append('display_order', String(form.display_order))
    fd.append('is_published', String(form.is_published))

    onSave(fd)
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="font-bold text-lg mb-5">
          {initial ? 'Edit Image' : 'Add Image'}
        </h2>

        <div className="flex flex-col gap-4">
          <ImageInput
            previewUrl={previewUrl}
            onFileChange={handleFileChange}
            onUrlChange={handleUrlChange}
            urlValue={form.image_url_field}
          />

          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase">Caption</label>
            <input
              value={form.caption}
              onChange={e => set('caption', e.target.value)}
              placeholder="Hackathon 2025 winners..."
              className="border p-2 rounded-lg text-sm w-full mt-1"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase">Alt Text</label>
            <input
              value={form.alt_text}
              onChange={e => set('alt_text', e.target.value)}
              placeholder="Describe the image for accessibility"
              className="border p-2 rounded-lg text-sm w-full mt-1"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase">Category</label>
            <select
              value={form.category}
              onChange={e => set('category', e.target.value as GalleryCategory)}
              className="border p-2 rounded-lg text-sm w-full mt-1 bg-white"
            >
              {CATEGORIES.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase">Display Order</label>
            <input
              type="number"
              min={0}
              value={form.display_order}
              onChange={e => set('display_order', Number(e.target.value))}
              className="border p-2 rounded-lg text-sm w-full mt-1"
            />
            <p className="text-[11px] text-gray-400 mt-1">Lower number = shown first</p>
          </div>

          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={form.is_published}
              onChange={e => set('is_published', e.target.checked)}
            />
            Published (visible to everyone)
          </label>
        </div>

        <div className="flex gap-2 mt-6">
          <button
            onClick={onClose}
            className="flex-1 border p-2 rounded-lg text-sm hover:bg-gray-50"
          >
            Cancel
          </button>
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
const Gallery: React.FC = () => {
  const qc = useQueryClient()
  const [modal, setModal]       = useState<'add' | GalleryImage | null>(null)
  const [filterCat, setFilterCat] = useState<string>('All')

  const { data: images = [], isLoading, error, refetch } = useQuery<GalleryImage[]>({
    queryKey: ['admin-gallery'],
    queryFn: fetchAllGallery,
  })

  const createMutation = useMutation({
    mutationFn: (fd: FormData) =>
      api.post('/gallery/', fd, { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-gallery'] })
      qc.invalidateQueries({ queryKey: ['gallery'] })
      setModal(null)
      toast.success('Image added!')
    },
    onError: () => toast.error('Failed to add image.'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, fd }: { id: number; fd: FormData }) =>
      api.patch(`/gallery/${id}/`, fd, { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-gallery'] })
      qc.invalidateQueries({ queryKey: ['gallery'] })
      setModal(null)
      toast.success('Image updated!')
    },
    onError: () => toast.error('Failed to update image.'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/gallery/${id}/`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-gallery'] })
      qc.invalidateQueries({ queryKey: ['gallery'] })
      toast.success('Image deleted.')
    },
    onError: () => toast.error('Failed to delete image.'),
  })

  const handleSave = (fd: FormData): void => {
    if (modal === 'add') {
      createMutation.mutate(fd)
    } else if (modal && typeof modal === 'object') {
      updateMutation.mutate({ id: (modal as GalleryImage).id, fd })
    }
  }

  const handleDelete = (id: number): void => {
    if (window.confirm('Delete this image? This cannot be undone.')) {
      deleteMutation.mutate(id)
    }
  }

  const isSaving = createMutation.isPending || updateMutation.isPending

  const displayed: GalleryImage[] =
    filterCat === 'All' ? images : images.filter(img => img.category === filterCat)

  const editInitial: GalleryImage | null =
    modal && modal !== 'add' ? (modal as GalleryImage) : null

  return (
    <div className="min-h-screen bg-[#f9fafb]">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-8">

        {/* Header */}
        <div className="bg-white rounded-2xl border border-gray-100 px-8 py-7 mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-[28px] font-extrabold text-[#1a7a3f] mb-1">GALLERY</h1>
            <p className="text-sm text-gray-500 max-w-md">
              Manage gallery images — changes reflect on the homepage and gallery page immediately.
            </p>
          </div>
          <button
            onClick={() => setModal('add')}
            className="flex items-center gap-2 bg-[#1a7a3f] text-white px-4 py-2 rounded-lg text-sm shrink-0 hover:bg-[#155f32]"
          >
            <span className="text-base leading-none">+</span>
            Add Image
          </button>
        </div>

        {/* Category filter */}
        <div className="flex gap-2 flex-wrap mb-6">
          {(['All', ...CATEGORIES] as string[]).map(cat => (
            <button
              key={cat}
              onClick={() => setFilterCat(cat)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                filterCat === cat
                  ? 'bg-[#1a7a3f] text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:border-[#1a7a3f]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1a7a3f]" />
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">Failed to load gallery.</p>
            <button onClick={() => refetch()} className="bg-[#1a7a3f] text-white px-6 py-2 rounded-lg">
              Try Again
            </button>
          </div>
        )}

        {/* Empty */}
        {!isLoading && !error && displayed.length === 0 && (
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-200">
            <p className="text-gray-500 mb-4">
              {filterCat === 'All' ? 'No images yet.' : `No images in "${filterCat}".`}
            </p>
            {filterCat === 'All' && (
              <button
                onClick={() => setModal('add')}
                className="bg-[#1a7a3f] text-white px-6 py-2 rounded-lg hover:bg-[#155f32]"
              >
                Add First Image
              </button>
            )}
          </div>
        )}

        {/* Grid */}
        {!isLoading && displayed.length > 0 && (
          <>
            <p className="text-sm text-gray-500 mb-4">
              {displayed.length} image{displayed.length !== 1 ? 's' : ''}
              {filterCat !== 'All' && ` in "${filterCat}"`}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {displayed.map(image => (
                <GalleryCard
                  key={image.id}
                  image={image}
                  onEdit={setModal}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          </>
        )}
      </main>

      {/* Modal */}
      {modal && (
        <GalleryModal
          initial={editInitial}
          onSave={handleSave}
          onClose={() => setModal(null)}
          isSaving={isSaving}
        />
      )}

      <Footer />
    </div>
  )
}

export default Gallery