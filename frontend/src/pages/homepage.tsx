// src/pages/homepage.tsx

// ─── NACOS HOMEPAGE — Futuristic Rebuild ─────────────────────────────────────
// Motion philosophy: every element breathes. Sections arrive like scenes.
// The Events carousel feels cinematic. Projects glow.
// Cursor magnetism, spring physics, layered depth — everywhere.

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { Link } from "react-router-dom";
import {
  motion,
  AnimatePresence,
  useInView,
  useMotionValue,
  useSpring,
  useTransform,
  animate,
} from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Hero } from "../components/home/Hero";
import { Section } from "../components/home/Section";
import About from "../components/AboutUs";
import Testimonials from "../components/Testimonials";
import { ProjectCardSkeleton } from "../components/home/Skeletons";
import {
  useFeaturedProjects,
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

// ─── Constants ────────────────────────────────────────────────────────────────

const MEDIA_BASE = (() => {
  const raw = (import.meta.env.VITE_API_URL || "http://127.0.0.1:8000")
    .replace(/\/+$/, "")
    .replace(/\/api$/, "");
  return raw;
})();

// ─── Utilities ────────────────────────────────────────────────────────────────

function resolveImageUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (
    url.startsWith("http://") ||
    url.startsWith("https://") ||
    url.startsWith("blob:") ||
    url.startsWith("data:")
  )
    return url;
  if (url.startsWith("/media/") || url.startsWith("media/"))
    return `${MEDIA_BASE}${url.startsWith("/") ? "" : "/"}${url}`;
  return url;
}

function getProjectImageFromApi(project: ProjectItem): string | null {
  const p = project as ProjectItem & { images?: string[] };
  if (Array.isArray(p.images) && p.images.length > 0) return p.images[0];
  return getProjectImage(project);
}

// ─── Global motion tokens ─────────────────────────────────────────────────────

const SPRING_STIFF = { type: "spring", stiffness: 340, damping: 30 } as const;
const SPRING_SOFT  = { type: "spring", stiffness: 180, damping: 22 } as const;
const EASE_EXPO    = [0.16, 1, 0.3, 1] as const;
const EASE_CINEMA  = [0.22, 1, 0.36, 1] as const;

const fadeUp = {
  hidden: { opacity: 0, y: 32, filter: "blur(4px)" },
  visible: (d: number = 0) => ({
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.7, ease: EASE_EXPO, delay: d },
  }),
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.88, filter: "blur(6px)" },
  visible: (d: number = 0) => ({
    opacity: 1,
    scale: 1,
    filter: "blur(0px)",
    transition: { duration: 0.6, ease: EASE_CINEMA, delay: d },
  }),
};

// ─── AnimatedSection ──────────────────────────────────────────────────────────

const AnimatedSection: React.FC<{
  children: React.ReactNode;
  className?: string;
  delay?: number;
}> = ({ children, className, delay = 0 }) => {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.1 });
  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      variants={fadeUp}
      custom={delay}
      className={className}
    >
      {children}
    </motion.div>
  );
};

// ─── MagneticWrapper — pulls child toward cursor ──────────────────────────────

