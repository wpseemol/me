"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { PageFace } from "./BookPage";
import { FLIP_SHEETS, meta } from "./skillsData";
import { asset } from "@/lib/asset";
import { useTheme } from "@/components/ThemeProvider";
import {
  createSkillBook3D,
  type SkillBookHandle,
} from "./SkillBook3D";

gsap.registerPlugin(ScrollTrigger);

/**
 * Sticky Three.js hardcover + GSAP ScrollTrigger scrub.
 * Rebuilds for light/dark so page textures + lighting match the site theme.
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
  return <DesktopSkillBook3D />;
}

function DesktopSkillBook3D() {
  const { theme, ready } = useTheme();
  const sectionRef = useRef<HTMLElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLParagraphElement>(null);
  const bookRef = useRef<SkillBookHandle | null>(null);
  const progressKeep = useRef(0);

  useLayoutEffect(() => {
    if (!ready) return;
    const section = sectionRef.current;
    const pin = pinRef.current;
    const canvas = canvasRef.current;
    if (!section || !pin || !canvas) return;

    let cancelled = false;
    let st: ScrollTrigger | null = null;
    let ro: ResizeObserver | null = null;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const boot = async () => {
      const book = await createSkillBook3D(canvas, theme);
      if (cancelled) {
        book.dispose();
        return;
      }
      bookRef.current = book;

      const resize = () => {
        book.resize(canvas.clientWidth, canvas.clientHeight);
      };
      resize();
      ro = new ResizeObserver(resize);
      ro.observe(canvas);

      if (reduced) {
        book.setProgress(0.45);
        if (labelRef.current) labelRef.current.textContent = meta.introTitle;
        return;
      }

      st = ScrollTrigger.create({
        trigger: section,
        start: "top top",
        end: "+=580%",
        pin: pin,
        scrub: 0.85,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          progressKeep.current = self.progress;
          book.setProgress(self.progress);
          if (labelRef.current) {
            labelRef.current.textContent = book.getLabel(self.progress);
          }
          if (progressRef.current) {
            gsap.set(progressRef.current, {
              scaleX: 0.04 + self.progress * 0.96,
            });
          }
        },
      });

      // Keep scroll place when theme toggles mid-read
      book.setProgress(progressKeep.current);
      if (labelRef.current) {
        labelRef.current.textContent = book.getLabel(progressKeep.current);
      }
      ScrollTrigger.refresh();
    };

    void boot();

    return () => {
      cancelled = true;
      st?.kill();
      ro?.disconnect();
      bookRef.current?.dispose();
      bookRef.current = null;
    };
  }, [theme, ready]);

  return (
    <section
      ref={sectionRef}
      className="relative"
      aria-labelledby="skill-book-live"
      data-theme={theme}
    >
      <div
        ref={pinRef}
        className="flex min-h-[100svh] flex-col items-center justify-center overflow-hidden py-4 sm:py-6"
      >
        <p
          ref={labelRef}
          id="skill-book-live"
          className="mb-2 font-mono text-2xs uppercase tracking-[0.16em] text-muted sm:mb-3"
          aria-live="polite"
        >
          Closed · Skill book
        </p>

        <div className="relative mx-auto w-full max-w-[1480px] px-1 sm:px-3">
          <div
            aria-hidden
            className="pointer-events-none absolute -inset-16 rounded-[48px] opacity-40 blur-3xl"
            style={{
              background:
                theme === "dark"
                  ? "radial-gradient(circle at 50% 55%, rgb(var(--c-glow-a) / 0.34), transparent 70%)"
                  : "radial-gradient(circle at 50% 55%, rgb(27 99 255 / 0.16), transparent 70%)",
            }}
          />
          <div
            className="relative w-full overflow-hidden rounded-[18px] sm:rounded-[22px]"
            style={{ height: "min(88svh, 960px)" }}
          >
            <canvas
              ref={canvasRef}
              className="h-full w-full touch-none"
              aria-hidden
            />
          </div>
        </div>

        <div className="relative z-10 mt-5 flex w-full max-w-xs flex-col items-center gap-2 px-4 sm:mt-6">
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
