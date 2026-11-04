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
  opts?: {
    duration?: number;
    immediate?: boolean;
    onComplete?: () => void;
  },
) {
  const lenis = instance;
  if (lenis) {
    lenis.scrollTo(y, {
      duration: opts?.immediate ? 0 : (opts?.duration ?? 0.85),
      force: true,
      lock: true,
      onComplete: opts?.onComplete,
    });
    return;
  }
  window.scrollTo({
    top: y,
    behavior: opts?.immediate ? "auto" : "smooth",
  });
  if (opts?.onComplete) {
    window.setTimeout(opts.onComplete, opts?.immediate ? 0 : 700);
  }
}
