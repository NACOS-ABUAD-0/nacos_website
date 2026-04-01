// src/components/home/Skeletons.tsx
import React from "react";
import { motion, easeInOut } from "framer-motion";

// ─── Shared shimmer keyframe via Tailwind (augmented with Framer stagger) ────

/**
 * A single shimmer bar that pulses and slides — GPU-only (opacity + transform).
 * `delay` staggers each bar so the skeleton feels alive rather than static.
 */
const ShimmerBar: React.FC<{
  className: string;
  delay?: number;
}> = ({ className, delay = 0 }) => (
  <motion.div
    className={`relative overflow-hidden rounded ${className}`}
    initial={{ opacity: 0.45 }}
    animate={{ opacity: [0.45, 0.85, 0.45] }}
    transition={{
      duration: 1.6,
      delay,
      repeat: Infinity,
      ease: easeInOut as const,
    }}
  >
    {/* Glint sweep */}
    <motion.span
      className="absolute inset-0 -skew-x-12"
      style={{
        background:
          "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.55) 50%, transparent 100%)",
      }}
      initial={{ x: "-100%" }}
      animate={{ x: "200%" }}
      transition={{
        duration: 1.6,
        delay,
        repeat: Infinity,
        ease: easeInOut as const,
        repeatDelay: 0.3,
      }}
    />
  </motion.div>
);

// ─── Stagger container ────────────────────────────────────────────────────────

const staggerContainer = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.07 },
  },
};

const staggerChild = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

// ─── HeroSkeleton ─────────────────────────────────────────────────────────────

export const HeroSkeleton: React.FC = () => (
  <motion.div
    variants={staggerContainer}
    initial="hidden"
    animate="visible"
    className="animate-pulse"
  >
    <motion.div variants={staggerChild} className="flex justify-center mb-8">
      <ShimmerBar className="h-8 bg-gradient-to-r from-gray-100 to-gray-200 rounded-full w-48" delay={0} />
    </motion.div>

    <motion.div variants={staggerChild} className="space-y-4 mb-8">
      <ShimmerBar className="h-12 bg-gradient-to-r from-gray-100 to-gray-200 rounded-xl w-3/4 mx-auto" delay={0.1} />
      <ShimmerBar className="h-12 bg-gradient-to-r from-gray-200 to-gray-300 rounded-xl w-2/3 mx-auto" delay={0.18} />
    </motion.div>

    <motion.div variants={staggerChild}>
      <ShimmerBar className="h-6 bg-gradient-to-r from-gray-100 to-gray-200 rounded-lg w-1/2 mx-auto mb-12" delay={0.26} />
    </motion.div>

    <motion.div variants={staggerChild} className="flex justify-center gap-6">
      <ShimmerBar className="h-14 bg-gradient-to-r from-gray-200 to-gray-300 rounded-xl w-40" delay={0.34} />
      <ShimmerBar className="h-14 bg-gradient-to-r from-gray-100 to-gray-200 rounded-xl w-40" delay={0.4} />
    </motion.div>
  </motion.div>
);

// ─── StatsSkeleton ────────────────────────────────────────────────────────────

export const StatsSkeleton: React.FC = () => (
  <motion.div
    variants={staggerContainer}
    initial="hidden"
    animate="visible"
    className="grid grid-cols-2 md:grid-cols-5 gap-8"
  >
    {[...Array(5)].map((_, i) => (
      <motion.div key={i} variants={staggerChild} className="text-center">
        <ShimmerBar className="h-10 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg mb-3 mx-auto w-20" delay={i * 0.08} />
        <ShimmerBar className="h-4 bg-gradient-to-r from-gray-100 to-gray-200 rounded w-16 mx-auto" delay={i * 0.08 + 0.06} />
        <ShimmerBar className="h-1 bg-gradient-to-r from-gray-100 to-gray-200 rounded-full w-8 mx-auto mt-3" delay={i * 0.08 + 0.1} />
      </motion.div>
    ))}
  </motion.div>
);

// ─── ProjectCardSkeleton ──────────────────────────────────────────────────────

