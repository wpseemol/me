'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

/**
 * Smooth scrolling, driven off the GSAP ticker rather than its own rAF loop.
 *
 * This is the bit that makes scroll-linked animation feel "designed" instead of
 * jittery: Lenis, ScrollTrigger and the canvas field all advance inside one
 * frame, in a fixed order, so a pinned section can never lag a frame behind the
 * scrollbar it is pinned to.
 *
 * Anyone who has asked their OS to reduce motion gets native scrolling.
 */
export default function SmoothScroll() {
  const pathname = usePathname();

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    gsap.registerPlugin(ScrollTrigger);

    const lenis = new Lenis({
      duration: 1.05,
      // Expo-out: fast pickup, long settle. Shorter curves feel like lag.
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      // Touch devices already have momentum scrolling; doubling it feels wrong.
      syncTouch: false,
    });

    lenis.on('scroll', ScrollTrigger.update);

    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    // Anchor links have to go through Lenis or they jump.
    const onClick = (e: MouseEvent) => {
      const link = (e.target as HTMLElement | null)?.closest?.('a[href^="#"]');
      if (!link) return;
      const id = link.getAttribute('href');
      if (!id || id === '#') return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      lenis.scrollTo(target as HTMLElement, { offset: -90 });
    };

    document.addEventListener('click', onClick);

    return () => {
      document.removeEventListener('click', onClick);
      gsap.ticker.remove(tick);
      lenis.destroy();
    };
  }, []);

  // App Router keeps the scroll container alive across routes, so both Lenis
  // and every ScrollTrigger need to be told the page underneath them changed.
  useEffect(() => {
    ScrollTrigger.refresh();
  }, [pathname]);

  return null;
}
