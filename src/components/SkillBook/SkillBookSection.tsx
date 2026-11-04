"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  motion,
  useMotionValueEvent,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from "framer-motion";
import BookPage, { PageFace } from "./BookPage";
import {
  FLIP_SHEETS,
  LEFT_ENDPAPER,
  RIGHT_BASE,
  meta,
  skills,
  type SheetContent,
} from "./skillsData";

const SHEET_COUNT = FLIP_SHEETS.length;

/**
 * Authentic 2-page skill book.
 * Hardcover is a jacket UNDER the spread — never a third side panel.
 * Scroll turns right-half leaves on a spine hinge (Framer Motion).
 */
export default function SkillBookSection() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const sync = () => setIsMobile(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  if (isMobile) return <MobileSkillBook />;
  return <DesktopSkillBook />;
}

function DesktopSkillBook() {
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });

  const progress = useSpring(scrollYProgress, {
    stiffness: 90,
    damping: 26,
    mass: 0.55,
    restDelta: 0.0004,
  });

  // 0–0.12 cover lifts away · then sequential page turns
  const coverProgress = useTransform(progress, [0, 0.12], [0, 1], {
    clamp: true,
  });
  const coverOpacity = useTransform(coverProgress, [0, 0.85, 1], [1, 1, 0]);
  const coverScale = useTransform(coverProgress, [0, 1], [1, 1.02]);
  const coverY = useTransform(coverProgress, [0, 1], [0, -12]);

  // Equal turn windows after the cover phase
  const turnStart = 0.14;
  const turnSpan = (0.98 - turnStart) / SHEET_COUNT;

  // Fixed sheet count — hooks must stay top-level / stable length.
  const sheetProgress = useMemo(
    () =>
      FLIP_SHEETS.map((_, i) => {
        const a = turnStart + i * turnSpan;
        const b = a + turnSpan * 0.92;
        return [a, b] as [number, number];
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  // Can't call useTransform in a loop — expand for known max and slice.
  // SHEET_COUNT is data-driven; use a helper component per sheet instead.
  const [label, setLabel] = useState("Closed · skills.json");
  const indicatorWidth = useTransform(progress, [0, 1], ["4%", "100%"]);

  // Cast shadow on the static right page while any leaf is mid-air.
  const castShadow = useTransform(progress, (v) => {
    if (v < turnStart) return 0;
    const local = (v - turnStart) / turnSpan;
    const within = local - Math.floor(local);
    if (local >= SHEET_COUNT) return 0;
    return Math.sin(Math.min(1, Math.max(0, within)) * Math.PI) * 0.55;
  });

  useMotionValueEvent(progress, "change", (v) => {
    if (v < 0.1) setLabel("Closed · skills.json");
    else if (v < turnStart) setLabel("Opening…");
    else {
      const idx = Math.min(
        SHEET_COUNT - 1,
        Math.max(0, Math.floor((v - turnStart) / turnSpan)),
      );
      const sheet = FLIP_SHEETS[idx];
      if (!sheet) setLabel("Turning…");
      else if (sheet.front.kind === "intro") setLabel(meta.introTitle);
      else if (sheet.front.kind === "skill") setLabel(sheet.front.skill.name);
      else setLabel("Turning…");
    }
  });

  return (
    <section
      ref={sectionRef}
      className="relative min-h-[420vh]"
      aria-labelledby="skill-book-live"
    >
      <div className="sticky top-0 flex min-h-[100svh] flex-col items-center justify-center overflow-hidden py-10">
        <p
          id="skill-book-live"
          className="mb-5 font-mono text-2xs uppercase tracking-[0.16em] text-muted"
          aria-live="polite"
        >
          {label}
        </p>

        <div className="relative mx-auto w-full max-w-[940px] px-4 sm:px-6">
          <div
            aria-hidden
            className="absolute -inset-10 rounded-[48px] opacity-45 blur-3xl"
            style={{
              background:
                "radial-gradient(circle at 50% 42%, rgb(var(--c-glow-a) / 0.28), transparent 70%)",
            }}
          />

          <BookSpread
            coverOpacity={coverOpacity}
            coverScale={coverScale}
            coverY={coverY}
            castShadow={castShadow}
            progress={progress}
            ranges={sheetProgress}
          />
        </div>

        <div className="relative z-10 mt-8 flex w-full max-w-xs flex-col items-center gap-2 px-4">
          <div className="book-track h-1 w-full overflow-hidden rounded-full">
            <motion.div
              className="h-full rounded-full bg-brand-500"
              style={{ width: indicatorWidth }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function BookSpread({
  coverOpacity,
  coverScale,
  coverY,
  castShadow,
  progress,
  ranges,
}: {
  coverOpacity: MotionValue<number>;
  coverScale: MotionValue<number>;
  coverY: MotionValue<number>;
  castShadow: MotionValue<number>;
  progress: MotionValue<number>;
  ranges: [number, number][];
}) {
  const shadowBg = useTransform(
    castShadow,
    (o) =>
      `linear-gradient(90deg, rgba(0,0,0,${0.08 + o * 0.35}) 0%, transparent 55%)`,
  );

  return (
    <div
      className="relative mx-auto aspect-[1.45/1] w-full"
      style={{
        perspective: 1800,
        perspectiveOrigin: "50% 48%",
      }}
    >
      {/* Floor shadow */}
      <div
        aria-hidden
        className="absolute -bottom-4 left-[12%] right-[12%] h-8 rounded-[100%] bg-black/35 blur-xl dark:bg-black/55"
      />

      {/* Hardcover jacket — UNDER the whole spread (not a side panel) */}
      <div
        aria-hidden
        className="book-jacket pointer-events-none absolute inset-0 -m-3 rounded-2xl sm:-m-4"
      />

      {/* Page block */}
      <div
        className="absolute inset-0 overflow-visible rounded-xl"
        style={{ transformStyle: "preserve-3d" }}
      >
        {/* Static left (verso endpaper) */}
        <div
          className="book-page absolute inset-y-0 left-0 h-full w-1/2 overflow-hidden rounded-l-xl border border-r-0"
          style={{ boxShadow: "inset -12px 0 22px rgb(0 0 0 / 0.1)" }}
        >
          <div className="flex h-full min-h-0 flex-col p-5 sm:p-7 md:p-8">
            <p className="book-muted shrink-0 font-mono text-[10px] uppercase tracking-[0.18em]">
              {LEFT_ENDPAPER.eyebrow}
            </p>
            <p className="book-ink book-rule mt-5 border-t pt-5 font-display text-xl leading-snug sm:text-2xl">
              {LEFT_ENDPAPER.body}
            </p>
            <p className="book-muted mt-auto shrink-0 font-mono text-[10px]">
              {LEFT_ENDPAPER.footer}
            </p>
          </div>
        </div>

        {/* Static right (base under flipping leaves) */}
        <div
          className="book-page absolute inset-y-0 right-0 h-full w-1/2 overflow-hidden rounded-r-xl border border-l-0"
          style={{ boxShadow: "inset 12px 0 22px rgb(0 0 0 / 0.06)" }}
        >
          <div className="flex h-full flex-col p-5 sm:p-7 md:p-8">
            <p className="book-muted font-mono text-[10px] uppercase tracking-[0.16em]">
              {RIGHT_BASE.eyebrow}
            </p>
            <h3 className="book-ink mt-4 font-display text-xl sm:text-2xl">
              {RIGHT_BASE.title}
            </h3>
            <p className="book-body mt-3 text-[12px] leading-relaxed sm:text-sm">
              {RIGHT_BASE.body}
            </p>
          </div>
          <motion.div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{ background: shadowBg }}
          />
        </div>

        {/* Spine joint */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 left-1/2 z-30 w-8 -translate-x-1/2"
          style={{
            background:
              "linear-gradient(to right, rgba(0,0,0,0.5), transparent 45%, transparent 55%, rgba(0,0,0,0.5))",
          }}
        />
        <div
          aria-hidden
          className="book-binding pointer-events-none absolute inset-y-3 left-1/2 z-[31] w-[6px] -translate-x-1/2 rounded-sm"
        />

        {/* Flipping leaves — each is a FlipLeaf so hooks stay legal */}
        {FLIP_SHEETS.map((sheet, i) => (
          <FlipLeaf
            key={sheet.id}
            sheet={sheet}
            index={i}
            progress={progress}
            range={ranges[i]!}
          />
        ))}

        {/* Front cover overlay — fades up, never becomes a third column */}
        <motion.div
          className="book-cover-overlay absolute inset-0 z-50 overflow-hidden rounded-xl border will-change-transform"
          style={{
            opacity: coverOpacity,
            scale: coverScale,
            y: coverY,
            pointerEvents: "none",
          }}
        >
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(145deg, var(--brand-950), var(--brand-800) 42%, var(--brand-600))",
            }}
          />
          <div
            aria-hidden
            className="book-binding absolute inset-y-0 left-0 w-3"
          />
          <div className="absolute inset-0 flex flex-col justify-between p-6 text-white sm:p-8">
            <div>
              <div className="inline-flex items-center gap-2 rounded-md border border-white/15 bg-black/30 px-2.5 py-1 font-mono text-[10px] text-white/75">
                <span className="h-1.5 w-1.5 rounded-full bg-accent-400" />
                skills.json
              </div>
              <p className="mt-5 font-mono text-[10px] uppercase tracking-[0.2em] text-white/65">
                {meta.eyebrow}
              </p>
              <p className="mt-3 font-display text-[1.8rem] leading-none sm:text-[2.2rem]">
                {meta.title}
              </p>
            </div>
            <p className="font-mono text-[10px] text-white/50">
              scroll to open →
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function FlipLeaf({
  sheet,
  index,
  progress,
  range,
}: {
  sheet: (typeof FLIP_SHEETS)[number];
  index: number;
  progress: MotionValue<number>;
  range: [number, number];
}) {
  const local = useTransform(progress, range, [0, 1], { clamp: true });
  // Gravity-ish remap: hang, fall, settle
  const gravity = useTransform(local, (t) => {
    const x = Math.min(1, Math.max(0, t));
    // Smoothstep-ish with front-loaded hang
    const hang = x * x * (3 - 2 * x);
    return hang * hang * (3 - 2 * hang);
  });

  return (
    <BookPage
      progress={gravity}
      front={sheet.front}
      back={sheet.back}
      stackIndex={index}
      sheetCount={SHEET_COUNT}
    />
  );
}

function MobileSkillBook() {
  const faces = useMemo(() => {
    const list: SheetContent[] = [];
    for (const sheet of FLIP_SHEETS) {
      list.push(sheet.front);
    }
    return list;
  }, []);
  const [index, setIndex] = useState(0);

  return (
    <section className="relative py-14" aria-labelledby="skill-book-mobile">
      <div className="shell">
        <p
          id="skill-book-mobile"
          className="mb-5 font-mono text-2xs uppercase tracking-[0.16em] text-muted"
        >
          {meta.title}
        </p>
        <div
          className="book-page overflow-hidden rounded-2xl border"
          style={{ minHeight: 440 }}
        >
          <PageFace content={faces[index]!} side="right" />
        </div>
        <div className="mt-5 flex items-center justify-between gap-3">
          <button
            type="button"
            className="btn btn-ghost px-4! py-2!"
            disabled={index === 0}
            onClick={() => setIndex((i) => Math.max(0, i - 1))}
          >
            Prev
          </button>
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
            Page {index + 1} of {faces.length}
          </p>
          <button
            type="button"
            className="btn btn-ghost px-4! py-2!"
            disabled={index >= faces.length - 1}
            onClick={() => setIndex((i) => Math.min(faces.length - 1, i + 1))}
          >
            Next
          </button>
        </div>
      </div>
    </section>
  );
}

// silence unused import warning if tree-shaken oddly
void skills;
