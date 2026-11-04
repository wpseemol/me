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

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, CustomEase);
  // Paper with weight: hangs, falls through the fold, then soft-settles.
  CustomEase.create(
    "paperGravity",
    "M0,0 C0.12,0.02 0.2,0.18 0.28,0.42 0.4,0.78 0.52,0.94 0.68,0.98 0.82,1 0.92,1 1,1",
  );
  CustomEase.create(
    "coverLift",
    "M0,0 C0.16,0.08 0.28,0.55 0.45,0.82 0.62,0.96 0.78,1 1,1",
  );
}

type Skill = (typeof skillsData.skills)[number];

type Sheet =
  | { kind: "intro"; title: string; lede: string; footer: string }
  | { kind: "skill"; skill: Skill; index: number };

/**
 * Centered skill book: closed cover → open → chapter → skill pages → close.
 * Page turns use a gravity ease + mid-flip lift so paper feels weighted.
 * Content lives in data/skills.json so each skill can be edited without code.
 */
export default function SkillBook() {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const bookRef = useRef<HTMLDivElement>(null);
  const coverRef = useRef<HTMLDivElement>(null);
  const spreadRef = useRef<HTMLDivElement>(null);
  const edgesRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);
  const labelRef = useRef("Closed · Skill book");
  const [label, setLabel] = useState("Closed · Skill book");

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
  // Open + one band per sheet + close. Extra height per band = slower, stickier turns.
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
    const paperEase = gsap.parseEase("paperGravity");
    const coverEase = gsap.parseEase("coverLift");

    const setLive = (next: string) => {
      if (labelRef.current === next) return;
      labelRef.current = next;
      setLabel(next);
    };

    const applyProgress = (p: number) => {
      const raw = p * bands;
      const openT = gsap.utils.clamp(0, 1, raw);
      const turnPhase = gsap.utils.clamp(0, sheetCount, raw - 1);
      const closeT = gsap.utils.clamp(0, 1, raw - (sheetCount + 1));

      let coverAngle: number;
      if (closeT > 0.001) {
        coverAngle = gsap.utils.interpolate(-172, -2, coverEase(closeT));
      } else {
        coverAngle = gsap.utils.interpolate(0, -172, coverEase(openT));
      }

      gsap.set(cover, {
        rotateY: coverAngle,
        z: closeT > 0.04 || openT < 0.9 ? 28 : 2,
        zIndex: closeT > 0.04 || openT < 0.9 ? 40 : 2,
      });

      const openAmount = coverEase(openT) * (1 - coverEase(closeT) * 0.94);
      const zoom = 0.93 + openAmount * 0.13 - closeT * 0.04;
      const shiftX = openAmount * 5 - closeT * 5;

      gsap.set(book, {
        scale: zoom,
        xPercent: shiftX,
        rotateX: 8 - openAmount * 5.5,
        rotateZ: (1 - openAmount) * -1.8,
      });

      gsap.set(spread, {
        width: gsap.utils.interpolate(46, 100, openAmount) + "%",
      });

      gsap.set(edges, {
        opacity: 1 - openAmount * 0.88,
        scaleY: 0.9 + (1 - openAmount) * 0.1,
      });

      pages.forEach((sheet, i) => {
        const local = gsap.utils.clamp(0, 1, turnPhase - i);
        const paper = paperEase(local);
        // Soft peel only — keep pages packed to the spine (no big z “unpack”).
        const peel = Math.sin(paper * Math.PI);

        gsap.set(sheet, {
          rotateY: paper * -180,
          z: peel * 10,
          zIndex: local < 0.5 ? sheetCount - i + 14 : i + 1,
        });

        sheet.querySelectorAll<HTMLElement>("[data-book-shade]").forEach((shade) => {
          gsap.set(shade, { opacity: peel * 0.5 });
        });
      });

      if (closeT > 0.55) setLive("Closed · Skill book");
      else if (openT < 0.82) setLive("Opening…");
      else if (turnPhase < 0.15) setLive(meta.introTitle);
      else if (turnPhase >= sheetCount - 0.08) setLive("Last page · closing soon");
      else {
        const idx = Math.min(
          skills.length - 1,
          Math.max(0, Math.floor(turnPhase) - 1),
        );
        setLive(skills[idx]?.name ?? "Turning page…");
      }
    };

    if (reduced) {
      applyProgress(0.22);
      return;
    }

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: section,
        start: "top top",
        // Longer pin distance = each page hangs longer before gravity takes it.
        end: () => `+=${bands * window.innerHeight * 1.05}`,
        pin: true,
        scrub: 1.15,
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

        <div ref={stageRef} className="relative mx-auto w-full max-w-[920px]">
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
            style={{
              perspective: 2800,
              perspectiveOrigin: "50% 48%",
              transformStyle: "preserve-3d",
            }}
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

              {/* Left endpaper — always under turned pages */}
              <div
                className="book-page absolute inset-y-0 left-0 w-1/2 overflow-hidden rounded-l-[16px] border border-r-0"
                style={{ boxShadow: "inset -10px 0 18px rgb(0 0 0 / 0.08)" }}
              >
                <div className="flex h-full flex-col justify-between p-5 sm:p-7">
                  <div>
                    <p className="book-muted font-mono text-[10px] uppercase tracking-[0.18em]">
                      {profile.handle} · {meta.leftLeafTitle}
                    </p>
                    <p className="book-ink mt-6 font-display text-xl leading-tight sm:text-2xl">
                      {meta.leftLeafBody}
                    </p>
                  </div>
                  <p className="book-muted font-mono text-[10px]">
                    {skills.length} skills · scroll to turn
                  </p>
                </div>
              </div>

              {/* Spine trough — keeps the spread looking packed, not floating */}
              <div
                aria-hidden
                className="pointer-events-none absolute inset-y-1 left-1/2 z-[36] w-8 -translate-x-1/2"
                style={{
                  background:
                    "linear-gradient(90deg, rgb(0 0 0 / 0.18), rgb(0 0 0 / 0.05) 40%, rgb(0 0 0 / 0.05) 60%, rgb(0 0 0 / 0.2))",
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
                      className="book-page book-sheet-face book-sheet-face--front absolute inset-0 overflow-hidden rounded-r-[16px] border border-l-0"
                      style={{
                        boxShadow:
                          "8px 16px 40px -18px rgb(0 0 0 / 0.45), inset 12px 0 20px rgb(0 0 0 / 0.04)",
                      }}
                    >
                      <div className="book-sheet-shade z-10" data-book-shade aria-hidden />
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
                            <p className="book-body mt-1.5 line-clamp-2 text-[11px] font-medium leading-snug sm:text-xs">
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

                    {/* Verso — readable left page after the turn (not a mirrored front) */}
                    <div
                      className="book-page-back book-sheet-face book-sheet-face--back absolute inset-0 overflow-hidden rounded-l-[16px] border"
                      style={{
                        boxShadow: "inset 10px 0 24px rgb(0 0 0 / 0.08)",
                      }}
                    >
                      <div className="book-sheet-shade z-10" data-book-shade aria-hidden />
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
                  className="book-sheet-face book-sheet-face--front absolute inset-0 overflow-hidden rounded-[16px] border"
                  style={{
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
                    </div>
                  </div>
                </div>

                <div
                  className="book-sheet-face book-sheet-face--back absolute inset-0 overflow-hidden rounded-l-[16px] border"
                  style={{
                    background:
                      "linear-gradient(135deg, var(--brand-800), var(--brand-600))",
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
