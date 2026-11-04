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
} from "./skillsData";
import { asset } from "@/lib/asset";
import { useTheme } from "@/components/ThemeProvider";

gsap.registerPlugin(ScrollTrigger);

const SHEET_COUNT = FLIP_SHEETS.length;

/**
 * Sticky hardcover Skill Book — CSS 3D + GSAP ScrollTrigger only.
 * One book, strict 2-page open spread, sequential page turns (no second cover panel).
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

    const syncSheetStack = (activeIndex: number, progress: number) => {
      sheets.forEach((sheet, i) => {
        if (i < activeIndex) {
          // Already turned — sit on the left stack
          sheet.style.zIndex = String(i + 2);
          gsap.set(sheet, { z: 0 });
          return;
        }
        if (i === activeIndex) {
          const mid = Math.sin(progress * Math.PI);
          sheet.style.zIndex = String(
            progress > 0.5 ? i + 2 : SHEET_COUNT - i + 30,
          );
          // Keep flips flat in-plane — z-lift made the book look like it floated
          gsap.set(sheet, { z: 0 });
          if (shades[i]) gsap.set(shades[i]!, { opacity: mid * 0.4 });
          if (curls[i]) gsap.set(curls[i]!, { opacity: mid * 0.55 });
          return;
        }
        // Waiting on the right
        sheet.style.zIndex = String(SHEET_COUNT - i + 30);
        gsap.set(sheet, { z: 0 });
        if (shades[i]) gsap.set(shades[i]!, { opacity: 0 });
        if (curls[i]) gsap.set(curls[i]!, { opacity: 0 });
      });
    };

    const ctx = gsap.context(() => {
      // Planted in the layout — no book pose / stage motion (that caused site float).
      gsap.set(stage, { clearProps: "transform" });
      gsap.set(book, {
        x: 0,
        y: 0,
        z: 0,
        rotateX: 0,
        rotateY: 0,
        rotateZ: 0,
        xPercent: 0,
        yPercent: 0,
        scale: 1,
        transformOrigin: "50% 50%",
      });
      gsap.set(cover, {
        rotateY: 0,
        autoAlpha: 1,
        transformOrigin: "left center",
      });
      gsap.set([edge, spine], { autoAlpha: 1 });
      gsap.set(sheets, {
        rotateY: 0,
        z: 0,
        x: 0,
        y: 0,
        transformOrigin: "left center",
      });
      gsap.set(shades, { opacity: 0 });
      gsap.set(curls, { opacity: 0 });
      sheets.forEach((sheet, i) => {
        sheet.style.zIndex = String(SHEET_COUNT - i + 30);
      });

      if (reduced) {
        gsap.set(cover, { autoAlpha: 0 });
        gsap.set([edge, spine], { autoAlpha: 0 });
        setLabel(meta.introTitle);
        return;
      }

      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: "+=420%",
          pin: pin,
          // transform pin is stabler with Lenis — avoids fixed-layer float/jitter
          pinType: "transform",
          scrub: 0.35,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            if (progressRef.current) {
              gsap.set(progressRef.current, {
                scaleX: 0.04 + self.progress * 0.96,
              });
            }
            const p = self.progress;
            if (p < 0.08) setLabel("Closed · Skill book");
            else if (p < 0.16) setLabel("Opening…");
            else if (p < 0.82) {
              const turnSpan = 0.82 - 0.16;
              const local = (p - 0.16) / turnSpan;
              const idx = Math.min(
                SHEET_COUNT - 1,
                Math.floor(local * SHEET_COUNT),
              );
              setLabel(sheetLabel(FLIP_SHEETS[idx]!) ?? `Page ${idx + 1}`);
            } else if (p < 0.9) setLabel("Closing…");
            else setLabel("Closed · Skill book");
          },
        },
      });

      /* ---- 1. Hold closed ------------------------------------------------ */
      tl.to({}, { duration: 0.08 });

      /* ---- 2. Open: cover fades only — book stays planted --------------- */
      tl.addLabel("open");
      tl.to(
        cover,
        {
          autoAlpha: 0,
          duration: 0.12,
          ease: "power2.inOut",
        },
        "open",
      );
      tl.to(
        [edge, spine],
        { autoAlpha: 0, duration: 0.1, ease: "power1.in" },
        "open",
      );

      /* ---- 3. Hold open spread (left endpaper + first recto) ------------ */
      tl.to({}, { duration: 0.05 });

      /* ---- 4. Turn pages one-by-one (no overlap) ------------------------ */
      const turnDur = 0.1;
      const gap = 0.035;
      sheets.forEach((sheet, i) => {
        tl.to(
          sheet,
          {
            rotateY: -180,
            duration: turnDur,
            ease: "power2.inOut",
            onUpdate: function onTurn() {
              syncSheetStack(i, this.progress());
            },
          },
          i === 0 ? ">" : `>+${gap}`,
        );
        // Settle after each turn
        tl.set(sheet, { z: 0 });
        if (shades[i]) tl.set(shades[i]!, { opacity: 0.06 });
        if (curls[i]) tl.set(curls[i]!, { opacity: 0.08 });
      });

      /* ---- 5. Hold on last spread --------------------------------------- */
      tl.to({}, { duration: 0.06 });

      /* ---- 6. Flip pages back to the right, one at a time --------------- */
      for (let i = sheets.length - 1; i >= 0; i--) {
        const sheet = sheets[i]!;
        tl.to(
          sheet,
          {
            rotateY: 0,
            z: 0,
            duration: 0.055,
            ease: "power2.inOut",
            onUpdate: function onBack() {
              const p = this.progress();
              // While returning, treat as active flip in reverse
              syncSheetStack(i, 1 - p);
            },
          },
          i === sheets.length - 1 ? ">" : ">+0.015",
        );
        if (shades[i]) tl.set(shades[i]!, { opacity: 0 });
        if (curls[i]) tl.set(curls[i]!, { opacity: 0 });
        sheet.style.zIndex = String(SHEET_COUNT - i + 30);
      }

      /* ---- 7. Cover returns — book never moves ------------------------- */
      tl.addLabel("close");
      tl.to(
        cover,
        {
          autoAlpha: 1,
          rotateY: 0,
          duration: 0.1,
          ease: "power2.out",
        },
        "close",
      );
      tl.to(
        [edge, spine],
        { autoAlpha: 1, duration: 0.08 },
        "close",
      );
      tl.to({}, { duration: 0.05 });
    }, pin);

    // Defer refresh so pin measurements settle after layout
    requestAnimationFrame(() => ScrollTrigger.refresh());
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
        className="flex min-h-[100svh] flex-col items-center justify-center overflow-x-clip py-3 sm:py-5"
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
          className="relative mx-auto w-full max-w-[720px] px-4 sm:px-6"
          style={{ perspective: "1400px", perspectiveOrigin: "50% 50%" }}
        >
          <div
            aria-hidden
            className="pointer-events-none absolute -inset-8 rounded-[32px] opacity-25 blur-3xl"
            style={{
              background:
                theme === "dark"
                  ? "radial-gradient(circle at 50% 55%, rgb(var(--c-glow-a) / 0.22), transparent 70%)"
                  : "radial-gradient(circle at 50% 55%, rgb(27 99 255 / 0.1), transparent 70%)",
            }}
          />

          <div
            ref={bookRef}
            className="relative mx-auto aspect-[5/4] w-full max-h-[min(56svh,480px)]"
            style={{ transformStyle: "preserve-3d" }}
          >
            {/* Soft jacket under the spread only — not a second book */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 -m-2 rounded-2xl opacity-90 sm:-m-3"
              style={{
                background:
                  "linear-gradient(145deg, color-mix(in oklab, var(--book-bind) 88%, white), var(--book-bind))",
                boxShadow: "0 28px 55px -22px rgb(0 0 0 / 0.55)",
              }}
            />

            <div
              ref={spineRef}
              aria-hidden
              className="hardcover-spine absolute top-[3%] bottom-[3%] left-0 z-30 w-[2.8%] rounded-l-md"
            />
            <div
              ref={edgeRef}
              aria-hidden
              className="hardcover-pages absolute top-[4%] right-0 bottom-[4%] z-30 w-[4%] rounded-r-sm"
            />

            {/* Strict 2-page spread */}
            <div
              className="absolute inset-0 rounded-2xl"
              style={{ transformStyle: "preserve-3d" }}
            >
              <div className="book-page absolute inset-y-0 left-0 z-[1] w-1/2 overflow-hidden rounded-l-2xl border border-r-0">
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

              <div
                aria-hidden
                className="book-binding absolute inset-y-[2%] left-1/2 z-40 w-[3px] -translate-x-1/2 rounded-full"
              />

              <div className="book-page absolute inset-y-0 left-1/2 z-[1] w-1/2 overflow-hidden rounded-r-2xl border border-l-0">
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

            {/* Front cover only (no inside-cover face = no second book) */}
            <div
              ref={coverRef}
              className="hardcover-cover absolute inset-0 z-50 overflow-hidden rounded-2xl"
            >
              <Image
                src={asset("/images/skill-book-cover.jpg")}
                alt=""
                fill
                className="object-cover"
                sizes="(max-width: 720px) 90vw, 720px"
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
