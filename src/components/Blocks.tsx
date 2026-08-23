"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import site from "@/data/site.json";
import Magnetic from "./Magnetic";
import { ArrowUpRightIcon, CheckIcon } from "./Icons";
import ScrambleText from "./ScrambleText";

if (typeof window !== "undefined") {
    gsap.registerPlugin(ScrollTrigger);
}

/* ------------------------------------------------------------- marquee */

/**
 * Marquee whose speed and direction follow the scroll.
 *
 * It idles at a slow constant crawl, accelerates with scroll velocity, and
 * reverses when you scroll back up — so the strip reports what the page is
 * doing instead of looping obliviously. The skew is small on purpose; past a
 * couple of degrees it stops reading as momentum and starts reading as a bug.
 */
export function TechMarquee() {
    const trackRef = useRef<HTMLDivElement>(null);
    const names = site.stack.map((s) => s.name);
    const row = [...names, ...names];

    useEffect(() => {
        const track = trackRef.current;
        if (!track) return;

        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches)
            return;

        const ctx = gsap.context(() => {
            // xPercent -50 is exactly one copy of the doubled row, so the wrap is
            // seamless regardless of how wide the content ends up.
            const loop = gsap.to(track, {
                xPercent: -50,
                repeat: -1,
                duration: 26,
                ease: "none",
            });

            const skewTo = gsap.quickTo(track, "skewX", {
                duration: 0.6,
                ease: "power3.out",
            });

            ScrollTrigger.create({
                trigger: track,
                start: "top bottom",
                end: "bottom top",
                onUpdate: (self) => {
                    const v = self.getVelocity();
                    loop.timeScale(gsap.utils.clamp(-6, 6, 1 + v / 320));
                    skewTo(gsap.utils.clamp(-4, 4, v / 900));
                },
            });

            // Without this the strip stays skewed after the scroll stops.
            ScrollTrigger.addEventListener("scrollEnd", () => {
                skewTo(0);
                gsap.to(loop, {
                    timeScale: 1,
                    duration: 0.8,
                    ease: "power2.out",
                });
            });
        }, track);

        return () => ctx.revert();
    }, []);

    return (
        <div
            className="mask-fade-x relative overflow-hidden border-y py-5"
            aria-hidden="true"
        >
            <div
                ref={trackRef}
                className="flex w-max gap-10 pr-10 will-change-transform"
            >
                {row.map((n, i) => (
                    <span
                        key={`${n}-${i}`}
                        className="flex shrink-0 items-center gap-10 font-display text-lg font-semibold text-muted"
                    >
                        {n}
                        <span className="h-1.5 w-1.5 rounded-full bg-brand-500/60" />
                    </span>
                ))}
            </div>
        </div>
    );
}

/* ---------------------------------------------------------- stack bars */

export function StackBars() {
    const ref = useRef<HTMLUListElement>(null);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const bars = el.querySelectorAll<HTMLElement>("[data-fill]");
        const reduced = window.matchMedia(
            "(prefers-reduced-motion: reduce)",
        ).matches;

        const ctx = gsap.context(() => {
            bars.forEach((bar) => {
                const level = Number(bar.dataset.fill ?? 0);
                if (reduced) {
                    gsap.set(bar, { scaleX: level / 100 });
                    return;
                }
                // scaleX rather than width: width animates layout, transform doesn't.
                gsap.fromTo(
                    bar,
                    { scaleX: 0 },
                    {
                        scaleX: level / 100,
                        duration: 1.3,
                        ease: "expo.out",
                        scrollTrigger: {
                            trigger: bar,
                            start: "top 92%",
                            once: true,
                        },
                    },
                );
            });
        }, el);

        return () => ctx.revert();
    }, []);

    return (
        <ul ref={ref} className="grid gap-x-10 gap-y-5 sm:grid-cols-2">
            {site.stack.map((s) => (
                <li key={s.name}>
                    <div className="flex items-baseline justify-between gap-3">
                        <span className="text-sm font-semibold">{s.name}</span>
                        <span className="font-mono text-2xs text-muted">
                            {s.group}
                        </span>
                    </div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface">
                        <div
                            data-fill={s.level}
                            className="h-full w-full origin-left scale-x-0 rounded-full"
                            style={{ background: "var(--grad)" }}
                        />
                    </div>
                </li>
            ))}
        </ul>
    );
}

