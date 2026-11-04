"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  BeeHoneycombIcon,
  FishRippleIcon,
  HoneyDropIcon,
  LeafFloatIcon,
  ShootingStarIcon,
} from "@/components/ui/icons";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

type Deco = {
  id: string;
  speed: number;
  rotate?: number;
  className: string;
  mobile?: boolean;
  node: ReactNode;
};

/**
 * Multi-depth scroll decorations:
 * - Midground (0.4–0.7×): nature / geometry badges that drift + rotate
 * - Foreground (1.1–1.3×): light specks, stardust, bubbles overshooting scroll
 *
 * Uses GSAP ScrollTrigger (project motion stack) rather than Framer Motion.
 */
export default function ScrollParallaxDecorations() {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>("[data-para]").forEach((el) => {
        const speed = Number(el.dataset.speed ?? 0.5);
        const rotate = Number(el.dataset.rotate ?? 0);
        // speed 1 = locked to scroll; <1 lags (background), >1 leads (foreground)
        const travel = (speed - 1) * -280;

        gsap.fromTo(
          el,
          { y: -travel * 0.35, rotate: rotate ? -rotate : 0 },
          {
            y: travel * 0.65,
            rotate: rotate || 0,
            ease: "none",
            scrollTrigger: {
              trigger: document.documentElement,
              start: "top top",
              end: "bottom bottom",
              scrub: 0.7,
            },
          },
        );
      });
    }, root);

    return () => ctx.revert();
  }, []);

  const mid: Deco[] = [
    {
      id: "honey-a",
      speed: 0.45,
      rotate: 18,
      className: "left-[4%] top-[18%] text-amber-500/55",
      node: <HoneyDropIcon width={36} height={36} />,
    },
    {
      id: "leaf-a",
      speed: 0.55,
      rotate: -22,
      className: "right-[5%] top-[32%] text-emerald-600/45 dark:text-emerald-400/40",
      node: <LeafFloatIcon width={40} height={40} />,
    },
    {
      id: "comb-a",
      speed: 0.62,
      rotate: 12,
      className: "left-[8%] top-[52%] text-amber-600/40 hidden sm:block",
      node: <BeeHoneycombIcon width={34} height={34} />,
    },
    {
      id: "wave-a",
      speed: 0.5,
      rotate: -8,
      className: "right-[7%] top-[68%] text-accent-500/45 hidden sm:block",
      node: <FishRippleIcon width={44} height={44} />,
    },
    {
      id: "honey-b",
      speed: 0.7,
      rotate: -14,
      className: "left-[12%] top-[78%] text-amber-400/35 hidden md:block",
      node: <HoneyDropIcon width={28} height={28} />,
    },
    {
      id: "leaf-b",
      speed: 0.48,
      rotate: 16,
      className: "right-[14%] top-[88%] text-emerald-500/35 hidden md:block",
      node: <LeafFloatIcon width={30} height={30} />,
    },
  ];

  const fore: Deco[] = [
    {
      id: "speck-a",
      speed: 1.15,
      className:
        "left-[18%] top-[24%] h-1.5 w-1.5 rounded-full bg-brand-300/70 hidden sm:block",
      node: null,
    },
    {
      id: "speck-b",
      speed: 1.22,
      className:
        "right-[22%] top-[40%] h-1 w-1 rounded-full bg-accent-400/60 hidden sm:block",
      node: null,
    },
    {
      id: "bubble-a",
      speed: 1.18,
      className:
        "left-[28%] top-[58%] h-2.5 w-2.5 rounded-full border border-accent-400/35 bg-accent-400/10 hidden sm:block",
      node: null,
    },
    {
      id: "star-a",
      speed: 1.28,
      rotate: -10,
      className: "right-[18%] top-[72%] text-brand-200/40 hidden md:block dark:opacity-80 opacity-40",
      node: <ShootingStarIcon width={26} height={26} />,
    },
    {
      id: "bubble-b",
      speed: 1.12,
      className:
        "left-[6%] top-[90%] h-2 w-2 rounded-full border border-brand-400/30 bg-brand-400/10 hidden sm:block",
      node: null,
    },
    {
      id: "speck-c",
      speed: 1.3,
      className:
        "right-[9%] top-[14%] h-1 w-1 rounded-full bg-white/50 hidden sm:block dark:bg-white/40",
      node: null,
    },
  ];

  return (
    <div
      ref={rootRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 -z-[1] overflow-hidden"
    >
      {mid.map((d) => (
        <div
          key={d.id}
          data-para
          data-speed={d.speed}
          data-rotate={d.rotate ?? 0}
          className={`absolute will-change-transform ${d.className}`}
        >
          {d.node}
        </div>
      ))}
      {fore.map((d) => (
        <div
          key={d.id}
          data-para
          data-speed={d.speed}
          data-rotate={d.rotate ?? 0}
          className={`absolute will-change-transform ${d.className}`}
        >
          {d.node}
        </div>
      ))}
    </div>
  );
}