const MagneticWrapper: React.FC<{
  children: React.ReactNode;
  strength?: number;
  className?: string;
}> = ({ children, strength = 0.3, className }) => {
  const ref = useRef<HTMLDivElement>(null);
  const x = useSpring(0, SPRING_STIFF);
  const y = useSpring(0, SPRING_STIFF);

  const handleMove = useCallback(
    (e: React.MouseEvent) => {
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      x.set((e.clientX - cx) * strength);
      y.set((e.clientY - cy) * strength);
    },
    [x, y, strength]
  );

  const reset = useCallback(() => {
    x.set(0);
    y.set(0);
  }, [x, y]);

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={reset}
      style={{ x, y }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

// ─── TiltCard — 3-D perspective tilt on hover ─────────────────────────────────

const TiltCard: React.FC<{
  children: React.ReactNode;
  className?: string;
  intensity?: number;
}> = ({ children, className, intensity = 10 }) => {
  const ref = useRef<HTMLDivElement>(null);
  const rotX = useSpring(0, SPRING_STIFF);
  const rotY = useSpring(0, SPRING_STIFF);
  const glowX = useMotionValue(50);
  const glowY = useMotionValue(50);

  const handleMove = useCallback(
    (e: React.MouseEvent) => {
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const nx = (e.clientX - rect.left) / rect.width;
      const ny = (e.clientY - rect.top) / rect.height;
      rotX.set((ny - 0.5) * -intensity);
      rotY.set((nx - 0.5) * intensity);
      glowX.set(nx * 100);
      glowY.set(ny * 100);
    },
    [rotX, rotY, glowX, glowY, intensity]
  );

  const reset = useCallback(() => {
    rotX.set(0);
    rotY.set(0);
    glowX.set(50);
    glowY.set(50);
  }, [rotX, rotY, glowX, glowY]);

  const background = useTransform(
    [glowX, glowY],
    ([x, y]) =>
      `radial-gradient(circle at ${x}% ${y}%, rgba(16,185,129,0.12) 0%, transparent 65%)`
  );

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={reset}
      style={{
        rotateX: rotX,
        rotateY: rotY,
        transformStyle: "preserve-3d",
        transformPerspective: 900,
      }}
      className={`relative ${className ?? ""}`}
    >
      {/* Dynamic glow overlay */}
      <motion.div
        style={{ background }}
        className="pointer-events-none absolute inset-0 rounded-[inherit] z-10 transition-opacity duration-300"
      />
      {children}
    </motion.div>
  );
};

// ─── GlowBorder — animated conic-gradient border ─────────────────────────────

const GlowBorder: React.FC<{
  children: React.ReactNode;
  className?: string;
  active?: boolean;
}> = ({ children, className, active = false }) => {
  const angle = useMotionValue(0);
  const springAngle = useSpring(angle, { stiffness: 60, damping: 20 });

  useEffect(() => {
    if (!active) return;
    const controls = animate(angle, 360, {
      duration: 3,
      repeat: Infinity,
      ease: "linear",
    });
    return controls.stop;
  }, [active, angle]);

  const borderBg = useTransform(
    springAngle,
    (a) =>
      `conic-gradient(from ${a}deg at 50% 50%, #10b981, #059669, #0d9488, #10b981)`
  );

  return (
    <div className={`relative rounded-2xl p-[1.5px] ${className ?? ""}`}>
      <motion.div
        style={active ? { background: borderBg } : {}}
        className={`absolute inset-0 rounded-2xl ${!active ? "bg-white/10" : ""}`}
      />
      <div className="relative rounded-[calc(1rem-1.5px)] overflow-hidden h-full">
        {children}
      </div>
    </div>
  );
};

// ─── Lecturer data ────────────────────────────────────────────────────────────

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

const GRADIENTS = [
  "from-emerald-500 to-teal-700",
  "from-blue-500 to-indigo-700",
  "from-violet-500 to-purple-700",
  "from-rose-500 to-pink-700",
];

function getLecturerGradient(id: number) {
  return GRADIENTS[(id - 1) % GRADIENTS.length];
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

// ─── API Event type ───────────────────────────────────────────────────────────

interface ApiEventItem {
  id: number | string;
  title: string;
  slug?: string;
  start_time: string;
  end_time?: string | null;
  location: string;
  poster_url?: string | null;
  is_remote?: boolean;
  status?: "upcoming" | "ongoing" | "completed" | string;
  media?: { poster?: string | null };
  description?: string;
}

// ═════════════════════════════════════════════════════════════════════════════
// HOMEPAGE ROOT
// ═════════════════════════════════════════════════════════════════════════════

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
        <main className="flex-grow overflow-x-hidden">
          <Hero showProfileBanner={showProfileBanner} />

          <AnimatedSection>
            <About />
          </AnimatedSection>

          {/* ── Featured Projects ── */}
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
                    key="sk"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
                  >
                    {[...Array(6)].map((_, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.07, duration: 0.4 }}
                      >
                        <ProjectCardSkeleton />
                      </motion.div>
                    ))}
                  </motion.div>
                ) : projectsError ? (
                  <motion.div
                    key="err"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-center py-16"
                  >
                    <p className="text-gray-400 mb-4 font-mono text-sm">
                      // failed to fetch projects
                    </p>
                    <motion.button
                      onClick={() => refetchProjects()}
                      whileHover={{ scale: 1.04 }}
                      whileTap={{ scale: 0.97 }}
                      className="bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700 transition-colors font-medium"
                    >
                      Retry
                    </motion.button>
                  </motion.div>
                ) : projectResults.length === 0 ? (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-center py-16"
                  >
                    <p className="text-gray-400 font-mono text-sm mb-4">
                      // no featured projects yet
                    </p>
                    {isAuthenticated && (
                      <Link
                        to="/projects/new"
                        className="bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700 transition-colors font-medium"
                      >
                        Create First Project
                      </Link>
                    )}
                  </motion.div>
                ) : (
                  <motion.div
                    key="carousel"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <ProjectCarousel projects={projectResults} />
                  </motion.div>
                )}
              </AnimatePresence>
            </Section>
          </AnimatedSection>

          {/* ── Events ── */}
          <AnimatedSection>
            <HomeEventsSection />
          </AnimatedSection>

          {/* ── Rest ── */}
          <AnimatedSection>
            <Executives isHome />
          </AnimatedSection>
          <AnimatedSection>
            <LecturersSection />
          </AnimatedSection>
          <AnimatedSection>
            <Facilities />
          </AnimatedSection>
          <AnimatedSection>
            <Section
              title="Student Resources"
              subtitle="Access learning materials, past questions, and tutorials"
            >
              <ResourcesCTA />
            </Section>
          </AnimatedSection>
          <AnimatedSection>
            <Gallery isHome={true} />
          </AnimatedSection>
          <AnimatedSection>
            <Testimonials />
          </AnimatedSection>
        </main>
      </div>
    </Layout>
  );
};

