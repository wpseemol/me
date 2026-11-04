"use client";

import { useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import skillsJson from "@/data/skills.json";
import { SKILL_ACCENT, SKILL_ICON } from "@/components/ui/SkillIcons";
import { SectionHead } from "@/components/Section";
import ScrambleText from "@/components/ScrambleText";
import { scrollToY } from "@/lib/lenis";
import {
  clearFieldAtmosphere,
  setFieldAtmosphere,
} from "@/lib/field-atmosphere";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

type Skill = (typeof skillsJson.skills)[number];

const SKILLS = skillsJson.skills as Skill[];

/**
 * Skills stage — same scroll/pin + professional out→swap→in content
 * animation as WorkingProjectStage.
 */
export default function SkillsStage() {
  const sectionRef = useRef<HTMLElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const levelFillRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const pinStRef = useRef<ScrollTrigger | null>(null);
  const clickLockRef = useRef(false);
  const showRef = useRef<(index: number, instant?: boolean) => void>(() => {});
  const [active, setActive] = useState(0);

  const total = SKILLS.length;
  const skill = SKILLS[Math.min(active, Math.max(total - 1, 0))]!;
  const Icon = SKILL_ICON[skill.name];

  useEffect(() => {
    const section = sectionRef.current;
    const pinEl = pinRef.current;
    const panel = panelRef.current;
    if (!section || !pinEl || !panel || total < 1) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let last = -1;
    let tl: gsap.core.Timeline | null = null;

    const fillLevel = (level: number, instant = false) => {
      const el = levelFillRef.current;
      if (!el) return;
      gsap.killTweensOf(el);
      if (instant || reduced) {
        gsap.set(el, { scaleX: level / 100, transformOrigin: "left center" });
        return;
      }
      gsap.fromTo(
        el,
        { scaleX: 0 },
        {
          scaleX: level / 100,
          duration: 0.55,
          ease: "power3.out",
          transformOrigin: "left center",
          overwrite: true,
        },
      );
    };

    const syncField = (index: number, progress: number, pulse: boolean) => {
      if (!pinStRef.current?.isActive) return;
      const name = SKILLS[index]?.name ?? "";
      setFieldAtmosphere({
        accent: SKILL_ACCENT[name] ?? "#1b63ff",
        progress,
        intensity: 1,
        ...(pulse ? { pulse: performance.now() } : {}),
      });
    };

    const show = (index: number, instant = false) => {
      if (index === last && !instant) return;
      const next = SKILLS[index];
      if (!next) return;
      const dir = index >= last ? 1 : -1;
      const progress = (index + 0.5) / Math.max(total, 1);

      tl?.kill();
      syncField(index, progress, !instant);

      if (instant || reduced) {
        gsap.set(panel, { y: 0, x: 0, opacity: 1 });
        setActive(index);
        fillLevel(next.level, true);
        last = index;
        return;
      }

      // Same professional out → swap → in as WorkingProjectStage
      tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      tl.to(panel, {
        y: dir * -10,
        opacity: 0,
        x: 0,
        duration: 0.24,
        ease: "power2.in",
        overwrite: "auto",
      })
        .add(() => {
          flushSync(() => setActive(index));
          gsap.set(panel, { y: dir * 20, x: 0, opacity: 0 });
          gsap.set(levelFillRef.current, {
            scaleX: 0,
            transformOrigin: "left center",
          });
        })
        .to(panel, {
          y: 0,
          x: 0,
          opacity: 1,
          duration: 0.48,
          ease: "power3.out",
        })
        .to(
          levelFillRef.current,
          {
            scaleX: next.level / 100,
            duration: 0.55,
            ease: "power3.out",
            transformOrigin: "left center",
          },
          "-=0.28",
        );

      last = index;
    };

    showRef.current = show;

    if (reduced) {
      show(0, true);
      return;
    }

    const ctx = gsap.context(() => {
      const pin = ScrollTrigger.create({
        trigger: section,
        start: "top top",
        end: () => `+=${Math.max(total, 2) * window.innerHeight * 0.42}`,
        pin: pinEl,
        pinType: "transform",
        scrub: 0.55,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onToggle: (self) => {
          if (!self.isActive) {
            clearFieldAtmosphere();
            return;
          }
          const idx = Math.min(
            total - 1,
            Math.floor(self.progress * total + 1e-6),
          );
          syncField(idx, self.progress, true);
        },
        onUpdate: (self) => {
          if (barRef.current) {
            gsap.set(barRef.current, {
              scaleX: 0.06 + self.progress * 0.94,
            });
          }
          if (clickLockRef.current) {
            setFieldAtmosphere({ progress: self.progress, intensity: 1 });
            return;
          }
          const idx = Math.min(
            total - 1,
            Math.floor(self.progress * total + 1e-6),
          );
          show(idx);
          if (self.isActive) {
            setFieldAtmosphere({ progress: self.progress, intensity: 1 });
          }
        },
        onRefresh: (self) => {
          if (barRef.current) {
            gsap.set(barRef.current, {
              scaleX: 0.06 + self.progress * 0.94,
            });
          }
          if (clickLockRef.current) return;
          const idx = Math.min(
            total - 1,
            Math.floor(self.progress * total + 1e-6),
          );
          show(idx, true);
        },
      });

      pinStRef.current = pin;
      show(0, true);
    }, section);

    const t1 = window.setTimeout(() => ScrollTrigger.refresh(), 60);
    const t2 = window.setTimeout(() => ScrollTrigger.refresh(), 280);

    const unlock = () => {
      clickLockRef.current = false;
    };
    window.addEventListener("wheel", unlock, { passive: true });
    window.addEventListener("touchmove", unlock, { passive: true });

    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.removeEventListener("wheel", unlock);
      window.removeEventListener("touchmove", unlock);
      clickLockRef.current = false;
      tl?.kill();
      clearFieldAtmosphere();
      pinStRef.current?.kill(true);
      pinStRef.current = null;
      ctx.revert();
    };
  }, [total]);

  useEffect(() => {
    const list = listRef.current;
    const el = list?.querySelector<HTMLElement>(
      `[data-skill-index="${active}"]`,
    );
    if (!list || !el) return;

    // Mobile strip is horizontal; desktop aside is vertical
    const horizontal = list.scrollWidth > list.clientWidth + 8;
    if (horizontal) {
      const left =
        el.offsetLeft - list.clientWidth / 2 + el.clientWidth / 2;
      list.scrollTo({ left: Math.max(0, left), behavior: "smooth" });
      return;
    }
    const top = el.offsetTop - list.clientHeight / 2 + el.clientHeight / 2;
    list.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
  }, [active]);

  const goToSkill = (index: number) => {
    if (!SKILLS[index]) return;
    const idx = Math.min(total - 1, Math.max(0, index));

    clickLockRef.current = true;
    showRef.current(idx, true);

    const st = pinStRef.current;
    if (!st) {
      clickLockRef.current = false;
      return;
    }

    const span = Math.max(1, st.end - st.start);
    const unlock = () => {
      clickLockRef.current = false;
    };

    scrollToY(st.start + span * ((idx + 0.5) / total), {
      duration: 0.7,
      onComplete: unlock,
    });
    window.setTimeout(unlock, 850);
  };

  return (
    <section
      ref={sectionRef}
      className="relative"
      aria-labelledby="stack-heading"
    >
      <div
        ref={pinRef}
        className="relative flex min-h-svh flex-col justify-center py-8 sm:py-10 lg:py-12"
      >
        <div className="shell">
          <div className="mx-auto max-w-3xl text-center">
            <SectionHead
              align="center"
              path="/stack"
              title={
                <span id="stack-heading">
                  <ScrambleText text="The tools I reach for" duration={500} />{" "}
                  <span className="grad-text">
                    <ScrambleText text="daily" duration={600} />
                  </span>
                </span>
              }
            />
          </div>

          <div className="mx-auto mt-6 grid max-w-5xl gap-5 sm:mt-8 lg:mt-10 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-10">
            {/* Mobile: horizontal chips · Desktop: vertical list */}
            <aside className="min-w-0 lg:pt-1">
              <div className="flex items-center justify-between gap-3 px-0.5 lg:block">
                <p className="font-mono text-2xs uppercase tracking-[0.16em] text-muted">
                  Stack · {String(active + 1).padStart(2, "0")} /{" "}
                  {String(total).padStart(2, "0")}
                </p>
                <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted lg:hidden">
                  Swipe · tap
                </p>
              </div>

              <ul
                ref={listRef}
                className="mt-3 flex gap-2 overflow-x-auto overscroll-x-contain pb-1 [-ms-overflow-style:none] [scrollbar-width:none] snap-x snap-mandatory lg:mt-4 lg:max-h-[min(52vh,22rem)] lg:flex-col lg:gap-1 lg:overflow-y-auto lg:overflow-x-visible lg:pb-0 lg:pr-1 lg:snap-none [&::-webkit-scrollbar]:hidden"
                role="listbox"
                aria-label="Skills"
              >
                {SKILLS.map((s, i) => {
                  const on = i === active;
                  return (
                    <li key={s.name} className="shrink-0 snap-start lg:w-full">
                      <button
                        type="button"
                        role="option"
                        aria-selected={on}
                        data-skill-index={i}
                        onClick={() => goToSkill(i)}
                        className={`flex min-h-11 items-center gap-2 rounded-full border px-3.5 py-2 text-left font-mono text-[12px] transition-colors lg:min-h-0 lg:w-full lg:rounded-lg lg:border-transparent lg:px-2.5 ${
                          on
                            ? "border-brand-500/40 bg-elev text-body shadow-[0_8px_24px_-16px_rgb(var(--c-glow-a)/0.7)] lg:shadow-none"
                            : "border-transparent bg-elev/50 text-muted hover:bg-elev hover:text-body lg:bg-transparent"
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                            on ? "bg-brand-500" : "bg-transparent lg:bg-transparent"
                          }`}
                        />
                        <span className="hidden tabular-nums text-muted lg:inline">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <span className="whitespace-nowrap lg:truncate">
                          {s.name}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </aside>

            <div className="min-w-0">
              <article className="overflow-hidden rounded-2xl border bg-elev p-4 sm:p-6 lg:p-7">
                <div ref={panelRef} aria-live="polite">
                  <div className="flex items-start justify-between gap-3">
                    <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border bg-surface text-body sm:h-14 sm:w-14 sm:rounded-2xl">
                      {Icon ? (
                        <span className="text-[1.5rem] leading-none sm:text-[2rem]">
                          <Icon />
                        </span>
                      ) : null}
                    </div>
                    <span className="rounded-full border bg-surface px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.1em] text-muted sm:text-[11px]">
                      {skill.group}
                    </span>
                  </div>

                  <h3 className="mt-3 font-display text-[1.65rem] leading-none text-body sm:mt-4 sm:text-3xl md:text-4xl">
                    {skill.name}
                  </h3>
                  <p className="mt-2 text-sm font-medium leading-snug text-muted sm:text-[15px]">
                    {skill.blurb}
                  </p>

                  <div className="mt-4 border-t pt-4 sm:mt-5">
                    <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
                      How I learned
                    </p>
                    <p className="mt-2 text-[13px] leading-relaxed text-body/80 sm:text-sm">
                      {skill.learned}
                    </p>
                    <ul className="mt-3 space-y-1.5">
                      {skill.practice.slice(0, 3).map((item, i) => (
                        <li
                          key={item}
                          className={`flex gap-2.5 text-[13px] leading-snug text-muted ${
                            i > 1 ? "hidden sm:flex" : ""
                          }`}
                        >
                          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {skill.focus.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full border bg-surface px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.08em] text-muted"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="mt-5 sm:mt-6">
                    <div className="mb-1.5 flex justify-between font-mono text-[11px] text-muted">
                      <span>Level</span>
                      <span>{skill.level}%</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-surface">
                      <div
                        ref={levelFillRef}
                        className="h-full origin-left rounded-full bg-brand-500"
                        style={{ width: "100%", transform: "scaleX(0)" }}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-5 flex items-center justify-between gap-2 sm:mt-6 sm:gap-3">
                  <button
                    type="button"
                    className="btn btn-ghost min-h-11 px-5! py-2.5! sm:min-h-0 sm:px-4!"
                    disabled={active === 0}
                    onClick={() => goToSkill(active - 1)}
                  >
                    Prev
                  </button>
                  <p className="truncate px-1 text-center font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
                    {skill.name}
                  </p>
                  <button
                    type="button"
                    className="btn btn-ghost min-h-11 px-5! py-2.5! sm:min-h-0 sm:px-4!"
                    disabled={active >= total - 1}
                    onClick={() => goToSkill(active + 1)}
                  >
                    Next
                  </button>
                </div>
              </article>

              <div className="mt-4 flex flex-col items-center gap-2 sm:mt-5">
                <div className="h-1 w-full max-w-xs overflow-hidden rounded-full bg-elev">
                  <div
                    ref={barRef}
                    className="h-full origin-left rounded-full bg-brand-500"
                    style={{ width: "100%", transform: "scaleX(0.06)" }}
                  />
                </div>
                <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
                  <span className="lg:hidden">Scroll or tap a skill</span>
                  <span className="hidden lg:inline">
                    Scroll · skill changes · click jumps
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
