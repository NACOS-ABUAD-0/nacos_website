import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "../components/Navbar";
import { Footer } from "../components/Footer";
import SectionHeader from "../components/SectionHeader";
import PageHeader from "../components/PageHeader";
import { useLatestGallery } from "../lib/hooks/useHomepage";
import { GallerySkeleton } from "../components/home/Skeletons";

interface galleryProps {
  isHome: boolean;
}

const galleryImages = [
  {
    id: 1,
    src: "/events/dev.jpeg",
    category: "Hackathons",
    title: "Hackathon 2025",
    size: "large",
  },
  {
    id: 2,
    src: "/events/dev.jpeg",
    category: "Workshops",
    title: "React Masterclass",
    size: "small",
  },
  {
    id: 3,
    src: "/events/dev.jpeg",
    category: "Socials",
    title: "Tech Mixer",
    size: "small",
  },
  {
    id: 4,
    src: "/events/dev.jpeg",
    category: "Hackathons",
    title: "AI Summit",
    size: "medium",
  },
  {
    id: 5,
    src: "/events/dev.jpeg",
    category: "Workshops",
    title: "Cloud Computing",
    size: "medium",
  },
  {
    id: 6,
    src: "/events/dev.jpeg",
    category: "Socials",
    title: "Dinner Night",
    size: "small",
  },
  {
    id: 7,
    src: "/events/dev.jpeg",
    category: "Socials",
    title: "Dinner Night",
    size: "small",
  },
  {
    id: 8,
    src: "/events/dev.jpeg",
    category: "Socials",
    title: "Dinner Night",
    size: "small",
  },
  {
    id: 9,
    src: "/events/dev.jpeg",
    category: "Socials",
    title: "Dinner Night",
    size: "small",
  },
];

export default function Gallery({ isHome }: galleryProps) {
  const {
    data: gallery,
    isLoading: galleryLoading,
    error: galleryError,
    refetch: refetchGallery,
  } = useLatestGallery();
  const [filter, setFilter] = useState("All");
  // Control how many images are visible (start with 6)
  const [visibleCount, setVisibleCount] = useState(6);

  const categories = ["All", "Hackathons", "Workshops", "Socials"];

  // 1. Filter the data first
  const filteredImages =
    filter === "All"
      ? galleryImages
      : galleryImages.filter((img) => img.category === filter);

  // 2. Slice the data for pagination
  const displayImages = filteredImages.slice(0, visibleCount);

  // 3. Handler for "Load More"
  const handleLoadMore = () => {
    setVisibleCount((prev) => prev + 3); // Load 3 more at a time
  };

  // Reset count when filter changes to keep things clean
  const handleFilterChange = (cat: string) => {
    setFilter(cat);
    setVisibleCount(6);
  };

  if (galleryLoading) return <GallerySkeleton />;
  return (
    <>
      {!isHome ? <Navbar /> : null}
      <section className="py-5 px-6 max-w-7xl mx-auto mb-14">
        {isHome ? (
          <SectionHeader
            subtitle="Gallery"
            title="Relive the moments that define our community"
          />
        ) : (
          <PageHeader
            title="GALLERY"
            subtitle="Explore our collection of videos and pictures from NACOS events, workshops, and seminars."
          />
        )}
        {/* ... Header and Filter Tabs stay the same, just update onClick to handleFilterChange ... */}
        \
        {!isHome ? (
          <div className="flex justify-center gap-3 mb-12 flex-wrap">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => handleFilterChange(cat)}
                className={`px-6 py-2 rounded-full text-sm font-bold transition-all cursor-pointer ${
                  filter === cat
                    ? "bg-[#006E3A] text-white"
                    : "bg-white text-gray-600 border border-gray-200"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        ) : null}
        {/* Grid Layout */}
        <motion.div
          layout
          className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4"
        >
          <AnimatePresence>
            {displayImages.map((image) => (
              <motion.div
                key={image.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="relative group overflow-hidden rounded-2xl break-inside-avoid shadow-sm"
              >
                <img
                  src={image.src}
                  alt={image.title}
                  className="w-full h-auto transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-[#006E3A]/80 opacity-0 group-hover:opacity-100 transition-opacity p-6 flex flex-col justify-end text-white">
                  <p className="text-[10px] uppercase tracking-tighter mb-1 opacity-80">
                    {image.category}
                  </p>
                  <h3 className="font-bold text-lg leading-tight">
                    {image.title}
                  </h3>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
        {/* --- LOAD MORE BUTTON --- */}
        {visibleCount < filteredImages.length && !isHome && (
          <div className="w-full flex justify-center mt-16">
            <button
              onClick={handleLoadMore}
              className="group flex flex-col items-center gap-2"
            >
              <span className="px-10 py-3 border-2 border-[#006E3A] text-[#006E3A] font-bold rounded-xl hover:bg-[#006E3A] hover:text-white transition-all duration-300 text-sm cursor-pointer">
                Load More Moments
              </span>
              {/* Visual indicator of how many are left */}
              <p className="text-[10px] text-gray-400 font-medium uppercase mt-2">
                Showing {displayImages.length} of {filteredImages.length}
              </p>
            </button>
          </div>
        )}
      </section>
      {!isHome ? <Footer /> : null}
    </>
  );
}
