"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
  PHP: "#8892BF",
  "Node.js": "#5FA04E",
  Express: "#888888",
  MongoDB: "#47A248",
  MySQL: "#4479A1",
  Redis: "#DC382D",
  Docker: "#2496ED",
};

const MARK: Record<string, string> = {
  HTML: "</>",
  CSS: "{}",
  "Tailwind CSS": "tw",
  React: "⚛",
  "Next.js": "N",
  TypeScript: "TS",
  Laravel: "Lv",
  PHP: "php",
  "Node.js": "JS",
  Express: "ex",
  MongoDB: "db",
  MySQL: "sql",
  Redis: "⚡",
  Docker: "⬡",
};

/**
 * Scroll-pinned skill stage: as you scroll, cards flip through the stack
 * in learning order — HTML → CSS → Tailwind → … → Docker.
 */
export default function SkillFlipStage() {
  const sectionRef = useRef<HTMLElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const faceRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<SVGCircleElement>(null);
  const [active, setActive] = useState(0);
  const skills = site.stack as Skill[];
  const total = skills.length;

  const skill = skills[active] ?? skills[0];
  const accent = ACCENT[skill.name] ?? "var(--brand-500)";
  const mark = MARK[skill.name] ?? skill.name.slice(0, 2);

  const circumference = useMemo(() => 2 * Math.PI * 42, []);

  useEffect(() => {
    const section = sectionRef.current;
    const card = cardRef.current;
    const face = faceRef.current;
    const ring = ringRef.current;
    if (!section || !card || !face || !ring) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let lastIndex = -1;

    const paint = (index: number, instant = false) => {
      const s = skills[index];
      if (!s) return;
      const color = ACCENT[s.name] ?? "#1b63ff";
      const level = s.level / 100;
      const offset = circumference * (1 - level);

      if (instant || reduced) {
        gsap.set(face, { rotateY: 0, opacity: 1 });
        gsap.set(ring, { strokeDashoffset: offset, stroke: color });
        setActive(index);
        lastIndex = index;
        return;
      }

      if (index === lastIndex) return;

      const dir = index > lastIndex ? 1 : -1;
      const tl = gsap.timeline({ defaults: { ease: "power3.inOut" } });

      // Flip to edge → swap skill → flip open (premium card flip).
      tl.to(face, { rotateY: dir * 90, opacity: 0.25, duration: 0.26 }, 0)
        .add(() => setActive(index))
        .set(face, { rotateY: dir * -90 })
        .to(face, { rotateY: 0, opacity: 1, duration: 0.34 })
        .to(
          ring,
          {
            strokeDashoffset: offset,
            stroke: color,
            duration: 0.55,
            ease: "expo.out",
          },
          0.22,
        );

      lastIndex = index;
    };

    if (reduced) {
      paint(0, true);
      return;
    }

    const ctx = gsap.context(() => {
      // Pin the stage and scrub through each skill as a flip step.
      ScrollTrigger.create({
        trigger: section,
        start: "top top",
        end: () => `+=${Math.max(total, 4) * window.innerHeight * 0.72}`,
        pin: true,
        scrub: 0.65,
        anticipatePin: 1,
        onUpdate: (self) => {
          const idx = Math.min(
            total - 1,
            Math.floor(self.progress * total + 1e-6),
          );
          paint(idx);
        },
        onRefresh: (self) => {
          const idx = Math.min(
            total - 1,
            Math.floor(self.progress * total + 1e-6),
          );
          paint(idx, true);
        },
      });

      gsap.fromTo(
        card,
        { y: 28, opacity: 0.4, rotateX: 8 },
        {
          y: 0,
          opacity: 1,
          rotateX: 0,
          ease: "none",
          scrollTrigger: {
            trigger: section,
            start: "top 80%",
            end: "top top",
            scrub: true,
          },
        },
      );

      paint(0, true);
    }, section);

    return () => ctx.revert();
  }, [circumference, skills, total]);

  return (
    <section
      ref={sectionRef}
      className="relative"
      aria-labelledby="skill-flip-live"
    >
      <div className="shell grid min-h-[100svh] items-center gap-10 py-16 lg:grid-cols-[0.95fr_1.05fr] lg:gap-14">
        {/* Copy + roadmap */}
        <div>
          <p
            id="skill-flip-live"
            className="font-mono text-2xs uppercase tracking-[0.16em] text-muted"
            aria-live="polite"
          >
            Step {String(active + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
            <span className="mx-2 opacity-40">·</span>
            {skill.group}
          </p>

          <h3 className="mt-4 text-[clamp(2rem,5vw,3.4rem)] leading-[0.98]">
            <span className="block text-muted">First principles,</span>
            <span className="grad-text">then the stack</span>
          </h3>

          <p className="mt-5 max-w-md text-[15px] leading-relaxed text-muted sm:text-[16px]">
            Scroll to flip through the tools in the order they actually stack —
            HTML, CSS, Tailwind, then the frameworks and platforms I ship with.
          </p>

          <ol className="mt-9 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {skills.map((s, i) => {
              const on = i === active;
              const done = i < active;
              return (
                <li
                  key={s.name}
                  className={`rounded-xl border px-3 py-2.5 transition-all duration-400 ${
                    on
                      ? "border-[color-mix(in_oklab,var(--brand-500)_55%,transparent)] bg-elev/80 shadow-[0_12px_30px_-18px_rgb(var(--c-glow-a)/0.55)]"
                      : done
                        ? "border-transparent bg-surface/70 text-muted"
                        : "border-transparent opacity-45"
                  }`}
                >
                  <span className="block font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span
                    className={`mt-0.5 block text-sm font-semibold ${on ? "text-body" : ""}`}
                  >
                    {s.name}
                  </span>
                </li>
              );
            })}
          </ol>
        </div>

        {/* Premium flip card */}
        <div className="relative mx-auto w-full max-w-md perspective-[1200px]">
          <div
            aria-hidden
            className="absolute -inset-8 rounded-[36px] opacity-60 blur-3xl transition-colors duration-500"
            style={{
              background: `radial-gradient(circle at 50% 40%, ${accent}55, transparent 68%)`,
            }}
          />

          <div
            ref={cardRef}
            className="relative will-change-transform"
            style={{ transformStyle: "preserve-3d" }}
          >
            <div
              ref={faceRef}
              className="relative overflow-hidden rounded-[28px] border bg-elev/85 p-7 shadow-[0_30px_80px_-40px_rgb(var(--c-glow-a)/0.85)] backdrop-blur-md will-change-transform sm:p-9"
              style={{ transformStyle: "preserve-3d", backfaceVisibility: "hidden" }}
            >
              <div
                className="absolute inset-x-0 top-0 h-1.5"
                style={{ background: accent }}
              />

              <div className="flex items-start justify-between gap-4">
                <div
                  className="grid h-16 w-16 place-items-center rounded-2xl border text-xl font-bold tracking-tight transition-colors duration-500"
                  style={{
                    color: accent,
                    background: `color-mix(in oklab, ${accent} 14%, transparent)`,
                    borderColor: `color-mix(in oklab, ${accent} 35%, transparent)`,
                  }}
                >
                  {mark}
                </div>

                <div className="relative h-[5.5rem] w-[5.5rem]">
                  <svg viewBox="0 0 100 100" className="-rotate-90">
                    <circle
                      cx="50"
                      cy="50"
                      r="42"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="6"
                      className="text-line/40"
                    />
                    <circle
                      ref={ringRef}
                      cx="50"
                      cy="50"
                      r="42"
                      fill="none"
                      stroke={accent}
                      strokeWidth="6"
                      strokeLinecap="round"
                      strokeDasharray={circumference}
                      strokeDashoffset={circumference}
                    />
                  </svg>
                  <span className="absolute inset-0 grid place-items-center font-mono text-sm font-semibold">
                    {skill.level}%
                  </span>
                </div>
              </div>

              <p className="mt-8 font-mono text-2xs uppercase tracking-[0.18em] text-muted">
                {skill.group}
              </p>
              <h4 className="mt-2 text-3xl sm:text-4xl">{skill.name}</h4>
              <p className="mt-4 min-h-[3.2em] text-sm leading-relaxed text-muted sm:text-[15px]">
                {"blurb" in skill && skill.blurb
                  ? skill.blurb
                  : `Production experience with ${skill.name}.`}
              </p>

              <div className="mt-8 flex items-center justify-between border-t pt-5">
                <span className="font-mono text-2xs text-muted">
                  {active === 0
                    ? "Start · HTML"
                    : active === total - 1
                      ? "Ship · Docker"
                      : "Scroll to flip →"}
                </span>
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ background: accent, boxShadow: `0 0 16px ${accent}` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
