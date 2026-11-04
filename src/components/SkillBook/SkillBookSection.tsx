"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import BookPage, { PageFace } from "./BookPage";
import {
  FLIP_SHEETS,
  LEFT_ENDPAPER,
  RIGHT_BASE,
  meta,
  profile,
} from "./skillsData";
import { asset } from "@/lib/asset";
import { useTheme } from "@/components/ThemeProvider";

gsap.registerPlugin(ScrollTrigger);

const SHEET_COUNT = FLIP_SHEETS.length;

/**
 * Sticky hardcover Skill Book — CSS 3D + GSAP ScrollTrigger only (no Three.js).
 * Closed volume → open 2-page spread → page turns → close.
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
  const { theme } = useTheme();
  const sectionRef = useRef<HTMLElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const bookRef = useRef<HTMLDivElement>(null);
  const coverRef = useRef<HTMLDivElement>(null);
  const edgeRef = useRef<HTMLDivElement>(null);
  const spineRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLParagraphElement>(null);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    const pin = pinRef.current;
    const stage = stageRef.current;
    const book = bookRef.current;
    const cover = coverRef.current;
    const edge = edgeRef.current;
    const spine = spineRef.current;
    if (!section || !pin || !stage || !book || !cover || !edge || !spine) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const sheets = gsap.utils.toArray<HTMLElement>("[data-book-sheet]", book);
    const shades = gsap.utils.toArray<HTMLElement>("[data-sheet-shade]", book);
    const curls = gsap.utils.toArray<HTMLElement>("[data-sheet-curl]", book);

    const setLabel = (text: string) => {
      if (labelRef.current) labelRef.current.textContent = text;
    };

    const ctx = gsap.context(() => {
      // Closed hardcover — angled object on the table
      gsap.set(book, {
        rotateX: 16,
        rotateY: -32,
        rotateZ: -4,
        xPercent: -8,
        scale: 0.92,
        transformOrigin: "50% 55%",
      });
      gsap.set(cover, {
        rotateY: 0,
        autoAlpha: 1,
        transformOrigin: "left center",
      });
      gsap.set(edge, { autoAlpha: 1, scaleX: 1 });
      gsap.set(spine, { autoAlpha: 1 });
      gsap.set(sheets, {
        rotateY: 0,
        z: 0,
        transformOrigin: "left center",
      });
      gsap.set(shades, { opacity: 0 });
      gsap.set(curls, { opacity: 0 });

      if (reduced) {
        gsap.set(book, {
          rotateX: 4,
          rotateY: 0,
          rotateZ: 0,
          xPercent: 0,
          scale: 1.08,
        });
        gsap.set(cover, { autoAlpha: 0, rotateY: -180 });
        gsap.set([edge, spine], { autoAlpha: 0 });
        setLabel(meta.introTitle);
        return;
      }

      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: "+=480%",
          pin: pin,
          scrub: 0.65,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            if (progressRef.current) {
              gsap.set(progressRef.current, {
                scaleX: 0.04 + self.progress * 0.96,
              });
            }
          },
        },
      });

      // 1) Hold closed
      tl.to({}, { duration: 0.06, onStart: () => setLabel("Closed · Skill book") });

      // 2) Open cover fast through upright — never linger as a 3rd panel
      tl.to(
        cover,
        {
          rotateY: -180,
          duration: 0.16,
          ease: "power2.inOut",
          onStart: () => setLabel("Opening…"),
        },
        "open",
      );
      // Fade cover away in the second half of the swing so inside cover never reads as a page
      tl.to(
        cover,
        {
          autoAlpha: 0,
          duration: 0.08,
          ease: "power1.in",
        },
        "open+=0.09",
      );
      tl.to(
        book,
        {
          rotateX: 4,
          rotateY: 0,
          rotateZ: 0,
          xPercent: 0,
          scale: 1.12,
          duration: 0.16,
          ease: "power2.out",
        },
        "open",
      );
      tl.to(
        stage,
        {
          scale: 1.06,
          duration: 0.16,
          ease: "power2.out",
        },
        "open",
      );
      tl.to(
        [edge, spine],
        { autoAlpha: 0, duration: 0.1, ease: "power1.in" },
        "open",
      );

      // 3) Turn each leaf — weighted ease, lift + shade mid-flip
      const turnDur = 0.55 / Math.max(1, sheets.length);
      sheets.forEach((sheet, i) => {
        const label =
          sheetLabel(FLIP_SHEETS[i]!) ?? `Page ${i + 1}`;
        const start = `turn${i}`;
        tl.to(
          sheet,
          {
            rotateY: -180,
            duration: turnDur,
            ease: "power2.inOut",
            onStart: () => setLabel(label),
            onUpdate: function onTurn() {
              const p = this.progress();
              const mid = Math.sin(p * Math.PI);
              gsap.set(sheet, { z: mid * 28 });
              if (shades[i]) gsap.set(shades[i]!, { opacity: mid * 0.45 });
              if (curls[i]) gsap.set(curls[i]!, { opacity: mid * 0.7 });
              // Stacking: turned leaves go under subsequent left stack order
              sheet.style.zIndex = String(
                p > 0.5 ? i + 3 : SHEET_COUNT - i + 20,
              );
            },
          },
          i === 0 ? ">-0.02" : ">-0.01",
        );
        // settle flat
        tl.set(sheet, { z: 0 }, ">");
        tl.set(shades[i] ?? {}, { opacity: 0.08 }, "<");
        tl.set(curls[i] ?? {}, { opacity: 0.1 }, "<");
        void start;
      });

      // 4) Brief hold open
      tl.to({}, { duration: 0.06, onStart: () => setLabel("Closing…") });

      // 5) Return pages flat to the right (fast, no upright linger)
      sheets
        .slice()
        .reverse()
        .forEach((sheet, rev) => {
          const i = sheets.length - 1 - rev;
          tl.to(
            sheet,
            {
              rotateY: 0,
              z: 0,
              duration: 0.045,
              ease: "power2.in",
              onUpdate: function onStack() {
                const p = this.progress();
                const mid = Math.sin(p * Math.PI);
                gsap.set(sheet, { z: mid * 16 });
                sheet.style.zIndex = String(SHEET_COUNT - i + 20);
              },
            },
            rev === 0 ? ">" : "<0.02",
          );
          tl.set(shades[i] ?? {}, { opacity: 0 }, ">");
          tl.set(curls[i] ?? {}, { opacity: 0 }, "<");
        });

      // 6) Cover swings shut (skip upright linger via ease), book settles closed
      tl.set(cover, { autoAlpha: 1, rotateY: -180 });
      tl.to(
        cover,
        {
          rotateY: 0,
          duration: 0.12,
          ease: "power3.in",
          onStart: () => setLabel("Closing cover…"),
        },
        "close",
      );
      tl.to(
        [edge, spine],
        { autoAlpha: 1, duration: 0.08 },
        "close+=0.06",
      );
      tl.to(
        book,
        {
          rotateX: 16,
          rotateY: -32,
          rotateZ: -4,
          xPercent: -8,
          scale: 0.92,
          duration: 0.14,
          ease: "power2.inOut",
        },
        "close",
      );
      tl.to(
        stage,
        { scale: 1, duration: 0.14, ease: "power2.inOut" },
        "close",
      );
      tl.to(
        {},
        {
          duration: 0.05,
          onComplete: () => setLabel("Closed · Skill book"),
        },
      );
    }, pin);

    ScrollTrigger.refresh();
    return () => ctx.revert();
  }, [theme]);

  return (
    <section
      ref={sectionRef}
      className="relative"
      aria-labelledby="skill-book-live"
      data-theme={theme}
    >
      <div
        ref={pinRef}
        className="flex min-h-[100svh] flex-col items-center justify-center overflow-hidden py-3 sm:py-5"
      >
        <p
          ref={labelRef}
          id="skill-book-live"
          className="mb-2 font-mono text-2xs uppercase tracking-[0.16em] text-muted sm:mb-3"
          aria-live="polite"
        >
          Closed · Skill book
        </p>

        <div
          ref={stageRef}
          className="relative mx-auto w-full max-w-[1100px] origin-center px-3 sm:px-5"
          style={{ perspective: "2200px", perspectiveOrigin: "50% 45%" }}
        >
          <div
            aria-hidden
            className="pointer-events-none absolute -inset-12 rounded-[48px] opacity-35 blur-3xl"
            style={{
              background:
                theme === "dark"
                  ? "radial-gradient(circle at 50% 55%, rgb(var(--c-glow-a) / 0.3), transparent 70%)"
                  : "radial-gradient(circle at 50% 55%, rgb(27 99 255 / 0.14), transparent 70%)",
            }}
          />

          <div
            ref={bookRef}
            className="relative mx-auto aspect-[1.42/1] w-full max-h-[min(82svh,760px)] will-change-transform"
            style={{ transformStyle: "preserve-3d" }}
          >
            {/* Jacket under the full spread — never a side panel */}
            <div
              aria-hidden
              className="book-jacket pointer-events-none absolute inset-0 -m-3 rounded-2xl sm:-m-4"
            />

            {/* Closed-volume paper edge + spine (fade out when open) */}
            <div
              ref={spineRef}
              aria-hidden
              className="hardcover-spine absolute top-[3%] bottom-[3%] left-0 z-30 w-[3.2%] rounded-l-md"
            />
            <div
              ref={edgeRef}
              aria-hidden
              className="hardcover-pages absolute top-[4%] right-0 bottom-[4%] z-30 w-[4.5%] rounded-r-sm"
            />

            {/* Open 2-page spread */}
            <div
              className="absolute inset-0 overflow-hidden rounded-2xl"
              style={{ transformStyle: "preserve-3d" }}
            >
              {/* Left endpaper */}
              <div className="book-page absolute inset-y-0 left-0 w-1/2 overflow-hidden rounded-l-2xl border border-r-0">
                <div className="relative flex h-full min-h-0 flex-col overflow-hidden p-5 sm:p-7 md:p-8">
                  <p className="book-muted shrink-0 font-mono text-[10px] uppercase tracking-[0.18em]">
                    {LEFT_ENDPAPER.eyebrow}
                  </p>
                  <h3 className="book-ink mt-3 shrink-0 font-display text-xl leading-tight sm:text-2xl md:text-3xl">
                    {meta.leftLeafTitle}
                  </h3>
                  <p className="book-body mt-3 text-[12px] leading-relaxed sm:text-sm md:text-[15px]">
                    {LEFT_ENDPAPER.body}
                  </p>
                  <p className="book-muted mt-auto font-mono text-[10px]">
                    {LEFT_ENDPAPER.footer}
                  </p>
                </div>
              </div>

              {/* Spine joint */}
              <div
                aria-hidden
                className="book-binding absolute inset-y-[2%] left-1/2 z-40 w-[3px] -translate-x-1/2 rounded-full"
              />

              {/* Right base (last page under the stack) */}
              <div className="book-page absolute inset-y-0 left-1/2 w-1/2 overflow-hidden rounded-r-2xl border border-l-0">
                <div className="relative flex h-full min-h-0 flex-col overflow-hidden p-5 sm:p-7 md:p-8">
                  <p className="book-muted shrink-0 font-mono text-[10px] uppercase tracking-[0.18em]">
                    {RIGHT_BASE.eyebrow}
                  </p>
                  <h3 className="book-ink mt-3 shrink-0 font-display text-xl leading-tight sm:text-2xl">
                    {RIGHT_BASE.title}
                  </h3>
                  <p className="book-body mt-3 text-[12px] leading-relaxed sm:text-sm">
                    {RIGHT_BASE.body}
                  </p>
                </div>
              </div>

              {/* Flipping leaves — right half only */}
              {FLIP_SHEETS.map((sheet, i) => (
                <BookPage
                  key={sheet.id}
                  front={sheet.front}
                  back={sheet.back}
                  stackIndex={i}
                  sheetCount={SHEET_COUNT}
                />
              ))}
            </div>

            {/* Front cover — hinged, fades out when open (no 3rd panel) */}
            <div
              ref={coverRef}
              className="hardcover-cover absolute inset-0 z-50 overflow-hidden rounded-2xl will-change-transform"
              style={{
                transformOrigin: "left center",
                transformStyle: "preserve-3d",
              }}
            >
              <div
                className="absolute inset-0 overflow-hidden rounded-2xl"
                style={{
                  backfaceVisibility: "hidden",
                  WebkitBackfaceVisibility: "hidden",
                  transform: "rotateY(0deg) translateZ(1px)",
                }}
              >
                <Image
                  src={asset("/images/skill-book-cover.jpg")}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="(max-width: 1100px) 90vw, 1100px"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-tr from-black/35 via-transparent to-white/5" />
                <div className="absolute inset-x-0 bottom-0 p-5 sm:p-7">
                  <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/70">
                    {meta.eyebrow}
                  </p>
                  <p className="mt-1 font-display text-2xl text-white sm:text-3xl">
                    {meta.title}
                  </p>
                </div>
              </div>
              <div
                className="book-page-back absolute inset-0 overflow-hidden rounded-2xl border"
                style={{
                  backfaceVisibility: "hidden",
                  WebkitBackfaceVisibility: "hidden",
                  transform: "rotateY(180deg) translateZ(1px)",
                }}
              >
                <div className="flex h-full flex-col p-6 sm:p-8">
                  <p className="book-muted font-mono text-[10px] uppercase tracking-[0.18em]">
                    Inside cover
                  </p>
                  <p className="book-ink mt-4 font-display text-xl leading-snug sm:text-2xl">
                    {meta.insideCover}
                  </p>
                  <p className="book-muted mt-auto font-mono text-[10px]">
                    @{profile.handle}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 mt-5 flex w-full max-w-sm flex-col items-center gap-2 px-4 sm:mt-6">
          <div className="book-track h-1 w-full overflow-hidden rounded-full">
            <div
              ref={progressRef}
              className="h-full origin-left rounded-full bg-brand-500"
              style={{ width: "100%", transform: "scaleX(0.04)" }}
            />
          </div>
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
            Scroll · open · turn · close
          </p>
        </div>
      </div>
    </section>
  );
}


