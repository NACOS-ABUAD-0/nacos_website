// src/components/home/Hero.tsx
"use client";
import React, { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  motion,
  useMotionValue,
  useTransform,
  useSpring,
  easeInOut,
  cubicBezier,
  useReducedMotion,
  AnimatePresence,
} from "framer-motion";
import Particles from "../reactbits/Particles";
import SplitFlapText from "../reactbits/SplitFlapText";

// ─── Define HeroProps type ────────────────────────────────────────────────────

interface HeroProps {
  // Add any props your Hero component might need
  // For now, it's empty since the component doesn't use any props
  // You can add props like:
  // title?: string;
  // subtitle?: string;
  // showStats?: boolean;
  // etc.
}

// ─── Reusable variants ────────────────────────────────────────────────────────

const slideTextVariants = {
  hidden: { opacity: 0, y: 40, filter: "blur(8px)" },
  visible: (d: number) => ({
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.8, ease: cubicBezier(0.22, 1, 0.36, 1), delay: d },
  }),
  exit: { opacity: 0, y: -20, filter: "blur(6px)", transition: { duration: 0.4 } },
};

// Directional "curtain" wipe: the incoming photo is revealed by a clip-path that
// sweeps across the screen while the outgoing photo slides back a little
// (parallax) and dims. `custom` is the direction: 1 = next, -1 = previous.
const SLIDE_EASE = cubicBezier(0.77, 0, 0.175, 1);
const slideVariants = {
  enter: (dir: number) => ({
    clipPath: dir > 0 ? "inset(0 0 0 100%)" : "inset(0 100% 0 0)",
    zIndex: 2,
  }),
  center: {
    clipPath: "inset(0 0 0 0%)",
    x: "0%",
    opacity: 1,
    zIndex: 2,
    transition: { duration: 1.15, ease: SLIDE_EASE },
  },
  exit: (dir: number) => ({
    x: dir > 0 ? "-14%" : "14%",
    opacity: 0.5,
    zIndex: 1,
    transition: { duration: 1.15, ease: SLIDE_EASE },
  }),
};

const statVariant = {
  hidden: { opacity: 0, y: 30, scale: 0.92 },
  visible: (d: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.7, ease: cubicBezier(0.22, 1, 0.36, 1), delay: d },
  }),
};

const navBtnVariant = {
  hidden: { opacity: 0, scale: 0.7 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: cubicBezier(0.22, 1, 0.36, 1) } },
};

// ─── Counter component (preserved exactly, with entrance animation wrapper) ──

const Counter = ({
  end,
  duration = 2000,
}: {
  end: number;
  duration?: number;
}) => {
  const [count, setCount] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const countRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasStarted) {
          setHasStarted(true);
        }
      },
      { threshold: 0.1 }
    );
    if (countRef.current) observer.observe(countRef.current);
    return () => observer.disconnect();
  }, [hasStarted]);

  useEffect(() => {
    if (!hasStarted) return;
    let startTimestamp: number | null = null;
    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      setCount(Math.floor(progress * end));
      if (progress < 1) window.requestAnimationFrame(step);
    };
    window.requestAnimationFrame(step);
  }, [hasStarted, end, duration]);

  return <span ref={countRef}>{count}</span>;
};

// ─── Slide indicator dots ─────────────────────────────────────────────────────

const SlideDots: React.FC<{ total: number; current: number; onDotClick: (i: number) => void }> = ({
  total,
  current,
  onDotClick,
}) => (
  <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2">
    {Array.from({ length: total }).map((_, i) => (
      <motion.button
        key={i}
        onClick={() => onDotClick(i)}
        aria-label={`Go to slide ${i + 1}`}
        className="rounded-full bg-white/50 hover:bg-white/80 transition-colors focus:outline-none"
        animate={{
          width: i === current ? 24 : 8,
          opacity: i === current ? 1 : 0.5,
        }}
        style={{ height: 8 }}
        transition={{ duration: 0.35, ease: cubicBezier(0.22, 1, 0.36, 1) }}
      />
    ))}
  </div>
);

// ─── Hero component ───────────────────────────────────────────────────────────

