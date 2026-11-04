"use client";

import { useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { WorkingProject } from "@/lib/working-projects";
import { scrollToY } from "@/lib/lenis";
import {
  clearFieldAtmosphere,
  projectAccent,
  setFieldAtmosphere,
} from "@/lib/field-atmosphere";
import { ArrowUpRightIcon, GithubIcon } from "./Icons";
import ProjectPagePreview from "./ProjectPagePreview";

if (typeof window !== "undefined") {
    gsap.registerPlugin(ScrollTrigger);
}

function hostLabel(url: string) {
    try {
        return new URL(url).hostname.replace(/^www\./, "");
    } catch {
        return url;
    }
}

/** Offsets from stage center — hero stays centered. */
const SCATTER = [
    { x: -210, y: 36, rotate: -14, scale: 0.7 },
    { x: 220, y: -28, rotate: 12, scale: 0.68 },
    { x: -170, y: -90, rotate: -8, scale: 0.64 },
    { x: 180, y: 78, rotate: 15, scale: 0.66 },
    { x: -60, y: 110, rotate: -5, scale: 0.62 },
    { x: 70, y: -110, rotate: 7, scale: 0.6 },
] as const;

const INITIAL_SCALE = 0.7;
const FOCUS_SCALE = 1;

/**
 * Working projects stage:
 * - Starts at ~70% scale, zooms to 100% on scroll/click (centered)
 * - Behind cards are clickable → selected project preview
 */
export default function WorkingProjectStage({
    projects,
}: {
    projects: WorkingProject[];
}) {
    const sectionRef = useRef<HTMLElement>(null);
    const pinRef = useRef<HTMLDivElement>(null);
    const stageRef = useRef<HTMLDivElement>(null);
    const zoomRef = useRef<HTMLDivElement>(null);
    const cardRef = useRef<HTMLElement>(null);
    const scatterRef = useRef<HTMLDivElement>(null);
    const pinStRef = useRef<ScrollTrigger | null>(null);
    const clickLockRef = useRef<number | null>(null);
    const showRef = useRef<(index: number, instant?: boolean) => void>(
        () => {},
    );
    const [active, setActive] = useState(0);

    const total = projects.length;
    const project = projects[Math.min(active, Math.max(total - 1, 0))];

    useEffect(() => {
        const section = sectionRef.current;
        const pinEl = pinRef.current;
        const stage = stageRef.current;
        const zoom = zoomRef.current;
        const card = cardRef.current;
        if (!section || !pinEl || !stage || !zoom || !card || total < 1) return;

        const reduced = window.matchMedia(
            "(prefers-reduced-motion: reduce)",
        ).matches;
        let last = -1;

        const fanScatter = (index: number) => {
            const nodes = scatterRef.current?.querySelectorAll<HTMLElement>(
                "[data-scatter-card]",
            );
            if (!nodes?.length) return;

            let pose = 0;
            nodes.forEach((el) => {
                const i = Number(el.dataset.index);
                gsap.set(el, {
                    left: "50%",
                    top: "50%",
                    xPercent: -50,
                    yPercent: -50,
                });

                if (i === index) {
                    gsap.to(el, {
                        opacity: 0,
                        scale: 0.85,
                        x: 0,
                        y: 0,
                        rotate: 0,
                        duration: 0.3,
                        ease: "power2.out",
                        overwrite: "auto",
                        pointerEvents: "none",
                    });
                    el.setAttribute("aria-hidden", "true");
                    el.tabIndex = -1;
                    return;
                }

                const s = SCATTER[pose % SCATTER.length]!;
                pose += 1;
                gsap.to(el, {
                    x: s.x,
                    y: s.y,
                    rotate: s.rotate,
                    scale: s.scale,
                    opacity: 0.9,
                    duration: 0.55,
                    ease: "power3.out",
                    overwrite: "auto",
                    pointerEvents: "auto",
                });
                el.setAttribute("aria-hidden", "false");
                el.tabIndex = 0;
            });
        };

        const syncField = (index: number, progress: number, pulse: boolean) => {
            const p = projects[index];
            if (!p) return;
            setFieldAtmosphere({
                accent: projectAccent(p.slug, index),
                progress,
                intensity: 1,
                ...(pulse ? { pulse: performance.now() } : {}),
            });
        };

        const show = (index: number, instant = false) => {
            if (index === last && !instant) return;
            if (!projects[index]) return;
            const dir = index >= last ? 1 : -1;
            const progress = (index + 0.5) / Math.max(total, 1);

            syncField(index, progress, true);

            if (instant || reduced) {
                gsap.set(card, { y: 0, x: 0, opacity: 1, rotate: 0 });
                setActive(index);
                fanScatter(index);
                last = index;
                return;
            }

            const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
            tl.to(card, {
                y: dir * -10,
                opacity: 0,
                x: 0,
                rotate: 0,
                duration: 0.24,
                ease: "power2.in",
            })
                .add(() => {
                    flushSync(() => setActive(index));
                    fanScatter(index);
                    gsap.set(card, {
                        y: dir * 20,
                        x: 0,
                        opacity: 0,
                        rotate: 0,
                    });
                })
                .to(card, {
                    y: 0,
                    x: 0,
                    opacity: 1,
                    rotate: 0,
                    duration: 0.48,
                    ease: "power3.out",
                });

            last = index;
        };

        showRef.current = show;

        if (reduced) {
            gsap.set(zoom, { scale: FOCUS_SCALE, transformOrigin: "50% 50%" });
            show(0, true);
            return;
        }

        const ctx = gsap.context(() => {
            // Approach: 70% → 100% zoom, locked to center.
            gsap.set(zoom, {
                scale: INITIAL_SCALE,
                transformOrigin: "50% 50%",
                force3D: true,
            });

            gsap.fromTo(
                zoom,
                { scale: INITIAL_SCALE },
                {
                    scale: FOCUS_SCALE,
                    ease: "none",
                    scrollTrigger: {
                        trigger: section,
                        start: "top 78%",
                        end: "top top",
                        scrub: 0.85,
                        invalidateOnRefresh: true,
                    },
                },
            );

            const pin = ScrollTrigger.create({
                trigger: section,
                start: "top top",
                // Keep the stage interactive without a huge empty pin spacer
                end: () =>
                    `+=${Math.max(total, 2) * window.innerHeight * 0.42}`,
                // Pin inner plate — pinning the section root breaks React route changes
                pin: pinEl,
                pinType: "transform",
                scrub: 0.55,
                anticipatePin: 1,
                invalidateOnRefresh: true,
                onUpdate: (self) => {
                    // Ignore scrub updates while a click is driving Lenis scroll
                    if (clickLockRef.current !== null) return;
                    const idx = Math.min(
                        total - 1,
                        Math.floor(self.progress * total + 1e-6),
                    );
                    show(idx);
                },
                onRefresh: (self) => {
                    if (clickLockRef.current !== null) return;
                    const idx = Math.min(
                        total - 1,
                        Math.floor(self.progress * total + 1e-6),
                    );
                    show(idx, true);
                },
            });
            pinStRef.current = pin;

            gsap.fromTo(
                stage,
                { y: 24, opacity: 0.65 },
                {
                    y: 0,
                    opacity: 1,
                    ease: "none",
                    scrollTrigger: {
                        trigger: section,
                        start: "top 85%",
                        end: "top top",
                        scrub: true,
                    },
                },
            );

            const nodes = scatterRef.current?.querySelectorAll<HTMLElement>(
                "[data-scatter-card]",
            );
            nodes?.forEach((el) => {
                gsap.set(el, {
                    left: "50%",
                    top: "50%",
                    xPercent: -50,
                    yPercent: -50,
                    x: 0,
                    y: 20,
                    opacity: 0,
                    scale: 0.55,
                    rotate: 0,
                });
            });

            show(0, true);
            requestAnimationFrame(() => fanScatter(0));
        }, section);

    return () => {
      // Restore pin DOM before React unmounts (prevents removeChild errors)
      clearFieldAtmosphere();
      pinStRef.current?.kill(true);
      pinStRef.current = null;
      ctx.revert();
    };
  }, [projects, total]);

    const selectProject = (index: number) => {
        if (index === active || !projects[index]) return;

        // Pulse zoom for click feedback: dip to 70%, settle at 100%.
        const zoom = zoomRef.current;
        if (
            zoom &&
            !window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ) {
            gsap.fromTo(
                zoom,
                { scale: INITIAL_SCALE },
                {
                    scale: FOCUS_SCALE,
                    duration: 0.65,
                    ease: "power3.out",
                    overwrite: "auto",
                    transformOrigin: "50% 50%",
                },
            );
        }

        clickLockRef.current = index;
        showRef.current(index, true);

        // Sync page scroll via Lenis — native window.scrollTo fights smooth scroll
        const st = pinStRef.current;
        if (st) {
            const span = Math.max(1, st.end - st.start);
            const target =
                st.start + (span * (index + 0.5)) / Math.max(total, 1);
            scrollToY(target, {
                duration: 0.7,
                onComplete: () => {
                    clickLockRef.current = null;
                },
            });
            window.setTimeout(() => {
                if (clickLockRef.current === index) clickLockRef.current = null;
            }, 900);
        } else {
            clickLockRef.current = null;
        }
    };

    if (!project) return null;

    const primaryHref = project.homepage || project.github;
    const isLive = Boolean(project.homepage);
    const tags = (
        project.technologies.length
            ? project.technologies
            : project.languages.length
              ? project.languages
              : [project.language]
    ).slice(0, 6);

    return (
        <section
            ref={sectionRef}
            className="relative"
            aria-labelledby="working-stage-live"
        >
            <div
                ref={pinRef}
                className="shell flex min-h-[100svh] flex-col items-center py-8 sm:py-10"
            >
                <div className="flex w-full max-w-3xl shrink-0 flex-col items-center text-center">
                    <p
                        id="working-stage-live"
                        className="font-mono text-2xs uppercase tracking-[0.16em] text-muted"
                        aria-live="polite"
                    >
                        {String(active + 1).padStart(2, "0")} /{" "}
                        {String(total).padStart(2, "0")}
                        <span className="mx-2 opacity-40">·</span>
                        {isLive ? "Live" : "Source"}
                    </p>

                    <ul className="mt-4 flex flex-wrap justify-center gap-2">
                        {projects.map((p, i) => {
                            const on = i === active;
                            return (
                                <li key={p.slug}>
                                    <button
                                        type="button"
                                        onClick={() => selectProject(i)}
                                        aria-pressed={on}
                                        className={`inline-flex border border-red-500 items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-all duration-400 ${
                                            on
                                                ? "border-[color-mix(in_oklab,var(--brand-500)_50%,transparent)] bg-elev/90 text-brand-ink shadow-[0_10px_28px_-16px_rgb(var(--c-glow-a)/0.7)]"
                                                : "opacity-55 hover:opacity-90"
                                        }`}
                                    >
                                        <span
                                            className={`h-1.5 w-1.5 rounded-full ${
                                                p.homepage
                                                    ? "bg-signal"
                                                    : "bg-muted"
                                            }`}
                                        />
                                        {p.name}
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                </div>

                <div className="relative flex w-full flex-1 items-center justify-center pt-6">
                    <div
                        ref={stageRef}
                        className="relative mx-auto w-full max-w-3xl will-change-transform"
                    >
                        <div
                            aria-hidden
                            className="absolute -inset-8 rounded-[40px] opacity-55 blur-3xl"
                            style={{
                                background:
                                    "radial-gradient(circle at 50% 30%, rgb(var(--c-glow-a) / 0.28), transparent 65%)",
                            }}
                        />

                        {/* Behind deck — click to open that project */}
                        <div
                            ref={scatterRef}
                            className="absolute inset-0 z-0 overflow-visible"
                        >
                            {projects.map((p, i) => (
                                <button
                                    key={p.slug}
                                    type="button"
                                    data-scatter-card
                                    data-index={i}
                                    onClick={() => selectProject(i)}
                                    aria-label={`Show ${p.name} preview`}
                                    className="absolute h-[78%] w-[84%] cursor-pointer overflow-hidden rounded-[22px] border bg-elev/85 text-left shadow-[0_18px_40px_-24px_rgb(0_0_0/0.55)] backdrop-blur-sm transition-[box-shadow] duration-300 will-change-transform hover:shadow-[0_22px_48px_-18px_rgb(var(--c-glow-a)/0.45)]"
                                    style={{ opacity: 0 }}
                                >
                                    <div className="relative h-36 overflow-hidden border-b sm:h-40">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                            src={p.screenshot}
                                            alt=""
                                            className="h-full w-full object-cover object-top opacity-90"
                                        />
                                    </div>
                                    <div className="p-3">
                                        <p className="truncate text-sm font-semibold">
                                            {p.name}
                                        </p>
                                        <p className="mt-0.5 truncate font-mono text-2xs text-muted">
                                            {p.framework || p.language}
                                        </p>
                                    </div>
                                </button>
                            ))}
                        </div>

                        {/* Zoom shell — 70% → 100%, always centered */}
                        <div
                            ref={zoomRef}
                            className="relative z-10 mx-auto w-full will-change-transform"
                            style={{ transformOrigin: "50% 50%" }}
                        >
                            <article
                                ref={cardRef}
                                className="group relative mx-auto w-full overflow-hidden rounded-[28px] border bg-elev/90 shadow-[0_28px_70px_-36px_rgb(var(--c-glow-a)/0.8)] backdrop-blur-md will-change-transform"
                            >
                                <ProjectPagePreview
                                    key={project.slug}
                                    src={project.screenshot}
                                    alt={`${project.name} website screenshot`}
                                    live={isLive}
                                    priority={active === 0}
                                    className="border-b"
                                />

                                <div className="grid gap-5 p-5 sm:grid-cols-[1.2fr_0.8fr] sm:p-6">
                                    <div className="min-w-0 text-left">
                                        <div className="flex items-center gap-3 font-mono text-2xs text-muted">
                                            <span>
                                                {project.framework ||
                                                    project.language}
                                            </span>
                                            <span className="opacity-40">
                                                ·
                                            </span>
                                            <span>
                                                {(
                                                    project.updated ||
                                                    project.created
                                                ).slice(0, 4)}
                                            </span>
                                        </div>
                                        <h4 className="mt-2 text-2xl tracking-tight sm:text-[1.75rem]">
                                            <a
                                                href={primaryHref}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="transition-colors hover:text-brand-ink"
                                            >
                                                {project.name}
                                            </a>
                                        </h4>
                                        <p className="mt-2 text-sm leading-relaxed text-muted">
                                            {project.description ||
                                                project.detail}
                                        </p>
                                    </div>

                                    <div className="flex min-w-0 flex-col justify-between gap-4 sm:items-end sm:text-right">
                                        <div className="flex flex-wrap gap-1.5 sm:justify-end">
                                            {tags.map((t) => (
                                                <span key={t} className="chip">
                                                    {t}
                                                </span>
                                            ))}
                                        </div>
                                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 sm:justify-end">
                                            {isLive ? (
                                                <a
                                                    href={project.homepage}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-ink transition-colors hover:text-accent-500"
                                                >
                                                    {hostLabel(
                                                        project.homepage,
                                                    )}
                                                    <ArrowUpRightIcon
                                                        width={15}
                                                        height={15}
                                                    />
                                                </a>
                                            ) : null}
                                            <a
                                                href={project.github}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted transition-colors hover:text-brand-ink"
                                            >
                                                <GithubIcon
                                                    width={15}
                                                    height={15}
                                                />
                                                GitHub
                                            </a>
                                        </div>
                                        <p className="font-mono text-2xs text-muted">
                                            Click a card behind · or scroll
                                            preview →
                                        </p>
                                    </div>
                                </div>
                            </article>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
