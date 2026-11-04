"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useTheme } from "@/components/ThemeProvider";
import {
  CrescentGlowIcon,
  ShootingStarIcon,
  SunRayBurstIcon,
} from "@/components/ui/icons";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

/**
 * Background celestial layer (scroll speed ~0.1–0.2×).
 * Sun/moon swap with the theme; soft blooms and clouds drift under content.
 */
export default function CelestialParallaxSky() {
  const rootRef = useRef<HTMLDivElement>(null);
  const { theme, ready } = useTheme();
  const isDark = theme === "dark";

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>("[data-sky-layer]").forEach((el) => {
        const speed = Number(el.dataset.speed ?? 0.15);
        gsap.to(el, {
          y: () => window.innerHeight * speed * 0.55,
          ease: "none",
          scrollTrigger: {
            trigger: document.documentElement,
            start: "top top",
            end: "bottom bottom",
            scrub: 0.85,
          },
        });
      });

      gsap.to("[data-sky-orbit]", {
        rotation: 12,
        ease: "none",
        scrollTrigger: {
          trigger: document.documentElement,
          start: "top top",
          end: "bottom bottom",
          scrub: 1.2,
        },
      });
    }, root);

    return () => ctx.revert();
  }, []);

  return (
    <div
      ref={rootRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      {/* Ambient radial blooms */}
      <div
        data-sky-layer
        data-speed="0.12"
        className="absolute inset-0 will-change-transform"
      >
        <div
          className="absolute -left-[12%] top-[-8%] h-[48vmax] w-[48vmax] rounded-full opacity-50 blur-3xl transition-colors duration-700"
          style={{
            background: isDark
              ? "radial-gradient(circle, rgb(var(--c-glow-a) / 0.22), transparent 68%)"
              : "radial-gradient(circle, rgb(var(--c-glow-a) / 0.14), transparent 68%)",
          }}
        />
        <div
          className="absolute -right-[10%] top-[18%] h-[42vmax] w-[42vmax] rounded-full opacity-45 blur-3xl transition-colors duration-700"
          style={{
            background: isDark
              ? "radial-gradient(circle, rgb(var(--c-glow-b) / 0.18), transparent 70%)"
              : "radial-gradient(circle, rgb(var(--c-glow-b) / 0.12), transparent 70%)",
          }}
        />
        <div
          className="absolute bottom-[-18%] left-[28%] h-[36vmax] w-[36vmax] rounded-full opacity-35 blur-3xl"
          style={{
            background: isDark
              ? "radial-gradient(circle, rgb(99 70 180 / 0.16), transparent 72%)"
              : "radial-gradient(circle, rgb(255 196 77 / 0.18), transparent 72%)",
          }}
        />
      </div>

      {/* Soft cloud blurs */}
      <div
        data-sky-layer
        data-speed="0.18"
        className="absolute inset-0 will-change-transform"
      >
        <div className="absolute left-[8%] top-[22%] h-24 w-56 rounded-full bg-white/5 blur-2xl dark:bg-white/[0.04]" />
        <div className="absolute right-[14%] top-[38%] h-20 w-72 rounded-full bg-white/6 blur-3xl dark:bg-white/[0.035]" />
        <div className="absolute left-[35%] top-[58%] h-28 w-64 rounded-full bg-brand-500/5 blur-3xl" />
      </div>

      {/* Celestial orbit (sun ↔ moon) */}
      <div
        data-sky-layer
        data-speed="0.14"
        className="absolute inset-x-0 top-0 h-[70vh] will-change-transform"
      >
        <div
          data-sky-orbit
          className="absolute right-[6%] top-[9%] origin-center sm:right-[10%] sm:top-[12%]"
        >
          <div
            className={`transition-all duration-700 ease-[var(--ease-fluid)] ${
              ready && !isDark
                ? "scale-100 opacity-100"
                : "pointer-events-none scale-75 opacity-0"
            }`}
          >
            <SunRayBurstIcon
              animate
              width={72}
              height={72}
              className="text-amber-400/80 drop-shadow-[0_0_24px_rgb(255_180_60_/0.45)]"
            />
          </div>
          <div
            className={`absolute inset-0 transition-all duration-700 ease-[var(--ease-fluid)] ${
              ready && isDark
                ? "scale-100 opacity-100"
                : "pointer-events-none scale-75 opacity-0"
            }`}
          >
            <CrescentGlowIcon
              width={68}
              height={68}
              className="text-brand-200/90 drop-shadow-[0_0_28px_rgb(133_166_255_/0.4)]"
            />
          </div>
        </div>

        {isDark ? (
          <>
            <ShootingStarIcon
              width={42}
              height={42}
              className="absolute left-[12%] top-[28%] rotate-[-8deg] text-brand-200/50 opacity-70 hidden sm:block"
            />
            <ShootingStarIcon
              width={28}
              height={28}
              className="absolute right-[28%] top-[18%] rotate-[12deg] text-accent-400/40 opacity-60 hidden md:block"
            />
          </>
        ) : null}
      </div>
    </div>
  );
}
