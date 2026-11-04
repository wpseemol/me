"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useTheme } from "@/components/ThemeProvider";
import { asset } from "@/lib/asset";
import { ShootingStarIcon } from "@/components/ui/icons";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

/**
 * Premium multi-depth sky: day/night photo layers, cloud bands, and a
 * sun/moon orb that rises or sets on theme toggle. Scroll drives parallax
 * so the imagery feels like it's drifting through depth.
 */
export default function CelestialParallaxSky() {
  const rootRef = useRef<HTMLDivElement>(null);
  const sunRef = useRef<HTMLDivElement>(null);
  const moonRef = useRef<HTMLDivElement>(null);
  const { theme, ready } = useTheme();
  const isDark = theme === "dark";
  const prevTheme = useRef<typeof theme | null>(null);

  /* ---------------- scroll parallax ------------------------------------ */
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>("[data-sky-layer]").forEach((el) => {
        const speed = Number(el.dataset.speed ?? 0.15);
        gsap.to(el, {
          y: () => window.innerHeight * speed * 0.7,
          ease: "none",
          scrollTrigger: {
            trigger: document.documentElement,
            start: "top top",
            end: "bottom bottom",
            scrub: 0.9,
          },
        });
      });

      gsap.to("[data-sky-drift]", {
        xPercent: 8,
        ease: "none",
        scrollTrigger: {
          trigger: document.documentElement,
          start: "top top",
          end: "bottom bottom",
          scrub: 1.1,
        },
      });
    }, root);

    return () => ctx.revert();
  }, []);

  /* ---------------- sun rise / moon rise on theme ---------------------- */
  useEffect(() => {
    if (!ready) return;
    const sun = sunRef.current;
    const moon = moonRef.current;
    if (!sun || !moon) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const firstPaint = prevTheme.current === null;
    prevTheme.current = theme;

    // Light: sun high-right. Dark: sun below horizon. Moon is the inverse.
    const sunUp = { y: 0, x: 0, scale: 1, opacity: 1, rotate: 0 };
    const sunDown = { y: 140, x: 36, scale: 0.72, opacity: 0, rotate: 18 };
    const moonUp = { y: 0, x: 0, scale: 1, opacity: 1, rotate: 0 };
    const moonDown = { y: 150, x: -28, scale: 0.7, opacity: 0, rotate: -14 };

    if (firstPaint || reduced) {
      gsap.set(sun, isDark ? sunDown : sunUp);
      gsap.set(moon, isDark ? moonUp : moonDown);
      return;
    }

    const duration = 1.15;
    const ease = "power3.inOut";

    if (isDark) {
      // Sunset → moonrise
      gsap.to(sun, { ...sunDown, duration, ease });
      gsap.fromTo(
        moon,
        { ...moonDown, y: 160 },
        { ...moonUp, duration, ease, delay: 0.12 },
      );
    } else {
      // Sunrise → moonset
      gsap.to(moon, { ...moonDown, duration, ease });
      gsap.fromTo(
        sun,
        { ...sunDown, y: 160 },
        { ...sunUp, duration, ease, delay: 0.12 },
      );
    }
  }, [theme, ready, isDark]);

  return (
    <div
      ref={rootRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      {/* ---- Day sky plate (scroll 0.12×) -------------------------------- */}
      <div
        data-sky-layer
        data-speed="0.12"
        className="absolute inset-[-12%] will-change-transform"
      >
        <Image
          src={asset("/images/parallax/day-sky.jpg")}
          alt=""
          fill
          priority
          sizes="100vw"
          className={`object-cover transition-opacity duration-1000 ease-[var(--ease-fluid)] ${
            isDark ? "opacity-0" : "opacity-55"
          }`}
        />
        <div
          className={`absolute inset-0 transition-opacity duration-1000 ${
            isDark ? "opacity-0" : "opacity-100"
          }`}
          style={{
            background:
              "linear-gradient(180deg, transparent 40%, var(--c-bg) 92%)",
          }}
        />
      </div>

      {/* ---- Night sky plate (scroll 0.14×) ------------------------------ */}
      <div
        data-sky-layer
        data-speed="0.14"
        className="absolute inset-[-14%] will-change-transform"
      >
        <Image
          src={asset("/images/parallax/night-sky.jpg")}
          alt=""
          fill
          sizes="100vw"
          className={`object-cover transition-opacity duration-1000 ease-[var(--ease-fluid)] ${
            isDark ? "opacity-60" : "opacity-0"
          }`}
        />
        <div
          className={`absolute inset-0 transition-opacity duration-1000 ${
            isDark ? "opacity-100" : "opacity-0"
          }`}
          style={{
            background:
              "linear-gradient(180deg, transparent 35%, var(--c-bg) 90%)",
          }}
        />
      </div>

      {/* Ambient brand blooms under the photos */}
      <div
        data-sky-layer
        data-speed="0.1"
        className="absolute inset-0 will-change-transform"
      >
        <div
          className="absolute -left-[10%] top-[-6%] h-[44vmax] w-[44vmax] rounded-full blur-3xl transition-opacity duration-700"
          style={{
            background: isDark
              ? "radial-gradient(circle, rgb(var(--c-glow-a) / 0.18), transparent 68%)"
              : "radial-gradient(circle, rgb(255 180 60 / 0.16), transparent 68%)",
          }}
        />
        <div
          className="absolute -right-[8%] top-[20%] h-[38vmax] w-[38vmax] rounded-full blur-3xl"
          style={{
            background: isDark
              ? "radial-gradient(circle, rgb(var(--c-glow-b) / 0.14), transparent 70%)"
              : "radial-gradient(circle, rgb(var(--c-glow-b) / 0.1), transparent 70%)",
          }}
        />
      </div>

      {/* ---- Cloud band (mid, drifts sideways + scrolls) ----------------- */}
      <div
        data-sky-layer
        data-speed="0.28"
        className="absolute inset-x-[-20%] top-[8%] h-[42vh] will-change-transform hidden sm:block"
      >
        <div data-sky-drift className="relative h-full w-full">
          <Image
            src={asset("/images/parallax/clouds.jpg")}
            alt=""
            fill
            sizes="120vw"
            className="object-cover opacity-35 mix-blend-screen dark:opacity-25 dark:mix-blend-screen"
          />
        </div>
      </div>

      {/* Second cloud strip, faster foreground feel */}
      <div
        data-sky-layer
        data-speed="0.45"
        className="absolute inset-x-[-25%] top-[28%] h-[28vh] will-change-transform hidden md:block"
      >
        <div data-sky-drift className="relative h-full w-[120%]">
          <Image
            src={asset("/images/parallax/clouds.jpg")}
            alt=""
            fill
            sizes="140vw"
            className="scale-x-[-1] object-cover opacity-20 mix-blend-screen dark:opacity-15"
          />
        </div>
      </div>

      {/* ---- Sun orb (rises in light / sets into dark) ------------------- */}
      <div
        data-sky-layer
        data-speed="0.2"
        className="absolute inset-x-0 top-0 h-[70vh] will-change-transform"
      >
        <div
          ref={sunRef}
          className="absolute right-[4%] top-[6%] h-[clamp(7rem,18vw,13rem)] w-[clamp(7rem,18vw,13rem)] will-change-transform sm:right-[8%] sm:top-[8%]"
        >
          <Image
            src={asset("/images/parallax/sun.jpg")}
            alt=""
            fill
            sizes="(max-width: 768px) 30vw, 220px"
            className="object-contain mix-blend-screen drop-shadow-[0_0_40px_rgb(255_180_60_/0.45)]"
          />
        </div>

        <div
          ref={moonRef}
          className="absolute right-[5%] top-[7%] h-[clamp(6.5rem,16vw,12rem)] w-[clamp(6.5rem,16vw,12rem)] will-change-transform sm:right-[9%] sm:top-[9%]"
        >
          <Image
            src={asset("/images/parallax/moon.jpg")}
            alt=""
            fill
            sizes="(max-width: 768px) 28vw, 200px"
            className="object-contain mix-blend-screen drop-shadow-[0_0_36px_rgb(133_166_255_/0.4)]"
          />
        </div>

        {isDark ? (
          <>
            <ShootingStarIcon
              width={42}
              height={42}
              className="absolute left-[12%] top-[28%] hidden rotate-[-8deg] text-brand-200/50 opacity-70 sm:block"
            />
            <ShootingStarIcon
              width={28}
              height={28}
              className="absolute right-[28%] top-[18%] hidden rotate-[12deg] text-accent-400/40 opacity-55 md:block"
            />
          </>
        ) : null}
      </div>
    </div>
  );
}