export const Hero: React.FC<HeroProps> = () => {
  const images = [
    "/heroImages/hero1.jpeg",
    "/heroImages/hero2.jpeg",
    "/heroImages/hero3.jpeg",
    "/heroImages/hero4.jpeg",
    "/heroImages/hero5.jpeg",
    "/heroImages/hero6.jpeg",
    "/heroImages/hero7.jpeg",
    "/heroImages/hero8.jpeg",
    "/heroImages/hero9.jpeg",
    "/heroImages/hero10.jpeg",
    "/heroImages/hero11.jpeg",
    "/heroImages/hero12.jpeg",
    "/heroImages/hero13.jpeg",
    "/heroImages/hero14.jpeg",
    "/heroImages/hero15.jpeg",
    "/heroImages/hero16.jpeg",
    "/heroImages/hero17.jpeg",
    "/heroImages/hero18.jpeg",
    "/heroImages/hero19.jpeg",
    "/heroImages/hero20.jpeg",
    "/heroImages/hero21.jpeg",
    "/heroImages/hero22.jpeg",
    "/heroImages/hero23.jpeg",
    "/heroImages/hero24.jpeg",
    "/heroImages/hero25.jpeg",
    "/heroImages/hero26.jpeg",
  ];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [mounted, setMounted] = useState(false);
  const reduceMotion = useReducedMotion();
  const [isSmall, setIsSmall] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 639px)");
    const update = () => setIsSmall(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  // Subtle mouse parallax on the content overlay
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springX = useSpring(mouseX, { stiffness: 60, damping: 20 });
  const springY = useSpring(mouseY, { stiffness: 60, damping: 20 });
  const contentX = useTransform(springX, [-1, 1], [-6, 6]);
  const contentY = useTransform(springY, [-1, 1], [-4, 4]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Auto-advance. Keyed on currentIndex so any manual navigation restarts the timer.
  useEffect(() => {
    const timeout = setTimeout(() => {
      setDirection(1);
      setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
    }, 5000);
    return () => clearTimeout(timeout);
  }, [currentIndex, images.length]);

  // Only the current photo is mounted, so warm the next one in the browser
  // cache to keep the wipe from revealing a half-loaded image.
  useEffect(() => {
    const next = new Image();
    next.src = images[(currentIndex + 1) % images.length];
  }, [currentIndex, images]);

  const nextSlide = () => {
    setDirection(1);
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };
  const prevSlide = () => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };
  const goToSlide = (i: number) => {
    setDirection(i >= currentIndex ? 1 : -1);
    setCurrentIndex(i);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    mouseX.set(((e.clientX - rect.left) / rect.width) * 2 - 1);
    mouseY.set(((e.clientY - rect.top) / rect.height) * 2 - 1);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  return (
    <div
      className="relative w-full min-h-[80vh] md:min-h-screen overflow-hidden"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* ── Background slides ─────────────────────────────────────────── */}
      <AnimatePresence initial={false} custom={direction}>
        <motion.div
          key={currentIndex}
          className="absolute inset-0 overflow-hidden"
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
        >
          {/* Slow Ken Burns zoom on the photo itself */}
          <motion.div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url(${images[currentIndex]})` }}
            initial={{ scale: 1 }}
            animate={{ scale: 1.08 }}
            transition={{ duration: 7, ease: "linear" }}
          />
        </motion.div>
      </AnimatePresence>

      {/* ── Dark overlay with radial vignette ────────────────────────── */}
      <div className="absolute inset-0 bg-black/55 z-10" />
      <div
        className="absolute inset-0 z-10 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.45) 100%)",
        }}
      />

      {/* ── Floating particles (decorative, behind the content) ──────── */}
      {!reduceMotion && (
        <div className="absolute inset-0 z-20 pointer-events-none" aria-hidden>
          <Particles
            particleCount={140}
            particleSpread={10}
            speed={0.08}
            particleColors={["#ffffff", "#4ade80", "#006E3A"]}
            alphaParticles
            particleBaseSize={90}
            sizeRandomness={1}
            cameraDistance={22}
            pixelRatio={1}
          />
        </div>
      )}

      {/* ── Content overlay ───────────────────────────────────────────── */}
      <motion.div
        className="absolute inset-0 flex flex-col justify-center items-center px-4 sm:px-6 py-16 text-white z-30"
        style={{ x: contentX, y: contentY }}
      >
        {/* Hero text */}
        <div className="text-center mb-10 md:mb-16 max-w-3xl">
          {/* Rotating split-flap keyword board */}
          <motion.div
            className="flex justify-center mb-5 md:mb-7"
            variants={slideTextVariants}
            custom={0.05}
            initial="hidden"
            animate={mounted ? "visible" : "hidden"}
            aria-label="NACOS ABUAD: computing, innovation, community, code"
          >
            <SplitFlapText
              aria-hidden
              words={["COMPUTING", "INNOVATION", "COMMUNITY", "CODE", "CREATIVITY"]}
              charset="alpha"
              padTo={10}
              fontSize={isSmall ? 20 : 30}
              gap={isSmall ? 4 : 6}
              tileColor="#006E3A"
              textColor="#ffffff"
              tileRadius={6}
              cycleDelay={2800}
              flipsPerChar={6}
              stagger={0.05}
            />
          </motion.div>

          <motion.h2
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold mb-4 md:mb-6 leading-tight tracking-tight"
            variants={slideTextVariants}
            custom={0.2}
            initial="hidden"
            animate={mounted ? "visible" : "hidden"}
          >
            Pioneering the Future of{" "}
            <br />
            <motion.span
              className="text-transparent bg-clip-text bg-gradient-to-r from-[#006E3A] to-green-400 inline-block"
              animate={{
                backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
              }}
              transition={{ duration: 5, repeat: Infinity, ease: easeInOut }}
              style={{ backgroundSize: "200% 200%" }}
            >
              Digital Innovation
            </motion.span>
          </motion.h2>

          <motion.p
            className="text-gray-300 text-base sm:text-lg md:text-xl leading-relaxed max-w-2xl mx-auto font-light"
            variants={slideTextVariants}
            custom={0.4}
            initial="hidden"
            animate={mounted ? "visible" : "hidden"}
          >
            The official hub for computing excellence at ABUAD. We empower
            students to bridge the gap between classroom theory and
            industry-leading technology.
          </motion.p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 sm:grid-cols-2 md:grid-cols-3 gap-8 md:gap-12 w-full max-w-5xl text-center justify-items-center">
          {[
            { end: 700, label: "Computing Students", color: "text-[#006E3A]", barColor: "bg-[#006E3A]" },
            { end: 50, label: "Events Hosted", color: "text-white", barColor: "bg-white" },
            { end: 10, label: "Projects Built", color: "text-[#006E3A]", barColor: "bg-[#006E3A]" },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              className="group"
              variants={statVariant}
              custom={0.6 + i * 0.12}
              initial="hidden"
              animate={mounted ? "visible" : "hidden"}
              whileHover={{ y: -4, transition: { duration: 0.3, ease: "easeOut" } }}
            >
              <p
                className={`font-bold text-[clamp(20px,8vw,64px)] ${stat.color} leading-none mb-2`}
              >
                <Counter end={stat.end} />+
              </p>
              <p className="text-gray-300 text-xs sm:text-base uppercase tracking-widest">
                {stat.label}
              </p>
              {/* Animated underline */}
              <motion.div
                className={`h-0.5 ${stat.barColor} rounded-full mx-auto mt-2`}
                initial={{ width: 0 }}
                whileHover={{ width: "100%" }}
                transition={{ duration: 0.35, ease: cubicBezier(0.22, 1, 0.36, 1) }}
                style={{ width: 0 }}
              />
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* ── Slide indicator dots ──────────────────────────────────────── */}
      <SlideDots
        total={images.length}
        current={currentIndex}
        onDotClick={goToSlide}
      />

      {/* ── Previous button ───────────────────────────────────────────── */}
      <motion.button
        onClick={prevSlide}
        variants={navBtnVariant}
        initial="hidden"
        animate={mounted ? "visible" : "hidden"}
        whileHover={{ scale: 1.12, backgroundColor: "rgba(255,255,255,0.2)" }}
        whileTap={{ scale: 0.93 }}
        className="absolute left-2 sm:left-3 md:left-6 top-1/2 -translate-y-1/2 z-50
          flex items-center justify-center
          w-9 h-9 sm:w-10 sm:h-10 md:w-14 md:h-14
          bg-black/40 sm:bg-white/10
          border border-white/20 backdrop-blur-md
          rounded-full text-white transition-colors duration-300"
        aria-label="Previous slide"
      >
        <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 md:w-8 md:h-8" />
      </motion.button>

      {/* ── Next button ───────────────────────────────────────────────── */}
      <motion.button
        onClick={nextSlide}
        variants={navBtnVariant}
        initial="hidden"
        animate={mounted ? "visible" : "hidden"}
        whileHover={{ scale: 1.12, backgroundColor: "rgba(255,255,255,0.2)" }}
        whileTap={{ scale: 0.93 }}
        className="absolute right-2 sm:right-3 md:right-6 top-1/2 -translate-y-1/2 z-50
          flex items-center justify-center
          w-9 h-9 sm:w-10 sm:h-10 md:w-14 md:h-14
          bg-black/40 sm:bg-white/10
          border border-white/20 backdrop-blur-md
          rounded-full text-white transition-colors duration-300"
        aria-label="Next slide"
      >
        <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 md:w-8 md:h-8" />
      </motion.button>
    </div>
  );
};