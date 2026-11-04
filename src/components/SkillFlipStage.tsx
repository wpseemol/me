"use client";

import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type SVGProps,
} from "react";
import { flushSync } from "react-dom";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import site from "@/data/site.json";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

type Skill = (typeof site.stack)[number] & { blurb?: string };

const ACCENT: Record<string, string> = {
  HTML: "#E34F26",
  CSS: "#1572B6",
  "Tailwind CSS": "#38BDF8",
  React: "#61DAFB",
  "Next.js": "#A3A3A3",
  TypeScript: "#3178C6",
  Laravel: "#FF2D20",
  PHP: "#777BB4",
  "Node.js": "#5FA04E",
  Express: "#888888",
  MongoDB: "#47A248",
  MySQL: "#4479A1",
  Redis: "#DC382D",
  Docker: "#2496ED",
};

type IconP = SVGProps<SVGSVGElement>;

function I({ children, ...p }: IconP & { children: ReactNode }) {
  return (
    <svg viewBox="0 0 48 48" width="1em" height="1em" fill="none" aria-hidden {...p}>
      {children}
    </svg>
  );
}

/** Distinct mark per skill — not the same badge reused. */
const SKILL_ICON: Record<string, (p: IconP) => ReactNode> = {
  HTML: (p) => (
    <I {...p}>
      <path d="M8 6h32l-3 34-13 4-13-4L8 6Z" fill="currentColor" opacity="0.92" />
      <path d="M24 38.5 34.2 35.6 36.6 10H24v28.5Z" fill="#000" opacity="0.18" />
      <path d="M16.5 18h15.2l-.35 4H20.6l.25 2.8h9.9l-.55 6.1L24 33.2l-6.2-1.7-.4-4.4h3.9l.2 2.1 2.5.7 2.5-.7.2-2.1H16.8l.7-7.8Z" fill="#fff" />
    </I>
  ),
  CSS: (p) => (
    <I {...p}>
      <path d="M8 6h32l-3 34-13 4-13-4L8 6Z" fill="currentColor" opacity="0.92" />
      <path d="M24 38.5 34.2 35.6 36.6 10H24v28.5Z" fill="#000" opacity="0.18" />
      <path d="M17 18h14.5l-.4 4.2H21.2l.2 2.4h9.2l-.7 7.5L24 34.2l-5.9-1.6-.35-3.8h3.85l.15 1.7 2.25.6 2.25-.6.2-2.2H17.6L18.4 18Z" fill="#fff" />
    </I>
  ),
  "Tailwind CSS": (p) => (
    <I {...p}>
      <path
        d="M24 12c-5.3 0-8.6 2.65-10 7.95 2-2.65 4.3-3.65 7-3 1.55.37 2.65 1.45 3.9 2.65C26.9 21.7 29 23.7 33 23.7c5.3 0 8.6-2.65 10-7.95-2 2.65-4.3 3.65-7 3-1.55-.37-2.65-1.45-3.9-2.65C30.1 14 28 12 24 12Zm-10 12.3c-5.3 0-8.6 2.65-10 7.95 2-2.65 4.3-3.65 7-3 1.55.37 2.65 1.45 3.9 2.65 2 2.1 4.1 4.1 8.1 4.1 5.3 0 8.6-2.65 10-7.95-2 2.65-4.3 3.65-7 3-1.55-.37-2.65-1.45-3.9-2.65-2-2.1-4.1-4.1-8.1-4.1Z"
        fill="currentColor"
      />
    </I>
  ),
  React: (p) => (
    <I {...p}>
      <circle cx="24" cy="24" r="3.2" fill="currentColor" />
      <ellipse cx="24" cy="24" rx="18" ry="7.2" stroke="currentColor" strokeWidth="2" />
      <ellipse cx="24" cy="24" rx="18" ry="7.2" stroke="currentColor" strokeWidth="2" transform="rotate(60 24 24)" />
      <ellipse cx="24" cy="24" rx="18" ry="7.2" stroke="currentColor" strokeWidth="2" transform="rotate(120 24 24)" />
    </I>
  ),
  "Next.js": (p) => (
    <I {...p}>
      <circle cx="24" cy="24" r="16" stroke="currentColor" strokeWidth="2.2" />
      <path d="M20 16h3.2l8.6 13.2V16H35v16h-3.1L23.2 18.7V32H20V16Z" fill="currentColor" />
    </I>
  ),
  TypeScript: (p) => (
    <I {...p}>
      <rect x="7" y="7" width="34" height="34" rx="6" fill="currentColor" />
      <path d="M14.5 20.5h19v3.4H26.2V34h-3.8V23.9h-7.9v-3.4Z" fill="#fff" />
    </I>
  ),
  Laravel: (p) => (
    <I {...p}>
      <path
        d="m10 18 7-4 7 4v8l-7 4-7-4v-8Zm14 0 7-4 7 4v3.5l-7 4V32l-7-4V18Z"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
    </I>
  ),
  PHP: (p) => (
    <I {...p}>
      <ellipse cx="24" cy="24" rx="18" ry="11" fill="currentColor" opacity="0.9" />
      <path d="M13 21.5h5.2c2.1 0 3.4 1 3.4 2.8 0 1.9-1.4 3-3.5 3H15.6V32h-2.6v-10.5Zm2.6 3.8h2c.9 0 1.4-.4 1.4-1.1s-.5-1-1.4-1h-2v2.1Zm9.2-3.8h2.6l2.4 7.2 2.4-7.2h2.6L30.4 32h-2.7l-2.9-10.5Zm11.3 0H41v2.5h-2.3V32h-2.6V24h-2.3v-2.5Z" fill="#fff" />
    </I>
  ),
  "Node.js": (p) => (
    <I {...p}>
      <path
        d="M24 7.5 38 15.5v16.8L24 40.5 10 32.3V15.5L24 7.5Z"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
      <path d="M18.5 22.5c0-3.2 2-5.2 5.4-5.2 2.6 0 4.4 1.2 5.1 3.2l-2.5 1.3c-.4-1-.9-1.6-2.5-1.6-1.5 0-2.5.9-2.5 2.3v5c0 1.4 1 2.3 2.5 2.3 1.6 0 2.1-.7 2.5-1.6l2.5 1.3c-.7 2-2.5 3.2-5.1 3.2-3.4 0-5.4-2-5.4-5.2v-5Z" fill="currentColor" />
    </I>
  ),
  Express: (p) => (
    <I {...p}>
      <path d="M8 24h32" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M12 16h10l4 16h10" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="36" cy="16" r="2.4" fill="currentColor" />
    </I>
  ),
  MongoDB: (p) => (
    <I {...p}>
      <path
        d="M24 6c2.5 6.5 10 10.5 10 20.5S28 40 24 42c-4-2-10-5.5-10-15.5S21.5 12.5 24 6Z"
        fill="currentColor"
      />
      <path d="M24 14v24" stroke="#06140a" strokeOpacity="0.35" strokeWidth="2" strokeLinecap="round" />
    </I>
  ),
  MySQL: (p) => (
    <I {...p}>
      <path
        d="M10 28c2.5-8 8-14 16.5-14 6 0 9.5 3 11.5 8"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <path
        d="M14 20c3 6 7 10 14 12 5 1.4 9 .8 12-1"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <circle cx="34" cy="30" r="2.2" fill="currentColor" />
    </I>
  ),
  Redis: (p) => (
    <I {...p}>
      <path d="m8 20 16-6 16 6-16 6L8 20Z" fill="currentColor" opacity="0.95" />
      <path d="m8 26 16 6 16-6" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" />
      <path d="m8 32 16 6 16-6" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" opacity="0.7" />
    </I>
  ),
  Docker: (p) => (
    <I {...p}>
      <path d="M8 28.5h28c2.2 0 5.5-1.6 6.8-4.2-1.5.7-3.2 1-5.2.6-5.4-1.1-6.3-5.2-6.3-5.2s-3.1 1.8-7.4 1.8H8v7Z" fill="currentColor" />
      <rect x="11" y="20" width="5" height="5" rx="0.8" fill="currentColor" />
      <rect x="17.5" y="20" width="5" height="5" rx="0.8" fill="currentColor" />
      <rect x="24" y="20" width="5" height="5" rx="0.8" fill="currentColor" />
      <rect x="17.5" y="13.5" width="5" height="5" rx="0.8" fill="currentColor" />
      <rect x="24" y="13.5" width="5" height="5" rx="0.8" fill="currentColor" />
      <rect x="30.5" y="20" width="5" height="5" rx="0.8" fill="currentColor" />
    </I>
  ),
};

