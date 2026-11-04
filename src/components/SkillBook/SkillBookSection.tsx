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
  profile,
} from "./skillsData";

const SHEET_COUNT = FLIP_SHEETS.length;

/**
 * Closed = one hardcover face.
 * Open = two-page spread only (no cover sitting beside pages).
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
    stiffness: 100,
    damping: 28,
    mass: 0.5,
    restDelta: 0.0004,
  });

  const COVER_END = 0.14;
  const TURN_START = 0.16;
  const turnSpan = (0.98 - TURN_START) / SHEET_COUNT;

  const coverProgress = useTransform(progress, [0.02, COVER_END], [0, 1], {
    clamp: true,
  });
  // Full cover until gone — never a half-open side panel.
  const coverOpacity = useTransform(coverProgress, [0, 0.55, 1], [1, 0.92, 0]);
  const coverScale = useTransform(coverProgress, [0, 1], [1, 1.04]);
  const coverBlur = useTransform(coverProgress, [0, 1], [0, 6]);
  const pagesOpacity = useTransform(coverProgress, [0.45, 0.85], [0, 1], {
    clamp: true,
  });

  const ranges = useMemo(
    () =>
      FLIP_SHEETS.map((_, i) => {
        const a = TURN_START + i * turnSpan;
        const b = a + turnSpan * 0.9;
        return [a, b] as [number, number];
      }),
    [turnSpan],
  );

  const [label, setLabel] = useState("Closed · skills.json");
  const [pagesLive, setPagesLive] = useState(false);
  const indicatorWidth = useTransform(progress, [0, 1], ["4%", "100%"]);

  const castShadow = useTransform(progress, (v) => {
    if (v < TURN_START) return 0;
    const local = (v - TURN_START) / turnSpan;
    if (local >= SHEET_COUNT) return 0;
    const within = local - Math.floor(local);
    return Math.sin(Math.min(1, Math.max(0, within)) * Math.PI) * 0.5;
  });

  useMotionValueEvent(progress, "change", (v) => {
    setPagesLive(v >= COVER_END * 0.7);
    if (v < 0.04) setLabel("Closed · skills.json");
    else if (v < TURN_START) setLabel("Opening…");
    else {
      const idx = Math.min(
        SHEET_COUNT - 1,
        Math.max(0, Math.floor((v - TURN_START) / turnSpan)),
      );
      const sheet = FLIP_SHEETS[idx];
      if (!sheet) setLabel("Turning…");
      else if (sheet.front.kind === "intro") setLabel(meta.introTitle);
      else if (sheet.front.kind === "skill") setLabel(sheet.front.skill.name);
      else setLabel("Turning…");
    }
  });

  const filter = useTransform(coverBlur, (b) => `blur(${b}px)`);

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

        <div className="relative mx-auto w-full max-w-[900px] px-5 sm:px-8">
          <div
            aria-hidden
            className="absolute -inset-10 rounded-[48px] opacity-45 blur-3xl"
            style={{
              background:
                "radial-gradient(circle at 50% 42%, rgb(var(--c-glow-a) / 0.28), transparent 70%)",
            }}
          />

          <div
            className="relative mx-auto aspect-[1.4/1] w-full"
            style={{ perspective: 2000, perspectiveOrigin: "50% 45%" }}
          >
            <div
              aria-hidden
              className="absolute -bottom-5 left-[14%] right-[14%] h-9 rounded-[100%] bg-black/40 blur-2xl dark:bg-black/60"
            />

            {/* Jacket hugs the whole book evenly */}
            <div
              aria-hidden
              className="book-jacket pointer-events-none absolute inset-0 -m-2.5 rounded-[18px] sm:-m-3.5 sm:rounded-[22px]"
            />

            {/* Open spread (under cover until cover fades) */}
            <motion.div
              className="absolute inset-0"
              style={{ opacity: pagesOpacity, transformStyle: "preserve-3d" }}
            >
              <Spread
                castShadow={castShadow}
                progress={progress}
                ranges={ranges}
                enabled={pagesLive}
              />
            </motion.div>

            {/* Closed hardcover — full face, above every page */}
            <motion.div
              className="absolute inset-0 z-[90] overflow-hidden rounded-[14px] border will-change-transform"
              style={{
                opacity: coverOpacity,
                scale: coverScale,
                filter,
                pointerEvents: "none",
                boxShadow:
                  "0 28px 60px -22px rgb(0 0 0 / 0.65), inset 0 1px 0 rgb(255 255 255 / 0.12)",
              }}
            >
              <div
                className="absolute inset-0"
                style={{
                  background:
                    "linear-gradient(155deg, var(--brand-950) 0%, var(--brand-800) 40%, var(--brand-600) 100%)",
                }}
              />
              <div
                aria-hidden
                className="book-binding absolute inset-y-0 left-0 w-3.5"
              />
              <div
                aria-hidden
                className="pointer-events-none absolute inset-y-0 right-0 w-3 opacity-40"
                style={{
                  background:
                    "linear-gradient(90deg, transparent, rgb(0 0 0 / 0.25))",
                }}
              />
              <div className="absolute inset-0 flex flex-col justify-between p-6 text-white sm:p-8">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-md border border-white/15 bg-black/35 px-2.5 py-1 font-mono text-[10px] text-white/80">
                    <span className="h-1.5 w-1.5 rounded-full bg-accent-400" />
                    skills.json
                  </div>
                  <p className="mt-6 font-mono text-[10px] uppercase tracking-[0.2em] text-white/65">
                    {meta.eyebrow}
                  </p>
                  <p className="mt-3 font-display text-[1.85rem] leading-none sm:text-[2.25rem]">
                    {meta.title}
                  </p>
                </div>
                <div>
                  <p className="font-display text-lg">{profile.name}</p>
                  <p className="mt-1 font-mono text-[10px] text-white/55">
                    @{profile.handle}
                  </p>
                  <p className="mt-4 font-mono text-[10px] text-white/45">
                    scroll to open →
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
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