export const ProjectCardSkeleton: React.FC = () => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
    className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden group"
  >
    {/* Image placeholder */}
    <div className="h-48 bg-gradient-to-br from-gray-100 to-gray-200 relative overflow-hidden">
      <motion.div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.5) 50%, transparent 100%)",
        }}
        animate={{ x: ["-100%", "200%"] }}
        transition={{ duration: 1.7, repeat: Infinity, ease: easeInOut as const, repeatDelay: 0.4 }}
      />
    </div>

    <div className="p-6 space-y-4">
      <ShimmerBar className="h-6 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg w-4/5" delay={0.05} />
      <ShimmerBar className="h-4 bg-gradient-to-r from-gray-100 to-gray-200 rounded w-1/2" delay={0.1} />

      <div className="flex flex-wrap gap-2">
        {[16, 20, 12].map((w, j) => (
          <ShimmerBar
            key={j}
            className={`h-6 bg-gradient-to-r from-gray-100 to-gray-200 rounded-full w-${w}`}
            delay={0.12 + j * 0.05}
          />
        ))}
      </div>

      <div className="flex items-center justify-between pt-2">
        <ShimmerBar className="h-5 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-24" delay={0.2} />
        <ShimmerBar className="h-4 bg-gradient-to-r from-gray-100 to-gray-200 rounded w-16" delay={0.25} />
      </div>
    </div>
  </motion.div>
);

// ─── EventCardSkeleton ────────────────────────────────────────────────────────

export const EventCardSkeleton: React.FC = () => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
    className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden group w-[450px]"
  >
    <div className="bg-gradient-to-br from-blue-50 to-green-50 relative overflow-hidden aspect-[4/5]">
      <motion.div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.45) 50%, transparent 100%)",
        }}
        animate={{ x: ["-100%", "200%"] }}
        transition={{ duration: 1.9, repeat: Infinity, ease: easeInOut as const, repeatDelay: 0.5 }}
      />
      <div className="absolute top-4 right-4">
        <ShimmerBar className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-full w-8 h-8" delay={0.1} />
      </div>
    </div>

    <div className="p-6 space-y-4">
      <ShimmerBar className="h-5 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg w-4/5" delay={0.05} />
      <div className="flex items-center space-y-2">
        <ShimmerBar className="h-4 bg-gradient-to-r from-gray-100 to-gray-200 rounded w-32" delay={0.12} />
      </div>
      <div className="flex items-center justify-between pt-2">
        <ShimmerBar className="h-5 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-20" delay={0.18} />
      </div>
    </div>
  </motion.div>
);

// ─── ExecutiveCardSkeleton ────────────────────────────────────────────────────

export const ExecutiveCardSkeleton: React.FC = () => (
  <motion.div
    initial={{ opacity: 0, scale: 0.94 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
    className="text-center group"
  >
    <div className="relative inline-block mb-4">
      <ShimmerBar className="w-24 h-24 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full mx-auto ring-2 ring-gray-100" delay={0} />
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 -z-10 transform scale-110" />
    </div>

    <div className="space-y-2">
      <ShimmerBar className="h-5 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg w-32 mx-auto" delay={0.08} />
      <ShimmerBar className="h-4 bg-gradient-to-r from-gray-100 to-gray-200 rounded w-24 mx-auto" delay={0.14} />
    </div>
  </motion.div>
);

// ─── ResourceCardSkeleton ─────────────────────────────────────────────────────

export const ResourceCardSkeleton: React.FC = () => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, ease: "easeOut" }}
    className="p-6 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors group"
  >
    <div className="flex items-start justify-between mb-4">
      <ShimmerBar className="w-10 h-10 bg-gradient-to-br from-gray-200 to-gray-300 rounded-lg" delay={0} />
      <ShimmerBar className="w-5 h-5 bg-gradient-to-r from-gray-100 to-gray-200 rounded" delay={0.06} />
    </div>

    <div className="space-y-3">
      <ShimmerBar className="h-5 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg w-4/5" delay={0.1} />
      <ShimmerBar className="h-4 bg-gradient-to-r from-gray-100 to-gray-200 rounded w-1/2" delay={0.16} />
    </div>
  </motion.div>
);

// ─── SectionSkeleton ──────────────────────────────────────────────────────────

export const SectionSkeleton: React.FC = () => (
  <motion.div
    variants={staggerContainer}
    initial="hidden"
    animate="visible"
    className="space-y-8"
  >
    <motion.div variants={staggerChild} className="text-center space-y-4">
      <ShimmerBar className="h-8 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg w-64 mx-auto" delay={0} />
      <ShimmerBar className="h-5 bg-gradient-to-r from-gray-100 to-gray-200 rounded w-96 mx-auto" delay={0.08} />
      <ShimmerBar className="h-6 bg-gradient-to-r from-gray-100 to-gray-200 rounded w-32 mx-auto" delay={0.14} />
    </motion.div>

    <motion.div variants={staggerChild} className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="space-y-4">
          <ShimmerBar className="h-48 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl" delay={i * 0.1} />
          <ShimmerBar className="h-5 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg" delay={i * 0.1 + 0.06} />
          <ShimmerBar className="h-4 bg-gradient-to-r from-gray-100 to-gray-200 rounded w-3/4" delay={i * 0.1 + 0.12} />
        </div>
      ))}
    </motion.div>
  </motion.div>
);

