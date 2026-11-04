"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { CustomEase } from "gsap/CustomEase";
import site from "@/data/site.json";
import skillsData from "@/data/skills.json";
import { asset } from "@/lib/asset";
import { SKILL_ACCENT, SKILL_ICON } from "@/components/ui/SkillIcons";

const PAPER_GRAVITY = "paperGravity";
const COVER_LIFT = "coverLift";

function ensureCustomEase(name: string, path: string) {
  try {
    // Reuse on Fast Refresh — recreating the same id can throw.
    if (CustomEase.get(name)) return;
    CustomEase.create(name, path);
  } catch {
    // Built-in fallback is resolved when parsing below.
  }
}

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, CustomEase);
  // Gravity: cling → free-fall past the fold → soft land.
  // Each cubic needs its own `C` or GSAP throws "Invalid CustomEase".
  ensureCustomEase(
    PAPER_GRAVITY,
    "M0,0 C0.08,0.02 0.14,0.08 0.22,0.28 C0.34,0.62 0.42,0.9 0.55,0.97 C0.72,1 0.86,1 1,1",
  );
  ensureCustomEase(
    COVER_LIFT,
    "M0,0 C0.16,0.06 0.26,0.45 0.42,0.78 C0.58,0.96 0.76,1 1,1",
  );
}

type Skill = (typeof skillsData.skills)[number];

type Sheet =
  | { kind: "intro"; title: string; lede: string; footer: string }
  | { kind: "skill"; skill: Skill; index: number };

/**
 * Skill book scroll story:
 * 1) Stay closed as a code file
 * 2) Scroll peels the cover off the file
 * 3) Only then do pages turn (no early flips, no end close)
 */