// ═════════════════════════════════════════════════════════════════════════════
// HOME EVENTS SECTION
// ═════════════════════════════════════════════════════════════════════════════

const HomeEventsSection: React.FC = () => {
  const { data, isLoading, error } = useQuery<ApiEventItem[]>({
    queryKey: ["events", "all-homepage"],
    queryFn: async () => {
      const r = await api.get("/events/");
      const d = r.data;
      return Array.isArray(d) ? d : (d?.results ?? []);
    },
    staleTime: 5 * 60 * 1000,
  });

  const allEvents: ApiEventItem[] = data ?? [];

  // Active events (upcoming + ongoing) sorted soonest first
  const activeEvents = allEvents
    .filter((e) => e.status === "upcoming" || e.status === "ongoing")
    .sort(
      (a, b) =>
        new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
    );

  // Completed events sorted most recent first
  const completedEvents = allEvents
    .filter((e) => e.status === "completed")
    .sort(
      (a, b) =>
        new Date(b.start_time).getTime() - new Date(a.start_time).getTime()
    );

  // Always show active first, completed appended after
  const homeEvents = [...activeEvents, ...completedEvents];

  if (isLoading) {
    return (
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="mb-12">
          <div className="h-9 w-64 bg-gray-100 rounded-xl animate-pulse mb-3" />
          <div className="h-4 w-80 bg-gray-100 rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-gray-50 rounded-2xl h-72 animate-pulse" />
          ))}
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
        <p className="text-gray-500">Failed to load events.</p>
      </section>
    );
  }

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <EventsSectionHeader
        title="Events"
        subtitle="Upcoming workshops, competitions, and community gatherings — plus a look back at past ones"
        ctaText="View all events"
        ctaLink="/events"
      />

      {homeEvents.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center py-20"
        >
          <div className="w-20 h-20 rounded-full border border-emerald-100 bg-emerald-50/60 flex items-center justify-center mx-auto mb-5">
            <svg
              className="w-9 h-9 text-emerald-300"
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
          <p className="text-gray-400 font-mono text-sm">
            // no events at the moment
          </p>
        </motion.div>
      ) : (
        <EventCarousel events={homeEvents} activeCount={activeEvents.length} />
      )}
    </section>
  );
};

// ─── Section header ───────────────────────────────────────────────────────────

const EventsSectionHeader: React.FC<{
  title: string;
  subtitle: string;
  ctaText?: string;
  ctaLink?: string;
}> = ({ title, subtitle, ctaText, ctaLink }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, amount: 0.5 }}
    transition={{ duration: 0.65, ease: EASE_EXPO }}
    className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-12"
  >
    <div>
      <p className="text-xs font-mono font-semibold tracking-[0.2em] uppercase text-emerald-500 mb-2">
        ◈ NACOS Events
      </p>
      <h2 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">
        {title}
      </h2>
      <p className="text-gray-400 mt-2 text-sm">{subtitle}</p>
    </div>
    {ctaText && ctaLink && (
      <MagneticWrapper strength={0.2}>
        <Link
          to={ctaLink}
          className="inline-flex items-center gap-2 text-emerald-600 hover:text-emerald-700 font-semibold text-sm shrink-0 group relative"
        >
          <span className="relative">
            {ctaText}
            <span className="absolute -bottom-0.5 left-0 w-0 h-px bg-emerald-500 group-hover:w-full transition-all duration-300" />
          </span>
          <motion.svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            whileHover={{ x: 3 }}
            transition={SPRING_STIFF}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </motion.svg>
        </Link>
      </MagneticWrapper>
    )}
  </motion.div>
);