// ─── NavigationSkeleton ───────────────────────────────────────────────────────

export const NavigationSkeleton: React.FC = () => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 0.4 }}
  >
    <div className="flex items-center justify-between p-4">
      <ShimmerBar className="h-8 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg w-32" delay={0} />

      <div className="hidden md:flex items-center gap-8">
        {[...Array(5)].map((_, i) => (
          <ShimmerBar
            key={i}
            className="h-5 bg-gradient-to-r from-gray-100 to-gray-200 rounded w-16"
            delay={i * 0.07}
          />
        ))}
      </div>

      <div className="flex items-center gap-4">
        <ShimmerBar className="h-10 bg-gradient-to-r from-gray-100 to-gray-200 rounded-lg w-24" delay={0.3} />
        <ShimmerBar className="h-10 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg w-24" delay={0.36} />
      </div>
    </div>
  </motion.div>
);

// ─── EventDetailSkeleton ──────────────────────────────────────────────────────

export const EventDetailSkeleton = () => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 0.5, ease: "easeOut" }}
    className="min-h-screen flex flex-col"
  >
    <div className="flex-grow flex flex-col lg:flex-row">
      {/* Left */}
      <motion.div
        initial={{ opacity: 0, x: -24 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
        className="w-full lg:w-1/2 p-8 lg:p-20 bg-[#f4fbfc] flex flex-col justify-center space-y-6"
      >
        <ShimmerBar className="h-6 w-20 bg-gray-300 rounded" delay={0.15} />
        <ShimmerBar className="h-16 w-3/4 bg-gray-300 rounded" delay={0.22} />
        <div className="space-y-4 pt-6">
          <ShimmerBar className="h-4 w-1/2 bg-gray-200 rounded" delay={0.28} />
          <ShimmerBar className="h-4 w-1/2 bg-gray-200 rounded" delay={0.34} />
          <ShimmerBar className="h-4 w-1/2 bg-gray-200 rounded" delay={0.4} />
        </div>
        <ShimmerBar className="h-14 w-48 bg-gray-300 rounded-xl mt-10" delay={0.46} />
      </motion.div>

      {/* Right */}
      <motion.div
        initial={{ opacity: 0, x: 24 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
        className="w-full lg:w-1/2 bg-gray-300 min-h-[400px] relative overflow-hidden"
      >
        <motion.div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%)",
          }}
          animate={{ x: ["-100%", "200%"] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: easeInOut as const, repeatDelay: 0.5 }}
        />
      </motion.div>
    </div>
  </motion.div>
);

// ─── GallerySkeleton ──────────────────────────────────────────────────────────

export const GallerySkeleton = () => (
  <motion.section
    variants={staggerContainer}
    initial="hidden"
    animate="visible"
    className="py-20 px-6 max-w-7xl mx-auto"
  >
    {/* Header */}
    <motion.div variants={staggerChild} className="text-center mb-12 flex flex-col items-center">
      <ShimmerBar className="h-8 w-64 bg-gray-200 rounded-md mb-4" delay={0} />
      <ShimmerBar className="h-4 w-96 bg-gray-100 rounded-md" delay={0.08} />
    </motion.div>

    {/* Filter Tabs */}
    <motion.div variants={staggerChild} className="flex justify-center gap-3 mb-12 flex-wrap">
      {[1, 2, 3, 4].map((i) => (
        <ShimmerBar key={i} className="px-10 py-5 bg-gray-200 rounded-full w-24 h-10" delay={i * 0.06} />
      ))}
    </motion.div>

    {/* Masonry grid */}
    <motion.div variants={staggerChild} className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4">
      {[
        { h: "h-96", delay: 0 },
        { h: "h-64", delay: 0.07 },
        { h: "h-80", delay: 0.14 },
        { h: "h-72", delay: 0.21 },
        { h: "h-96", delay: 0.28 },
        { h: "h-60", delay: 0.35 },
      ].map(({ h, delay }, i) => (
        <div key={i} className={`${h} rounded-2xl w-full relative overflow-hidden bg-gray-200`}>
          <motion.div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)",
            }}
            animate={{ x: ["-100%", "200%"] }}
            transition={{
              duration: 1.7,
              delay,
              repeat: Infinity,
              ease: easeInOut as const,
              repeatDelay: 0.5,
            }}
          />
        </div>
      ))}
    </motion.div>

    {/* Button */}
    <motion.div variants={staggerChild} className="w-full flex justify-center mt-16">
      <ShimmerBar className="h-12 w-48 bg-gray-200 rounded-xl" delay={0.5} />
    </motion.div>
  </motion.section>
);