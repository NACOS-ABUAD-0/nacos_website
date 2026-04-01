// src/components/home/Section.tsx
"use client";
import React, { useRef } from "react";
import { Link } from "react-router-dom";
import {
  motion,
  useInView,
  useScroll,
  useTransform,
  AnimatePresence,
  easeInOut
} from "framer-motion";

interface SectionProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  ctaText?: string;
  ctaLink?: string;
  id?: string;
}

// ─── Reusable motion variants ──────────────────────────────────────────────

const fadeUpVariant = {
  hidden: { opacity: 0, y: 32 },
  visible: (delay: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.65,
      ease: [0.22, 1, 0.36, 1],
      delay,
    },
  }),
};

const accentLineVariant = {
  hidden: { scaleX: 0, opacity: 0 },
  visible: {
    scaleX: 1,
    opacity: 1,
    transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
  },
};

const childrenVariant = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1],
      delay: 0.3,
    },
  },
};

const ctaVariant = {
  hidden: { opacity: 0, y: 20, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.55,
      ease: [0.22, 1, 0.36, 1],
      delay: 0.45,
    },
  },
};

const dividerVariant = {
  hidden: { scaleX: 0, opacity: 0 },
  visible: {
    scaleX: 1,
    opacity: 1,
    transition: { duration: 0.5, ease: "easeOut", delay: 0.6 },
  },
};

// ─── Floating particle (pure decoration, GPU-only) ─────────────────────────

const FloatingOrb: React.FC<{
  className: string;
  delay?: number;
  duration?: number;
}> = ({ className, delay = 0, duration = 6 }) => (
  <motion.div
    className={className}
    animate={{
      y: [0, -14, 0],
      opacity: [0.18, 0.35, 0.18],
    }}
    transition={{
      duration,
      delay,
      repeat: Infinity,
      ease: easeInOut as const,
    }}
  />
);

// ─── Section component ─────────────────────────────────────────────────────

export const Section: React.FC<SectionProps> = ({
  title,
  subtitle,
  children,
  ctaText,
  ctaLink,
  id,
}) => {
  const sectionRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);

  // Trigger header once when 20 % of it is visible
  const headerInView = useInView(headerRef, { once: true, amount: 0.2 });
  const ctaInView = useInView(ctaRef, { once: true, amount: 0.3 });

  // Subtle parallax on the decorative top strip
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });
  const bgY = useTransform(scrollYProgress, [0, 1], ["0%", "6%"]);
  const stripOpacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 0.6, 0.6, 0]);

  return (
    <section
      id={id}
      ref={sectionRef}
      className="py-20 bg-white relative overflow-hidden"
    >
      {/* ── Top accent line (parallax) ─────────────────────────────────── */}
      <motion.div
        className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-green-200 to-transparent"
        style={{ opacity: stripOpacity }}
      />

      {/* ── Floating ambient orbs ──────────────────────────────────────── */}
      <FloatingOrb
        className="absolute -top-10 left-[8%] w-40 h-40 rounded-full bg-green-100/30 blur-3xl pointer-events-none"
        delay={0}
        duration={7}
      />
      <FloatingOrb
        className="absolute top-1/3 right-[5%] w-56 h-56 rounded-full bg-teal-100/20 blur-3xl pointer-events-none"
        delay={2}
        duration={9}
      />
      <FloatingOrb
        className="absolute bottom-10 left-[15%] w-32 h-32 rounded-full bg-emerald-100/25 blur-2xl pointer-events-none"
        delay={1}
        duration={8}
      />

      {/* ── Content ───────────────────────────────────────────────────── */}
      <motion.div
        className="max-w-7xl mx-auto px-4 relative"
        style={{ y: bgY }}
      >
        {/* Section header */}
        <div ref={headerRef} className="text-center mb-16">
          {/* Accent line */}
          <motion.div
            className="w-12 h-1 bg-gradient-to-r from-green-400 to-teal-400 rounded-full mx-auto mb-6 origin-left"
            variants={accentLineVariant}
            initial="hidden"
            animate={headerInView ? "visible" : "hidden"}
          />

          {/* Title */}
          <motion.h2
            className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 tracking-tight"
            variants={fadeUpVariant}
            custom={0.1}
            initial="hidden"
            animate={headerInView ? "visible" : "hidden"}
          >
            {title}
          </motion.h2>

          {/* Subtitle */}
          <AnimatePresence>
            {subtitle && (
              <motion.p
                className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed"
                variants={fadeUpVariant}
                custom={0.2}
                initial="hidden"
                animate={headerInView ? "visible" : "hidden"}
                exit={{ opacity: 0, y: -12, transition: { duration: 0.3 } }}
              >
                {subtitle}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* Children */}
        <motion.div
          className="relative"
          variants={childrenVariant}
          initial="hidden"
          animate={headerInView ? "visible" : "hidden"}
        >
          {children}
        </motion.div>

        {/* CTA */}
        <AnimatePresence>
          {ctaText && ctaLink && (
            <motion.div
              ref={ctaRef}
              className="text-center mt-16"
              variants={ctaVariant}
              initial="hidden"
              animate={ctaInView ? "visible" : "hidden"}
            >
              <motion.div
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: "spring", stiffness: 380, damping: 22 }}
                className="inline-block"
              >
                <Link
                  to={ctaLink}
                  className="group inline-flex items-center gap-3 bg-gradient-to-r from-green-600 to-teal-600 text-white px-8 py-4 rounded-xl font-semibold shadow-lg hover:shadow-[0_8px_30px_rgba(5,150,105,0.35)] transition-shadow duration-300 relative overflow-hidden"
                >
                  {/* Sheen sweep on hover */}
                  <motion.span
                    className="absolute inset-0 bg-white/10 -skew-x-12 -translate-x-full group-hover:translate-x-[200%] transition-transform duration-700 pointer-events-none"
                  />
                  <span className="relative z-10">{ctaText}</span>
                  <motion.svg
                    className="w-5 h-5 relative z-10"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    animate={{ x: 0 }}
                    whileHover={{ x: 4 }}
                    transition={{ type: "spring", stiffness: 400, damping: 20 }}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 7l5 5m0 0l-5 5m5-5H6"
                    />
                  </motion.svg>
                </Link>
              </motion.div>

              {/* Decorative divider */}
              <motion.div
                className="mt-8 flex justify-center origin-center"
                variants={dividerVariant}
                initial="hidden"
                animate={ctaInView ? "visible" : "hidden"}
              >
                <div className="w-24 h-px bg-gradient-to-r from-gray-200 to-gray-300 rounded-full" />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* ── Bottom accent line ─────────────────────────────────────────── */}
      <motion.div
        className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-gray-100 to-transparent"
        style={{ opacity: stripOpacity }}
      />
    </section>
  );
};