"use client";

import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from "react";
import Image from "next/image";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { PageFace } from "./BookPage";
import {
  FLIP_SHEETS,
  LEFT_ENDPAPER,
  RIGHT_BASE,
  meta,
  profile,
} from "./skillsData";
import { asset } from "@/lib/asset";

gsap.registerPlugin(ScrollTrigger);

const SHEET_COUNT = FLIP_SHEETS.length;

/**
 * Sticky hardcover Skill Book — GSAP ScrollTrigger pin + scrub.
 * Closed pose matches a real book (spine, canvas page-block, ajar cover).
 * Scroll opens the cover, then turns each leaf with gravity easing.
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
  const pinRef = useRef<HTMLDivElement>(null);
  const bookRef = useRef<HTMLDivElement>(null);
  const coverRef = useRef<HTMLDivElement>(null);
  const leftRef = useRef<HTMLDivElement>(null);
  const edgesRef = useRef<HTMLDivElement>(null);
  const ribbonRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLParagraphElement>(null);
  const leafRefs = useRef<(HTMLDivElement | null)[]>([]);
  const edgeCanvasRef = useRef<HTMLCanvasElement>(null);
  const topCanvasRef = useRef<HTMLCanvasElement>(null);

  usePaintPageEdges(edgeCanvasRef, "fore");
  usePaintPageEdges(topCanvasRef, "head");

  useLayoutEffect(() => {
    const section = sectionRef.current;
    const pin = pinRef.current;
    const book = bookRef.current;
    const cover = coverRef.current;
    if (!section || !pin || !book || !cover) return;

    const leaves = leafRefs.current.filter(Boolean) as HTMLDivElement[];
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const ctx = gsap.context(() => {
      gsap.set(book, {
        rotateX: 16,
        rotateY: -22,
        rotateZ: -4,
        xPercent: 24,
        transformOrigin: "50% 50%",
        force3D: true,
      });
      gsap.set(cover, {
        rotateY: -14,
        transformOrigin: "left center",
        force3D: true,
      });
      gsap.set(leftRef.current, { opacity: 0 });
      gsap.set(leaves, {
        rotateY: 0,
        transformOrigin: "left center",
        force3D: true,
      });
      leaves.forEach((leaf, i) => {
        gsap.set(leaf, { zIndex: SHEET_COUNT - i + 20 });
      });
      gsap.set(progressRef.current, { scaleX: 0.04, transformOrigin: "left center" });

      if (reduced) {
        gsap.set(book, { rotateX: 2, rotateY: 0, rotateZ: 0, xPercent: 0 });
        gsap.set(cover, { rotateY: -176, opacity: 0 });
        gsap.set(leftRef.current, { opacity: 1 });
        gsap.set(edgesRef.current, { opacity: 0 });
        gsap.set(ribbonRef.current, { opacity: 0 });
        return;
      }

      const setLabel = (text: string) => {
        if (labelRef.current) labelRef.current.textContent = text;
      };

      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: `+=${Math.max(380, 140 + SHEET_COUNT * 55)}%`,
          pin: pin,
          scrub: 0.65,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            const p = self.progress;
            if (progressRef.current) {
              gsap.set(progressRef.current, {
                scaleX: 0.04 + p * 0.96,
              });
            }
            if (p < 0.08) setLabel("Closed · Skill book");
            else if (p < 0.28) setLabel("Opening…");
            else if (p < 0.34) setLabel(meta.introTitle);
            else {
              const turnStart = 0.34;
              const turnSpan = (0.96 - turnStart) / SHEET_COUNT;
              const idx = Math.min(
                SHEET_COUNT - 1,
                Math.max(0, Math.floor((p - turnStart) / turnSpan)),
              );
              const sheet = FLIP_SHEETS[idx];
              if (!sheet) setLabel("Turning page…");
              else if (sheet.front.kind === "intro") setLabel(meta.introTitle);
              else if (sheet.front.kind === "skill")
                setLabel(sheet.front.skill.name);
              else setLabel("Turning page…");
            }
          },
        },
      });

      // 0 → ~0.28  straighten + gravity cover open
      tl.to(
        book,
        {
          rotateX: 2,
          rotateY: 0,
          rotateZ: 0,
          xPercent: 0,
          duration: 2.4,
          ease: "power2.inOut",
        },
        0,
      );
      tl.to(
        cover,
        {
          rotateY: -176,
          duration: 2.6,
          ease: "power3.inOut",
        },
        0.05,
      );
      tl.to(
        edgesRef.current,
        { opacity: 0, duration: 1.1, ease: "power1.out" },
        0.45,
      );
      tl.to(
        ribbonRef.current,
        { opacity: 0, y: 12, duration: 0.7, ease: "power1.out" },
        0.35,
      );
      tl.to(
        leftRef.current,
        { opacity: 1, duration: 0.9, ease: "power1.out" },
        0.7,
      );
      tl.to(
        cover,
        { opacity: 0, duration: 0.45, ease: "power1.out" },
        2.35,
      );

      // Page turns — gravity ease (slow → fast → settle)
      leaves.forEach((leaf, i) => {
        const start = 2.7 + i * 1.15;
        tl.to(
          leaf,
          {
            rotateY: -180,
            duration: 1.05,
            ease: "power2.inOut",
            onUpdate: function onFlip() {
              const ry = Number(gsap.getProperty(leaf, "rotateY"));
              leaf.style.zIndex = String(
                ry > -90 ? SHEET_COUNT - i + 20 : i + 3,
              );
            },
          },
          start,
        );
      });

      tl.to({}, { duration: 0.4 }); // tail settle
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative"
      aria-labelledby="skill-book-live"
    >
      <div
        ref={pinRef}
        className="flex min-h-[100svh] flex-col items-center justify-center overflow-hidden py-8"
      >
        <p
          ref={labelRef}
          id="skill-book-live"
          className="mb-5 font-mono text-2xs uppercase tracking-[0.16em] text-muted"
          aria-live="polite"
        >
          Closed · Skill book
        </p>

        <div className="relative mx-auto w-full max-w-[880px] px-4 sm:px-6">
          <div
            aria-hidden
            className="pointer-events-none absolute -inset-16 rounded-[48px] opacity-35 blur-3xl"
            style={{
              background:
                "radial-gradient(circle at 48% 58%, rgb(var(--c-glow-a) / 0.3), transparent 68%)",
            }}
          />

          <div
            className="relative mx-auto aspect-[1.35/1] w-full"
            style={{ perspective: 1400, perspectiveOrigin: "46% 60%" }}
          >
            {/* Table shadow */}
            <div
              aria-hidden
              className="absolute -bottom-8 left-[12%] right-[8%] h-16 rounded-[100%] bg-black/55 blur-2xl dark:bg-black/75"
            />

            <div
              ref={bookRef}
              className="absolute inset-0 will-change-transform"
              style={{ transformStyle: "preserve-3d" }}
            >
              {/* Jacket / boards under pages */}
              <div
                aria-hidden
                className="book-jacket pointer-events-none absolute inset-0 -m-2.5 rounded-[16px] sm:-m-3"
              />

              <div
                className="absolute inset-0 rounded-[12px]"
                style={{ transformStyle: "preserve-3d" }}
              >
                {/* Left page */}
                <div
                  ref={leftRef}
                  className="book-page absolute inset-y-0 left-0 h-full w-1/2 overflow-hidden rounded-l-[12px] border border-r-0"
                  style={{ boxShadow: "inset -14px 0 24px rgb(0 0 0 / 0.12)" }}
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

                {/* Right base */}
                <div
                  className="book-page absolute inset-y-0 right-0 h-full w-1/2 overflow-hidden rounded-r-[12px] border border-l-0"
                  style={{ boxShadow: "inset 12px 0 20px rgb(0 0 0 / 0.06)" }}
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

                {/* Open spine */}
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-y-0 left-1/2 z-30 w-10 -translate-x-1/2"
                  style={{
                    background:
                      "linear-gradient(to right, rgba(0,0,0,0.42), transparent 42%, transparent 58%, rgba(0,0,0,0.42))",
                  }}
                />
                <div
                  aria-hidden
                  className="book-binding pointer-events-none absolute inset-y-3 left-1/2 z-[31] w-[5px] -translate-x-1/2 rounded-sm"
                />

                {/* Flip leaves */}
                {FLIP_SHEETS.map((sheet, i) => (
                  <div
                    key={sheet.id}
                    ref={(el) => {
                      leafRefs.current[i] = el;
                    }}
                    className="pointer-events-none absolute inset-y-0 left-1/2 w-1/2 will-change-transform"
                    style={{ transformStyle: "preserve-3d" }}
                  >
                    <div
                      className="book-page absolute inset-0 overflow-hidden rounded-r-xl border border-l-0"
                      style={{
                        backfaceVisibility: "hidden",
                        WebkitBackfaceVisibility: "hidden",
                        transform: "translateZ(1px)",
                        boxShadow:
                          "8px 16px 36px -16px rgb(0 0 0 / 0.45), inset 10px 0 18px rgb(0 0 0 / 0.04)",
                      }}
                    >
                      <PageFace content={sheet.front} side="right" />
                    </div>
                    <div
                      className="book-page-back absolute inset-0 overflow-hidden rounded-l-xl border"
                      style={{
                        backfaceVisibility: "hidden",
                        WebkitBackfaceVisibility: "hidden",
                        transform: "rotateY(180deg) translateZ(1px)",
                        boxShadow: "inset -10px 0 20px rgb(0 0 0 / 0.08)",
                      }}
                    >
                      <PageFace content={sheet.back} side="left" verso />
                    </div>
                  </div>
                ))}

                {/* —— Closed hardcover extras (canvas page block) —— */}
                <div
                  ref={edgesRef}
                  className="pointer-events-none absolute inset-0 z-[60]"
                  style={{ transformStyle: "preserve-3d" }}
                >
                  {/* Spine board left of cover */}
                  <div
                    aria-hidden
                    className="hardcover-spine absolute inset-y-0 left-1/2 w-[16px] -translate-x-full rounded-l-[7px]"
                  />
                  {/* Fore-edge canvas */}
                  <div className="absolute inset-y-[2%] right-[-26px] w-[26px] overflow-hidden rounded-r-[4px] shadow-[4px_0_16px_rgb(0_0_0_/0.35)]">
                    <canvas
                      ref={edgeCanvasRef}
                      className="h-full w-full"
                      aria-hidden
                    />
                  </div>
                  {/* Head-edge canvas */}
                  <div className="absolute right-0 top-[-11px] h-[11px] w-1/2 overflow-hidden rounded-t-[2px]">
                    <canvas
                      ref={topCanvasRef}
                      className="h-full w-full"
                      aria-hidden
                    />
                  </div>
                  {/* Paper peek under ajar cover */}
                  <div
                    aria-hidden
                    className="absolute inset-y-[6%] left-[52%] right-[5%] rounded-r-[8px]"
                    style={{
                      background: "var(--book-page)",
                      boxShadow: "inset 0 0 0 1px rgb(0 0 0 / 0.08)",
                      transform: "translateZ(-1px)",
                    }}
                  />
                </div>

                {/* Ribbon */}
                <div
                  ref={ribbonRef}
                  aria-hidden
                  className="pointer-events-none absolute bottom-[-24px] right-[30%] z-[85] h-12 w-[12px]"
                  style={{
                    background:
                      "linear-gradient(180deg, #d4283a 0%, #9b1b2a 62%, #6e1220 100%)",
                    clipPath:
                      "polygon(0 0, 100% 0, 100% 76%, 50% 100%, 0 76%)",
                    boxShadow: "1px 6px 12px rgb(0 0 0 / 0.45)",
                  }}
                />

                {/* Cover — right half, hinged at spine */}
                <div
                  ref={coverRef}
                  className="absolute inset-y-0 left-1/2 z-[75] w-1/2 will-change-transform"
                  style={{ transformStyle: "preserve-3d" }}
                >
                  <div
                    className="hardcover-cover absolute inset-0 overflow-hidden rounded-r-[12px]"
                    style={{
                      backfaceVisibility: "hidden",
                      WebkitBackfaceVisibility: "hidden",
                      transform: "translateZ(2px)",
                    }}
                  >
                    <Image
                      src={asset("/images/skill-book-cover.jpg")}
                      alt=""
                      fill
                      sizes="(max-width: 900px) 48vw, 440px"
                      className="object-cover"
                      priority
                    />
                    {/* Hinge groove */}
                    <div
                      aria-hidden
                      className="absolute inset-y-0 left-0 w-6"
                      style={{
                        background:
                          "linear-gradient(90deg, rgb(0 0 0 / 0.55), rgb(0 0 0 / 0.2) 50%, transparent)",
                      }}
                    />
                    <div
                      aria-hidden
                      className="absolute inset-y-6 left-[17px] w-[2px] rounded-full bg-black/45"
                    />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/55 to-transparent p-4 pt-10 sm:p-5">
                      <p className="font-mono text-[10px] text-white/55">
                        @{profile.handle} · scroll to open
                      </p>
                    </div>
                  </div>

                  <div
                    className="absolute inset-0 overflow-hidden rounded-l-[12px]"
                    style={{
                      backfaceVisibility: "hidden",
                      WebkitBackfaceVisibility: "hidden",
                      transform: "rotateY(180deg) translateZ(2px)",
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
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 mt-8 flex w-full max-w-xs flex-col items-center gap-2 px-4">
          <div className="book-track h-1 w-full overflow-hidden rounded-full">
            <div
              ref={progressRef}
              className="h-full origin-left rounded-full bg-brand-500"
              style={{ width: "100%", transform: "scaleX(0.04)" }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

/** Canvas-painted paper stack (fore-edge or head-edge). */
function usePaintPageEdges(
  canvasRef: RefObject<HTMLCanvasElement | null>,
  kind: "fore" | "head",
) {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const paint = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const w = parent.clientWidth;
      const h = parent.clientHeight;
      if (w < 2 || h < 2) return;

      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const dark = document.documentElement.classList.contains("dark");
      const a = dark ? "#2a3348" : "#f4efe4";
      const b = dark ? "#1c2436" : "#e2d8c8";
      const shade = dark ? "rgba(0,0,0,0.45)" : "rgba(0,0,0,0.22)";

      if (kind === "fore") {
        const step = 2.4;
        for (let y = 0; y < h; y += step) {
          ctx.fillStyle = Math.floor(y / step) % 2 === 0 ? a : b;
          ctx.fillRect(0, y, w, step);
        }
        // Depth shade from spine side
        const grad = ctx.createLinearGradient(0, 0, w, 0);
        grad.addColorStop(0, shade);
        grad.addColorStop(0.45, "transparent");
        grad.addColorStop(1, dark ? "rgba(0,0,0,0.2)" : "rgba(0,0,0,0.08)");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);
        // Speckles
        ctx.globalAlpha = 0.12;
        for (let i = 0; i < 40; i++) {
          ctx.fillStyle = dark ? "#fff" : "#000";
          ctx.fillRect(Math.random() * w, Math.random() * h, 1, 1);
        }
        ctx.globalAlpha = 1;
      } else {
        const step = 2.4;
        for (let x = 0; x < w; x += step) {
          ctx.fillStyle = Math.floor(x / step) % 2 === 0 ? a : b;
          ctx.fillRect(x, 0, step, h);
        }
        const grad = ctx.createLinearGradient(0, 0, 0, h);
        grad.addColorStop(0, shade);
        grad.addColorStop(1, "transparent");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);
      }
    };

    paint();
    const ro = new ResizeObserver(paint);
    if (canvas.parentElement) ro.observe(canvas.parentElement);
    const mo = new MutationObserver(paint);
    mo.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => {
      ro.disconnect();
      mo.disconnect();
    };
  }, [canvasRef, kind]);
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
        <div className="relative mx-auto max-w-sm">
          <div
            className="hardcover-cover relative overflow-hidden rounded-2xl border"
            style={{ aspectRatio: "3/4" }}
          >
            <Image
              src={asset("/images/skill-book-cover.jpg")}
              alt={meta.title}
              fill
              className="object-cover"
              sizes="400px"
            />
          </div>
        </div>
        <div
          className="book-page mt-5 overflow-hidden rounded-2xl border"
          style={{ minHeight: 420 }}
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
