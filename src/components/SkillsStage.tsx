"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import skillsJson from "@/data/skills.json";
import { SKILL_ICON } from "@/components/ui/SkillIcons";
import { SectionHead } from "@/components/Section";
import ScrambleText from "@/components/ScrambleText";
import { scrollToY } from "@/lib/lenis";

if (typeof window !== "undefined") {
    gsap.registerPlugin(ScrollTrigger);
}

type Skill = (typeof skillsJson.skills)[number];

const SKILLS = skillsJson.skills as Skill[];

/**
 * Same ScrollTrigger pin pattern as WorkingProjectStage (that one works after reload).
 * Scroll scrub → skill index; click → scrollTo that band; solid opaque bg hides particles.
 */
export default function SkillsStage() {
    const sectionRef = useRef<HTMLElement>(null);
    const panelRef = useRef<HTMLDivElement>(null);
    const barRef = useRef<HTMLDivElement>(null);
    const listRef = useRef<HTMLUListElement>(null);
    const pinStRef = useRef<ScrollTrigger | null>(null);
    const activeRef = useRef(0);
    const [active, setActive] = useState(0);

    const total = SKILLS.length;

    const show = (index: number, instant = false) => {
        const idx = Math.min(total - 1, Math.max(0, index));
        if (idx === activeRef.current && !instant) return;
        activeRef.current = idx;
        setActive(idx);
    };

    const goToSkill = (index: number) => {
        const idx = Math.min(total - 1, Math.max(0, index));
        show(idx, true);

        const st = pinStRef.current;
        if (!st) return;
        const span = Math.max(1, st.end - st.start);
        scrollToY(st.start + span * ((idx + 0.5) / total), { duration: 0.7 });
    };

    // Content enter animation (after index changes)
    useEffect(() => {
        const panel = panelRef.current;
        if (!panel) return;
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
            gsap.set(panel, { autoAlpha: 1, y: 0 });
            return;
        }
        gsap.fromTo(
            panel,
            { autoAlpha: 0, y: 20 },
            {
                autoAlpha: 1,
                y: 0,
                duration: 0.38,
                ease: "power3.out",
                overwrite: true,
            },
        );
    }, [active]);

    // Keep sidebar row visible inside the list only
    useEffect(() => {
        const list = listRef.current;
        const el = list?.querySelector<HTMLElement>(
            `[data-skill-index="${active}"]`,
        );
        if (!list || !el) return;
        const top = el.offsetTop - list.clientHeight / 2 + el.clientHeight / 2;
        list.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
    }, [active]);

    // Mirror WorkingProjectStage scroll setup (works after reload with Lenis)
    useEffect(() => {
        const section = sectionRef.current;
        if (!section || total < 1) return;

        const reduced = window.matchMedia(
            "(prefers-reduced-motion: reduce)",
        ).matches;
        if (reduced) {
            show(0, true);
            return;
        }

        const ctx = gsap.context(() => {
            const pin = ScrollTrigger.create({
                trigger: section,
                start: "top top",
                end: () =>
                    `+=${Math.max(total, 2) * window.innerHeight * 0.42}`,
                pin: true,
                pinType: "transform",
                scrub: 0.55,
                anticipatePin: 1,
                invalidateOnRefresh: true,
                onUpdate: (self) => {
                    const idx = Math.min(
                        total - 1,
                        Math.floor(self.progress * total + 1e-6),
                    );
                    if (barRef.current) {
                        gsap.set(barRef.current, {
                            scaleX: 0.06 + self.progress * 0.94,
                        });
                    }
                    show(idx);
                },
                onRefresh: (self) => {
                    const idx = Math.min(
                        total - 1,
                        Math.floor(self.progress * total + 1e-6),
                    );
                    show(idx, true);
                    if (barRef.current) {
                        gsap.set(barRef.current, {
                            scaleX: 0.06 + self.progress * 0.94,
                        });
                    }
                },
            });

            pinStRef.current = pin;
        }, section);

        // Lenis + fonts can land after first paint — refresh like the rest of the site
        const t1 = window.setTimeout(() => ScrollTrigger.refresh(), 60);
        const t2 = window.setTimeout(() => ScrollTrigger.refresh(), 300);
        const onLoad = () => ScrollTrigger.refresh();
        window.addEventListener("load", onLoad);

        return () => {
            window.clearTimeout(t1);
            window.clearTimeout(t2);
            window.removeEventListener("load", onLoad);
            pinStRef.current = null;
            ctx.revert();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps -- mount once
    }, [total]);

    const skill = SKILLS[active]!;
    const Icon = SKILL_ICON[skill.name];

    return (
        <section
            ref={sectionRef}
            className="relative z-10 isolate"
            aria-labelledby="stack-heading"
        >
            {/* Opaque plate — kills CanvasField / parallax bleed-through */}
            <div aria-hidden className="pointer-events-none absolute inset-0" />

            <div className="relative flex min-h-svh flex-col justify-center py-10 sm:py-12">
                <div className="shell">
                    <div className="mx-auto max-w-3xl text-center">
                        <SectionHead
                            align="center"
                            path="/stack"
                            title={
                                <span id="stack-heading">
                                    <ScrambleText
                                        text="The tools I reach for"
                                        duration={500}
                                    />{" "}
                                    <span className="grad-text">
                                        <ScrambleText
                                            text="daily"
                                            duration={600}
                                        />
                                    </span>
                                </span>
                            }
                        />
                    </div>

                    <div className="mx-auto mt-8 grid max-w-5xl gap-6 lg:mt-10 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-10">
                        <aside>
                            <p className="font-mono text-2xs uppercase tracking-[0.16em] text-muted">
                                Stack · {String(active + 1).padStart(2, "0")} /{" "}
                                {String(total).padStart(2, "0")}
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
                                                        on
                                                            ? "bg-brand-500"
                                                            : "bg-transparent"
                                                    }`}
                                                />
                                                <span className="tabular-nums text-muted">
                                                    {String(i + 1).padStart(
                                                        2,
                                                        "0",
                                                    )}
                                                </span>
                                                <span className="truncate">
                                                    {s.name}
                                                </span>
                                            </button>
                                        </li>
                                    );
                                })}
                            </ul>
                        </aside>

                        <div>
                            <article className="overflow-hidden rounded-2xl border bg-elev p-5 sm:p-7">
                                <div ref={panelRef} aria-live="polite">
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
                                            {skill.practice
                                                .slice(0, 3)
                                                .map((item) => (
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
                                                style={{
                                                    width: `${skill.level}%`,
                                                }}
                                            />
                                        </div>
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
                                        disabled={active >= total - 1}
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
                                        style={{
                                            width: "100%",
                                            transform: "scaleX(0.06)",
                                        }}
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
