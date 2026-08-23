'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

/**
 * A two-part cursor: a hard dot that tracks exactly, and a ring that trails it.
 *
 * The ring is the honest part of the interface — it grows over anything
 * clickable and collapses inward while the pointer is held, which is the same
 * moment the canvas field switches from pushing glyphs away to pulling them in.
 * The native cursor is never hidden, so nobody loses their pointer if this
 * fails to load.
 */
export default function Cursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const dot = dotRef.current;
    const ring = ringRef.current;
    if (!dot || !ring) return;

    // Pointer-precision check, not a width check: a small laptop still has a
    // mouse and a large tablet still does not.
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    gsap.set([dot, ring], { xPercent: -50, yPercent: -50, autoAlpha: 0 });

    const dotX = gsap.quickTo(dot, 'x', { duration: 0.1, ease: 'power3.out' });
    const dotY = gsap.quickTo(dot, 'y', { duration: 0.1, ease: 'power3.out' });
    const ringX = gsap.quickTo(ring, 'x', { duration: 0.45, ease: 'power3.out' });
    const ringY = gsap.quickTo(ring, 'y', { duration: 0.45, ease: 'power3.out' });

    let shown = false;

    const onMove = (e: PointerEvent) => {
      if (!shown) {
        shown = true;
        gsap.to([dot, ring], { autoAlpha: 1, duration: 0.3 });
      }
      dotX(e.clientX);
      dotY(e.clientY);
      ringX(e.clientX);
      ringY(e.clientY);

      const interactive = (e.target as HTMLElement | null)?.closest?.(
        'a, button, [role="button"], input, textarea, select, summary',
      );
      gsap.to(ring, {
        scale: interactive ? 1.75 : 1,
        borderColor: interactive
          ? 'color-mix(in oklab, var(--accent-400) 90%, transparent)'
          : 'color-mix(in oklab, var(--brand-500) 70%, transparent)',
        duration: 0.32,
        ease: 'power3.out',
      });
    };

    const onDown = () => gsap.to(ring, { scale: 0.72, duration: 0.22, ease: 'power3.out' });
    const onUp = () => gsap.to(ring, { scale: 1, duration: 0.35, ease: 'power3.out' });
    const onLeave = () => gsap.to([dot, ring], { autoAlpha: 0, duration: 0.2 });
    const onEnter = () => gsap.to([dot, ring], { autoAlpha: 1, duration: 0.2 });

    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerdown', onDown, { passive: true });
    window.addEventListener('pointerup', onUp, { passive: true });
    document.addEventListener('pointerleave', onLeave);
    document.addEventListener('pointerenter', onEnter);

    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointerup', onUp);
      document.removeEventListener('pointerleave', onLeave);
      document.removeEventListener('pointerenter', onEnter);
      gsap.killTweensOf([dot, ring]);
    };
  }, []);

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[90] hidden md:block">
      <div
        ref={dotRef}
        className="absolute top-0 left-0 h-1.5 w-1.5 rounded-full bg-accent-400 opacity-0"
      />
      <div
        ref={ringRef}
        className="absolute top-0 left-0 h-9 w-9 rounded-full border opacity-0"
        style={{ borderColor: 'color-mix(in oklab, var(--brand-500) 70%, transparent)' }}
      />
    </div>
  );
}