/* -------------------------------------------------------- service card */

type Service = (typeof site.services)[number];

export function ServiceCard({
    service,
    index,
}: {
    service: Service;
    index: number;
}) {
    return (
        <article id={service.slug} className="card scroll-mt-28 p-6 sm:p-7">
            <div className="flex items-start justify-between gap-4">
                <span className="font-mono text-2xs uppercase tracking-[0.18em] text-muted">
                    {String(index + 1).padStart(2, "0")}
                </span>
                <span
                    className="h-9 w-9 shrink-0 rounded-[11px] opacity-90"
                    style={{
                        background: `linear-gradient(${135 + index * 25}deg, var(--brand-600), var(--accent-400))`,
                    }}
                />
            </div>

            <h3 className="mt-5 text-xl sm:text-[1.35rem]">{service.title}</h3>
            <p className="mt-3 text-sm leading-relaxed text-muted">
                {service.summary}
            </p>

            <ul className="mt-5 space-y-2">
                {service.deliverables.slice(0, 4).map((d) => (
                    <li
                        key={d}
                        className="flex items-start gap-2.5 text-sm text-muted"
                    >
                        <CheckIcon
                            width={15}
                            height={15}
                            className="mt-0.5 shrink-0 text-brand-ink"
                        />
                        <span>{d}</span>
                    </li>
                ))}
            </ul>

            <div className="mt-6 flex flex-wrap gap-1.5 border-t pt-5">
                {service.stack.map((t) => (
                    <span key={t} className="chip">
                        {t}
                    </span>
                ))}
            </div>
        </article>
    );
}

/* -------------------------------------------------------- project card */

type Project = (typeof site.projects)[number];

const LANG_COLOR: Record<string, string> = {
    PHP: "#8892BF",
    TypeScript: "#3178C6",
    JavaScript: "#F7DF1E",
    Liquid: "#7AB55C",
};

export function ProjectCard({ project }: { project: Project }) {
    return (
        <article className="card group flex flex-col p-6 sm:p-7">
            <div className="flex items-center justify-between gap-3">
                <span className="inline-flex items-center gap-2 font-mono text-2xs text-muted">
                    <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{
                            background:
                                LANG_COLOR[project.language] ??
                                "var(--brand-400)",
                        }}
                    />
                    {project.language}
                </span>
                <span className="font-mono text-2xs text-muted">
                    {project.year}
                </span>
            </div>

            <h3 className="mt-4 text-lg sm:text-xl">{project.name}</h3>
            <p className="mt-3 text-sm leading-relaxed text-muted">
                {project.detail}
            </p>

            <div className="mt-5 flex flex-wrap gap-1.5">
                {project.tags.map((t) => (
                    <span key={t} className="chip">
                        {t}
                    </span>
                ))}
            </div>

            <a
                href={project.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 inline-flex items-center gap-1.5 border-t pt-5 text-sm font-semibold text-brand-ink transition-colors hover:text-accent-500"
            >
                View source on GitHub
                <ArrowUpRightIcon
                    width={15}
                    height={15}
                    className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                />
            </a>
        </article>
    );
}

/* ------------------------------------------------------------- process */

/**
 * The spine draws itself as you scroll and each marker lights when its step
 * arrives — the timeline reports reading progress rather than decorating it.
 */
