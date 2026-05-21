// src/pages/homepage.tsx
import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence, useInView } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Hero } from "../components/home/Hero";
import { Section } from "../components/home/Section";
import About from "../components/AboutUs";
import Testimonials from "../components/Testimonials";
import { ProjectCardSkeleton } from "../components/home/Skeletons";
import {
  useFeaturedProjects,
  usePublicStats,
  getProjectImage,
} from "../lib/hooks/useHomepage";
import type { ProjectItem } from "../lib/hooks/useHomepage";
import { useSEO } from "../lib/seo";
import { useAuth } from "../context/AuthContext";
import Facilities from "../components/Facilities";
import Executives from "../components/Executives";
import { Layout } from "../layouts/layout";
import Gallery from "./gallery";
import api from "../lib/api";

// ─── resolveImageUrl ──────────────────────────────────────────────────────────
//
// Rules:
//   • Already-absolute URLs (http/https/blob/data/Cloudinary) → unchanged.
//   • Django media paths starting with /media/ or media/ → prepend the
//     backend server origin so the browser can actually fetch them.
//   • Everything else (e.g. /images/lecturers/… public Vite assets) → returned
//     as-is; the browser resolves them against the FRONTEND origin, which is
//     correct for files in the public/ folder.
//
const MEDIA_BASE = (() => {
  const raw = (import.meta.env.VITE_API_URL || "http://127.0.0.1:8000")
    .replace(/\/+$/, "")
    .replace(/\/api$/, "");
  return raw; // e.g. "http://127.0.0.1:8000" or "https://api.yoursite.com"
})();

function resolveImageUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  // Already absolute — Cloudinary, S3, external CDN, blob, data URI, etc.
  if (
    url.startsWith("http://") ||
    url.startsWith("https://") ||
    url.startsWith("blob:")   ||
    url.startsWith("data:")
  ) {
    return url;
  }
  // Django media file — must be fetched from the backend origin
  if (url.startsWith("/media/") || url.startsWith("media/")) {
    return `${MEDIA_BASE}${url.startsWith("/") ? "" : "/"}${url}`;
  }
  // Public / static frontend asset (e.g. /images/lecturers/Hod.png served by Vite)
  // Leave as-is so the browser resolves it against the frontend origin.
  return url;
}

// ─── Shared motion variants ───────────────────────────────────────────────────

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: (d: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1], delay: d },
  }),
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: (d: number = 0) => ({
    opacity: 1,
    scale: 1,
    transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1], delay: d },
  }),
};

// ─── AnimatedSection wrapper — fires once on scroll entry ─────────────────────

const AnimatedSection: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.12 });

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      variants={fadeUp}
      custom={0}
      className={className}
    >
      {children}
    </motion.div>
  );
};

// ─── Lecturer data (preview subset for homepage) ──────────────────────────────

type Lecturer = {
  id: number;
  name: string;
  position: string;
  office: string;
  image: string;
};

const LECTURERS: Lecturer[] = [
  {
    id: 1,
    name: "Professor Bunmi Abiola",
    position: "Head of Department",
    office: "D54 College of Science",
    image: "/images/lecturers/Hod.png",
  },
  {
    id: 2,
    name: "Dr. Awoyemi Oloruntoba",
    position: "300 Level Advisor",
    office: "D04 College of Science",
    image: "/images/lecturers/Dr Awoyemi Oloruntoba.jpg",
  },
  {
    id: 3,
    name: "Mr. Awopetu Felix",
    position: "Lecturer",
    office: "Coming soon",
    image: "/images/lecturers/Mr Awopetu Felix.jpg",
  },
  {
    id: 4,
    name: "Mr. Sayan Oluwafemi",
    position: "Lecturer",
    office: "D24 College of Science",
    image: "/images/lecturers/Mr Sayan Oluwafemi.jpg",
  },
];

