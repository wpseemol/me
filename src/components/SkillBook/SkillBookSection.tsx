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
 * Real book:
 * 1) Closed hardcover (centered cover + page edges)
 * 2) Cover swings open on the spine
 * 3) Pages turn one-by-one on scroll
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
    stiffness: 92,
    damping: 26,
    mass: 0.55,
    restDelta: 0.0004,
  });

  // Phases: hold closed → open cover → turn pages
  const OPEN_START = 0.06;
  const OPEN_END = 0.22;
  const TURN_START = 0.24;
  const turnSpan = (0.97 - TURN_START) / SHEET_COUNT;

  const openT = useTransform(progress, [OPEN_START, OPEN_END], [0, 1], {
    clamp: true,
  });

  // Cover hinge 0 → -165° (real open, not a fade)
  const coverRotate = useTransform(openT, [0, 1], [0, -165]);
  const coverLift = useTransform(openT, [0, 0.5, 1], [0, 28, 8]);
  // Closed book sits so the cover face is centered; open book is full spread.
  const bookX = useTransform(openT, [0, 1], ["22%", "0%"]);
  const bookRotateX = useTransform(openT, [0, 1], [8, 2]);
  const edgesOpacity = useTransform(openT, [0, 0.35], [1, 0]);
  const spineOpacity = useTransform(openT, [0.25, 0.7], [0, 1]);

  const ranges = useMemo(
    () =>
      FLIP_SHEETS.map((_, i) => {
        const a = TURN_START + i * turnSpan;
        const b = a + turnSpan * 0.88;
        return [a, b] as [number, number];
      }),
    [turnSpan],
  );

  const [label, setLabel] = useState("Closed · Skill book");
  const indicatorWidth = useTransform(progress, [0, 1], ["5%", "100%"]);

  useMotionValueEvent(progress, "change", (v) => {
    if (v < OPEN_START) setLabel("Closed · Skill book");
    else if (v < OPEN_END) setLabel("Opening cover…");
    else if (v < TURN_START + 0.02) setLabel(meta.introTitle);
    else {
      const idx = Math.min(
        SHEET_COUNT - 1,
        Math.max(0, Math.floor((v - TURN_START) / turnSpan)),
      );
      const sheet = FLIP_SHEETS[idx];
      if (!sheet) setLabel("Turning page…");
      else if (sheet.front.kind === "intro") setLabel(meta.introTitle);
      else if (sheet.front.kind === "skill") setLabel(sheet.front.skill.name);
      else setLabel("Turning page…");
    }
  });

  return (
    <section
      ref={sectionRef}
      className="relative min-h-[440vh]"
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

        <div className="relative mx-auto w-full max-w-[920px] px-4 sm:px-6">
          <div
            aria-hidden
            className="absolute -inset-12 rounded-[48px] opacity-45 blur-3xl"
            style={{
              background:
                "radial-gradient(circle at 50% 40%, rgb(var(--c-glow-a) / 0.3), transparent 70%)",
            }}
          />

          <motion.div
            className="relative mx-auto aspect-[1.55/1] w-full"
            style={{
              perspective: 2200,
              perspectiveOrigin: "50% 45%",
            }}
          >
            {/* Floor shadow */}
            <div
              aria-hidden
              className="absolute -bottom-5 left-[16%] right-[16%] h-10 rounded-[100%] bg-black/40 blur-2xl dark:bg-black/60"
            />

            <motion.div
              className="absolute inset-0 will-change-transform"
              style={{
                x: bookX,
                rotateX: bookRotateX,
                transformStyle: "preserve-3d",
              }}
            >
              {/* Hardcover jacket under pages */}
              <div
                aria-hidden
                className="book-jacket pointer-events-none absolute inset-0 -m-2 rounded-[16px] sm:-m-3 sm:rounded-[18px]"
              />

              <div
                className="absolute inset-0 rounded-[12px]"
                style={{ transformStyle: "preserve-3d" }}
              >
                {/* Left endpaper (visible once cover opens / pages land) */}
                <div
                  className="book-page absolute inset-y-0 left-0 h-full w-1/2 overflow-hidden rounded-l-[12px] border border-r-0"
                  style={{ boxShadow: "inset -14px 0 26px rgb(0 0 0 / 0.14)" }}
                >
                  <div className="flex h-full flex-col p-5 sm:p-7 md:p-8">
                    <p className="book-muted font-mono text-[10px] uppercase tracking-[0.18em]">
                      {LEFT_ENDPAPER.eyebrow}
                    </p>
                    <p className="book-ink book-rule mt-5 border-t pt-5 font-display text-xl leading-snug sm:text-2xl">
                      {LEFT_ENDPAPER.body}
                    </p>
                    <p className="book-muted mt-auto font-mono text-[10px]">
                      {LEFT_ENDPAPER.footer}
                    </p>
                  </div>
                </div>

                {/* Right base under flipping sheets */}
                <div
                  className="book-page absolute inset-y-0 right-0 h-full w-1/2 overflow-hidden rounded-r-[12px] border border-l-0"
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
                </div>

                {/* Spine crease when open */}
                <motion.div
                  aria-hidden
                  className="pointer-events-none absolute inset-y-0 left-1/2 z-30 w-10 -translate-x-1/2"
                  style={{
                    opacity: spineOpacity,
                    background:
                      "linear-gradient(to right, rgba(0,0,0,0.48), transparent 42%, transparent 58%, rgba(0,0,0,0.48))",
                  }}
                />
                <motion.div
                  aria-hidden
                  className="book-binding pointer-events-none absolute inset-y-3 left-1/2 z-[31] w-[6px] -translate-x-1/2 rounded-sm"
                  style={{ opacity: spineOpacity }}
                />

                {/* Closed-book page block (fore-edge) — right of the cover */}
                <motion.div
                  aria-hidden
                  className="book-fore-edge pointer-events-none absolute inset-y-[5%] right-[-11px] z-[45] w-[12px] rounded-r-[6px]"
                  style={{ opacity: edgesOpacity }}
                />

                {/* Flipping skill pages (under the cover) */}
                {FLIP_SHEETS.map((sheet, i) => (
                  <FlipLeaf
                    key={sheet.id}
                    sheet={sheet}
                    index={i}
                    progress={progress}
                    range={ranges[i]!}
                    openT={openT}
                  />
                ))}

                {/* HARDCOVER — hinged at the spine (center). This is the book. */}
                <motion.div
                  className="absolute inset-y-0 left-1/2 z-[60] w-1/2 origin-left will-change-transform"
                  style={{
                    rotateY: coverRotate,
                    z: coverLift,
                    transformStyle: "preserve-3d",
                  }}
                >
                  {/* Front cover */}
                  <div
                    className="absolute inset-0 overflow-hidden rounded-r-[12px] border"
                    style={{
                      backfaceVisibility: "hidden",
                      WebkitBackfaceVisibility: "hidden",
                      transform: "translateZ(1px)",
                      boxShadow:
                        "10px 22px 44px -14px rgb(0 0 0 / 0.55), inset 0 1px 0 rgb(255 255 255 / 0.14)",
                      background:
                        "linear-gradient(155deg, var(--brand-950) 0%, var(--brand-800) 42%, var(--brand-600) 100%)",
                    }}
                  >
                    <div
                      aria-hidden
                      className="book-binding absolute inset-y-0 left-0 w-3"
                    />
                    <div className="absolute inset-0 flex flex-col justify-between p-5 text-white sm:p-7">
                      <div>
                        <div className="inline-flex items-center gap-2 rounded-md border border-white/15 bg-black/35 px-2.5 py-1 font-mono text-[10px] text-white/80">
                          <span className="h-1.5 w-1.5 rounded-full bg-accent-400" />
                          skills.json
                        </div>
                        <p className="mt-5 font-mono text-[10px] uppercase tracking-[0.2em] text-white/65">
                          {meta.eyebrow}
                        </p>
                        <p className="mt-3 font-display text-[1.75rem] leading-none sm:text-[2.15rem]">
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
                  </div>

                  {/* Inside cover (verso) */}
                  <div
                    className="absolute inset-0 overflow-hidden rounded-l-[12px] border"
                    style={{
                      backfaceVisibility: "hidden",
                      WebkitBackfaceVisibility: "hidden",
                      transform: "rotateY(180deg) translateZ(1px)",
                      background:
                        "linear-gradient(145deg, var(--brand-900), var(--brand-700))",
                    }}
                  >
                    <div className="flex h-full flex-col justify-end p-5 text-white/75 sm:p-6">
                      <p className="font-mono text-[10px] uppercase tracking-[0.16em]">
                        Inside cover
                      </p>
                      <p className="mt-2 text-sm leading-relaxed">
                        {meta.insideCover}
                      </p>
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
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

function FlipLeaf({
  sheet,
  index,
  progress,
  range,
  openT,
}: {
  sheet: (typeof FLIP_SHEETS)[number];
  index: number;
  progress: MotionValue<number>;
  range: [number, number];
  openT: MotionValue<number>;
}) {
  const local = useTransform(progress, range, [0, 1], { clamp: true });

  // Pages only turn after the cover is mostly open.
  const gravity = useTransform([local, openT], ([t, open]) => {
    const o = Number(open);
    const x = Math.min(1, Math.max(0, Number(t)));
    if (o < 0.85) return 0;
    // Gravity curve: hang → fall → settle
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
