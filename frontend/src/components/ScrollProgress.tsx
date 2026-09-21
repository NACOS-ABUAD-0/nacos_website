import { motion, useScroll, useSpring } from "framer-motion";

// Thin green bar at the top of the viewport that fills as the page is scrolled.
export default function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 30, restDelta: 0.001 });

  return (
    <motion.div
      aria-hidden
      className="fixed top-0 left-0 right-0 h-[3px] z-[9998] origin-left bg-gradient-to-r from-[#006E3A] to-green-400 pointer-events-none"
      style={{ scaleX }}
    />
  );
}
