import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { Footer } from '../components/Footer'
import SectionHeader from '../components/SectionHeader'
import PageHeader from '../components/PageHeader'
import { useGallery } from '../lib/hooks/useGallery'
import { GallerySkeleton } from '../components/home/Skeletons'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'

interface GalleryProps {
  isHome: boolean
}

const CATEGORIES = ['All', 'Hackathons', 'Workshops', 'Socials', 'Others']
const PAGE_SIZE = 10

// ─── Pagination ───────────────────────────────────────────────────────────────
interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}

function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null

  const getPages = (): (number | '...')[] => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1)
    }
    const pages: (number | '...')[] = [1]
    if (currentPage > 3) pages.push('...')
    const start = Math.max(2, currentPage - 1)
    const end   = Math.min(totalPages - 1, currentPage + 1)
    for (let i = start; i <= end; i++) pages.push(i)
    if (currentPage < totalPages - 2) pages.push('...')
    pages.push(totalPages)
    return pages
  }

  return (
    <div className="flex items-center justify-center gap-1 mt-14 flex-wrap">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:border-[#006E3A] hover:text-[#006E3A] disabled:opacity-30 disabled:cursor-not-allowed transition"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      {getPages().map((page, idx) =>
        page === '...' ? (
          <span key={`ellipsis-${idx}`} className="px-2 text-gray-400 select-none">…</span>
        ) : (
          <button
            key={page}
            onClick={() => onPageChange(page as number)}
            className={`min-w-[36px] h-9 rounded-lg text-sm font-semibold transition border ${
              page === currentPage
                ? 'bg-[#006E3A] text-white border-[#006E3A]'
                : 'border-gray-200 text-gray-600 hover:border-[#006E3A] hover:text-[#006E3A]'
            }`}
          >
            {page}
          </button>
        )
      )}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:border-[#006E3A] hover:text-[#006E3A] disabled:opacity-30 disabled:cursor-not-allowed transition"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function Gallery({ isHome }: GalleryProps) {
  const [filter, setFilter]               = useState('All')
  const [currentPage, setCurrentPage]     = useState(1)
  const [selectedImage, setSelectedImage] = useState<any | null>(null)

  // Home preview: just 6 images, no pagination
  const homeParams = { page_size: 6 }

  // Full page: send page + page_size + optional category filter to backend
  const pageParams: Record<string, unknown> = {
    page:      currentPage,
    page_size: PAGE_SIZE,
    ...(filter !== 'All' && { category: filter }),
  }

  const { data, isLoading, error, refetch } = useGallery(isHome ? homeParams : pageParams)

  const images     = data?.results ?? []
  const totalCount = data?.count   ?? 0
  const totalPages = Math.ceil(totalCount / PAGE_SIZE)

  const handleFilterChange = (cat: string) => {
    setFilter(cat)
    setCurrentPage(1)
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (isLoading) return <GallerySkeleton />

  if (error) {
    return (
      <>
        {!isHome && <Navbar />}
        <div className="text-center py-20">
          <p className="text-gray-500 mb-4">Failed to load gallery.</p>
          <button
            onClick={() => refetch()}
            className="bg-[#006E3A] text-white px-6 py-2 rounded-lg hover:bg-green-800"
          >
            Try Again
          </button>
        </div>
        {!isHome && <Footer />}
      </>
    )
  }

  return (
    <>
      {!isHome && <Navbar />}

      <section className="py-10 px-6 max-w-7xl mx-auto mb-20">
        {isHome ? (
          <SectionHeader
            subtitle="Gallery"
            title="Relive the moments that define our community"
          />
        ) : (
          <PageHeader
            title="GALLERY"
            subtitle="Explore moments from events, workshops, and experiences."
          />
        )}

        {/* FILTER — full page only */}
        {!isHome && (
          <div className="flex justify-center gap-3 mb-12 flex-wrap">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => handleFilterChange(cat)}
                className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${
                  filter === cat
                    ? 'bg-[#006E3A] text-white shadow'
                    : 'bg-white text-gray-600 border hover:border-[#006E3A]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* EMPTY */}
        {images.length === 0 && (
          <div className="text-center py-20 text-gray-500 font-medium">
            No images found.
          </div>
        )}

        {/* GRID */}
        <motion.div layout className="columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6">
          <AnimatePresence mode="wait">
            {images.map(image => (
              <motion.div
                key={image.id}
                layout
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
                className="relative group cursor-pointer break-inside-avoid rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition"
                onClick={() => setSelectedImage(image)}
              >
                <img
                  src={image.resolved_url ?? '/placeholder.jpg'}
                  alt={image.alt_text || image.caption}
                  className="w-full h-auto object-cover group-hover:scale-105 transition duration-500"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                  <p className="text-xs text-white/70 uppercase">{image.category}</p>
                  <p className="text-sm font-semibold text-white line-clamp-1">{image.caption}</p>
                </div>
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white font-semibold text-sm">
                  View Image
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        {/* NUMBERED PAGINATION — full page only */}
        {!isHome && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        )}

        {/* Result count — full page only */}
        {!isHome && totalCount > 0 && (
          <p className="text-center text-xs text-gray-400 mt-4">
            Showing {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, totalCount)} of {totalCount} images
          </p>
        )}

        {/* VIEW ALL BUTTON — home only */}
        {isHome && images.length > 0 && (
          <div className="flex justify-center mt-12">
            <Link
              to="/gallery"
              className="px-8 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-green-600 to-green-800 hover:from-green-700 hover:to-green-900 transition shadow-md"
            >
              View All Gallery
            </Link>
          </div>
        )}
      </section>

      {/* LIGHTBOX MODAL */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedImage(null)}
          >
            <motion.div
              className="bg-white rounded-2xl overflow-hidden max-w-4xl w-full"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              onClick={e => e.stopPropagation()}
            >
              <div className="relative">
                <img
                  src={selectedImage.resolved_url}
                  alt={selectedImage.alt_text || selectedImage.caption}
                  className="w-full max-h-[500px] object-cover"
                />
                <button
                  onClick={() => setSelectedImage(null)}
                  className="absolute top-3 right-3 bg-black/70 text-white p-2 rounded-full"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-6">
                <p className="text-xs uppercase text-gray-400 mb-2">{selectedImage.category}</p>
                <h2 className="text-xl font-bold mb-2">{selectedImage.caption}</h2>
                <p className="text-gray-600 text-sm">
                  {selectedImage.alt_text || 'No description provided.'}
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {!isHome && <Footer />}
    </>
  )
}