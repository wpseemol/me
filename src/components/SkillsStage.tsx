"use client";

import { useEffect, useRef, useState } from "react";
import skillsJson from "@/data/skills.json";
import { SKILL_ACCENT, SKILL_ICON } from "@/components/ui/SkillIcons";
import { SectionHead } from "@/components/Section";
import ScrambleText from "@/components/ScrambleText";
import Reveal from "@/components/Reveal";

type Skill = (typeof skillsJson.skills)[number];

const SKILLS = skillsJson.skills as Skill[];

/**
 * Compact home stack — no ScrollTrigger pin (that was creating huge empty page space).
 * Click / keyboard to step skills; auto-highlights as the section enters view.
 */
export default function SkillsStage() {
  const [active, setActive] = useState(0);
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown" || e.key === "ArrowRight") {
        e.preventDefault();
        setActive((i) => Math.min(SKILLS.length - 1, i + 1));
      } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
        e.preventDefault();
        setActive((i) => Math.max(0, i - 1));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(
      `[data-skill-index="${active}"]`,
    );
    el?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [active]);

  const skill = SKILLS[active]!;
  const accent = SKILL_ACCENT[skill.name] ?? "#1b63ff";
  const Icon = SKILL_ICON[skill.name];

  return (
    <section
      className="relative py-16 sm:py-20"
      aria-labelledby="stack-heading"
    >
      <div className="shell">
        <Reveal>
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
        </Reveal>

        <Reveal className="mx-auto mt-10 grid max-w-5xl gap-6 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-10">
          <aside>
            <p className="font-mono text-2xs uppercase tracking-[0.16em] text-muted">
              Stack · {String(active + 1).padStart(2, "0")} /{" "}
              {String(SKILLS.length).padStart(2, "0")}
            </p>
            <ul
              ref={listRef}
              className="mt-4 max-h-72 space-y-1 overflow-auto pr-1 sm:max-h-80"
              role="listbox"
              aria-label="Skills"
            >
              {SKILLS.map((s, i) => {
                const on = i === active;
                const a = SKILL_ACCENT[s.name] ?? "#1b63ff";
                return (
                  <li key={s.name}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={on}
                      data-skill-index={i}
                      onClick={() => setActive(i)}
                      className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left font-mono text-[12px] transition-colors ${
                        on
                          ? "bg-elev text-body"
                          : "text-muted hover:bg-elev/50 hover:text-body"
                      }`}
                    >
                      <span
                        className="h-1.5 w-1.5 shrink-0 rounded-full"
                        style={{ background: on ? a : "transparent" }}
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

          <article
            key={skill.name}
            className="rounded-2xl border bg-elev/50 p-5 sm:p-7"
            aria-live="polite"
          >
            <div className="flex items-start justify-between gap-4">
              <div
                className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border sm:h-14 sm:w-14"
                style={{
                  color: accent,
                  borderColor: `${accent}55`,
                  background: `${accent}18`,
                }}
              >
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
                    <span
                      className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
                      style={{ background: accent }}
                    />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {skill.focus.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.08em]"
                    style={{
                      color: accent,
                      borderColor: `${accent}44`,
                      background: `${accent}12`,
                    }}
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
                  className="h-full rounded-full"
                  style={{ width: `${skill.level}%`, background: accent }}
                />
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between gap-3">
              <button
                type="button"
                className="btn btn-ghost px-4! py-2!"
                disabled={active === 0}
                onClick={() => setActive((i) => Math.max(0, i - 1))}
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
                onClick={() =>
                  setActive((i) => Math.min(SKILLS.length - 1, i + 1))
                }
              >
                Next
              </button>
            </div>
          </article>
        </Reveal>
      </div>
    </section>
  );
}
