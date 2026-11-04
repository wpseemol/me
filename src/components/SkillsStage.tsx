"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import skillsJson from "@/data/skills.json";
import { SKILL_ICON } from "@/components/ui/SkillIcons";
import { SectionHead } from "@/components/Section";
import ScrambleText from "@/components/ScrambleText";
import { scrollToY } from "@/lib/lenis";

gsap.registerPlugin(ScrollTrigger);

type Skill = (typeof skillsJson.skills)[number];

const SKILLS = skillsJson.skills as Skill[];
const VH_PER_SKILL = 0.38;

/**
 * Pinned skills stage — scroll/click sync + GSAP content swap.
 * Solid surfaces only (no skill accent fills).
 */
export default function SkillsStage() {
  const sectionRef = useRef<HTMLElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const cardRef = useRef<HTMLElement>(null);
  const stRef = useRef<ScrollTrigger | null>(null);
  const activeRef = useRef(0);
  const animatingRef = useRef(false);
  const [active, setActive] = useState(0);

  const swapTo = (index: number) => {
    const i = Math.max(0, Math.min(SKILLS.length - 1, index));
    if (i === activeRef.current) return;
    // Lock index immediately so scroll+click don't double-fire
    activeRef.current = i;

    const card = cardRef.current;
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (!card || reduced) {
      setActive(i);
      return;
    }

    gsap.killTweensOf(card);
    animatingRef.current = true;
    gsap.to(card, {
      autoAlpha: 0,
      y: 14,
      duration: 0.18,
      ease: "power2.in",
      overwrite: "auto",
      onComplete: () => {
        setActive(i);
        requestAnimationFrame(() => {
          gsap.fromTo(
            card,
            { autoAlpha: 0, y: -12 },
            {
              autoAlpha: 1,
              y: 0,
              duration: 0.32,
              ease: "power3.out",
              overwrite: "auto",
              onComplete: () => {
                animatingRef.current = false;
              },
            },
          );
        });
      },
    });
  };

  const goToSkill = (index: number) => {
    const st = stRef.current;
    const i = Math.max(0, Math.min(SKILLS.length - 1, index));
    swapTo(i);

    if (!st) return;
    const span = st.end - st.start;
    const progress = (i + 0.5) / SKILLS.length;
    scrollToY(st.start + span * progress, { duration: 0.75 });
  };

  useLayoutEffect(() => {
    const section = sectionRef.current;
    const pin = pinRef.current;
    if (!section || !pin || SKILLS.length < 1) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    const ctx = gsap.context(() => {
      const st = ScrollTrigger.create({
        trigger: section,
        start: "top top",
        end: () =>
          `+=${Math.max(SKILLS.length, 2) * window.innerHeight * VH_PER_SKILL}`,
        pin: pin,
        pinType: "transform",
        scrub: 0.4,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          const idx = Math.min(
            SKILLS.length - 1,
            Math.max(0, Math.floor(self.progress * 0.999 * SKILLS.length)),
          );
          if (barRef.current) {
            gsap.set(barRef.current, {
              scaleX: 0.06 + self.progress * 0.94,
            });
          }
          if (idx !== activeRef.current) {
            swapTo(idx);
          }
        },
      });
      stRef.current = st;
    }, section);

    requestAnimationFrame(() => ScrollTrigger.refresh());
    return () => {
      stRef.current = null;
      ctx.revert();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount once
  }, []);

  useLayoutEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(
      `[data-skill-index="${active}"]`,
    );
    el?.scrollIntoView({ block: "nearest" });
  }, [active]);

  const skill = SKILLS[active]!;
  const Icon = SKILL_ICON[skill.name];

  return (
    <section
      ref={sectionRef}
      className="relative"
      aria-labelledby="stack-heading"
    >
      <div ref={pinRef} className="bg-surface py-10 sm:py-12">
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

          <div className="mx-auto mt-8 grid max-w-5xl gap-6 lg:mt-10 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-10">
            <aside>
              <p className="font-mono text-2xs uppercase tracking-[0.16em] text-muted">
                Stack · {String(active + 1).padStart(2, "0")} /{" "}
                {String(SKILLS.length).padStart(2, "0")}
              </p>
              <ul
                ref={listRef}
                className="mt-4 max-h-72 space-y-1 overflow-auto pr-1 sm:max-h-[min(52vh,22rem)]"
                role="listbox"
                aria-label="Skills"
              >
                {SKILLS.map((s, i) => {
                  const on = i === active;
                  return (
                    <li key={s.name}>
                      <button
                        type="button"
                        role="option"
                        aria-selected={on}
                        data-skill-index={i}
                        onClick={() => goToSkill(i)}
                        className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left font-mono text-[12px] transition-colors ${
                          on
                            ? "bg-elev text-body"
                            : "text-muted hover:bg-elev hover:text-body"
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                            on ? "bg-brand-500" : "bg-transparent"
                          }`}
                        />
                        <span className="tabular-nums text-muted">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <span className="truncate">{s.name}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </aside>

            <div>
              <article
                ref={cardRef}
                className="rounded-2xl border bg-elev p-5 sm:p-7"
                aria-live="polite"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border bg-surface text-body sm:h-14 sm:w-14">
                    {Icon ? (
                      <span className="text-[1.75rem] leading-none sm:text-[2rem]">
                        <Icon />
                      </span>
                    ) : null}
                  </div>
                  <span className="font-mono text-[11px] text-muted">
                    {skill.group}
                  </span>
                </div>

                <h3 className="mt-4 font-display text-2xl leading-none text-body sm:text-3xl md:text-4xl">
                  {skill.name}
                </h3>
                <p className="mt-2 text-sm font-medium text-muted sm:text-[15px]">
                  {skill.blurb}
                </p>

                <div className="mt-5 border-t pt-4">
                  <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
                    How I learned
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-body/80">
                    {skill.learned}
                  </p>
                  <ul className="mt-3 space-y-1.5">
                    {skill.practice.slice(0, 3).map((item) => (
                      <li
                        key={item}
                        className="flex gap-2.5 text-[13px] leading-snug text-muted"
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

                <div className="mt-6">
                  <div className="mb-1.5 flex justify-between font-mono text-[11px] text-muted">
                    <span>Level</span>
                    <span>{skill.level}%</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-surface">
                    <div
                      className="h-full rounded-full bg-brand-500"
                      style={{ width: `${skill.level}%` }}
                    />
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    className="btn btn-ghost px-4! py-2!"
                    disabled={active === 0}
                    onClick={() => goToSkill(active - 1)}
                  >
                    Prev
                  </button>
                  <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
                    {skill.name}
                  </p>
                  <button
                    type="button"
                    className="btn btn-ghost px-4! py-2!"
                    disabled={active >= SKILLS.length - 1}
                    onClick={() => goToSkill(active + 1)}
                  >
                    Next
                  </button>
                </div>
              </article>

              <div className="mt-5 flex flex-col items-center gap-2">
                <div className="h-1 w-full max-w-xs overflow-hidden rounded-full bg-elev">
                  <div
                    ref={barRef}
                    className="h-full origin-left rounded-full bg-brand-500"
                    style={{ width: "100%", transform: "scaleX(0.06)" }}
                  />
                </div>
                <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
                  Scroll · skill changes · click jumps
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