export function ProcessList() {
    const ref = useRef<HTMLOListElement>(null);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
            gsap.set(el.querySelectorAll("[data-spine]"), { scaleY: 1 });
            gsap.set(el.querySelectorAll("[data-marker]"), { opacity: 1 });
            return;
        }

        const ctx = gsap.context(() => {
            gsap.to("[data-spine]", {
                scaleY: 1,
                ease: "none",
                scrollTrigger: {
                    trigger: el,
                    start: "top 78%",
                    end: "bottom 72%",
                    scrub: 0.5,
                },
            });

            gsap.utils
                .toArray<HTMLElement>("[data-marker]")
                .forEach((marker) => {
                    gsap.fromTo(
                        marker,
                        { opacity: 0.28, scale: 0.82 },
                        {
                            opacity: 1,
                            scale: 1,
                            duration: 0.5,
                            ease: "back.out(2)",
                            scrollTrigger: {
                                trigger: marker,
                                start: "top 82%",
                                once: true,
                            },
                        },
                    );
                });
        }, el);

        return () => ctx.revert();
    }, []);

    return (
        <ol ref={ref} className="relative pl-7">
            <span
                className="absolute inset-y-0 left-0 w-px bg-line"
                aria-hidden="true"
            />
            <span
                data-spine
                aria-hidden="true"
                className="absolute inset-y-0 left-0 w-px origin-top scale-y-0"
                style={{ background: "var(--grad)" }}
            />

            {site.process.map((step, i) => (
                <li key={step.step} className="relative pb-9 last:pb-0">
                    <span
                        data-marker
                        className="absolute -left-8.75 grid h-6 w-6 place-items-center rounded-full font-mono text-[10px] font-bold text-white"
                        style={{
                            background:
                                "linear-gradient(140deg, var(--brand-600), var(--accent-500))",
                        }}
                    >
                        {i + 1}
                    </span>
                    <span className="font-mono text-2xs uppercase tracking-[0.18em] text-muted">
                        {step.step}
                    </span>
                    <h3 className="mt-1.5 text-lg">{step.title}</h3>
                    <p className="mt-2 max-w-prose text-sm leading-relaxed text-muted">
                        {step.body}
                    </p>
                </li>
            ))}
        </ol>
    );
}

/* ----------------------------------------------------------------- FAQ */

export function Faq() {
    const [open, setOpen] = useState<number | null>(0);

    return (
        <div className="divide-y border-y">
            {site.faq.map((item, i) => {
                const isOpen = open === i;
                return (
                    <div key={item.q}>
                        <h3>
                            <button
                                type="button"
                                onClick={() => setOpen(isOpen ? null : i)}
                                aria-expanded={isOpen}
                                aria-controls={`faq-panel-${i}`}
                                className="flex w-full items-center justify-between gap-5 py-5 text-left"
                            >
                                <span className="font-display text-base font-bold sm:text-lg">
                                    {item.q}
                                </span>
                                <span
                                    aria-hidden
                                    className="grid h-7 w-7 shrink-0 place-items-center rounded-full border text-muted transition-transform duration-500"
                                    style={{
                                        transform: isOpen
                                            ? "rotate(45deg)"
                                            : "none",
                                        transitionTimingFunction:
                                            "var(--ease-fluid)",
                                    }}
                                >
                                    <svg
                                        viewBox="0 0 24 24"
                                        width="14"
                                        height="14"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2.2"
                                        strokeLinecap="round"
                                    >
                                        <path d="M12 5v14M5 12h14" />
                                    </svg>
                                </span>
                            </button>
                        </h3>
                        <div
                            id={`faq-panel-${i}`}
                            className="grid transition-all duration-500"
                            style={{
                                gridTemplateRows: isOpen ? "1fr" : "0fr",
                                transitionTimingFunction: "var(--ease-fluid)",
                            }}
                        >
                            <div className="overflow-hidden">
                                <p className="max-w-prose pb-6 text-sm leading-relaxed text-muted">
                                    {item.a}
                                </p>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

/* --------------------------------------------------------------- CTA */

export function CtaBand() {
    return (
        <section className="shell">
            <div className="relative overflow-hidden rounded-card border p-8 text-center sm:p-14">
                <div
                    aria-hidden
                    className="absolute inset-0 opacity-[0.16]"
                    style={{ background: "var(--grad)" }}
                />
                <div className="relative">
                    <h2 className="text-[clamp(1.7rem,4vw,2.6rem)]">
                        <ScrambleText
                            text="Have something you need built?"
                            duration={500}
                        />
                    </h2>
                    <p className="mx-auto mt-4 max-w-lg text-[15px] leading-relaxed text-muted">
                        Tell me what the product has to do and where it&apos;s
                        stuck. You&apos;ll get a written scope back —
                        deliverables, timeline and price — before anyone writes
                        code.
                    </p>
                    <div className="mt-8 flex flex-wrap justify-center gap-3">
                        <Magnetic strength={0.3}>
                            <Link href="/contact" className="btn btn-primary">
                                Start a project
                            </Link>
                        </Magnetic>
                        <Magnetic strength={0.3}>
                            <a
                                href={`mailto:${site.profile.email}`}
                                className="btn btn-ghost"
                            >
                                {site.profile.email}
                            </a>
                        </Magnetic>
                    </div>
                </div>
            </div>
        </section>
    );
}