function getLecturerGradient(id: number) {
  const gradients = [
    "from-emerald-500 to-teal-700",
    "from-blue-500 to-indigo-700",
    "from-violet-500 to-purple-700",
    "from-rose-500 to-pink-700",
  ];
  return gradients[(id - 1) % gradients.length];
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter((n) => n.length > 1)
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

// ─── Event types ──────────────────────────────────────────────────────────────

interface EventItem {
  id: number | string;
  title: string;
  slug?: string;
  cover?: string;
  start: string;
  end?: string;
  venue?: string;
  is_remote?: boolean;
  status?: "upcoming" | "ongoing" | "completed" | string;
}

// ─── Homepage ─────────────────────────────────────────────────────────────────

const Homepage: React.FC = () => {
  useSEO();

  const { isAuthenticated, user } = useAuth();
  const showProfileBanner = isAuthenticated && !user?.profile_complete;

  const {
    data: projects,
    isLoading: projectsLoading,
    error: projectsError,
    refetch: refetchProjects,
  } = useFeaturedProjects();

  const projectResults: ProjectItem[] = projects?.results ?? [];

  return (
    <Layout>
      <div className="min-h-screen flex flex-col bg-white">
        <main className="flex-grow">
          {/* Hero */}
          <Hero showProfileBanner={showProfileBanner} />

          {/* About */}
          <AnimatedSection>
            <About />
          </AnimatedSection>

          {/* Featured Projects */}
          <AnimatedSection>
            <Section
              title="Featured Projects"
              subtitle="Student-built applications and experiments showcasing innovation"
              ctaText="View all projects"
              ctaLink="/projects"
              id="projects"
            >
              <AnimatePresence mode="wait">
                {projectsLoading ? (
                  <motion.div
                    key="skeleton"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
                  >
                    {[...Array(6)].map((_, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.07, duration: 0.4, ease: "easeOut" }}
                      >
                        <ProjectCardSkeleton />
                      </motion.div>
                    ))}
                  </motion.div>
                ) : projectsError ? (
                  <motion.div
                    key="error"
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4 }}
                    className="text-center py-12"
                  >
                    <p className="text-gray-500 mb-4">Failed to load projects</p>
                    <motion.button
                      onClick={() => refetchProjects()}
                      whileHover={{ scale: 1.04 }}
                      whileTap={{ scale: 0.97 }}
                      className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Try Again
                    </motion.button>
                  </motion.div>
                ) : projectResults.length === 0 ? (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4 }}
                    className="text-center py-12"
                  >
                    <p className="text-gray-500 mb-4">No featured projects yet</p>
                    {isAuthenticated && (
                      <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
                        <Link
                          to="/projects/new"
                          className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
                        >
                          Create First Project
                        </Link>
                      </motion.div>
                    )}
                  </motion.div>
                ) : (
                  <motion.div
                    key="carousel"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4 }}
                  >
                    <ProjectCarousel projects={projectResults} />
                  </motion.div>
                )}
              </AnimatePresence>
            </Section>
          </AnimatedSection>

          {/* Events — smart section with upcoming + completed fallback */}
          <AnimatedSection>
            <HomeEventsSection />
          </AnimatedSection>

          {/* Executives */}
          <AnimatedSection>
            <Executives isHome />
          </AnimatedSection>

          {/* Lecturers */}
          <AnimatedSection>
            <LecturersSection />
          </AnimatedSection>

          {/* Facilities */}
          <AnimatedSection>
            <Facilities />
          </AnimatedSection>

          {/* Resources Section */}
          <AnimatedSection>
            <Section
              title="Student Resources"
              subtitle="Access learning materials, past questions, and tutorials"
            >
              <ResourcesCTA />
            </Section>
          </AnimatedSection>

          {/* Gallery */}
          <AnimatedSection>
            <Gallery isHome={true} />
          </AnimatedSection>

          {/* Testimonials */}
          <AnimatedSection>
            <Testimonials />
          </AnimatedSection>
        </main>
      </div>
    </Layout>
  );
};

// ─── HomeEventsSection ────────────────────────────────────────────────────────
// Fetches upcoming/ongoing events first. If none exist, falls back to
// completed events. If both exist, shows upcoming/ongoing first then completed.