export default function SkillBook() {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const bookRef = useRef<HTMLDivElement>(null);
  const coverRef = useRef<HTMLDivElement>(null);
  const spreadRef = useRef<HTMLDivElement>(null);
  const edgesRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);
  const labelRef = useRef("Closed · skills.json");
  const [label, setLabel] = useState("Closed · skills.json");

  const skills = skillsData.skills as Skill[];
  const meta = skillsData.meta;
  const profile = site.profile;

  const sheets: Sheet[] = useMemo(
    () => [
      {
        kind: "intro",
        title: meta.introTitle,
        lede: meta.introLede,
        footer: meta.introFooter,
      },
      ...skills.map((skill, index) => ({
        kind: "skill" as const,
        skill,
        index,
      })),
    ],
    [skills, meta],
  );

  const sheetCount = sheets.length;
  // hold closed → open cover → one band per page (no final close)
  const HOLD_BAND = 0.85;
  const OPEN_BAND = 1;
  const bands = HOLD_BAND + OPEN_BAND + sheetCount;

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
    const paperEase = CustomEase.get(PAPER_GRAVITY) || gsap.parseEase("power3.inOut");
    const coverEase = CustomEase.get(COVER_LIFT) || gsap.parseEase("power2.inOut");

    const setLive = (next: string) => {
      if (labelRef.current === next) return;
      labelRef.current = next;
      setLabel(next);
    };

    const applyProgress = (p: number) => {
      const raw = p * bands;
      // Phase A: stay closed as a file
      const held = raw <= HOLD_BAND;
      // Phase B: cover lifts off the file (only after hold)
      const openT = gsap.utils.clamp(0, 1, (raw - HOLD_BAND) / OPEN_BAND);
      // Phase C: pages turn only after cover is open
      const turnPhase = gsap.utils.clamp(
        0,
        sheetCount,
        raw - HOLD_BAND - OPEN_BAND,
      );

      const coverPaper = coverEase(openT);
      const coverAngle = gsap.utils.interpolate(0, -172, coverPaper);
      const coverPeel = Math.sin(coverPaper * Math.PI);
      const coverUp = openT < 0.92;

      gsap.set(cover, {
        rotateY: coverAngle,
        z: coverUp ? 18 + coverPeel * 22 : 2,
        rotateX: coverPeel * -5,
        zIndex: coverUp ? 40 : 2,
      });

      const openAmount = coverEase(openT);
      const zoom = 0.92 + openAmount * 0.14;
      const shiftX = openAmount * 5;

      gsap.set(book, {
        scale: zoom,
        xPercent: shiftX,
        rotateX: 8 - openAmount * 5.5,
        rotateZ: (1 - openAmount) * -1.8,
      });

      gsap.set(spread, {
        width: gsap.utils.interpolate(46, 100, openAmount) + "%",
      });

      // Fore-edge = closed file thickness; fades away as the cover opens.
      const edgeShow = gsap.utils.clamp(0, 1, 1 - openT * 1.35);
      gsap.set(edges, {
        opacity: edgeShow,
        scaleY: 0.96 + edgeShow * 0.04,
        x: (1 - edgeShow) * -8,
      });

      pages.forEach((sheet, i) => {
        // Pages stay flat until the cover is fully out of the way.
        const local =
          openT < 0.98 ? 0 : gsap.utils.clamp(0, 1, turnPhase - i);
        // Gravity remap — hang, fall hard through mid-fold, settle.
        const paper = gsap.utils.clamp(0, 1, paperEase(local));
        const peel = Math.sin(paper * Math.PI);
        // Extra fall weight after the fold (page dropping onto the left).
        const drop = paper > 0.5 ? Math.pow((paper - 0.5) * 2, 1.35) : 0;

        gsap.set(sheet, {
          rotateY: paper * -180,
          // Lift then settle — reads as paper with mass, not a flat spin.
          z: peel * 28 - drop * 6,
          rotateX: peel * -7 + drop * 1.5,
          zIndex: local < 0.5 ? sheetCount - i + 14 : i + 1,
        });

        sheet.querySelectorAll<HTMLElement>("[data-book-shade]").forEach((shade) => {
          gsap.set(shade, { opacity: 0.15 + peel * 0.55 });
        });
        sheet.querySelectorAll<HTMLElement>("[data-book-curl]").forEach((curl) => {
          gsap.set(curl, { opacity: peel * 0.85 });
        });
      });

      if (held || openT < 0.04) setLive("Closed · skills.json");
      else if (openT < 0.98) setLive("Opening cover…");
      else if (turnPhase < 0.15) setLive(meta.introTitle);
      else if (turnPhase >= sheetCount - 0.05) setLive("Last page");
      else {
        const idx = Math.min(
          skills.length - 1,
          Math.max(0, Math.floor(turnPhase) - 1),
        );
        setLive(skills[idx]?.name ?? "Turning page…");
      }
    };

    if (reduced) {
      // Open to the intro page — skip the scroll theatre.
      applyProgress((HOLD_BAND + OPEN_BAND + 0.15) / bands);
      return;
    }

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: section,
        start: "top top",
        end: () => `+=${bands * window.innerHeight * 1.12}`,
        pin: true,
        // Heavier scrub = more inertia / gravity feel on wheel jumps.
        scrub: 1.45,
        anticipatePin: 1,
        onUpdate: (self) => applyProgress(self.progress),
        onRefresh: (self) => applyProgress(self.progress),
      });

      gsap.fromTo(
        stage,
        { y: 44, opacity: 0.45 },
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
  }, [bands, sheetCount, skills, meta.introTitle]);

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

        <div ref={stageRef} className="relative mx-auto w-full max-w-[940px]">
          <div
            aria-hidden
            className="absolute -inset-12 rounded-[52px] opacity-50 blur-3xl"
            style={{
              background:
                "radial-gradient(circle at 50% 40%, rgb(var(--c-glow-a) / 0.3), transparent 70%)",
            }}
          />

          <div
            ref={bookRef}
            className="relative mx-auto aspect-[4/3] w-full will-change-transform"
            style={{
              perspective: 3000,
              perspectiveOrigin: "50% 46%",
              transformStyle: "preserve-3d",
            }}
          >
            <div
              aria-hidden
              className="absolute -bottom-5 left-[10%] right-[10%] h-10 rounded-[100%] bg-black/40 blur-2xl dark:bg-black/60"
            />

            <div
              ref={spreadRef}
              className="absolute inset-y-0 left-1/2 w-[46%] -translate-x-1/2"
              style={{ transformStyle: "preserve-3d" }}
            >
              <div
                ref={edgesRef}
                aria-hidden
                className="book-fore-edge pointer-events-none absolute inset-y-[4%] right-0 z-[4] w-[10px] overflow-hidden rounded-r-[8px] will-change-transform"
              />

              {/* Left endpaper */}
              <div
                className="book-page absolute inset-y-0 left-0 w-1/2 overflow-hidden rounded-l-[12px] border border-r-0"
                style={{ boxShadow: "inset -12px 0 22px rgb(0 0 0 / 0.1)" }}
              >
                <div className="flex h-full flex-col justify-between p-5 sm:p-7">
                  <div>
                    <p className="book-muted font-mono text-[10px] uppercase tracking-[0.18em]">
                      {profile.handle} · {meta.leftLeafTitle}
                    </p>
                    <div className="book-rule mt-4 border-t pt-4">
                      <p className="book-ink font-display text-xl leading-tight sm:text-2xl">
                        {meta.leftLeafBody}
                      </p>
                    </div>
                  </div>
                  <p className="book-muted font-mono text-[10px]">
                    {skills.length} skills · scroll to turn
                  </p>
                </div>
              </div>

              {/* Spine trough + binding strip */}
              <div
                aria-hidden
                className="book-binding pointer-events-none absolute inset-y-2 left-1/2 z-[35] w-[7px] -translate-x-1/2 rounded-sm"
              />
              <div
                aria-hidden
                className="pointer-events-none absolute inset-y-1 left-1/2 z-[36] w-11 -translate-x-1/2"
                style={{
                  background:
                    "linear-gradient(90deg, rgb(0 0 0 / 0.22), rgb(0 0 0 / 0.04) 40%, rgb(0 0 0 / 0.04) 60%, rgb(0 0 0 / 0.24))",
                }}
              />

              {sheets.map((page, i) => {
                const skill = page.kind === "skill" ? page.skill : null;
                const accent = skill
                  ? (SKILL_ACCENT[skill.name] ?? "#1b63ff")
                  : "#1b63ff";
                const Icon = skill ? SKILL_ICON[skill.name] : null;
                return (
                  <div
                    key={page.kind === "skill" ? page.skill.name : "intro"}
                    ref={(el) => {
                      pageRefs.current[i] = el;
                    }}
                    className="book-sheet absolute inset-y-0 left-1/2 w-1/2 will-change-transform"
                    style={{ zIndex: sheetCount - i + 8 }}
                  >
                    {/* Recto — right page */}
                    <div
                      className="book-page book-sheet-face book-sheet-face--front absolute inset-0 overflow-hidden rounded-r-[12px] border border-l-0"
                      style={{
                        boxShadow:
                          "10px 18px 42px -18px rgb(0 0 0 / 0.5), inset 12px 0 20px rgb(0 0 0 / 0.04)",
                      }}
                    >
                      <div className="book-sheet-shade z-10" data-book-shade aria-hidden />
                      <div className="book-sheet-curl z-10" data-book-curl aria-hidden />
                      <div className="relative flex h-full flex-col overflow-hidden p-3.5 sm:p-5 md:p-6">
                        {page.kind === "intro" ? (
                          <>
                            <p className="book-muted font-mono text-[10px] uppercase tracking-[0.18em]">
                              Introduction
                            </p>
                            <h4 className="book-ink mt-2 font-display text-lg leading-tight sm:text-2xl">
                              {page.title}
                            </h4>
                            <p className="book-body mt-2 text-[11px] leading-relaxed sm:text-sm">
                              {page.lede}
                            </p>
                            <ol className="mt-3 grid flex-1 grid-cols-2 content-start gap-x-3 gap-y-1 overflow-hidden sm:gap-y-1.5">
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
                            <p className="book-muted mt-2 font-mono text-[10px]">
                              {page.footer}
                            </p>
                          </>
                        ) : skill ? (
                          <>
                            <div className="flex items-start justify-between gap-2">
                              <div
                                className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border sm:h-12 sm:w-12"
                                style={{
                                  color: accent,
                                  borderColor: `${accent}55`,
                                  background: `${accent}18`,
                                  boxShadow: `0 0 24px ${accent}22`,
                                }}
                              >
                                {Icon ? (
                                  <span className="text-[1.6rem] leading-none sm:text-[1.85rem]">
                                    <Icon />
                                  </span>
                                ) : null}
                              </div>
                              <span className="book-muted font-mono text-[10px]">
                                {String(page.index + 1).padStart(2, "0")} /{" "}
                                {String(skills.length).padStart(2, "0")}
                              </span>
                            </div>

                            <p className="book-muted mt-3 font-mono text-[10px] uppercase tracking-[0.16em]">
                              {skill.group}
                            </p>
                            <h4 className="book-ink mt-0.5 text-xl leading-none sm:text-2xl">
                              {skill.name}
                            </h4>
                            <p className="book-body book-rule mt-2 line-clamp-2 border-b pb-2 text-[11px] font-medium leading-snug sm:text-xs">
                              {skill.blurb}
                            </p>

                            <div className="mt-2 min-h-0 flex-1 sm:mt-2.5">
                              <p className="book-muted font-mono text-[9px] uppercase tracking-[0.14em]">
                                How I learned
                              </p>
                              <p className="book-body mt-1 line-clamp-4 text-[11px] leading-relaxed sm:line-clamp-5 sm:text-[12px]">
                                {skill.learned}
                              </p>

                              <ul className="mt-2 hidden space-y-1 sm:block">
                                {skill.practice.slice(0, 2).map((item) => (
                                  <li
                                    key={item}
                                    className="book-body flex gap-2 text-[10px] leading-snug sm:text-[11px]"
                                  >
                                    <span
                                      className="mt-[5px] h-1 w-1 shrink-0 rounded-full"
                                      style={{ background: accent }}
                                      aria-hidden
                                    />
                                    <span className="line-clamp-1">{item}</span>
                                  </li>
                                ))}
                              </ul>

                              <div className="mt-2 flex flex-wrap gap-1">
                                {skill.focus.map((tag) => (
                                  <span
                                    key={tag}
                                    className="rounded-full border px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.08em]"
                                    style={{
                                      color: accent,
                                      borderColor: `${accent}44`,
                                      background: `${accent}12`,
                                    }}
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            </div>

                            <div className="mt-auto shrink-0 pt-2">
                              <div className="book-muted mb-1 flex justify-between font-mono text-[10px]">
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

                    {/* Verso — readable left page after the turn */}
                    <div
                      className="book-page-back book-sheet-face book-sheet-face--back absolute inset-0 overflow-hidden rounded-l-[12px] border"
                      style={{
                        boxShadow: "inset 10px 0 24px rgb(0 0 0 / 0.08)",
                      }}
                    >
                      <div className="book-sheet-shade z-10" data-book-shade aria-hidden />
                      <div className="book-sheet-curl z-10" data-book-curl aria-hidden />
                      {skill ? (
                        <VersoSkill skill={skill} />
                      ) : (
                        <div className="flex h-full flex-col justify-between p-5 sm:p-6">
                          <div>
                            <p className="book-muted font-mono text-[10px] uppercase tracking-[0.16em]">
                              Inside cover
                            </p>
                            <p className="book-ink mt-4 font-display text-lg leading-snug sm:text-xl">
                              {meta.insideCover}
                            </p>
                          </div>
                          <p className="book-muted font-mono text-[10px]">
                            @{profile.handle}
                          </p>
                        </div>
                      )}
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
                  className="book-sheet-face book-sheet-face--front absolute inset-0 overflow-hidden rounded-[14px] border"
                  style={{
                    boxShadow:
                      "14px 26px 56px -16px rgb(0 0 0 / 0.6), inset 0 1px 0 rgb(255 255 255 / 0.14)",
                  }}
                >
                  <div
                    aria-hidden
                    className="book-binding absolute inset-y-0 left-0 z-10 w-3"
                  />
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
                      {/* Closed state reads like a code file until scroll opens it */}
                      <div className="inline-flex items-center gap-2 rounded-md border border-white/15 bg-black/35 px-2.5 py-1 font-mono text-[10px] text-white/75 backdrop-blur-sm">
                        <span className="h-1.5 w-1.5 rounded-full bg-accent-400" />
                        skills.json
                      </div>
                      <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.2em] text-white/65">
                        {meta.eyebrow}
                      </p>
                      <p className="mt-3 font-display text-[1.7rem] leading-none sm:text-[2.1rem]">
                        {meta.title}
                      </p>
                    </div>
                    <div>
                      <p className="font-display text-lg leading-tight sm:text-xl">
                        {profile.name}
                      </p>
                      <p className="mt-1 font-mono text-[10px] text-white/60">
                        @{profile.handle} · {profile.role}
                      </p>
                      <p className="mt-3 font-mono text-[10px] text-white/45">
                        scroll to open →
                      </p>
                    </div>
                  </div>
                </div>

                <div
                  className="book-sheet-face book-sheet-face--back absolute inset-0 overflow-hidden rounded-l-[12px] border"
                  style={{
                    background:
                      "linear-gradient(145deg, var(--brand-900), var(--brand-700) 55%, var(--brand-600))",
                  }}
                >
                  <div className="flex h-full flex-col justify-end p-5 text-white/70">
                    <p className="font-mono text-[10px] uppercase tracking-[0.16em]">
                      Inside cover
                    </p>
                    <p className="mt-2 text-sm">{meta.insideCover}</p>
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

function VersoSkill({ skill }: { skill: Skill }) {
  const accent = SKILL_ACCENT[skill.name] ?? "#1b63ff";
  const Icon = SKILL_ICON[skill.name];

  return (
    <div className="flex h-full flex-col p-4 sm:p-5">
      <div className="flex items-center gap-2.5">
        <div
          className="grid h-9 w-9 place-items-center rounded-xl border"
          style={{
            color: accent,
            borderColor: `${accent}55`,
            background: `${accent}16`,
          }}
        >
          {Icon ? (
            <span className="text-[1.25rem] leading-none">
              <Icon />
            </span>
          ) : null}
        </div>
        <div className="min-w-0">
          <p className="book-muted font-mono text-[9px] uppercase tracking-[0.14em]">
            {skill.group}
          </p>
          <p className="book-ink truncate text-base font-semibold leading-tight">
            {skill.name}
          </p>
        </div>
      </div>
      <p className="book-body mt-3 text-[11px] leading-relaxed sm:text-xs">
        {skill.blurb}
      </p>
      <p className="book-body mt-2 line-clamp-4 text-[10px] leading-relaxed opacity-80 sm:text-[11px]">
        {skill.learned}
      </p>
      <div className="mt-auto pt-3">
        <div className="book-muted mb-1 flex justify-between font-mono text-[10px]">
          <span>Level</span>
          <span>{skill.level}%</span>
        </div>
        <div className="book-track h-1 overflow-hidden rounded-full">
          <div
            className="h-full rounded-full"
            style={{ width: `${skill.level}%`, background: accent }}
          />
        </div>
      </div>
    </div>
  );
}
