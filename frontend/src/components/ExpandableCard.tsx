import { useCallback, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";

interface ExpandableCardProps {
  children: ReactNode;
  /** Accessible name, e.g. the person's name. */
  label: string;
  /** Corner radius of the card, so the lifted shadow follows its shape. */
  radiusClassName?: string;
  /** Upper bound for how much the card is enlarged. */
  maxScale?: number;
}

interface Box {
  left: number;
  top: number;
  width: number;
  height: number;
}

interface Pose {
  x: number;
  y: number;
  scale: number;
}

const LIFT_SPRING = { type: "spring", stiffness: 240, damping: 28, mass: 0.9 } as const;

/**
 * Click a card and it lifts out of the page, scales up and settles in the middle
 * of the screen over a blurred backdrop. Click anywhere (or press Esc) and it
 * flies back to wherever the card currently sits.
 *
 * The card is rendered a second time in a portal at its measured position and
 * moved with a plain transform, so the content is scaled uniformly (no
 * layout-animation stretching). The original stays in place, hidden, so the
 * page doesn't reflow while the card is open.
 */
export default function ExpandableCard({
  children,
  label,
  radiusClassName = "rounded-2xl",
  maxScale = 1.7,
}: ExpandableCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState<Box | null>(null); // non-null while the overlay is mounted
  const [pose, setPose] = useState<Pose>({ x: 0, y: 0, scale: 1 });
  const [closing, setClosing] = useState(false);

  const open = useCallback(() => {
    const el = ref.current;
    if (!el || box) return;
    const r = el.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const scale = Math.max(1, Math.min(maxScale, (vw * 0.92) / r.width, (vh * 0.88) / r.height));
    setBox({ left: r.left, top: r.top, width: r.width, height: r.height });
    setPose({
      x: vw / 2 - (r.left + r.width / 2),
      y: vh / 2 - (r.top + r.height / 2),
      scale,
    });
    setClosing(false);
  }, [box, maxScale]);

  const close = useCallback(() => {
    const el = ref.current;
    if (!el || !box || closing) return;
    // Re-measure: the card may have moved since opening (page reflow, scroll).
    const r = el.getBoundingClientRect();
    setPose({ x: r.left - box.left, y: r.top - box.top, scale: 1 });
    setClosing(true);
  }, [box, closing]);

  // While open: Esc closes, page scroll is locked, and a width change just drops
  // the overlay (its measured position would be stale).
  useEffect(() => {
    if (!box) return;

    const html = document.documentElement;
    const body = document.body;
    const prevOverflow = html.style.overflow;
    const prevPadding = body.style.paddingRight;
    const scrollbar = window.innerWidth - html.clientWidth;
    html.style.overflow = "hidden";
    if (scrollbar > 0) body.style.paddingRight = `${scrollbar}px`;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    // Width only: mobile browsers fire height-only resizes as the URL bar
    // shows/hides, which shouldn't dismiss the card.
    const startWidth = window.innerWidth;
    const onResize = () => {
      if (window.innerWidth === startWidth) return;
      setBox(null);
      setClosing(false);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("resize", onResize);

    return () => {
      html.style.overflow = prevOverflow;
      body.style.paddingRight = prevPadding;
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onResize);
    };
  }, [box, close]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      open();
    }
  };

  return (
    <>
      <div
        ref={ref}
        role="button"
        tabIndex={0}
        aria-label={`View ${label} larger`}
        aria-haspopup="dialog"
        onClick={open}
        onKeyDown={handleKeyDown}
        className="cursor-zoom-in rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-[#006E3A] focus-visible:ring-offset-2"
        style={{ visibility: box ? "hidden" : "visible" }}
      >
        {children}
      </div>

      {box &&
        createPortal(
          <div
            className="fixed inset-0 z-[10000] cursor-zoom-out"
            role="dialog"
            aria-modal="true"
            aria-label={label}
            onClick={close}
          >
            <motion.div
              className="absolute inset-0 bg-black/40 backdrop-blur-md"
              initial={{ opacity: 0 }}
              animate={{ opacity: closing ? 0 : 1 }}
              transition={{ duration: 0.3 }}
            />

            <motion.div
              className={`pointer-events-none overflow-hidden ${radiusClassName}`}
              style={{
                position: "fixed",
                left: box.left,
                top: box.top,
                width: box.width,
                height: box.height,
              }}
              initial={{ x: 0, y: 0, scale: 1, boxShadow: "0 0 0 0 rgba(0,0,0,0)" }}
              animate={{
                x: pose.x,
                y: pose.y,
                scale: pose.scale,
                boxShadow: closing
                  ? "0 0 0 0 rgba(0,0,0,0)"
                  : "0 40px 90px -20px rgba(0,0,0,0.5)",
              }}
              transition={LIFT_SPRING}
              onAnimationComplete={() => {
                if (!closing) return;
                setBox(null);
                setClosing(false);
                ref.current?.focus({ preventScroll: true });
              }}
            >
              {children}
            </motion.div>
          </div>,
          document.body
        )}
    </>
  );
}