/**
 * Modern scroll skill stand — icon cards rise into focus with scale / slide /
 * blur. No 3D flip.
 */
export default function SkillFlipStage() {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const iconRef = useRef<HTMLDivElement>(null);
  const copyRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const skills = site.stack as Skill[];
  const total = skills.length;
  const skill = skills[active] ?? skills[0];
  const accent = ACCENT[skill.name] ?? "#1b63ff";
  const Icon = SKILL_ICON[skill.name];

  useEffect(() => {
    const section = sectionRef.current;
    const stage = stageRef.current;
    const icon = iconRef.current;
    const copy = copyRef.current;
    const bar = barRef.current;
    if (!section || !stage || !icon || !copy || !bar) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let last = -1;

    const show = (index: number, instant = false) => {
      if (index === last && !instant) return;
      const s = skills[index];
      if (!s) return;
      const color = ACCENT[s.name] ?? "#1b63ff";
      const dir = index >= last ? 1 : -1;

      if (instant || reduced) {
        gsap.set([icon, copy], { y: 0, opacity: 1, scale: 1, filter: "blur(0px)" });
        gsap.set(bar, { scaleX: s.level / 100, background: color });
        setActive(index);
        last = index;
        return;
      }

      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      // Soft stand transition: lift + blur out → swap icon card → rise in.
      tl.to([icon, copy], {
        y: dir * -28,
        opacity: 0,
        scale: 0.92,
        filter: "blur(8px)",
        duration: 0.28,
        stagger: 0.04,
        ease: "power2.in",
      })
        .add(() => {
          flushSync(() => setActive(index));
          gsap.set([icon, copy], {
            y: dir * 36,
            opacity: 0,
            scale: 0.9,
            filter: "blur(10px)",
          });
        })
        .to([icon, copy], {
          y: 0,
          opacity: 1,
          scale: 1,
          filter: "blur(0px)",
          duration: 0.48,
          stagger: 0.06,
          ease: "expo.out",
        })
        .to(
          bar,
          {
            scaleX: s.level / 100,
            background: color,
            duration: 0.55,
            ease: "expo.out",
          },
          "-=0.35",
        );

      last = index;
    };

    if (reduced) {
      show(0, true);
      return;
    }

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: section,
        start: "top top",
        end: () => `+=${Math.max(total, 4) * window.innerHeight * 0.68}`,
        pin: true,
        scrub: 0.55,
        anticipatePin: 1,
        onUpdate: (self) => {
          const idx = Math.min(total - 1, Math.floor(self.progress * total + 1e-6));
          show(idx);
        },
        onRefresh: (self) => {
          const idx = Math.min(total - 1, Math.floor(self.progress * total + 1e-6));
          show(idx, true);
        },
      });

      gsap.fromTo(
        stage,
        { y: 40, opacity: 0.5 },
        {
          y: 0,
          opacity: 1,
          ease: "none",
          scrollTrigger: {
            trigger: section,
            start: "top 85%",
            end: "top top",
            scrub: true,
          },
        },
      );

      show(0, true);
    }, section);

    return () => ctx.revert();
  }, [skills, total]);

  return (
    <section ref={sectionRef} className="relative" aria-labelledby="skill-stage-live">
      <div className="shell grid min-h-[100svh] items-center gap-10 py-14 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
        {/* Roadmap */}
        <div>
          <p
            id="skill-stage-live"
            className="font-mono text-2xs uppercase tracking-[0.16em] text-muted"
            aria-live="polite"
          >
            {String(active + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
            <span className="mx-2 opacity-40">·</span>
            {skill.group}
          </p>

          <h3 className="mt-4 text-[clamp(2rem,5vw,3.35rem)] leading-[0.98]">
            <span className="block text-muted">Build order,</span>
            <span className="grad-text">not a dump</span>
          </h3>

          <p className="mt-5 max-w-md text-[15px] leading-relaxed text-muted">
            Scroll to step through the stack the way it layers in real work —
            HTML, CSS, Tailwind, then frameworks, data, and Docker.
          </p>

          <ul className="mt-8 flex flex-wrap gap-2">
            {skills.map((s, i) => {
              const on = i === active;
              const color = ACCENT[s.name] ?? "var(--brand-500)";
              const Mini = SKILL_ICON[s.name];
              return (
                <li key={s.name}>
                  <span
                    className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1.5 text-xs font-medium transition-all duration-400 ${
                      on
                        ? "bg-elev/90 shadow-[0_10px_28px_-16px_rgb(var(--c-glow-a)/0.7)]"
                        : i < active
                          ? "opacity-70"
                          : "opacity-35"
                    }`}
                    style={
                      on
                        ? {
                            borderColor: `color-mix(in oklab, ${color} 50%, transparent)`,
                            color,
                          }
                        : undefined
                    }
                  >
                    {Mini ? (
                      <span className="text-[14px] leading-none">
                        <Mini width={14} height={14} />
                      </span>
                    ) : null}
                    {s.name}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Icon stand card */}
        <div ref={stageRef} className="relative mx-auto w-full max-w-lg will-change-transform">
          {/* Depth plates behind the active card */}
          <div
            aria-hidden
            className="absolute inset-x-6 top-6 h-full rounded-[28px] border bg-elev/40 opacity-40"
          />
          <div
            aria-hidden
            className="absolute inset-x-3 top-3 h-full rounded-[28px] border bg-elev/55 opacity-60"
          />

          <div
            aria-hidden
            className="absolute -inset-10 rounded-[40px] opacity-70 blur-3xl transition-[background] duration-500"
            style={{
              background: `radial-gradient(circle at 40% 30%, ${accent}40, transparent 65%)`,
            }}
          />

          <article className="relative overflow-hidden rounded-[28px] border bg-elev/90 p-7 shadow-[0_28px_70px_-36px_rgb(var(--c-glow-a)/0.8)] backdrop-blur-md sm:p-9">
            <div className="flex items-start justify-between gap-4">
              <div
                ref={iconRef}
                className="grid h-[5.5rem] w-[5.5rem] place-items-center rounded-[22px] border will-change-transform sm:h-[6.25rem] sm:w-[6.25rem]"
                style={{
                  color: accent,
                  background: `linear-gradient(145deg, color-mix(in oklab, ${accent} 22%, transparent), transparent 70%)`,
                  borderColor: `color-mix(in oklab, ${accent} 40%, transparent)`,
                  boxShadow: `inset 0 1px 0 color-mix(in oklab, ${accent} 35%, transparent), 0 18px 40px -24px ${accent}`,
                }}
              >
                {Icon ? (
                  <span className="text-[3rem] leading-none sm:text-[3.35rem]">
                    <Icon />
                  </span>
                ) : (
                  <span className="font-display text-2xl font-bold">{skill.name.slice(0, 2)}</span>
                )}
              </div>

              <div className="text-right">
                <p className="font-mono text-2xs uppercase tracking-[0.16em] text-muted">
                  proficiency
                </p>
                <p className="mt-1 font-display text-3xl font-bold tabular-nums sm:text-4xl">
                  {skill.level}
                  <span className="text-lg text-muted">%</span>
                </p>
              </div>
            </div>

            <div ref={copyRef} className="mt-8 will-change-transform">
              <p className="font-mono text-2xs uppercase tracking-[0.18em] text-muted">
                {skill.group}
              </p>
              <h4 className="mt-2 text-3xl tracking-tight sm:text-[2.55rem]">{skill.name}</h4>
              <p className="mt-3 min-h-[3.4em] max-w-md text-sm leading-relaxed text-muted sm:text-[15px]">
                {skill.blurb ?? `Production experience with ${skill.name}.`}
              </p>
            </div>

            <div className="mt-8">
              <div className="mb-2 flex justify-between font-mono text-2xs text-muted">
                <span>
                  {active === 0
                    ? "Begin · HTML"
                    : active === total - 1
                      ? "Ship · Docker"
                      : "Scroll to next skill"}
                </span>
                <span>{skill.level}/100</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-surface">
                <div
                  ref={barRef}
                  className="h-full w-full origin-left scale-x-0 rounded-full"
                  style={{ background: accent }}
                />
              </div>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