const HomeEventsSection: React.FC = () => {
  // Upcoming / ongoing events
  const { data: upcomingRaw, isLoading: upcomingLoading } = useQuery<EventItem[]>({
    queryKey: ["events", "upcoming-homepage"],
    queryFn: async () => {
      const res = await api.get("/events/", { params: { upcoming: true, page_size: 6 } });
      const d = res.data;
      return Array.isArray(d) ? d : (d?.results ?? []);
    },
    staleTime: 5 * 60 * 1000,
  });

  // Completed events — always fetch so we can show them as a fallback or
  // appended section
  const { data: completedRaw, isLoading: completedLoading } = useQuery<EventItem[]>({
    queryKey: ["events", "completed-homepage"],
    queryFn: async () => {
      const res = await api.get("/events/", {
        params: { status: "completed", page_size: 6 },
      });
      const d = res.data;
      return Array.isArray(d) ? d : (d?.results ?? []);
    },
    staleTime: 5 * 60 * 1000,
  });

  const isLoading = upcomingLoading || completedLoading;
  const upcomingEvents: EventItem[] = upcomingRaw ?? [];
  const completedEvents: EventItem[] = completedRaw ?? [];

  const hasUpcoming = upcomingEvents.length > 0;
  const hasCompleted = completedEvents.length > 0;

  if (isLoading) {
    return (
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="mb-10">
          <div className="h-8 w-48 bg-gray-100 rounded-lg animate-pulse mb-3" />
          <div className="h-4 w-72 bg-gray-100 rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-gray-50 rounded-2xl h-64 animate-pulse" />
          ))}
        </div>
      </section>
    );
  }

  if (!hasUpcoming && !hasCompleted) {
    return (
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <SectionHeader
          title="Events"
          subtitle="Workshops, competitions, and community gatherings"
          ctaText="View all events"
          ctaLink="/events"
        />
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-gray-500">No events at the moment. Check back soon!</p>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Upcoming / Ongoing events */}
      {hasUpcoming && (
        <>
          <SectionHeader
            title="Upcoming & Ongoing Events"
            subtitle="Workshops, competitions, and community gatherings"
            ctaText="View all events"
            ctaLink="/events"
          />
          <EventGrid events={upcomingEvents} variant="upcoming" />
        </>
      )}

      {/* If no upcoming, show completed with "Events" heading */}
      {!hasUpcoming && hasCompleted && (
        <>
          <SectionHeader
            title="Events"
            subtitle="Workshops, competitions, and community gatherings"
            ctaText="View all events"
            ctaLink="/events"
          />
          <EventGrid events={completedEvents} variant="completed" />
        </>
      )}

      {/* If both exist, show completed below upcoming */}
      {hasUpcoming && hasCompleted && (
        <div className="mt-14">
          <div className="flex items-center gap-3 mb-6">
            <span className="text-sm font-semibold text-gray-400 uppercase tracking-widest">
              Past Events
            </span>
            <div className="flex-1 h-px bg-gray-100" />
          </div>
          <EventGrid events={completedEvents} variant="completed" />
        </div>
      )}
    </section>
  );
};

// ─── SectionHeader (local helper, avoids Section wrapper for events layout) ───

const SectionHeader: React.FC<{
  title: string;
  subtitle: string;
  ctaText?: string;
  ctaLink?: string;
}> = ({ title, subtitle, ctaText, ctaLink }) => (
  <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10">
    <div>
      <h2 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">{title}</h2>
      <p className="text-gray-500 mt-2">{subtitle}</p>
    </div>
    {ctaText && ctaLink && (
      <Link
        to={ctaLink}
        className="inline-flex items-center gap-1.5 text-green-600 hover:text-green-700 font-semibold text-sm shrink-0 group"
      >
        {ctaText}
        <svg
          className="w-4 h-4 transition-transform group-hover:translate-x-0.5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </Link>
    )}
  </div>
);

// ─── EventGrid ────────────────────────────────────────────────────────────────

