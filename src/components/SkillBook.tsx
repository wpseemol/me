"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import site from "@/data/site.json";
import { asset } from "@/lib/asset";
import { SKILL_ACCENT, SKILL_ICON } from "@/components/ui/SkillIcons";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

type Skill = (typeof site.stack)[number] & { blurb?: string };

type Sheet =
  | { kind: "intro"; title: string; lede: string }
  | { kind: "skill"; skill: Skill; index: number };

/**
 * Centered skill book: closed cover → open → chapter (full skill list) →
 * skill pages → close. Shifts slightly as the spread opens for reading room.
 */
export default function SkillBook() {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const bookRef = useRef<HTMLDivElement>(null);
  const coverRef = useRef<HTMLDivElement>(null);
  const spreadRef = useRef<HTMLDivElement>(null);
  const edgesRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [label, setLabel] = useState("Closed · Skill book");

  const skills = site.stack as Skill[];
  const profile = site.profile;

  const sheets: Sheet[] = useMemo(
    () => [
      {
        kind: "intro",
        title: "Chapter 01 · The stack",
        lede: "Everything I reach for in production — foundations first, then frameworks, data, and delivery.",
      },
      ...skills.map((skill, index) => ({ kind: "skill" as const, skill, index })),
    ],
    [skills],
  );

  const sheetCount = sheets.length;
  const bands = sheetCount + 2;

  useEffect(() => {
    const section = sectionRef.current;
    const stage = stageRef.current;
    const book = bookRef.current;
    const cover = coverRef.current;
    const spread = spreadRef.current;
    const edges = edgesRef.current;
    if (!section || !stage || !book || !cover || !spread || !edges) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const pages = pageRefs.current.filter(Boolean) as HTMLDivElement[];

    const applyProgress = (p: number) => {
      const raw = p * bands;
      const openT = gsap.utils.clamp(0, 1, raw);
      const turnPhase = gsap.utils.clamp(0, sheetCount, raw - 1);
      const closeT = gsap.utils.clamp(0, 1, raw - (sheetCount + 1));

      let coverAngle: number;
      if (closeT > 0.001) {
        coverAngle = gsap.utils.interpolate(-168, -2, closeT);
      } else {
        coverAngle = gsap.utils.interpolate(0, -168, openT);
      }

      gsap.set(cover, {
        rotateY: coverAngle,
        zIndex: closeT > 0.04 || openT < 0.92 ? 40 : 2,
      });

      const openEase = gsap.parseEase("power2.out")(openT);
      const closeEase = gsap.parseEase("power2.inOut")(closeT);
      const spreadAmount = openEase * (1 - closeEase * 0.92);
      const zoom = 0.94 + spreadAmount * 0.12 - closeEase * 0.05;

      // Closed: centered. Open: nudge right so the left cover swing has room.
      const shiftX = spreadAmount * 4.5 - closeEase * 4.5;

      gsap.set(book, {
        scale: zoom,
        xPercent: shiftX,
        rotateX: 7 - spreadAmount * 5,
        rotateZ: (1 - spreadAmount) * -1.5,
      });

      gsap.set(spread, {
        width: gsap.utils.interpolate(46, 100, spreadAmount) + "%",
      });

      gsap.set(edges, {
        opacity: 1 - spreadAmount * 0.85,
        scaleY: 0.92 + (1 - spreadAmount) * 0.08,
      });

      pages.forEach((sheet, i) => {
        const local = gsap.utils.clamp(0, 1, turnPhase - i);
        const paper = gsap.parseEase("power1.inOut")(local);
        gsap.set(sheet, {
          rotateY: paper * -180,
          zIndex: local < 0.5 ? sheetCount - i + 12 : i + 1,
          filter:
            local > 0.02 && local < 0.98 ? "brightness(0.92)" : "brightness(1)",
        });
      });

      if (closeT > 0.55) setLabel("Closed · Skill book");
      else if (openT < 0.85) setLabel("Opening…");
      else if (turnPhase < 0.2) setLabel("Chapter 01 · The stack");
      else if (turnPhase >= sheetCount - 0.05) setLabel("Last page · closing soon");
      else {
        const idx = Math.min(
          skills.length - 1,
          Math.max(0, Math.floor(turnPhase) - 1),
        );
        setLabel(skills[idx]?.name ?? "Turning page…");
      }
    };

    if (reduced) {
      applyProgress(0.25);
      return;
    }

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: section,
        start: "top top",
        end: () => `+=${bands * window.innerHeight * 0.78}`,
        pin: true,
        scrub: 0.7,
        anticipatePin: 1,
        onUpdate: (self) => applyProgress(self.progress),
        onRefresh: (self) => applyProgress(self.progress),
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

      applyProgress(0);
    }, section);

    return () => ctx.revert();
  }, [bands, sheetCount, skills]);

  return (
    <section
      ref={sectionRef}
      className="relative"
      aria-labelledby="skill-book-live"
    >
      <div className="shell flex min-h-[100svh] flex-col items-center justify-center py-10">
        <p
          id="skill-book-live"
          className="mb-6 font-mono text-2xs uppercase tracking-[0.16em] text-muted"
          aria-live="polite"
        >
          {label}
        </p>

        <div ref={stageRef} className="relative mx-auto w-full max-w-[880px]">
          <div
            aria-hidden
            className="absolute -inset-10 rounded-[48px] opacity-55 blur-3xl"
            style={{
              background:
                "radial-gradient(circle at 50% 42%, rgb(var(--c-glow-a) / 0.32), transparent 68%)",
            }}
          />

          <div
            ref={bookRef}
            className="relative mx-auto aspect-[4/3] w-full will-change-transform"
            style={{ perspective: 2600, transformStyle: "preserve-3d" }}
          >
            <div
              aria-hidden
              className="absolute -bottom-4 left-[12%] right-[12%] h-8 rounded-[100%] bg-black/35 blur-xl dark:bg-black/55"
            />

            <div
              ref={spreadRef}
              className="absolute inset-y-0 left-1/2 w-[46%] -translate-x-1/2"
              style={{ transformStyle: "preserve-3d" }}
            >
              <div
                ref={edgesRef}
                aria-hidden
                className="absolute inset-y-[3%] right-[-14px] z-[5] w-[14px] overflow-hidden rounded-r-[4px] will-change-transform"
                style={{
                  background:
                    "repeating-linear-gradient(180deg, var(--book-edge-a) 0 2px, var(--book-edge-b) 2px 3px)",
                  boxShadow: "2px 0 8px rgb(0 0 0 / 0.25)",
                }}
              />

              {/* Left leaf */}
              <div
                className="book-page absolute inset-y-0 left-0 w-1/2 overflow-hidden rounded-l-[16px] border border-r-0"
                style={{ boxShadow: "inset -10px 0 18px rgb(0 0 0 / 0.08)" }}
              >
                <div className="flex h-full flex-col justify-between p-5 sm:p-7">
                  <div>
                    <p className="book-muted font-mono text-[10px] uppercase tracking-[0.18em]">
                      {profile.handle} · field notes
                    </p>
                    <p className="book-ink mt-6 font-display text-xl leading-tight sm:text-2xl">
                      Turn the page to study each tool.
                    </p>
                  </div>
                  <p className="book-muted font-mono text-[10px]">Left leaf</p>
                </div>
              </div>

              <div
                aria-hidden
                className="pointer-events-none absolute inset-y-2 left-1/2 z-[35] w-5 -translate-x-1/2"
                style={{
                  background:
                    "linear-gradient(90deg, transparent, rgb(0 0 0 / 0.22), transparent)",
                }}
              />

              {sheets.map((page, i) => {
                const skill = page.kind === "skill" ? page.skill : null;
                const accent = skill
                  ? SKILL_ACCENT[skill.name] ?? "#1b63ff"
                  : "#1b63ff";
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
                      zIndex: sheetCount - i + 8,
                    }}
                  >
                    <div
                      className="book-page absolute inset-0 overflow-hidden rounded-r-[16px] border border-l-0"
                      style={{
                        boxShadow:
                          "8px 16px 40px -18px rgb(0 0 0 / 0.45), inset 12px 0 20px rgb(0 0 0 / 0.04)",
                        backfaceVisibility: "hidden",
                        WebkitBackfaceVisibility: "hidden",
                      }}
                    >
                      <div className="relative flex h-full flex-col p-4 sm:p-6">
                        {page.kind === "intro" ? (
                          <>
                            <p className="book-muted font-mono text-[10px] uppercase tracking-[0.18em]">
                              Introduction
                            </p>
                            <h4 className="book-ink mt-3 font-display text-xl leading-tight sm:text-2xl">
                              {page.title}
                            </h4>
                            <p className="book-body mt-2 text-[12px] leading-relaxed sm:text-sm">
                              {page.lede}
                            </p>
                            <ol className="mt-4 grid flex-1 grid-cols-2 content-start gap-x-3 gap-y-1.5 overflow-hidden sm:gap-y-2">
                              {skills.map((s, idx) => (
                                <li
                                  key={s.name}
                                  className="book-ink flex items-baseline gap-1.5 font-mono text-[10px] sm:text-[11px]"
                                >
                                  <span className="book-muted tabular-nums">
                                    {String(idx + 1).padStart(2, "0")}
                                  </span>
                                  <span className="truncate font-medium">
                                    {s.name}
                                  </span>
                                </li>
                              ))}
                            </ol>
                            <p className="book-muted mt-3 font-mono text-[10px]">
                              Next pages → each skill
                            </p>
                          </>
                        ) : skill ? (
                          <>
                            <div className="flex items-start justify-between gap-3">
                              <div
                                className="grid h-12 w-12 place-items-center rounded-2xl border sm:h-14 sm:w-14"
                                style={{
                                  color: accent,
                                  borderColor: `${accent}55`,
                                  background: `${accent}18`,
                                }}
                              >
                                {Icon ? (
                                  <span className="text-[1.75rem] leading-none sm:text-[2rem]">
                                    <Icon />
                                  </span>
                                ) : null}
                              </div>
                              <span className="book-muted font-mono text-[10px]">
                                {String(page.index + 1).padStart(2, "0")} /{" "}
                                {String(skills.length).padStart(2, "0")}
                              </span>
                            </div>
                            <p className="book-muted mt-5 font-mono text-[10px] uppercase tracking-[0.16em]">
                              {skill.group}
                            </p>
                            <h4 className="book-ink mt-1 text-xl sm:text-2xl">
                              {skill.name}
                            </h4>
                            <p className="book-body mt-3 text-sm leading-relaxed">
                              {skill.blurb ??
                                `Production experience with ${skill.name}.`}
                            </p>
                            <div className="mt-auto pt-4">
                              <div className="book-muted mb-1.5 flex justify-between font-mono text-[10px]">
                                <span>Level</span>
                                <span>{skill.level}%</span>
                              </div>
                              <div className="book-track h-1.5 overflow-hidden rounded-full">
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

                    <div
                      className="book-page-back absolute inset-0 overflow-hidden rounded-l-[16px] border"
                      style={{
                        transform: "rotateY(180deg)",
                        boxShadow: "inset 10px 0 24px rgb(0 0 0 / 0.08)",
                        backfaceVisibility: "hidden",
                        WebkitBackfaceVisibility: "hidden",
                      }}
                    >
                      <div className="book-muted flex h-full items-end justify-between p-5">
                        <span className="font-mono text-[10px] uppercase tracking-[0.16em]">
                          {profile.handle}
                        </span>
                        <span className="font-mono text-[10px]">· {i + 1}</span>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Cover */}
              <div
                ref={coverRef}
                className="absolute inset-0 origin-left will-change-transform"
                style={{ transformStyle: "preserve-3d", zIndex: 40 }}
              >
                <div
                  className="absolute inset-0 overflow-hidden rounded-[16px] border"
                  style={{
                    backfaceVisibility: "hidden",
                    WebkitBackfaceVisibility: "hidden",
                    boxShadow:
                      "12px 22px 50px -16px rgb(0 0 0 / 0.55), inset 0 1px 0 rgb(255 255 255 / 0.12)",
                  }}
                >
                  <Image
                    src={asset("/images/skill-book-cover.jpg")}
                    alt=""
                    fill
                    sizes="(max-width: 1024px) 70vw, 480px"
                    className="object-cover"
                    priority
                  />
                  <div
                    aria-hidden
                    className="absolute inset-0"
                    style={{
                      background:
                        "linear-gradient(180deg, rgb(6 12 28 / 0.15) 0%, rgb(6 12 28 / 0.55) 48%, rgb(6 12 28 / 0.88) 100%)",
                    }}
                  />
                  <div className="absolute inset-0 flex flex-col justify-between p-5 text-white sm:p-7">
                    <div>
                      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/65">
                        Portfolio field guide
                      </p>
                      <p className="mt-3 font-display text-[1.7rem] leading-none sm:text-[2.1rem]">
                        Skill book
                      </p>
                    </div>
                    <div>
                      <p className="font-display text-lg leading-tight sm:text-xl">
                        {profile.name}
                      </p>
                      <p className="mt-1 font-mono text-[10px] text-white/60">
                        @{profile.handle} · {profile.role}
                      </p>
                    </div>
                  </div>
                </div>

                <div
                  className="absolute inset-0 overflow-hidden rounded-l-[16px] border"
                  style={{
                    transform: "rotateY(180deg)",
                    background:
                      "linear-gradient(135deg, var(--brand-800), var(--brand-600))",
                    backfaceVisibility: "hidden",
                    WebkitBackfaceVisibility: "hidden",
                  }}
                >
                  <div className="flex h-full flex-col justify-end p-5 text-white/70">
                    <p className="font-mono text-[10px] uppercase tracking-[0.16em]">
                      Inside cover
                    </p>
                    <p className="mt-2 text-sm">HTML → CSS → Tailwind → ship</p>
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
