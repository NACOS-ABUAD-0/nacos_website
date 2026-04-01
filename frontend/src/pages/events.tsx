import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import { Footer } from "../components/Footer";
import SectionHeader from "../components/SectionHeader";
import PageHeader from "../components/PageHeader";
import { EventCard } from "../components/EventCard";
import { EventCardSkeleton } from "../components/home/Skeletons";
import { useEvents } from "../lib/hooks/useEvents";

interface EventProps {
  isHome: boolean;
}

export default function Events({ isHome }: EventProps) {
  const [filter, setFilter] = useState<"all" | "upcoming" | "ongoing" | "completed">("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  const { data, isLoading, error } = useEvents();
  const allEvents: any[] = Array.isArray(data) ? data : data?.results ?? [];

  // For homepage: combine upcoming and ongoing events, sort by start_time ascending
  const homeEvents = allEvents
    .filter(e => e.status === "upcoming" || e.status === "ongoing")
    .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());

  const filtered = filter === "all" ? allEvents : allEvents.filter(e => e.status === filter);

  const displayData = isHome
    ? homeEvents.slice(0, 3) // fallback for static (carousel handles all)
    : filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);

  useEffect(() => {
    setCurrentPage(1);
  }, [filter]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentPage]);

  const FilterIcon = ({ active }: { active: boolean }) => (
    <svg
      className={`w-4 h-4 mr-2 ${active ? "text-white" : "text-gray-500"}`}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
      />
    </svg>
  );

  return (
    <section className={isHome ? "mb-37.5" : ""}>
      {!isHome && <Navbar />}

      {isHome ? (
        <SectionHeader subtitle="Upcoming & Ongoing Events" title="Learn, Connect, and Grow" />
      ) : (
        <PageHeader
          title="NACOS EVENTS"
          subtitle="Our events are designed to empower students through knowledge sharing and collaboration."
        />
      )}

      {/* Filter bar — events page only */}
      {!isHome && (
        <div className="flex justify-center gap-2 md:gap-4 mt-8 px-4 flex-wrap">
          {(["all", "upcoming", "ongoing", "completed"] as const).map(type => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`px-6 py-2 rounded-full text-sm font-semibold transition-all cursor-pointer flex items-center ${
                filter === type
                  ? "bg-gradient-to-r from-green-600 to-teal-600 text-white shadow-md"
                  : "bg-white text-gray-700 border border-gray-200 hover:border-green-400 hover:shadow-sm"
              }`}
            >
              <FilterIcon active={filter === type} />
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>
      )}

      {/* Main content area */}
      <div className={!isHome ? "pb-20" : ""}>
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-10 px-4 md:px-8">
            {[...Array(isHome ? 3 : 6)].map((_, i) => (
              <EventCardSkeleton key={i} />
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Failed to load events.</p>
          </div>
        ) : (
          <>
            {isHome ? (
              // Carousel for homepage (upcoming + ongoing events)
              <EventCarousel events={homeEvents} />
            ) : (
              // Regular grid and pagination for events page
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-10 px-4 md:px-8">
                  {displayData.map(event => (
                    <EventCard key={event.id} event={event} />
                  ))}
                  {displayData.length === 0 && (
                    <div className="col-span-full py-20 text-center text-gray-500 font-medium">
                      No {filter} events found at the moment.
                    </div>
                  )}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-10">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                      disabled={currentPage === 1}
                      className="p-3 rounded-full border border-gray-200 bg-white disabled:opacity-30 hover:border-green-600 transition-all"
                    >
                      <svg
                        className="w-6 h-6 rotate-180"
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
                    </button>
                    {pageNumbers.map(n => (
                      <button
                        key={n}
                        onClick={() => setCurrentPage(n)}
                        className={`w-10 h-10 rounded-lg font-semibold transition-all ${
                          currentPage === n
                            ? "bg-gradient-to-r from-green-600 to-teal-600 text-white shadow-md scale-110"
                            : "text-gray-600 hover:bg-gray-100"
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                    <button
                      onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="p-3 rounded-full bg-gradient-to-r from-green-600 to-teal-600 text-white disabled:opacity-30 transition-all"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 7l5 5m0 0l-5 5m5-5H6"
                        />
                      </svg>
                    </button>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>

      {/* "View All Events" button for homepage */}
      {isHome && (
        <div className="w-full flex flex-col items-center gap-4 p-6 mb-20">
          <h1 className="font-bold text-2xl md:text-3xl lg:text-[32px] text-[#006E3A] text-center">
            Explore All Events
          </h1>
          <Link
            to="/events"
            className="group inline-flex items-center gap-3 bg-gradient-to-r from-green-600 to-teal-600 text-white px-8 py-4 rounded-xl font-semibold shadow-lg hover:scale-105 transition-all mt-5"
          >
            View All Events
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
    </section>
  );
}

// Carousel component for homepage events (displays up to 3 events per slide)
interface EventCarouselProps {
  events: any[];
}

const EventCarousel: React.FC<EventCarouselProps> = ({ events }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Group events into slides (max 3 per slide)
  const itemsPerSlide = 3;
  const slides = [];
  for (let i = 0; i < events.length; i += itemsPerSlide) {
    slides.push(events.slice(i, i + itemsPerSlide));
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

  // If no events, show a message
  if (events.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No upcoming or ongoing events at the moment.</p>
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-4 md:px-8">
                {slide.map((event) => (
                  <EventCard key={event.id} event={event} />
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
            aria-label="Previous events"
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
            aria-label="Next events"
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