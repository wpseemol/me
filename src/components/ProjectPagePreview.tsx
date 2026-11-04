"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { asset } from "@/lib/asset";

/**
 * Long-page screenshot preview.
 * Wheel/pointer scrub the capture with gravity easing.
 * At the top/bottom edge, wheel is released so the page can advance
 * to the next project — no trapping, no snap-away that “removes” the shot.
 */
export default function ProjectPagePreview({
  src,
  alt,
  live = false,
  priority = false,
  className = "",
}: {
  src: string;
  alt: string;
  live?: boolean;
  priority?: boolean;
  className?: string;
}) {
  const frameRef = useRef<HTMLDivElement>(null);
  const shotRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const travelRef = useRef(0);
  const yRef = useRef(0);
  const tweenRef = useRef<gsap.core.Tween | null>(null);
  const [progress, setProgress] = useState(0);
  const [canScroll, setCanScroll] = useState(false);
  const [scrolling, setScrolling] = useState(false);

  const measureTravel = () => {
    const frame = frameRef.current;
    const shot = shotRef.current;
    if (!frame || !shot) return 0;

    const frameH = frame.clientHeight;
    const frameW = frame.clientWidth;
    if (frameH < 8 || frameW < 8) return 0;

    const img = imgRef.current || shot.querySelector("img");
    let imgH = 0;

    if (img instanceof HTMLImageElement && img.naturalWidth > 0) {
      imgH = (img.naturalHeight / img.naturalWidth) * frameW;
      shot.style.height = `${imgH}px`;
      img.style.height = `${imgH}px`;
      img.style.width = "100%";
      img.style.maxWidth = "none";
    } else {
      imgH = Math.max(shot.scrollHeight, shot.offsetHeight);
    }

    const travel = Math.max(0, imgH - frameH);
    travelRef.current = travel;
    return travel;
  };

  const stopTween = () => {
    tweenRef.current?.kill();
    tweenRef.current = null;
  };

  const reportProgress = (y: number, travel: number) => {
    yRef.current = y;
    setProgress(travel > 0 ? Math.min(1, Math.abs(y) / travel) : 0);
  };

  const applyY = (y: number, travel: number, immediate = true) => {
    const shot = shotRef.current;
    if (!shot) return;
    const clamped = gsap.utils.clamp(-travel, 0, y);
    if (immediate) {
      gsap.set(shot, { y: clamped });
      reportProgress(clamped, travel);
      return;
    }
    // Gravity settle — soft weight instead of a hard snap.
    stopTween();
    tweenRef.current = gsap.to(shot, {
      y: clamped,
      duration: 0.42,
      ease: "power3.out",
      onUpdate: () => {
        const cy = Number(gsap.getProperty(shot, "y")) || 0;
        reportProgress(cy, travel);
      },
    });
  };

  useEffect(() => {
    const frame = frameRef.current;
    const shot = shotRef.current;
    if (!frame || !shot) return;

    gsap.set(shot, { y: 0, force3D: true });
    yRef.current = 0;
    setProgress(0);
    setScrolling(false);
    setCanScroll(false);

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let edgeLock = 0; // require a little overscroll before releasing page scroll

    const refresh = () => {
      const travel = measureTravel();
      setCanScroll(travel > 16);
      if (travel > 16) applyY(yRef.current, travel);
      else applyY(0, 0);
    };

    const onMove = (e: PointerEvent) => {
      if (reduced) return;
      const travel = measureTravel();
      if (travel <= 16) {
        setCanScroll(false);
        return;
      }
      const rect = frame.getBoundingClientRect();
      if (rect.height <= 0) return;
      setCanScroll(true);
      setScrolling(true);
      const ratio = gsap.utils.clamp(0, 1, (e.clientY - rect.top) / rect.height);
      // Map pointer with a slight ease so it doesn’t feel glued to the cursor.
      const eased = ratio * ratio * (3 - 2 * ratio);
      applyY(-travel * eased, travel);
      edgeLock = 0;
    };

    const onEnter = () => {
      if (reduced) return;
      refresh();
      setScrolling(true);
      edgeLock = 0;
    };

    const onLeave = () => {
      // Keep the scrolled position — don’t yank the image back to the top
      // (that felt like the preview “removing” itself).
      setScrolling(false);
      edgeLock = 0;
    };

    const onWheel = (e: WheelEvent) => {
      if (reduced) return;
      const travel = measureTravel();
      if (travel <= 16) return; // nothing to scrub — let the page scroll

      const current = yRef.current;
      const atTop = current >= -2;
      const atBottom = current <= -travel + 2;
      const goingDown = e.deltaY > 0;
      const goingUp = e.deltaY < 0;

      // Finished the screenshot → release wheel so the next project can come in.
      if ((goingDown && atBottom) || (goingUp && atTop)) {
        edgeLock += Math.abs(e.deltaY);
        if (edgeLock > 28) {
          setScrolling(false);
          return; // do NOT preventDefault — page / stage scroll continues
        }
        // Absorb the first ticks of overscroll so it doesn’t feel twitchy.
        e.preventDefault();
        e.stopPropagation();
        return;
      }

      edgeLock = 0;
      e.preventDefault();
      e.stopPropagation();
      setScrolling(true);
      setCanScroll(true);
      stopTween();

      // Gravity-weighted wheel: slightly stronger than raw delta, then soft clamp.
      const weighted = e.deltaY * 1.15;
      const next = gsap.utils.clamp(-travel, 0, current - weighted);
      applyY(next, travel, false);
    };

    frame.addEventListener("pointerenter", onEnter);
    frame.addEventListener("pointermove", onMove);
    frame.addEventListener("pointerleave", onLeave);
    frame.addEventListener("wheel", onWheel, { passive: false });

    const ro = new ResizeObserver(refresh);
    ro.observe(frame);

    const t1 = window.setTimeout(refresh, 80);
    const t2 = window.setTimeout(refresh, 400);

    return () => {
      frame.removeEventListener("pointerenter", onEnter);
      frame.removeEventListener("pointermove", onMove);
      frame.removeEventListener("pointerleave", onLeave);
      frame.removeEventListener("wheel", onWheel);
      ro.disconnect();
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      stopTween();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src]);

  return (
    <div
      ref={frameRef}
      className={`group/preview relative z-[3] aspect-[16/10] cursor-ns-resize overflow-hidden bg-surface touch-none ${className}`}
      title="Scroll the preview first — at the end, keep scrolling for the next project"
    >
      <div
        ref={shotRef}
        className="absolute left-0 top-0 w-full will-change-transform"
        style={{ transform: "translate3d(0,0,0)" }}
      >
        <Image
          src={asset(src)}
          alt={alt}
          width={1920}
          height={5600}
          sizes="(max-width: 1024px) 92vw, 640px"
          priority={priority}
          draggable={false}
          className="pointer-events-none block w-full max-w-none select-none"
          style={{ height: "auto" }}
          onLoad={(e) => {
            imgRef.current = e.currentTarget;
            const travel = measureTravel();
            setCanScroll(travel > 16);
          }}
        />
      </div>

      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 z-[1] h-10 bg-gradient-to-b from-elev/80 to-transparent"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-20 bg-gradient-to-t from-elev via-elev/70 to-transparent"
      />

      <div className="pointer-events-none absolute left-3 top-3 z-[2]">
        {live ? (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-elev/85 px-2.5 py-0.5 font-mono text-2xs uppercase tracking-[0.14em] text-brand-ink backdrop-blur-sm">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-500 opacity-60" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-brand-500" />
            </span>
            Live preview
          </span>
        ) : (
          <span className="chip bg-elev/85 backdrop-blur-sm">Source</span>
        )}
      </div>

      <div className="pointer-events-none absolute inset-x-3 bottom-3 z-[2] flex items-end justify-between gap-3">
        <div
          className={`rounded-full border border-white/15 bg-elev/90 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] backdrop-blur-sm transition-all duration-300 ${
            scrolling || canScroll
              ? "translate-y-0 opacity-100"
              : "opacity-0 group-hover/preview:opacity-100"
          }`}
        >
          {progress >= 0.98 ? (
            <span className="text-brand-ink">End of page · scroll for next</span>
          ) : scrolling ? (
            <span className="inline-flex items-center gap-2 text-brand-ink">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand-500" />
              Scrolling · {Math.round(progress * 100)}%
            </span>
          ) : canScroll ? (
            <span className="text-muted">Wheel to scroll preview</span>
          ) : (
            <span className="text-muted">Loading preview…</span>
          )}
        </div>

        <span
          aria-hidden
          className="relative h-14 w-1.5 overflow-hidden rounded-full bg-line/90"
        >
          <span
            className="absolute inset-x-0 top-0 w-full rounded-full transition-[height] duration-100"
            style={{
              height: `${Math.max(12, progress * 100)}%`,
              background: "var(--grad)",
              boxShadow: scrolling
                ? "0 0 12px rgb(var(--c-glow-a) / 0.7)"
                : undefined,
            }}
          />
        </span>
      </div>
    </div>
  );
}