// ═════════════════════════════════════════════════════════════════════════════
// EVENT CAROUSEL
// ═════════════════════════════════════════════════════════════════════════════

const EventImageWithFallback: React.FC<{ src: string; alt: string }> = ({
  src,
  alt,
}) => {
  const [failed, setFailed] = useState(false);
  if (failed)
    return (
      <div className="w-full h-48 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <svg
          className="w-10 h-10 text-gray-200"
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
    );
  return (
    <div className="relative overflow-hidden h-48">
      <img
        src={src}
        alt={alt}
        loading="lazy"
        className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06]"
        onError={() => setFailed(true)}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent pointer-events-none" />
    </div>
  );
};

const EventCarousel: React.FC<{
  events: ApiEventItem[];
  activeCount?: number;
}> = ({ events, activeCount = 0 }) => {
  if (!events.length) return null;

  const [current, setCurrent] = useState(0);
  const [direction, setDir] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const PER = 3;
  // Track each event's global index so we can identify completed events
  // (those at index >= activeCount) regardless of which slide page they're on.
  const indexedEvents = useMemo(
    () => events.map((e, globalIdx) => ({ event: e, globalIdx })),
    [events]
  );
  const slides = useMemo(() => {
    const s: { event: ApiEventItem; globalIdx: number }[][] = [];
    for (let i = 0; i < indexedEvents.length; i += PER)
      s.push(indexedEvents.slice(i, i + PER));
    return s;
  }, [indexedEvents]);
  const total = slides.length;

  const go = useCallback(
    (n: number) => {
      setDir(n > current ? 1 : -1);
      setCurrent(n);
    },
    [current]
  );

  useEffect(() => {
    if (isPaused || total <= 1) return;
    intervalRef.current = setInterval(() => go((current + 1) % total), 5500);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPaused, total, current, go]);

  const slideV = {
    enter: (d: number) => ({
      x: d > 0 ? "100%" : "-100%",
      opacity: 0,
      filter: "blur(8px)",
    }),
    center: {
      x: 0,
      opacity: 1,
      filter: "blur(0px)",
      transition: { duration: 0.6, ease: EASE_CINEMA },
    },
    exit: (d: number) => ({
      x: d > 0 ? "-100%" : "100%",
      opacity: 0,
      filter: "blur(8px)",
      transition: { duration: 0.5, ease: EASE_CINEMA },
    }),
  };

  const cardV = {
    hidden: { opacity: 0, y: 24, scale: 0.96 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { duration: 0.55, ease: EASE_EXPO, delay: i * 0.1 },
    }),
  };

  return (
    <div
      className="relative"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="overflow-hidden">
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.div
            key={current}
            custom={direction}
            variants={slideV}
            initial="enter"
            animate="center"
            exit="exit"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {slides[current].map(({ event, globalIdx }, i) => {
                const isCompleted = globalIdx >= activeCount;
                const imageSrc = resolveImageUrl(
                  event.poster_url || event.media?.poster || null
                );
                const now = new Date();
                const startDate = event.start_time
                  ? new Date(event.start_time)
                  : null;
                const endDate = event.end_time
                  ? new Date(event.end_time)
                  : null;
                const isOngoing = !!(
                  startDate &&
                  endDate &&
                  startDate <= now &&
                  endDate >= now
                );
                const isUpcoming = !!(startDate && startDate > now);

                const statusLabel =
                  event.status === "completed"
                    ? "completed"
                    : isOngoing
                    ? "ongoing"
                    : isUpcoming
                    ? "upcoming"
                    : event.status ?? "upcoming";

                const isFocused = i === 0;
                // Completed cards are always slightly dimmed to visually
                // separate them from active events, but still hoverable.
                const blurClass = isCompleted
                  ? "opacity-50 scale-95 hover:opacity-80 hover:scale-100"
                  : isFocused
                  ? "blur-0 opacity-100 scale-100"
                  : "blur-[2px] opacity-60 scale-95 hover:blur-0 hover:opacity-100 hover:scale-100";

                return (
                  <motion.div
                    key={event.id}
                    custom={i}
                    variants={cardV}
                    initial="hidden"
                    animate="visible"
                    className={`transition-all duration-500 ease-out ${blurClass}`}
                  >
                    <TiltCard
                      intensity={isCompleted ? 2 : isFocused ? 6 : 2}
                      className={`bg-white rounded-2xl border overflow-hidden group
                                 hover:shadow-xl transition-all duration-400 h-full
                                 ${isCompleted
                                   ? "border-gray-100 hover:border-gray-200 hover:shadow-gray-50/80"
                                   : "border-gray-100 hover:border-emerald-200/60 hover:shadow-emerald-50/80"
                                 }`}
                    >
                      {imageSrc ? (
                        <EventImageWithFallback src={imageSrc} alt={event.title} />
                      ) : (
                        <div className="w-full h-48 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
                          <svg
                            className="w-10 h-10 text-gray-200"
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

                      <div className="p-6">
                        {/* Status badge */}
                        <div className="mb-3">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold rounded-full uppercase tracking-wide
                            ${
                              statusLabel === "upcoming"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                                : statusLabel === "ongoing"
                                ? "bg-blue-50 text-blue-700 border border-blue-100"
                                : "bg-gray-50 text-gray-600 border border-gray-100"
                            }`}
                          >
                            {statusLabel === "ongoing" && (
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                            )}
                            {statusLabel.charAt(0).toUpperCase() +
                              statusLabel.slice(1)}
                          </span>
                        </div>

                        <h3 className="text-base font-bold text-gray-900 mb-1.5 line-clamp-2 group-hover:text-emerald-700 transition-colors duration-300">
                          {event.title}
                        </h3>

                        {startDate && (
                          <div className="flex flex-wrap items-center gap-2 text-xs text-gray-400 font-mono mb-3">
                            <div className="flex items-center gap-1.5">
                              <svg
                                className="w-3.5 h-3.5 text-emerald-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                />
                              </svg>
                              <span>
                                {startDate.toLocaleDateString([], {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                })}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <svg
                                className="w-3.5 h-3.5 text-emerald-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                              </svg>
                              <span>
                                {startDate.toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            </div>
                          </div>
                        )}

                        <div className="flex items-center gap-1.5 text-xs text-gray-400 font-mono mb-4">
                          <svg
                            className="w-3.5 h-3.5 text-emerald-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                          </svg>
                          <span className="truncate">
                            {event.is_remote ? "Remote Event" : event.location}
                          </span>
                        </div>

                        <div className="flex items-center justify-between gap-3 mt-auto">
                          <MagneticWrapper strength={0.2} className="inline-block">
                            <Link
                              to={`/events/${event.slug || event.id}`}
                              className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-600 hover:text-emerald-700 group/btn"
                            >
                              <span className="relative">
                                View Details
                                <span className="absolute -bottom-0.5 left-0 w-0 h-px bg-emerald-500 group-hover/btn:w-full transition-all duration-200" />
                              </span>
                              <motion.svg
                                className="w-3.5 h-3.5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                whileHover={{ x: 3 }}
                                transition={SPRING_STIFF}
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2.5}
                                  d="M9 5l7 7-7 7"
                                />
                              </motion.svg>
                            </Link>
                          </MagneticWrapper>

                          {statusLabel === "upcoming" && (
                            <Link
                              to={`/register/${event.id}`}
                              className="px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white
                                         text-[10px] font-bold rounded-lg hover:shadow-md hover:scale-105
                                         transition-all tracking-wide whitespace-nowrap"
                            >
                              Register
                            </Link>
                          )}
                        </div>
                      </div>
                    </TiltCard>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Nav */}
      {total > 1 && (
        <div className="flex items-center justify-between mt-8 px-1">
          <div className="flex gap-2">
            {[
              { dir: -1, icon: "M15 19l-7-7 7-7", label: "Prev" },
              { dir: 1, icon: "M9 5l7 7-7 7", label: "Next" },
            ].map(({ dir, icon, label }) => (
              <MagneticWrapper key={label} strength={0.35}>
                <motion.button
                  onClick={() => go((current + dir + total) % total)}
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.92 }}
                  className="w-10 h-10 rounded-full border border-gray-200 bg-white flex items-center justify-center
                             text-gray-500 shadow-sm hover:border-emerald-400 hover:text-emerald-600
                             hover:shadow-emerald-100 transition-all duration-200"
                  aria-label={label}
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d={icon}
                    />
                  </svg>
                </motion.button>
              </MagneticWrapper>
            ))}
          </div>

          <div className="flex items-center gap-1.5">
            {slides.map((_, i) => (
              <motion.button
                key={i}
                onClick={() => go(i)}
                animate={{
                  width: i === current ? 24 : 8,
                  backgroundColor: i === current ? "#10b981" : "#e5e7eb",
                  opacity: i === current ? 1 : 0.6,
                }}
                transition={{ duration: 0.3, ease: EASE_CINEMA }}
                whileHover={{ scale: 1.3 }}
                className="h-2 rounded-full focus:outline-none"
                aria-label={`Slide ${i + 1}`}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ═════════════════════════════════════════════════════════════════════════════
// PROJECT CAROUSEL
// ═════════════════════════════════════════════════════════════════════════════

const ProjectImageWithFallback: React.FC<{ src: string; alt: string }> = ({
  src,
  alt,
}) => {
  const [failed, setFailed] = useState(false);
  if (failed)
    return (
      <div className="w-full h-48 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <svg
          className="w-10 h-10 text-gray-200"
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
    );
  return (
    <div className="relative overflow-hidden h-48">
      <img
        src={src}
        alt={alt}
        loading="lazy"
        className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06]"
        onError={() => setFailed(true)}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent pointer-events-none" />
    </div>
  );
};

const ProjectCarousel: React.FC<{ projects: ProjectItem[] }> = ({
  projects,
}) => {
  if (!projects.length) return null;

  const [current, setCurrent] = useState(0);
  const [direction, setDir] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const PER = 3;
  const slides = useMemo(() => {
    const s: ProjectItem[][] = [];
    for (let i = 0; i < projects.length; i += PER)
      s.push(projects.slice(i, i + PER));
    return s;
  }, [projects]);
  const total = slides.length;

  const go = useCallback(
    (n: number) => {
      setDir(n > current ? 1 : -1);
      setCurrent(n);
    },
    [current]
  );

  useEffect(() => {
    if (isPaused || total <= 1) return;
    intervalRef.current = setInterval(() => go((current + 1) % total), 5500);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPaused, total, current, go]);

  const slideV = {
    enter: (d: number) => ({
      x: d > 0 ? "100%" : "-100%",
      opacity: 0,
      filter: "blur(8px)",
    }),
    center: {
      x: 0,
      opacity: 1,
      filter: "blur(0px)",
      transition: { duration: 0.6, ease: EASE_CINEMA },
    },
    exit: (d: number) => ({
      x: d > 0 ? "-100%" : "100%",
      opacity: 0,
      filter: "blur(8px)",
      transition: { duration: 0.5, ease: EASE_CINEMA },
    }),
  };

  const cardV = {
    hidden: { opacity: 0, y: 24, scale: 0.96 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { duration: 0.55, ease: EASE_EXPO, delay: i * 0.1 },
    }),
  };

  return (
    <div
      className="relative"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="overflow-hidden">
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.div
            key={current}
            custom={direction}
            variants={slideV}
            initial="enter"
            animate="center"
            exit="exit"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {slides[current].map((project, i) => {
                const imageSrc = resolveImageUrl(
                  getProjectImageFromApi(project)
                );
                const pw = project as ProjectItem & {
                  tags?: { id: number; name: string }[];
                };
                const tagNames = pw.tags?.map((t) => t.name) ?? project.skills ?? [];

                return (
                  <motion.div
                    key={project.id}
                    custom={i}
                    variants={cardV}
                    initial="hidden"
                    animate="visible"
                  >
                    <TiltCard
                      intensity={6}
                      className="bg-white rounded-2xl border border-gray-100 overflow-hidden group
                                 hover:border-emerald-200/60 hover:shadow-xl hover:shadow-emerald-50/80
                                 transition-all duration-400 h-full"
                    >
                      {imageSrc ? (
                        <ProjectImageWithFallback
                          src={imageSrc}
                          alt={project.title}
                        />
                      ) : (
                        <div className="w-full h-48 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
                          <svg
                            className="w-10 h-10 text-gray-200"
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

                      <div className="p-6">
                        <h3 className="text-base font-bold text-gray-900 mb-1.5 line-clamp-2 group-hover:text-emerald-700 transition-colors duration-300">
                          {project.title}
                        </h3>
                        <p className="text-xs text-gray-400 font-mono mb-4">
                          by {project.owner?.full_name || "Anonymous"}
                        </p>

                        {tagNames.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mb-5">
                            {tagNames.slice(0, 3).map((name, j) => (
                              <span
                                key={j}
                                className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 text-xs font-medium rounded-full border border-emerald-100/80"
                              >
                                {name}
                              </span>
                            ))}
                            {tagNames.length > 3 && (
                              <span className="px-2.5 py-0.5 bg-gray-50 text-gray-500 text-xs font-medium rounded-full border border-gray-100">
                                +{tagNames.length - 3}
                              </span>
                            )}
                          </div>
                        )}

                        <div className="flex items-center justify-between">
                          <MagneticWrapper strength={0.2} className="inline-block">
                            <Link
                              to={`/projects/${project.id}`}
                              className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-600 hover:text-emerald-700 group/btn"
                            >
                              <span className="relative">
                                View Project
                                <span className="absolute -bottom-0.5 left-0 w-0 h-px bg-emerald-500 group-hover/btn:w-full transition-all duration-200" />
                              </span>
                              <motion.svg
                                className="w-3.5 h-3.5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                whileHover={{ x: 3 }}
                                transition={SPRING_STIFF}
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2.5}
                                  d="M9 5l7 7-7 7"
                                />
                              </motion.svg>
                            </Link>
                          </MagneticWrapper>
                          <span className="text-[10px] text-gray-300 font-mono">
                            {project.updated_at
                              ? new Date(project.updated_at).toLocaleDateString()
                              : ""}
                          </span>
                        </div>
                      </div>
                    </TiltCard>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Nav */}
      {total > 1 && (
        <div className="flex items-center justify-between mt-8 px-1">
          <div className="flex gap-2">
            {[
              { dir: -1, icon: "M15 19l-7-7 7-7", label: "Prev" },
              { dir: 1, icon: "M9 5l7 7-7 7", label: "Next" },
            ].map(({ dir, icon, label }) => (
              <MagneticWrapper key={label} strength={0.35}>
                <motion.button
                  onClick={() => go((current + dir + total) % total)}
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.92 }}
                  className="w-10 h-10 rounded-full border border-gray-200 bg-white flex items-center justify-center
                             text-gray-500 shadow-sm hover:border-emerald-400 hover:text-emerald-600
                             hover:shadow-emerald-100 transition-all duration-200"
                  aria-label={label}
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d={icon}
                    />
                  </svg>
                </motion.button>
              </MagneticWrapper>
            ))}
          </div>

          <div className="flex items-center gap-1.5">
            {slides.map((_, i) => (
              <motion.button
                key={i}
                onClick={() => go(i)}
                animate={{
                  width: i === current ? 24 : 8,
                  backgroundColor: i === current ? "#10b981" : "#e5e7eb",
                  opacity: i === current ? 1 : 0.6,
                }}
                transition={{ duration: 0.3, ease: EASE_CINEMA }}
                whileHover={{ scale: 1.3 }}
                className="h-2 rounded-full focus:outline-none"
                aria-label={`Slide ${i + 1}`}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ═════════════════════════════════════════════════════════════════════════════
// LECTURERS SECTION
// ═════════════════════════════════════════════════════════════════════════════

const LecturersSection: React.FC = () => {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.1 });

  return (
    <section ref={ref} className="py-20 bg-gradient-to-b from-gray-50/60 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-12">
          <motion.div
            variants={fadeUp}
            custom={0}
            initial="hidden"
            animate={inView ? "visible" : "hidden"}
          >
            <p className="text-xs font-mono font-semibold tracking-[0.2em] uppercase text-emerald-500 mb-2">
              ◈ Department of Computing · ABUAD
            </p>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">
              Our Faculty
            </h2>
            <p className="text-gray-400 mt-2 max-w-md text-sm">
              Dedicated educators and researchers guiding the next generation of
              computing professionals.
            </p>
          </motion.div>
          <motion.div
            variants={fadeUp}
            custom={0.1}
            initial="hidden"
            animate={inView ? "visible" : "hidden"}
          >
            <MagneticWrapper strength={0.2}>
              <Link
                to="/lecturers"
                className="inline-flex items-center gap-1.5 text-emerald-600 hover:text-emerald-700 font-semibold text-sm group shrink-0"
              >
                Meet all faculty
                <motion.svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  whileHover={{ x: 3 }}
                  transition={SPRING_STIFF}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </motion.svg>
              </Link>
            </MagneticWrapper>
          </motion.div>
        </div>

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

        <motion.div
          variants={fadeUp}
          custom={0.35}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          className="text-center mt-10"
        >
          <MagneticWrapper strength={0.15} className="inline-block">
            <Link
              to="/lecturers"
              className="inline-flex items-center gap-2 border border-gray-200 text-gray-700
                         hover:border-emerald-300 hover:text-emerald-700 hover:bg-emerald-50/50
                         px-6 py-3 rounded-xl font-medium text-sm transition-all duration-300"
            >
              View All Faculty Members
            </Link>
          </MagneticWrapper>
        </motion.div>
      </div>
    </section>
  );
};

const LecturerCard: React.FC<{ lecturer: Lecturer }> = ({ lecturer }) => {
  const [imgError, setImgError] = useState(false);
  const hasImage = lecturer.image && !imgError;
  const gradient = getLecturerGradient(lecturer.id);

  return (
    <TiltCard
      intensity={8}
      className="group bg-white rounded-2xl border border-gray-100 overflow-hidden cursor-default
                 hover:border-emerald-200/60 hover:shadow-lg hover:shadow-emerald-50/60
                 transition-all duration-400"
    >
      <div className="relative h-56 w-full overflow-hidden bg-gray-50">
        {hasImage ? (
          <img
            src={lecturer.image}
            alt={lecturer.name}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.05]"
            onError={() => setImgError(true)}
          />
        ) : (
          <div
            className={`w-full h-full flex flex-col items-center justify-center bg-gradient-to-br ${gradient}`}
          >
            <span className="text-white font-bold text-3xl tracking-tight">
              {getInitials(lecturer.name)}
            </span>
            <span className="text-white/60 text-xs mt-2 font-mono tracking-wider uppercase">
              {lecturer.position}
            </span>
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-white/40 to-transparent pointer-events-none" />
      </div>
      <div className="p-5">
        <p className="text-[10px] font-mono font-semibold tracking-[0.18em] uppercase text-emerald-500 mb-1">
          {lecturer.position}
        </p>
        <h3 className="text-sm font-semibold text-gray-900 leading-snug mb-2">
          {lecturer.name}
        </h3>
        <motion.div
          className="h-px bg-gray-200 group-hover:bg-emerald-200 mb-2 origin-left"
          initial={{ scaleX: 0.3 }}
          whileInView={{ scaleX: 1 }}
          transition={{ duration: 0.5, ease: EASE_EXPO }}
        />
        <p className="text-xs text-gray-400 font-mono">{lecturer.office}</p>
      </div>
    </TiltCard>
  );
};

// ═════════════════════════════════════════════════════════════════════════════
// RESOURCES CTA
// ═════════════════════════════════════════════════════════════════════════════

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
        className="w-24 h-24 rounded-full border border-emerald-100 bg-emerald-50/60
                   flex items-center justify-center mx-auto mb-8 relative"
        whileHover={{
          scale: 1.08,
          rotate: [0, -4, 4, 0],
          transition: { duration: 0.5 },
        }}
      >
        <motion.div
          className="absolute inset-0 rounded-full border border-emerald-200/50"
          animate={{ scale: [1, 1.3, 1], opacity: [0.6, 0, 0.6] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />
        <svg
          className="w-11 h-11 text-emerald-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
          />
        </svg>
      </motion.div>

      <motion.h3
        variants={fadeUp}
        custom={0.1}
        initial="hidden"
        animate={inView ? "visible" : "hidden"}
        className="text-4xl md:text-5xl font-bold text-gray-900 mb-5 tracking-tight"
      >
        Unlock Your Academic Potential
      </motion.h3>

      <motion.p
        variants={fadeUp}
        custom={0.2}
        initial="hidden"
        animate={inView ? "visible" : "hidden"}
        className="text-lg text-gray-400 mb-10 leading-relaxed max-w-3xl mx-auto"
      >
        A curated library of CS resources — lecture notes, past questions,
        programming tutorials. Created and shared by students, for students.
      </motion.p>

      <motion.div
        variants={scaleIn}
        custom={0.3}
        initial="hidden"
        animate={inView ? "visible" : "hidden"}
        className="inline-block"
      >
        <MagneticWrapper strength={0.2}>
          <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
            <Link
              to="/resources"
              className="group inline-flex items-center gap-2 bg-emerald-600 text-white
                         px-10 py-4 rounded-xl font-semibold text-base
                         hover:bg-emerald-700 transition-colors shadow-lg
                         hover:shadow-emerald-200/60 hover:shadow-xl relative overflow-hidden"
            >
              <motion.span
                className="absolute inset-0 -skew-x-12 bg-white/8 pointer-events-none"
                initial={{ x: "-110%" }}
                whileHover={{ x: "210%", transition: { duration: 0.55 } }}
              />
              <span className="relative z-10">Explore Resources</span>
              <motion.svg
                className="w-4 h-4 relative z-10"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                whileHover={{ x: 4 }}
                transition={SPRING_STIFF}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </motion.svg>
            </Link>
          </motion.div>
        </MagneticWrapper>
      </motion.div>
    </div>
  );
};

export default Homepage;