function sheetLabel(sheet: (typeof FLIP_SHEETS)[number]) {
  if (sheet.front.kind === "intro") return meta.introTitle;
  if (sheet.front.kind === "group") return sheet.front.title;
  if (sheet.front.kind === "skill") return sheet.front.skill.name;
  return null;
}

function MobileSkillBook() {
  const { theme } = useTheme();
  const faces = useMemo(() => FLIP_SHEETS.map((s) => s.front), []);
  const [index, setIndex] = useState(0);

  return (
    <section
      className="relative py-14"
      aria-labelledby="skill-book-mobile"
      data-theme={theme}
    >
      <div className="shell">
        <p
          id="skill-book-mobile"
          className="mb-5 font-mono text-2xs uppercase tracking-[0.16em] text-muted"
        >
          {meta.title}
        </p>
        <div className="relative mx-auto max-w-sm">
          <div
            className="hardcover-cover relative overflow-hidden rounded-2xl border shadow-2xl"
            style={{ aspectRatio: "3/4" }}
          >
            <Image
              src={asset("/images/skill-book-cover.jpg")}
              alt={meta.title}
              fill
              className="object-cover"
              sizes="400px"
              priority
            />
          </div>
        </div>
        <div
          className="book-page mt-5 overflow-hidden rounded-2xl border"
          style={{ minHeight: 460 }}
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
