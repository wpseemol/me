"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import site from "@/data/site.json";
import { SKILL_ACCENT, SKILL_ICON } from "@/components/ui/SkillIcons";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

type Skill = (typeof site.stack)[number] & { blurb?: string };

type Page =
  | { kind: "cover"; title: string; lede: string }
  | { kind: "skill"; skill: Skill; index: number }
  | { kind: "end"; title: string; lede: string };

/**
 * Scroll-driven skill book: title page → turn through each skill → close cover.
 */
export default function SkillBook() {
  const sectionRef = useRef<HTMLElement>(null);
  const bookRef = useRef<HTMLDivElement>(null);
  const coverRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [label, setLabel] = useState("Open the book");

  const skills = site.stack as Skill[];

  const pages: Page[] = useMemo(
    () => [
      {
        kind: "cover",
        title: "Skill book",
        lede: "A short field guide to the tools I reach for — from HTML and CSS through Tailwind, frameworks, data, and Docker.",
      },
      ...skills.map((skill, index) => ({ kind: "skill" as const, skill, index })),
      {
        kind: "end",
        title: "Stack complete",
        lede: "Those are the layers I ship with. Keep scrolling and the book closes.",
      },
    ],
    [skills],
  );

  // Sheets that physically turn (everything after the fixed left base).
  const turnPages = pages.slice(0, -1); // last "end" shows on left after final turn; cover closes after
  const sheetCount = turnPages.length; // cover + skills
  // progress bands: one per sheet turn, plus final close
  const bands = sheetCount + 1;

  useEffect(() => {
    const section = sectionRef.current;
    const book = bookRef.current;
    const cover = coverRef.current;
    if (!section || !book || !cover) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const sheets = pageRefs.current.filter(Boolean) as HTMLDivElement[];

    const applyProgress = (progress: number) => {
      const raw = progress * bands;
      const turnPhase = Math.min(sheetCount, raw);
      const closePhase = Math.max(0, raw - sheetCount); // 0..1

      sheets.forEach((sheet, i) => {
        // Each sheet turns fully across its band: 0 → -180
        const local = gsap.utils.clamp(0, 1, turnPhase - i);
        const angle = local * -180;
        gsap.set(sheet, {
          rotateY: angle,
          // Keep turning page on top until it's past halfway
          zIndex: local < 0.5 ? sheetCount - i + 10 : i,
        });
      });

      // Cover rests open behind the stack, then swings shut over the right leaf.
      gsap.set(cover, {
        rotateY: gsap.utils.interpolate(-175, -4, closePhase),
        zIndex: closePhase > 0.02 ? 90 : 0,
      });

      if (closePhase > 0.55) {
        setLabel("Book closed");
      } else if (turnPhase < 0.2) {
        setLabel("Title page");
      } else {
        const idx = Math.min(skills.length - 1, Math.max(0, Math.floor(turnPhase) - 1));
        const s = skills[idx];
        setLabel(turnPhase >= sheetCount ? "Closing…" : s ? s.name : "Turning…");
      }
    };

    if (reduced) {
      applyProgress(0);
      return;
    }

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: section,
        start: "top top",
        end: () => `+=${bands * window.innerHeight * 0.7}`,
        pin: true,
        scrub: 0.55,
        anticipatePin: 1,
        onUpdate: (self) => applyProgress(self.progress),
        onRefresh: (self) => applyProgress(self.progress),
      });

      gsap.fromTo(
        book,
        { y: 36, opacity: 0.55, rotateX: 6 },
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

      applyProgress(0);
    }, section);

    return () => ctx.revert();
  }, [bands, sheetCount, skills]);

  return (
    <section ref={sectionRef} className="relative" aria-labelledby="skill-book-live">
      <div className="shell grid min-h-[100svh] items-center gap-10 py-14 lg:grid-cols-[0.85fr_1.15fr] lg:gap-14">
        <div>
          <p
            id="skill-book-live"
            className="font-mono text-2xs uppercase tracking-[0.16em] text-muted"
            aria-live="polite"
          >
            {label}
          </p>
          <h3 className="mt-4 text-[clamp(2rem,5vw,3.3rem)] leading-[0.98]">
            <span className="block text-muted">Skills,</span>
            <span className="grad-text">page by page</span>
          </h3>
          <p className="mt-5 max-w-md text-[15px] leading-relaxed text-muted">
            Scroll to turn the book — HTML first, then CSS, Tailwind, and the rest
            of the stack. At the end the cover closes.
          </p>

          <ol className="mt-8 space-y-1.5">
            {skills.map((s, i) => (
              <li
                key={s.name}
                className="flex items-center gap-3 font-mono text-2xs text-muted"
              >
                <span className="tabular-nums opacity-50">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="text-sm font-medium text-body/80">{s.name}</span>
              </li>
            ))}
          </ol>
        </div>

        {/* Book stage */}
        <div className="relative mx-auto w-full max-w-xl">
          <div
            aria-hidden
            className="absolute -inset-8 rounded-[40px] opacity-50 blur-3xl"
            style={{
              background:
                "radial-gradient(circle at 50% 40%, rgb(var(--c-glow-a) / 0.28), transparent 70%)",
            }}
          />

          <div
            ref={bookRef}
            className="relative mx-auto aspect-[4/3] w-full max-w-[560px] will-change-transform"
            style={{ perspective: 1800 }}
          >
            <div
              className="absolute inset-0"
              style={{ transformStyle: "preserve-3d" }}
            >
              {/* Left base page (always visible under turns) */}
              <div className="absolute inset-y-0 left-0 w-1/2 overflow-hidden rounded-l-[14px] border border-r-0 bg-[#f4efe6] shadow-[-8px_12px_30px_-18px_rgb(0_0_0_/0.35)] dark:bg-[#1a2030]">
                <div className="flex h-full flex-col justify-between p-5 sm:p-6">
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-black/45 dark:text-white/40">
                      wpseemol · stack
                    </p>
                    <p className="mt-6 font-display text-2xl leading-tight text-black/80 dark:text-white/85 sm:text-3xl">
                      Build from the page up.
                    </p>
                  </div>
                  <p className="font-mono text-[10px] text-black/40 dark:text-white/35">
                    Left leaf
                  </p>
                </div>
              </div>

              {/* Spine shadow */}
              <div
                aria-hidden
                className="absolute inset-y-3 left-1/2 z-[60] w-4 -translate-x-1/2 rounded-full opacity-40"
                style={{
                  background:
                    "linear-gradient(90deg, transparent, rgb(0 0 0 / 0.25), transparent)",
                }}
              />

              {/* Turning sheets — right half, hinge on the spine */}
              {turnPages.map((page, i) => {
                const skill = page.kind === "skill" ? page.skill : null;
                const accent = skill
                  ? SKILL_ACCENT[skill.name] ?? "#1b63ff"
                  : "var(--brand-500)";
                const Icon = skill ? SKILL_ICON[skill.name] : null;

                return (
                  <div
                    key={i}
                    ref={(el) => {
                      pageRefs.current[i] = el;
                    }}
                    className="absolute inset-y-0 left-1/2 w-1/2 origin-left will-change-transform"
                    style={{
                      transformStyle: "preserve-3d",
                      zIndex: sheetCount - i + 5,
                    }}
                  >
                    {/* Front of sheet */}
                    <div
                      className="absolute inset-0 overflow-hidden rounded-r-[14px] border border-l-0 bg-[#faf7f1] shadow-[8px_14px_36px_-20px_rgb(0_0_0_/0.4)] dark:bg-[#121826]"
                      style={{
                        backfaceVisibility: "hidden",
                        WebkitBackfaceVisibility: "hidden",
                      }}
                    >
                      <div className="flex h-full flex-col p-5 sm:p-6">
                        {page.kind === "cover" ? (
                          <>
                            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
                              Chapter 00
                            </p>
                            <h4 className="mt-4 font-display text-2xl leading-tight sm:text-3xl">
                              {page.title}
                            </h4>
                            <p className="mt-4 text-sm leading-relaxed text-muted">
                              {page.lede}
                            </p>
                            <p className="mt-auto font-mono text-[10px] text-muted">
                              Scroll to turn →
                            </p>
                          </>
                        ) : page.kind === "skill" && skill ? (
                          <>
                            <div className="flex items-start justify-between gap-3">
                              <div
                                className="grid h-12 w-12 place-items-center rounded-xl border sm:h-14 sm:w-14"
                                style={{
                                  color: accent,
                                  borderColor: `color-mix(in oklab, ${accent} 40%, transparent)`,
                                  background: `color-mix(in oklab, ${accent} 14%, transparent)`,
                                }}
                              >
                                {Icon ? (
                                  <span className="text-[1.75rem] leading-none">
                                    <Icon />
                                  </span>
                                ) : null}
                              </div>
                              <span className="font-mono text-[10px] text-muted">
                                {String(page.index + 1).padStart(2, "0")} /{" "}
                                {String(skills.length).padStart(2, "0")}
                              </span>
                            </div>
                            <p className="mt-5 font-mono text-[10px] uppercase tracking-[0.16em] text-muted">
                              {skill.group}
                            </p>
                            <h4 className="mt-1 text-xl sm:text-2xl">{skill.name}</h4>
                            <p className="mt-3 text-sm leading-relaxed text-muted">
                              {skill.blurb ??
                                `Production experience with ${skill.name}.`}
                            </p>
                            <div className="mt-auto pt-4">
                              <div className="mb-1.5 flex justify-between font-mono text-[10px] text-muted">
                                <span>Level</span>
                                <span>{skill.level}%</span>
                              </div>
                              <div className="h-1 overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
                                <div
                                  className="h-full rounded-full"
                                  style={{
                                    width: `${skill.level}%`,
                                    background: accent,
                                  }}
                                />
                              </div>
                            </div>
                          </>
                        ) : null}
                      </div>
                    </div>

                    {/* Back of sheet */}
                    <div
                      className="absolute inset-0 overflow-hidden rounded-l-[14px] border bg-[#efe8dc] dark:bg-[#0e1422]"
                      style={{
                        transform: "rotateY(180deg)",
                        backfaceVisibility: "hidden",
                        WebkitBackfaceVisibility: "hidden",
                      }}
                    >
                      <div className="flex h-full items-end p-5 opacity-40">
                        <span className="font-mono text-[10px] uppercase tracking-[0.16em]">
                          · {i + 1}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Closing front cover (right flap) */}
              <div
                ref={coverRef}
                className="absolute inset-y-0 left-1/2 w-1/2 origin-left will-change-transform"
                style={{ transformStyle: "preserve-3d" }}
              >
                <div
                  className="absolute inset-0 overflow-hidden rounded-r-[14px] border border-l-0 shadow-[10px_18px_40px_-18px_rgb(0_0_0_/0.45)]"
                  style={{
                    background:
                      "linear-gradient(145deg, var(--brand-700), var(--brand-500) 55%, var(--accent-500))",
                    backfaceVisibility: "hidden",
                    WebkitBackfaceVisibility: "hidden",
                  }}
                >
                  <div className="flex h-full flex-col justify-between p-5 text-white sm:p-6">
                    <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/70">
                      Seemol Chakroborti
                    </p>
                    <div>
                      <p className="font-display text-2xl leading-tight sm:text-3xl">
                        Skill book
                      </p>
                      <p className="mt-2 text-sm text-white/75">
                        HTML → CSS → Tailwind → ship
                      </p>
                    </div>
                    <p className="font-mono text-[10px] text-white/60">wpseemol.site</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
