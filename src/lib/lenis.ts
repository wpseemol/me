import type Lenis from "lenis";

let instance: Lenis | null = null;

export function setLenis(lenis: Lenis | null) {
  instance = lenis;
}

export function getLenis() {
  return instance;
}

/** Scroll the page (Lenis when available, native otherwise). */
export function scrollToY(
  y: number,
  opts?: { duration?: number; immediate?: boolean },
) {
  const lenis = instance;
  if (lenis) {
    lenis.scrollTo(y, {
      duration: opts?.immediate ? 0 : (opts?.duration ?? 0.85),
      force: true,
    });
    return;
  }
  window.scrollTo({
    top: y,
    behavior: opts?.immediate ? "auto" : "smooth",
  });
}