function Spread({
  castShadow,
  progress,
  ranges,
  enabled,
}: {
  castShadow: MotionValue<number>;
  progress: MotionValue<number>;
  ranges: [number, number][];
  enabled: boolean;
}) {
  const shadowBg = useTransform(
    castShadow,
    (o) =>
      `linear-gradient(90deg, rgba(0,0,0,${0.1 + o * 0.4}) 0%, transparent 58%)`,
  );

  return (
    <div
      className="absolute inset-0 overflow-visible rounded-[14px]"
      style={{ transformStyle: "preserve-3d" }}
    >
      <div
        className="book-page absolute inset-y-0 left-0 h-full w-1/2 overflow-hidden rounded-l-[14px] border border-r-0"
        style={{ boxShadow: "inset -14px 0 24px rgb(0 0 0 / 0.12)" }}
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

      <div
        className="book-page absolute inset-y-0 right-0 h-full w-1/2 overflow-hidden rounded-r-[14px] border border-l-0"
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

      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-1/2 z-30 w-10 -translate-x-1/2"
        style={{
          background:
            "linear-gradient(to right, rgba(0,0,0,0.45), transparent 42%, transparent 58%, rgba(0,0,0,0.45))",
        }}
      />
      <div
        aria-hidden
        className="book-binding pointer-events-none absolute inset-y-4 left-1/2 z-[31] w-[5px] -translate-x-1/2 rounded-sm"
      />

      {FLIP_SHEETS.map((sheet, i) => (
        <FlipLeaf
          key={sheet.id}
          sheet={sheet}
          index={i}
          progress={progress}
          range={ranges[i]!}
          enabled={enabled}
        />
      ))}
    </div>
  );
}

function FlipLeaf({
  sheet,
  index,
  progress,
  range,
  enabled,
}: {
  sheet: (typeof FLIP_SHEETS)[number];
  index: number;
  progress: MotionValue<number>;
  range: [number, number];
  enabled: boolean;
}) {
  const local = useTransform(progress, range, [0, 1], { clamp: true });
  const gravity = useTransform(local, (t) => {
    if (!enabled) return 0;
    const x = Math.min(1, Math.max(0, t));
    return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
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
  const faces = useMemo(() => FLIP_SHEETS.map((s) => s.front), []);
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