const EventGrid: React.FC<{
  events: EventItem[];
  variant: "upcoming" | "completed";
}> = ({ events, variant }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {events.slice(0, 6).map((event, i) => (
        <motion.div
          key={event.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.07, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <EventCard event={event} variant={variant} />
        </motion.div>
      ))}
    </div>
  );
};

// ─── EventCard ────────────────────────────────────────────────────────────────

const EventCard: React.FC<{
  event: EventItem;
  variant: "upcoming" | "completed";
}> = ({ event, variant }) => {
  const [imgError, setImgError] = useState(false);

  const startDate = event.start ? new Date(event.start) : null;
  const endDate = event.end ? new Date(event.end) : null;

  const formatDate = (d: Date) =>
    d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

  const isCompleted = variant === "completed";

  const now = new Date();
  const isOngoing =
    startDate && endDate && startDate <= now && endDate >= now;
  const isUpcoming = startDate && startDate > now;

  // Resolve relative media paths to absolute URLs
  const coverSrc = resolveImageUrl(event.cover);

  return (
    <motion.div
      whileHover={{ y: -4, boxShadow: "0 12px 32px rgba(0,0,0,0.08)" }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={`bg-white rounded-2xl border overflow-hidden group ${
        isCompleted ? "border-gray-100 opacity-90" : "border-gray-100"
      }`}
    >
      {/* Cover image / placeholder — plain <img> mirrors how Gallery renders images */}
      <div className="relative h-44 overflow-hidden bg-gradient-to-br from-green-50 to-teal-50">
        {coverSrc && !imgError ? (
          <img
            src={coverSrc}
            alt={event.title}
            className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${
              isCompleted ? "grayscale-[30%]" : ""
            }`}
            loading="lazy"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg
              className="w-10 h-10 text-green-200"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
        )}

        {/* Status badge */}
        <div className="absolute top-3 left-3">
          {isCompleted ? (
            <span className="inline-flex items-center gap-1 bg-gray-700/80 backdrop-blur-sm text-white text-xs font-medium px-2.5 py-1 rounded-full">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Completed
            </span>
          ) : isOngoing ? (
            <span className="inline-flex items-center gap-1.5 bg-green-600 text-white text-xs font-semibold px-2.5 py-1 rounded-full">
              <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
              Live Now
            </span>
          ) : isUpcoming ? (
            <span className="inline-flex items-center gap-1 bg-blue-600/90 backdrop-blur-sm text-white text-xs font-medium px-2.5 py-1 rounded-full">
              Upcoming
            </span>
          ) : null}
        </div>

        {/* Remote badge */}
        {event.is_remote && (
          <div className="absolute top-3 right-3">
            <span className="bg-white/80 backdrop-blur-sm text-gray-700 text-xs font-medium px-2 py-1 rounded-full">
              Remote
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5">
        <h3 className="font-semibold text-gray-900 text-base leading-snug mb-2 line-clamp-2 group-hover:text-green-700 transition-colors">
          {event.title}
        </h3>

        <div className="space-y-1.5 mb-4">
          {startDate && (
            <p className="flex items-center gap-2 text-xs text-gray-500">
              <svg className="w-3.5 h-3.5 shrink-0 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {formatDate(startDate)}
              {endDate && endDate.toDateString() !== startDate.toDateString() && (
                <> – {formatDate(endDate)}</>
              )}
            </p>
          )}
          {event.venue && (
            <p className="flex items-center gap-2 text-xs text-gray-500">
              <svg className="w-3.5 h-3.5 shrink-0 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {event.venue}
            </p>
          )}
        </div>

        <Link
          to={`/events/${event.slug || event.id}`}
          className="inline-flex items-center gap-1 text-xs font-semibold text-green-600 hover:text-green-700 group/link"
        >
          View details
          <svg
            className="w-3.5 h-3.5 transition-transform group-hover/link:translate-x-0.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </motion.div>
  );
};

// ─── LecturersSection ─────────────────────────────────────────────────────────

const LecturersSection: React.FC = () => {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.1 });

  return (
    <section ref={ref} className="py-20 bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-12">
          <motion.div
            variants={fadeUp}
            custom={0}
            initial="hidden"
            animate={inView ? "visible" : "hidden"}
          >
            <p className="text-xs font-semibold tracking-[0.2em] uppercase text-green-600 mb-2">
              Department of Computing · ABUAD
            </p>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">
              Our Faculty
            </h2>
            <p className="text-gray-500 mt-2 max-w-md">
              Dedicated educators and researchers guiding the next generation of computing professionals.
            </p>
          </motion.div>

          <motion.div
            variants={fadeUp}
            custom={0.1}
            initial="hidden"
            animate={inView ? "visible" : "hidden"}
          >
            <Link
              to="/lecturers"
              className="inline-flex items-center gap-1.5 text-green-600 hover:text-green-700 font-semibold text-sm group shrink-0"
            >
              Meet all faculty
              <svg
                className="w-4 h-4 transition-transform group-hover:translate-x-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </motion.div>
        </div>

        {/* Cards grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {LECTURERS.map((lecturer, i) => (
            <motion.div
              key={lecturer.id}
              variants={scaleIn}
              custom={i * 0.08}
              initial="hidden"
              animate={inView ? "visible" : "hidden"}
            >
              <LecturerCard lecturer={lecturer} />
            </motion.div>
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          variants={fadeUp}
          custom={0.35}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          className="text-center mt-10"
        >
          <Link
            to="/lecturers"
            className="inline-flex items-center gap-2 border border-green-200 text-green-700 hover:bg-green-50 px-6 py-3 rounded-xl font-medium text-sm transition-colors"
          >
            View All Faculty Members
          </Link>
        </motion.div>
      </div>
    </section>
  );
};

// ─── LecturerCard ─────────────────────────────────────────────────────────────

const LecturerCard: React.FC<{ lecturer: Lecturer }> = ({ lecturer }) => {
  const [imgError, setImgError] = useState(false);
  // Lecturer images live in /public/images/lecturers/ — served by the frontend,
  // NOT Django. Use the path directly; no URL transformation needed.
  const hasImage = lecturer.image && !imgError;
  const gradient = getLecturerGradient(lecturer.id);

  return (
    <motion.article
      whileHover={{
        y: -6,
        boxShadow: "0 16px 40px rgba(0,0,0,0.09)",
        transition: { duration: 0.3, ease: "easeOut" },
      }}
      className="group bg-white rounded-2xl border border-gray-100 overflow-hidden cursor-default"
    >
      {/* Photo */}
      <div className="relative h-56 w-full overflow-hidden bg-gray-50">
        {hasImage ? (
          <img
            src={lecturer.image}
            alt={lecturer.name}
            className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
            loading="lazy"
            onError={() => setImgError(true)}
          />
        ) : (
          <div
            className={`w-full h-full flex flex-col items-center justify-center bg-gradient-to-br ${gradient}`}
          >
            <span className="text-white font-bold text-3xl tracking-tight">
              {getInitials(lecturer.name)}
            </span>
            <span className="text-white/60 text-xs mt-2 font-medium tracking-wider uppercase">
              {lecturer.position}
            </span>
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-white/30 to-transparent pointer-events-none" />
      </div>

      {/* Info */}
      <div className="p-5">
        <p className="text-[10px] font-semibold tracking-[0.15em] uppercase text-green-600 mb-1">
          {lecturer.position}
        </p>
        <h3 className="text-sm font-semibold text-gray-900 leading-snug mb-2">
          {lecturer.name}
        </h3>
        <div className="w-6 h-px bg-gray-200 group-hover:w-10 group-hover:bg-green-200 transition-all duration-300 mb-2" />
        <p className="text-xs text-gray-400">{lecturer.office}</p>
      </div>
    </motion.article>
  );
};

// ─── Resources CTA ────────────────────────────────────────────────────────────

const ResourcesCTA: React.FC = () => {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.25 });

  return (
    <div ref={ref} className="max-w-4xl mx-auto text-center py-12">
      <motion.div
        variants={scaleIn}
        custom={0}
        initial="hidden"
        animate={inView ? "visible" : "hidden"}
        className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-8"
        whileHover={{ scale: 1.08, rotate: [0, -5, 5, 0], transition: { duration: 0.5 } }}
      >
        <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
          />
        </svg>
      </motion.div>

      <motion.h3
        variants={fadeUp}
        custom={0.1}
        initial="hidden"
        animate={inView ? "visible" : "hidden"}
        className="text-4xl md:text-5xl font-bold text-gray-900 mb-6"
      >
        Unlock Your Academic Potential
      </motion.h3>

      <motion.p
        variants={fadeUp}
        custom={0.2}
        initial="hidden"
        animate={inView ? "visible" : "hidden"}
        className="text-lg md:text-xl text-gray-600 mb-10 leading-relaxed max-w-3xl mx-auto"
      >
        Access a curated library of Computer Science resources, including lecture notes,
        past questions, programming tutorials, and more. All materials are created and
        shared by students, for students.
      </motion.p>

      <motion.div
        variants={scaleIn}
        custom={0.3}
        initial="hidden"
        animate={inView ? "visible" : "hidden"}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.97 }}
        className="inline-block"
      >
        <Link
          to="/resources"
          className="group inline-flex items-center gap-2 bg-green-600 text-white px-10 py-4 rounded-xl font-semibold text-lg hover:bg-green-700 transition-all shadow-md hover:shadow-[0_8px_30px_rgba(5,150,105,0.3)] relative overflow-hidden"
        >
          <motion.span
            className="absolute inset-0 -skew-x-12 bg-white/10 pointer-events-none"
            initial={{ x: "-100%" }}
            whileHover={{ x: "200%" }}
            transition={{ duration: 0.6 }}
          />
          <span className="relative z-10">Explore Resources</span>
          <motion.svg
            className="w-5 h-5 relative z-10"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            whileHover={{ x: 4 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </motion.svg>
        </Link>
      </motion.div>
    </div>
  );
};

// ─── ProjectCarousel ──────────────────────────────────────────────────────────

interface ProjectCarouselProps {
  projects: ProjectItem[];
}

// ─── ProjectImageWithFallback ─────────────────────────────────────────────────
// Receives an already-resolved absolute URL (Cloudinary, etc.) and renders it.
// Falls back to a placeholder icon on error. Uses a plain <img> — same
// pattern the Gallery component uses — to avoid any framer-motion interference
// with the onError handler.

const ProjectImageWithFallback: React.FC<{ src: string; alt: string }> = ({ src, alt }) => {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div className="w-full h-48 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
        </svg>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden group-hover:[&>img]:scale-105 transition-transform duration-450">
      <img
        src={src}
        alt={alt}
        className="w-full h-48 object-cover transition-transform duration-[450ms] ease-out group-hover:scale-105"
        loading="lazy"
        onError={() => setFailed(true)}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
    </div>
  );
};

const ProjectCarousel: React.FC<ProjectCarouselProps> = ({ projects }) => {
  if (!projects || projects.length === 0) return null;

  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [direction, setDirection] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const itemsPerSlide = 3;
  const slides: ProjectItem[][] = [];
  for (let i = 0; i < projects.length; i += itemsPerSlide) {
    slides.push(projects.slice(i, i + itemsPerSlide));
  }
  const totalSlides = slides.length;

  useEffect(() => {
    if (isPaused || totalSlides <= 1) return;
    intervalRef.current = setInterval(() => {
      setDirection(1);
      setCurrentSlide((prev) => (prev + 1) % totalSlides);
    }, 5000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPaused, totalSlides]);

  const goToNext = () => {
    setDirection(1);
    setCurrentSlide((prev) => (prev + 1) % totalSlides);
  };

  const goToPrev = () => {
    setDirection(-1);
    setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);
  };

  const goToSlide = (index: number) => {
    setDirection(index > currentSlide ? 1 : -1);
    setCurrentSlide(index);
  };

  if (totalSlides === 0) return null;

  const slideVariants = {
    enter: (d: number) => ({ x: d > 0 ? "100%" : "-100%", opacity: 0 }),
    center: {
      x: 0,
      opacity: 1,
      transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
    },
    exit: (d: number) => ({
      x: d > 0 ? "-100%" : "100%",
      opacity: 0,
      transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] },
    }),
  };

  const cardStagger = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.08 } },
  };

  const cardVariant = {
    hidden: { opacity: 0, y: 20, scale: 0.97 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
    },
  };

  return (
    <div
      className="relative"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="overflow-hidden relative">
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.div
            key={currentSlide}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
          >
            <motion.div
              variants={cardStagger}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            >
              {slides[currentSlide].map((project) => {
                // Resolve any relative /media/… path Django returns to a full URL
                const imageSrc = resolveImageUrl(getProjectImage(project));

                return (
                  <motion.div
                    key={project.id}
                    variants={cardVariant}
                    whileHover={{
                      y: -6,
                      boxShadow: "0 16px 40px rgba(0,0,0,0.1)",
                      transition: { duration: 0.3, ease: "easeOut" },
                    }}
                    className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden group"
                  >
                    {/* ── Image: use state-based fallback component ───────── */}
                    {imageSrc ? (
                      <ProjectImageWithFallback src={imageSrc} alt={project.title} />
                    ) : (
                      <div className="w-full h-48 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
                        <svg
                          className="w-12 h-12 text-gray-300"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
                          />
                        </svg>
                      </div>
                    )}

                    {/* Card body */}
                    <div className="p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                        {project.title}
                      </h3>
                      <p className="text-sm text-gray-600 mb-3">
                        By {project.owner?.full_name || "Anonymous"}
                      </p>

                      {project.skills && project.skills.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                          {project.skills.slice(0, 3).map((skill, idx) => (
                            <motion.span
                              key={idx}
                              whileHover={{ scale: 1.05 }}
                              className="px-3 py-1 bg-green-50 text-green-700 text-xs font-medium rounded-full border border-green-100 cursor-default"
                            >
                              {skill}
                            </motion.span>
                          ))}
                          {project.skills.length > 3 && (
                            <span className="px-3 py-1 bg-gray-50 text-gray-600 text-xs font-medium rounded-full">
                              +{project.skills.length - 3}
                            </span>
                          )}
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <Link
                          to={`/projects/${project.id}`}
                          className="text-green-600 hover:text-green-700 font-medium inline-flex items-center gap-1 group-hover:gap-2 transition-all"
                        >
                          View Project
                          <motion.svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            whileHover={{ x: 3 }}
                            transition={{ type: "spring", stiffness: 400, damping: 20 }}
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </motion.svg>
                        </Link>
                        <span className="text-xs text-gray-400">
                          {project.updated_at
                            ? new Date(project.updated_at).toLocaleDateString()
                            : ""}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Prev / Next */}
      {totalSlides > 1 && (
        <>
          <motion.button
            onClick={goToPrev}
            whileHover={{ scale: 1.1, backgroundColor: "#f9fafb" }}
            whileTap={{ scale: 0.93 }}
            className="absolute left-0 top-1/2 -translate-y-1/2 -ml-4 lg:-ml-6 bg-white rounded-full p-2 shadow-md focus:outline-none z-10"
            aria-label="Previous projects"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </motion.button>
          <motion.button
            onClick={goToNext}
            whileHover={{ scale: 1.1, backgroundColor: "#f9fafb" }}
            whileTap={{ scale: 0.93 }}
            className="absolute right-0 top-1/2 -translate-y-1/2 -mr-4 lg:-mr-6 bg-white rounded-full p-2 shadow-md focus:outline-none z-10"
            aria-label="Next projects"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </motion.button>
        </>
      )}

      {/* Dots */}
      {totalSlides > 1 && (
        <div className="flex justify-center gap-2 mt-8">
          {slides.map((_, idx) => (
            <motion.button
              key={idx}
              onClick={() => goToSlide(idx)}
              animate={{
                width: idx === currentSlide ? 24 : 10,
                backgroundColor: idx === currentSlide ? "#16a34a" : "#d1d5db",
              }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ scale: 1.2 }}
              className="h-2.5 rounded-full focus:outline-none"
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Homepage;