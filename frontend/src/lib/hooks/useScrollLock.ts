import { useEffect } from "react";

/**
 * Locks background page scroll while `locked` is true — used for any popup/
 * modal/drawer (mobile nav hamburger, upload dialogs, etc.) so touch-drag
 * scrolling stays inside the popup instead of the underlying page.
 *
 * Plain `document.body.style.overflow = "hidden"` looks right but doesn't
 * reliably block touch-scroll on mobile Safari — the visual viewport can
 * still rubber-band scroll underneath a fixed-position overlay. Pinning the
 * body itself with `position: fixed` (and restoring the exact scroll
 * position on unlock) actually removes it from the scrollable flow, which
 * is the technique that holds up across mobile browsers.
 */
export function useScrollLock(locked: boolean) {
  useEffect(() => {
    if (!locked) return;

    const scrollY = window.scrollY;
    const { style } = document.body;
    const previous = {
      position: style.position,
      top: style.top,
      left: style.left,
      right: style.right,
      overflow: style.overflow,
      width: style.width,
    };

    style.position = "fixed";
    style.top = `-${scrollY}px`;
    style.left = "0";
    style.right = "0";
    style.width = "100%";
    style.overflow = "hidden";

    return () => {
      style.position = previous.position;
      style.top = previous.top;
      style.left = previous.left;
      style.right = previous.right;
      style.overflow = previous.overflow;
      style.width = previous.width;
      window.scrollTo(0, scrollY);
    };
  }, [locked]);
}
