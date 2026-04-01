// src/components/home/StatsStrip.tsx
import React, { useRef } from "react";
import { motion, useInView, easeInOut } from "framer-motion";
import type { Stats } from "../../lib/hooks/useHomepage";
import { StatsSkeleton } from "./Skeletons";

interface StatsStripProps {
  stats?: Stats;
  isLoading: boolean;
  error?: unknown;
}

const fallbackStats: Stats = {
  students: 250,
  projects: 120,
  skills: 45,
  events: 36,
  resources: 180,
};

// ─── Motion variants ──────────────────────────────────────────────────────────

const stripVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.1, delayChildren: 0.1 },
  },
};

const statCardVariant = {
  hidden: { opacity: 0, y: 28, scale: 0.93 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] },
  },
};

const numberVariant = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
  },
};

const accentLineVariant = {
  hidden: { scaleX: 0, opacity: 0 },
  visible: {
    scaleX: 1,
    opacity: 1,
    transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1], delay: 0.15 },
  },
};

const subtitleVariant = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: "easeOut", delay: 0.55 },
  },
};

// ─── Single stat card ─────────────────────────────────────────────────────────

interface StatItem {
  value: number;
  label: string;
  icon: string;
}

const StatCard: React.FC<{ stat: StatItem }> = ({ stat }) => {
  return (
    <motion.div
      variants={statCardVariant}
      className="group relative cursor-default"
      whileHover={{ y: -6, transition: { duration: 0.3, ease: "easeOut" } }}
    >
      {/* Hover glow card */}
      <motion.div
        className="absolute inset-0 bg-white rounded-2xl shadow-sm pointer-events-none"
        initial={{ opacity: 0, scale: 0.95 }}
        whileHover={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        style={{ boxShadow: "0 8px 32px rgba(5,150,105,0.12)" }}
      />

      <div className="relative p-6">
        {/* Number */}
        <motion.div
          variants={numberVariant}
          className="text-4xl font-bold bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent mb-3 tabular-nums"
        >
          {stat.value}+
        </motion.div>

        {/* Icon with spring on hover */}
        <motion.div
          className="text-2xl mb-3"
          whileHover={{ scale: 1.25, rotate: [0, -8, 8, 0] }}
          transition={{ duration: 0.45, ease: easeInOut as const }}
        >
          {stat.icon}
        </motion.div>

        {/* Label */}
        <div className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
          {stat.label}
        </div>

        {/* Accent underline — grows from center on hover */}
        <motion.div
          className="h-0.5 bg-gradient-to-r from-green-400 to-teal-400 rounded-full mx-auto mt-4 origin-center"
          initial={{ scaleX: 0, opacity: 0 }}
          whileHover={{ scaleX: 1, opacity: 1 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          style={{ width: "2rem" }}
        />
      </div>
    </motion.div>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────

export const StatsStrip: React.FC<StatsStripProps> = ({ stats, isLoading, error }) => {
  const displayStats = stats || fallbackStats;
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.2 });

  if (isLoading) {
    return (
      <section className="py-12 bg-gradient-to-r from-gray-50 to-white border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-4">
          <StatsSkeleton />
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-12 bg-gradient-to-r from-gray-50 to-white border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-3 text-gray-500 bg-white/80 backdrop-blur-sm px-6 py-3 rounded-2xl border border-gray-200"
          >
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm font-medium">Statistics temporarily unavailable</span>
          </motion.div>
        </div>
      </section>
    );
  }

  const statItems: StatItem[] = [
    { value: displayStats.students, label: "Students", icon: "👥" },
    { value: displayStats.projects, label: "Projects", icon: "🚀" },
    { value: displayStats.skills, label: "Skills", icon: "🛠️" },
    { value: displayStats.events, label: "Events", icon: "📅" },
    { value: displayStats.resources, label: "Resources", icon: "📚" },
  ];

  return (
    <section
      ref={ref}
      className="py-16 bg-gradient-to-r from-white via-green-50/30 to-white border-y border-gray-100 relative overflow-hidden"
    >
      {/* ── Subtle background pattern ────────────────────────────────── */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%230f766e' fill-opacity='0.1'%3E%3Cpath d='M20 20c0-2.2 1.8-4 4-4s4 1.8 4 4-1.8 4-4 4-4-1.8-4-4z'/%3E%3C/g%3E%3C/svg%3E")`,
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      {/* ── Ambient floating orbs ─────────────────────────────────────── */}
      <motion.div
        className="absolute top-4 left-10 w-3 h-3 bg-green-300 rounded-full pointer-events-none"
        animate={{ opacity: [0.2, 0.45, 0.2], y: [0, -8, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: easeInOut as const }}
      />
      <motion.div
        className="absolute bottom-6 right-16 w-2 h-2 bg-teal-400 rounded-full pointer-events-none"
        animate={{ opacity: [0.3, 0.6, 0.3], y: [0, -6, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: easeInOut as const, delay: 1.5 }}
      />

      <div className="max-w-7xl mx-auto px-4 relative">
        {/* ── Grid ─────────────────────────────────────────────────────── */}
        <motion.div
          variants={stripVariants}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          className="grid grid-cols-2 md:grid-cols-5 gap-8 text-center"
        >
          {statItems.map((stat) => (
            <StatCard key={stat.label} stat={stat} />
          ))}
        </motion.div>

        {/* ── Accent divider line ───────────────────────────────────────── */}
        <motion.div
          className="flex justify-center mt-10"
          variants={accentLineVariant}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
        >
          <div className="w-32 h-px bg-gradient-to-r from-transparent via-green-300 to-transparent rounded-full origin-center" />
        </motion.div>

        {/* ── Subtitle ──────────────────────────────────────────────────── */}
        <motion.div
          className="text-center mt-4"
          variants={subtitleVariant}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
        >
          <p className="text-sm text-gray-500 font-medium uppercase tracking-wide">
            Growing Community • Active Development • Continuous Learning
          </p>
        </motion.div>
      </div>
    </section>
  );
};