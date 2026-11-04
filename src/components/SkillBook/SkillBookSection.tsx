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
 * Physical hardcover → open spread → page turns.
 * Closed pose matches a real book (cover + spine + thick page block).
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
    stiffness: 88,
    damping: 28,
    mass: 0.6,
    restDelta: 0.0004,
  });

  // 0–0.18 closed hardcover pose
  // 0.18–0.38 face camera + cover opens
  // 0.40–1 page turns
  const poseT = useTransform(progress, [0.02, 0.2], [0, 1], { clamp: true });
  const openT = useTransform(progress, [0.18, 0.38], [0, 1], { clamp: true });
  const TURN_START = 0.4;
  const turnSpan = (0.97 - TURN_START) / SHEET_COUNT;

  // Closed = three-quarter hardcover. Open = front-facing spread.
  const bookRotateY = useTransform(poseT, [0, 1], [-32, 0]);
  const bookRotateX = useTransform(poseT, [0, 1], [14, 2]);
  const bookRotateZ = useTransform(poseT, [0, 1], [-4, 0]);
  const bookScale = useTransform(poseT, [0, 1], [0.92, 1]);

  // Cover hinged at spine — slightly ajar when closed (like the reference).
  const coverRotate = useTransform(openT, [0, 1], [-8, -168]);
  const coverZ = useTransform(openT, [0, 0.45, 1], [18, 36, 10]);

  // Closed block is a single volume; open expands to a full spread.
  const closedOpacity = useTransform(openT, [0, 0.35], [1, 0]);
  const spreadOpacity = useTransform(openT, [0.28, 0.7], [0, 1]);
  const blockDepth = useTransform(poseT, [0, 1], [1, 0.35]);
  const groundOpacity = useTransform(poseT, [0, 1], [0.9, 0.45]);

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
  const indicatorWidth = useTransform(progress, [0, 1], ["4%", "100%"]);

  useMotionValueEvent(progress, "change", (v) => {
    if (v < 0.18) setLabel("Closed · Skill book");
    else if (v < 0.38) setLabel("Opening…");
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
      className="relative min-h-[460vh]"
      aria-labelledby="skill-book-live"
    >
      <div className="sticky top-0 flex min-h-[100svh] flex-col items-center justify-center overflow-hidden py-10">
        <p
          id="skill-book-live"
          className="mb-6 font-mono text-2xs uppercase tracking-[0.16em] text-muted"
          aria-live="polite"
        >
          {label}
        </p>

        <div className="relative mx-auto w-full max-w-[880px] px-4 sm:px-8">
          <div
            aria-hidden
            className="absolute -inset-16 rounded-[56px] opacity-40 blur-3xl"
            style={{
              background:
                "radial-gradient(circle at 50% 55%, rgb(var(--c-glow-a) / 0.28), transparent 68%)",
            }}
          />

          <div
            className="relative mx-auto flex aspect-[1.35/1] w-full items-center justify-center"
            style={{
              perspective: 1800,
              perspectiveOrigin: "50% 55%",
            }}
          >
            {/* Soft ground shadow */}
            <motion.div
              aria-hidden
              className="absolute bottom-[6%] left-[18%] right-[12%] h-12 rounded-[100%] bg-black/45 blur-2xl dark:bg-black/65"
              style={{ opacity: groundOpacity }}
            />

            <motion.div
              className="hardcover relative h-[86%] w-[58%] will-change-transform sm:w-[52%]"
              style={{
                rotateY: bookRotateY,
                rotateX: bookRotateX,
                rotateZ: bookRotateZ,
                scale: bookScale,
                transformStyle: "preserve-3d",
                transformOrigin: "50% 60%",
              }}
            >
              {/* ===== CLOSED HARDCOVER VOLUME ===== */}
              <motion.div
                className="absolute inset-0"
                style={{
                  opacity: closedOpacity,
                  transformStyle: "preserve-3d",
                  pointerEvents: "none",
                }}
              >
                {/* Back board */}
                <div
                  className="hardcover-board absolute inset-0 rounded-[10px]"
                  style={{
                    transform: "translateZ(-22px)",
                    background:
                      "linear-gradient(145deg, var(--brand-950), var(--brand-800))",
                    boxShadow: "inset 0 0 0 1px rgb(0 0 0 / 0.35)",
                  }}
                />

                {/* Thick page block (text block) */}
                <motion.div
                  className="absolute inset-y-[3%] left-[4%] right-[3%]"
                  style={{
                    transformStyle: "preserve-3d",
                    scaleX: blockDepth,
                    transformOrigin: "left center",
                  }}
                >
                  {/* Pages body */}
                  <div
                    className="absolute inset-0 rounded-sm"
                    style={{
                      transform: "translateZ(0px)",
                      background: "var(--book-page)",
                      boxShadow: "inset 0 0 20px rgb(0 0 0 / 0.08)",
                    }}
                  />
                  {/* Fore-edge (right) — stacked paper */}
                  <div
                    className="hardcover-pages absolute inset-y-0 -right-[18px] w-[18px] rounded-r-[3px] sm:-right-[22px] sm:w-[22px]"
                    style={{
                      transform: "rotateY(90deg)",
                      transformOrigin: "left center",
                    }}
                  />
                  {/* Head band (top edge of pages) */}
                  <div
                    className="hardcover-pages-top absolute -top-[14px] right-0 left-0 h-[14px] sm:-top-[16px] sm:h-[16px]"
                    style={{
                      transform: "rotateX(90deg)",
                      transformOrigin: "bottom center",
                    }}
                  />
                </motion.div>

                {/* Spine */}
                <div
                  className="hardcover-spine absolute inset-y-0 left-0 w-[26px] rounded-l-[10px] sm:w-[32px]"
                  style={{
                    transform: "rotateY(-90deg) translateZ(0px)",
                    transformOrigin: "left center",
                  }}
                >
                  <p className="absolute inset-x-0 top-1/2 origin-center -translate-y-1/2 rotate-180 text-center font-mono text-[8px] tracking-[0.2em] text-white/50 [writing-mode:vertical-rl]">
                    SKILL BOOK
                  </p>
                </div>

                {/* Ribbon bookmark */}
                <div
                  aria-hidden
                  className="absolute bottom-[-18px] left-[18%] z-20 h-10 w-[10px] rounded-b-sm"
                  style={{
                    background:
                      "linear-gradient(180deg, var(--brand-400), var(--brand-600))",
                    boxShadow: "1px 2px 6px rgb(0 0 0 / 0.35)",
                    transform: "translateZ(24px)",
                  }}
                />
              </motion.div>

              {/* Front cover — hinged at the spine */}
              <motion.div
                className="absolute inset-0 origin-left will-change-transform"
                style={{
                  rotateY: coverRotate,
                  z: coverZ,
                  transformStyle: "preserve-3d",
                }}
              >
                <div
                  className="hardcover-cover absolute inset-0 overflow-hidden rounded-[10px]"
                  style={{
                    backfaceVisibility: "hidden",
                    WebkitBackfaceVisibility: "hidden",
                    transform: "translateZ(24px)",
                  }}
                >
                  <div
                    className="absolute inset-0"
                    style={{
                      background:
                        "linear-gradient(155deg, var(--brand-950) 0%, var(--brand-800) 40%, var(--brand-600) 100%)",
                    }}
                  />
                  {/* Hinge groove */}
                  <div
                    aria-hidden
                    className="absolute inset-y-3 left-[10px] w-[3px] rounded-full bg-black/35"
                  />
                  <div
                    aria-hidden
                    className="absolute inset-3 rounded-[8px] border border-white/10"
                  />
                  <div className="absolute inset-0 flex flex-col justify-between p-5 text-white sm:p-7">
                    <div>
                      <div className="inline-flex items-center gap-2 rounded-md border border-white/15 bg-black/35 px-2.5 py-1 font-mono text-[10px] text-white/80">
                        <span className="h-1.5 w-1.5 rounded-full bg-accent-400" />
                        skills.json
                      </div>
                      <p className="mt-6 font-mono text-[10px] uppercase tracking-[0.22em] text-white/60">
                        {meta.eyebrow}
                      </p>
                      <p className="mt-3 font-display text-[1.85rem] leading-none sm:text-[2.2rem]">
                        {meta.title}
                      </p>
                    </div>
                    <div>
                      <p className="font-display text-lg leading-tight">
                        {profile.name}
                      </p>
                      <p className="mt-1 font-mono text-[10px] text-white/55">
                        @{profile.handle}
                      </p>
                      <p className="mt-4 font-mono text-[10px] text-white/40">
                        scroll to open →
                      </p>
                    </div>
                  </div>
                </div>

                {/* Inside of front cover */}
                <div
                  className="absolute inset-0 overflow-hidden rounded-[10px]"
                  style={{
                    backfaceVisibility: "hidden",
                    WebkitBackfaceVisibility: "hidden",
                    transform: "rotateY(180deg) translateZ(24px)",
                    background:
                      "linear-gradient(145deg, var(--brand-900), var(--brand-700))",
                  }}
                >
                  <div className="flex h-full flex-col justify-end p-6 text-white/70">
                    <p className="font-mono text-[10px] uppercase tracking-[0.16em]">
                      Inside cover
                    </p>
                    <p className="mt-2 text-sm leading-relaxed">
                      {meta.insideCover}
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* ===== OPEN READING SPREAD ===== */}
              <motion.div
                className="absolute inset-y-[-4%] left-[-48%] right-[-2%]"
                style={{
                  opacity: spreadOpacity,
                  transformStyle: "preserve-3d",
                  transform: "translateZ(8px)",
                }}
              >
                <OpenSpread progress={progress} ranges={ranges} openT={openT} />
              </motion.div>
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

function OpenSpread({
  progress,
  ranges,
  openT,
}: {
  progress: MotionValue<number>;
  ranges: [number, number][];
  openT: MotionValue<number>;
}) {
  return (
    <div
      className="absolute inset-0 overflow-visible rounded-[12px]"
      style={{ transformStyle: "preserve-3d" }}
    >
      <div
        aria-hidden
        className="book-jacket pointer-events-none absolute inset-0 -m-2 rounded-[16px]"
      />

      <div
        className="book-page absolute inset-y-0 left-0 h-full w-1/2 overflow-hidden rounded-l-[12px] border border-r-0"
        style={{ boxShadow: "inset -14px 0 26px rgb(0 0 0 / 0.12)" }}
      >
        <div className="flex h-full flex-col p-5 sm:p-7">
          <p className="book-muted font-mono text-[10px] uppercase tracking-[0.18em]">
            {LEFT_ENDPAPER.eyebrow}
          </p>
          <p className="book-ink book-rule mt-4 border-t pt-4 font-display text-xl leading-snug sm:text-2xl">
            {LEFT_ENDPAPER.body}
          </p>
          <p className="book-muted mt-auto font-mono text-[10px]">
            {LEFT_ENDPAPER.footer}
          </p>
        </div>
      </div>

      <div
        className="book-page absolute inset-y-0 right-0 h-full w-1/2 overflow-hidden rounded-r-[12px] border border-l-0"
        style={{ boxShadow: "inset 12px 0 22px rgb(0 0 0 / 0.06)" }}
      >
        <div className="flex h-full flex-col p-5 sm:p-7">
          <p className="book-muted font-mono text-[10px] uppercase tracking-[0.16em]">
            {RIGHT_BASE.eyebrow}
          </p>
          <h3 className="book-ink mt-3 font-display text-xl sm:text-2xl">
            {RIGHT_BASE.title}
          </h3>
          <p className="book-body mt-3 text-[12px] leading-relaxed sm:text-sm">
            {RIGHT_BASE.body}
          </p>
        </div>
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
        className="book-binding pointer-events-none absolute inset-y-3 left-1/2 z-[31] w-[5px] -translate-x-1/2 rounded-sm"
      />

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
    </div>
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
  const gravity = useTransform([local, openT], ([t, open]) => {
    if (Number(open) < 0.9) return 0;
    const x = Math.min(1, Math.max(0, Number(t)));
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
