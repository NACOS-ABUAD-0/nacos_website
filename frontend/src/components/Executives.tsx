import { useState, useEffect, useMemo, useRef } from "react";
import ExecCard from "./ExecCard";
import SectionHeader from "./SectionHeader";
import { Link, useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import { Footer } from "./Footer";
import PageHeader from "./PageHeader";
import { Search } from "lucide-react";
import { motion } from "framer-motion";

type Executive = {
  id: number;
  name: string;
  position: string;
  level: string;
  bio: string;
  image: string;
};

interface ExecutivesProps {
  isHome: boolean;
}

export default function Executives({ isHome }: ExecutivesProps) {
  const location = useLocation();

  useEffect(() => {
    if (location.hash) {
      const el = document.querySelector(location.hash);
      if (el) el.scrollIntoView({ behavior: "smooth" });
    }
  }, [location]);

  const executives: Executive[] = [
    { id: 1, name: "Bada Najeebah Motunrayo", position: "President", level: "Computer Science 400 Level", bio: "+234 706 871 3177", image: "/images/Bada.jpg" },
    { id: 2, name: "Amalaha Jeffrey Chigozie", position: "Vice President", level: "Computer Science 300 Level", bio: "+234 913 166 5281", image: "/images/jeff2.jpg" },
    { id: 3, name: "Oyekunle Olaoluwa Oluwanifemi", position: "Chief Of Staff", level: "Computer Science 400 Level", bio: "+234 906 013 1167", image: "/images/victor.jpg" },
    { id: 4, name: "Hassan Mukthar Feranmi", position: "Hardware Director", level: "Computer Science 300 Level", bio: "+234 816 575 2181", image: "/images/hassan.jpg" },
    { id: 5, name: "Ifediba Chimdalu", position: "Social Director", level: "Computer Science 300 Level", bio: "+234 802 533 7835", image: "/images/ifediba.png" },
    { id: 6, name: "Abdulazeez Jamiu Oladipupo", position: "Software Director", level: "Computer Science 300 Level", bio: "+234 70 699 10 759", image: "/images/jamiu.png" },
    { id: 7, name: "Nwezi Favour", position: "Financial Secretary", level: "Computer Science 300 Level", bio: "+234 816 786 1462", image: "/images/nwezi.png" },
    { id: 8, name: "Akinkunmi Ibitoye", position: "Welfare Director", level: "Computer Science 300 Level", bio: "+234 906 379 7057", image: "/images/akinkunmi.png" },
    { id: 9, name: "Mojoyinoluwa Sholotan", position: "General Secretary", level: "Computer Science 400 Level", bio: "+234 813 197 6848", image: "/images/mj.png" },
    { id: 10, name: "Julius Tony Chukwuemeka", position: "Academic Director", level: "Computer Science 400 Level", bio: "+234 812 321 7365", image: "/images/tony.png" },
    { id: 11, name: "Udotchay Oluchi", position: "Assistant General Secretary", level: "Computer Science 200 Level", bio: "234 708 581 9394", image: "/images/oluhci.png" },
    { id: 12, name: "Ayinde Adedotun", position: "Public Relation Officer", level: "Computer Science 300 Level", bio: "+234 705 563 8902", image: "/images/dotun.png" },
    { id: 13, name: "Iwuanyanwu Godsgift Ebube", position: "Sports Director", level: "Computer Science 400 Level", bio: "+234 902 369 6070", image: "/images/ebube.png" },
  ];

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [levelFilter, setLevelFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const itemsPerPage = 8;

  useEffect(() => {
    setCurrentPage(1);
  }, [search, roleFilter, levelFilter]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentPage]);

  const roles = [...new Set(executives.map(e => e.position))];
  const levels = [...new Set(executives.map(e => e.level))];

  const filteredExecutives = useMemo(() => {
    return executives.filter(e => {
      const matchesSearch =
        e.name.toLowerCase().includes(search.toLowerCase()) ||
        e.position.toLowerCase().includes(search.toLowerCase()) ||
        e.level.toLowerCase().includes(search.toLowerCase());

      const matchesRole = roleFilter ? e.position === roleFilter : true;
      const matchesLevel = levelFilter ? e.level === levelFilter : true;

      return matchesSearch && matchesRole && matchesLevel;
    });
  }, [search, roleFilter, levelFilter]);

  const totalPages = Math.ceil(filteredExecutives.length / itemsPerPage);

  const displayData = isHome
    ? filteredExecutives.slice(0, 3) // fallback, but carousel uses all
    : filteredExecutives.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
      );

  return (
    <>
      {!isHome && <Navbar />}

      {isHome ? (
        <SectionHeader subtitle="Leadership Team" title="Meet our Executive Team" />
      ) : (
        <PageHeader
          title="NACOS EXECUTIVES"
          subtitle="Meet the team driving innovation and leadership."
        />
      )}

      {/* SEARCH + FILTER */}
      {!isHome && (
        <div className="max-w-6xl mx-auto px-4 mt-10 flex flex-col lg:flex-row gap-4">
          <div className="flex items-center gap-2 border rounded-xl px-3 py-2 w-full">
            <Search className="w-4 h-4 text-gray-400" />
            <input
              placeholder="Search executives..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full outline-none text-sm"
            />
          </div>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="border rounded-xl px-3 py-2 text-sm"
          >
            <option value="">All Roles</option>
            {roles.map(r => <option key={r}>{r}</option>)}
          </select>

          <select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
            className="border rounded-xl px-3 py-2 text-sm"
          >
            <option value="">All Levels</option>
            {levels.map(l => <option key={l}>{l}</option>)}
          </select>
        </div>
      )}

      {/* GRID or CAROUSEL */}
      {isHome ? (
        <ExecutivesCarousel executives={filteredExecutives} />
      ) : (
        <>
          <motion.section
            layout
            className="max-w-7xl mx-auto px-4 mt-12 mb-16 grid gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          >
            {displayData.map((exec) => (
              <motion.div
                key={exec.id}
                layout
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <ExecCard {...exec} />
              </motion.div>
            ))}
          </motion.section>

          {/* PAGINATION */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-8 mb-20 flex-wrap">
              <button
                onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 rounded-lg border bg-white hover:bg-gray-50 disabled:opacity-30"
              >
                Prev
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-10 h-10 rounded-lg ${
                    currentPage === page
                      ? "bg-[#006E3A] text-white"
                      : "border"
                  }`}
                >
                  {page}
                </button>
              ))}

              <button
                onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 bg-[#006E3A] text-white rounded-lg"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {/* View All Executives Button (only on homepage) */}
      {isHome && (
        <div className="w-full flex flex-col items-center gap-4 p-6 mb-20">
          <h1 className="font-bold text-2xl md:text-3xl lg:text-[32px] text-[#006E3A] text-center">
            Meet the Full Executive Team
          </h1>
          <Link
            to="/executives"
            className="group inline-flex items-center gap-3 bg-gradient-to-r from-green-600 to-teal-600 text-white px-8 py-4 rounded-xl font-semibold shadow-lg hover:scale-105 transition-all mt-5"
          >
            View All Executives
            <svg
              className="w-5 h-5 group-hover:translate-x-1 transition-transform"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 7l5 5m0 0l-5 5m5-5H6"
              />
            </svg>
          </Link>
        </div>
      )}

      {!isHome && <Footer />}
    </>
  );
}

// Carousel component for homepage executives (displays up to 4 per slide)
interface ExecutivesCarouselProps {
  executives: Executive[];
}

const ExecutivesCarousel: React.FC<ExecutivesCarouselProps> = ({ executives }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Group executives into slides (max 4 per slide)
  const itemsPerSlide = 4;
  const slides = [];
  for (let i = 0; i < executives.length; i += itemsPerSlide) {
    slides.push(executives.slice(i, i + itemsPerSlide));
  }
  const totalSlides = slides.length;

  // Auto‑rotate every 5 seconds
  useEffect(() => {
    if (isPaused || totalSlides <= 1) return;

    intervalRef.current = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % totalSlides);
    }, 5000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPaused, totalSlides]);

  const goToNext = () => {
    setCurrentSlide((prev) => (prev + 1) % totalSlides);
  };

  const goToPrev = () => {
    setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  // If no executives, show a message
  if (executives.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No executives found.</p>
      </div>
    );
  }

  return (
    <div
      className="relative"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Slides container */}
      <div className="overflow-hidden">
        <div
          className="flex transition-transform duration-500 ease-in-out"
          style={{ transform: `translateX(-${currentSlide * 100}%)` }}
        >
          {slides.map((slide, slideIdx) => (
            <div key={slideIdx} className="w-full flex-shrink-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 px-4">
                {slide.map((exec) => (
                  <div key={exec.id}>
                    <ExecCard {...exec} />
                  </div>
                ))}
                {/* Fill empty slots with invisible placeholders to maintain grid layout */}
                {slide.length < itemsPerSlide &&
                  Array.from({ length: itemsPerSlide - slide.length }).map((_, i) => (
                    <div key={`placeholder-${i}`} className="invisible" />
                  ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation arrows (only if more than one slide) */}
      {totalSlides > 1 && (
        <>
          <button
            onClick={goToPrev}
            className="absolute left-0 top-1/2 -translate-y-1/2 -ml-4 lg:-ml-6 bg-white rounded-full p-2 shadow-md hover:bg-gray-50 transition-colors focus:outline-none z-10"
            aria-label="Previous executives"
          >
            <svg
              className="w-5 h-5 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <button
            onClick={goToNext}
            className="absolute right-0 top-1/2 -translate-y-1/2 -mr-4 lg:-mr-6 bg-white rounded-full p-2 shadow-md hover:bg-gray-50 transition-colors focus:outline-none z-10"
            aria-label="Next executives"
          >
            <svg
              className="w-5 h-5 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </>
      )}

      {/* Dot indicators (only if more than one slide) */}
      {totalSlides > 1 && (
        <div className="flex justify-center gap-2 mt-8">
          {slides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => goToSlide(idx)}
              className={`w-2.5 h-2.5 rounded-full transition-all duration-300 focus:outline-none ${
                idx === currentSlide
                  ? "bg-green-600 w-6"
                  : "bg-gray-300 hover:bg-gray-400"
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};