import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom"; // Import Link for navigation
import Navbar from "../components/Navbar";
import { Footer } from "../components/Footer";
import SectionHeader from "../components/SectionHeader";
import PageHeader from "../components/PageHeader";
import { useGallery } from "../lib/hooks/useGallery";
import { GallerySkeleton } from "../components/home/Skeletons";
import { X } from "lucide-react";

interface GalleryProps {
  isHome: boolean;
}

const CATEGORIES = ["All", "Hackathons", "Workshops", "Socials", "Others"];

export default function Gallery({ isHome }: GalleryProps) {
  const [filter, setFilter] = useState("All");
  const [visibleCount, setVisibleCount] = useState(6);
  const [selectedImage, setSelectedImage] = useState<any | null>(null);

  const { data: images = [], isLoading, error, refetch } = useGallery();

  const filtered =
    filter === "All" ? images : images.filter(img => img.category === filter);

  const displayImages = isHome
    ? images.slice(0, 6)
    : filtered.slice(0, visibleCount);

  const handleFilterChange = (cat: string) => {
    setFilter(cat);
    setVisibleCount(6);
  };

  if (isLoading) return <GallerySkeleton />;

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
    );
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

        {/* FILTER */}
        {!isHome && (
          <div className="flex justify-center gap-3 mb-12 flex-wrap">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => handleFilterChange(cat)}
                className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${
                  filter === cat
                    ? "bg-[#006E3A] text-white shadow"
                    : "bg-white text-gray-600 border hover:border-[#006E3A]"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* EMPTY */}
        {displayImages.length === 0 && (
          <div className="text-center py-20 text-gray-500 font-medium">
            No images found.
          </div>
        )}

        {/* GRID */}
        <motion.div
          layout
          className="columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6"
        >
          <AnimatePresence>
            {displayImages.map(image => (
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
                  src={image.resolved_url ?? "/placeholder.jpg"}
                  alt={image.alt_text || image.caption}
                  className="w-full h-auto object-cover group-hover:scale-105 transition duration-500"
                />

                {/* SUBTLE ALWAYS TEXT */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                  <p className="text-xs text-white/70 uppercase">
                    {image.category}
                  </p>
                  <p className="text-sm font-semibold text-white line-clamp-1">
                    {image.caption}
                  </p>
                </div>

                {/* HOVER OVERLAY */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white font-semibold text-sm">
                  View Image
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        {/* LOAD MORE (only on full gallery page) */}
        {!isHome && visibleCount < filtered.length && (
          <div className="flex justify-center mt-16 mb-10">
            <button
              onClick={() => setVisibleCount(c => c + 3)}
              className="px-8 py-3 border-2 border-[#006E3A] text-[#006E3A] font-semibold rounded-xl hover:bg-[#006E3A] hover:text-white transition"
            >
              Load More
            </button>
          </div>
        )}

        {/* GRADIENT GREEN BUTTON - VIEW ALL GALLERY (only on home) */}
        {isHome && images.length > 0 && (
          <div className="flex justify-center mt-12">
            <Link
              to="/gallery" // Adjust the route if your gallery page is at a different path
              className="px-8 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-green-600 to-green-800 hover:from-green-700 hover:to-green-900 transition shadow-md"
            >
              View All Gallery
            </Link>
          </div>
        )}
      </section>

      {/* MODAL */}
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
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative">
                <img
                  src={selectedImage.resolved_url}
                  className="w-full max-h-[500px] object-cover"
                />

                <button
                  onClick={() => setSelectedImage(null)}
                  className="absolute top-3 right-3 bg-black/70 text-white p-2 rounded-full"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* DESCRIPTION */}
              <div className="p-6">
                <p className="text-xs uppercase text-gray-400 mb-2">
                  {selectedImage.category}
                </p>

                <h2 className="text-xl font-bold mb-2">
                  {selectedImage.caption}
                </h2>

                <p className="text-gray-600 text-sm">
                  {selectedImage.alt_text || "No description provided."}
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {!isHome && <Footer />}
    </>
  );
}