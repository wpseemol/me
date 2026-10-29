"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { WorkingProject } from "@/lib/working-projects";
import { asset } from "@/lib/asset";
import { ArrowUpRightIcon, GithubIcon } from "./Icons";

if (typeof window !== "undefined") {
    gsap.registerPlugin(ScrollTrigger);
}

const LANG_COLOR: Record<string, string> = {
    PHP: "#8892BF",
    TypeScript: "#3178C6",
    JavaScript: "#F7DF1E",
    Blade: "#F7523F",
    CSS: "#563D7C",
    Liquid: "#7AB55C",
};

function yearOf(iso: string) {
    return iso ? iso.slice(0, 4) : "";
}

function hostLabel(url: string) {
    try {
        return new URL(url).hostname.replace(/^www\./, "");
    } catch {
        return url;
    }
}

function WorkingProjectCard({
    project,
    index,
}: {
    project: WorkingProject;
    index: number;
}) {
    const cardRef = useRef<HTMLElement>(null);
    const frameRef = useRef<HTMLDivElement>(null);
    const shotRef = useRef<HTMLDivElement>(null);
    const tweenRef = useRef<gsap.core.Tween | null>(null);
    const [progress, setProgress] = useState(0);
    const [canScroll, setCanScroll] = useState(false);

    const primaryHref = project.homepage || project.github;
    const isLive = Boolean(project.homepage);
    const tags = (
        project.languages.length ? project.languages : [project.language]
    ).slice(0, 4);

    const measureTravel = () => {
        const frame = frameRef.current;
        const shot = shotRef.current;
        if (!frame || !shot) return 0;
        const img = shot.querySelector("img");
        const imgH = img?.getBoundingClientRect().height ?? shot.offsetHeight;
        return Math.max(0, imgH - frame.clientHeight);
    };

    const stopTween = () => {
        tweenRef.current?.kill();
        tweenRef.current = null;
    };

    const scrollPreview = (toBottom: boolean) => {
        const shot = shotRef.current;
        if (!shot) return;
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches)
            return;

        const travel = measureTravel();
        setCanScroll(travel > 24);
        if (travel <= 24) {
            gsap.set(shot, { y: 0 });
            setProgress(0);
            return;
        }

        stopTween();
        const current = Number(gsap.getProperty(shot, "y")) || 0;
        const target = toBottom ? -travel : 0;
        const distance = Math.abs(target - current);
        const duration = Math.max(1.6, Math.min(8, distance / 460));

        tweenRef.current = gsap.to(shot, {
            y: target,
            duration,
            ease: toBottom ? "power1.inOut" : "power2.out",
            onUpdate: () => {
                const y = Math.abs(Number(gsap.getProperty(shot, "y")) || 0);
                setProgress(travel ? y / travel : 0);
            },
        });
    };

    useEffect(() => {
        const card = cardRef.current;
        if (!card) return;

        const onEnter = () => scrollPreview(true);
        const onLeave = () => scrollPreview(false);
        const onResize = () => setCanScroll(measureTravel() > 24);

        card.addEventListener("pointerenter", onEnter);
        card.addEventListener("pointerleave", onLeave);

        const ro = new ResizeObserver(onResize);
        if (frameRef.current) ro.observe(frameRef.current);

        onResize();

        return () => {
            card.removeEventListener("pointerenter", onEnter);
            card.removeEventListener("pointerleave", onLeave);
            ro.disconnect();
            stopTween();
        };
        // Hover handlers rebind when the screenshot asset changes.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [project.screenshot]);

    return (
        <article
            ref={cardRef}
            data-scale-card
            className="group relative flex flex-col overflow-hidden rounded-card border bg-elev/70 backdrop-blur-xs will-change-transform transition-[border-color,box-shadow,translate] duration-500 hover:-translate-y-1.5 hover:border-[color-mix(in_oklab,var(--brand-500)_45%,transparent)] hover:shadow-[0_18px_44px_-22px_rgb(var(--c-glow-a)/0.55)]"
            style={{
                transformOrigin:
                    index % 2 === 0 ? "left center" : "right center",
            }}
        >
            {/* Live site snapshot — auto-scrolls the full page on card hover */}
            <div
                ref={frameRef}
                className="relative aspect-[16/10] overflow-hidden border-b bg-surface"
            >
                <div
                    ref={shotRef}
                    className="absolute inset-x-0 top-0 will-change-transform"
                >
                    <Image
                        src={asset(project.screenshot)}
                        alt={`${project.name} live website screenshot`}
                        width={1280}
                        height={2400}
                        sizes="(max-width: 768px) 100vw, 50vw"
                        className="block h-auto w-full"
                        onLoad={() => setCanScroll(measureTravel() > 24)}
                    />
                </div>

                <div
                    aria-hidden
                    className="pointer-events-none absolute inset-x-0 top-0 z-[1] h-8 bg-gradient-to-b from-elev/70 to-transparent opacity-70"
                />
                <div
                    aria-hidden
                    className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-16 bg-gradient-to-t from-elev via-elev/50 to-transparent"
                />

                <div className="pointer-events-none absolute left-3 top-3 z-[2] flex flex-wrap items-center gap-2">
                    {isLive ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-elev/85 px-2.5 py-0.5 font-mono text-2xs uppercase tracking-[0.14em] text-brand-ink backdrop-blur-sm">
                            <span className="relative flex h-1.5 w-1.5">
                                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-500 opacity-60" />
                                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-brand-500" />
                            </span>
                            Live preview
                        </span>
                    ) : (
                        <span className="chip bg-elev/85 backdrop-blur-sm">
                            Source
                        </span>
                    )}
                </div>

                <div className="pointer-events-none absolute bottom-3 right-3 z-[2] flex items-center gap-2">
                    {canScroll ? (
                        <span className="rounded-full border border-white/15 bg-elev/80 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-muted opacity-0 backdrop-blur-sm transition-opacity duration-300 group-hover:opacity-100">
                            Auto-scroll
                        </span>
                    ) : null}
                    <span
                        aria-hidden
                        className="relative h-12 w-1 overflow-hidden rounded-full bg-line/80"
                    >
                        <span
                            className="absolute inset-x-0 top-0 w-full rounded-full"
                            style={{
                                height: `${Math.max(10, progress * 100)}%`,
                                background: "var(--grad)",
                            }}
                        />
                    </span>
                </div>
            </div>

            <div className="relative flex flex-1 flex-col p-6 sm:p-7">
                <div className="flex items-start justify-between gap-4">
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
                        {yearOf(project.updated) || yearOf(project.created)}
                    </span>
                </div>

                <h3 className="mt-4 text-xl sm:text-2xl">
                    <a
                        href={primaryHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-inherit after:absolute after:inset-0 after:z-[1] after:content-['']"
                    >
                        <span className="relative z-[2] transition-colors duration-300 group-hover:text-brand-ink">
                            {project.name}
                        </span>
                    </a>
                </h3>

                <p className="mt-3 max-w-prose text-sm leading-relaxed text-muted">
                    {project.description || project.body}
                </p>

                <div className="mt-5 flex flex-wrap gap-1.5">
                    {tags.map((t) => (
                        <span key={t} className="chip">
                            {t}
                        </span>
                    ))}
                </div>

                <div className="relative z-[2] mt-auto flex flex-wrap items-center gap-x-5 gap-y-3 border-t pt-5">
                    {isLive ? (
                        <a
                            href={project.homepage}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-ink transition-colors hover:text-accent-500"
                        >
                            {hostLabel(project.homepage)}
                            <ArrowUpRightIcon
                                width={15}
                                height={15}
                                className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                            />
                        </a>
                    ) : null}

                    <a
                        href={project.github}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted transition-colors hover:text-brand-ink"
                    >
                        <GithubIcon width={15} height={15} />
                        GitHub
                        <ArrowUpRightIcon width={14} height={14} />
                    </a>
                </div>
            </div>
        </article>
    );
}

/** Projects from data/projects/*.md — scale in on scroll, auto-scroll preview on hover. */
export default function WorkingProjects({
    projects,
}: {
    projects: WorkingProject[];
}) {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const root = ref.current;
        if (!root || !projects.length) return;

        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
            gsap.set(root.querySelectorAll("[data-scale-card]"), { scale: 1 });
            return;
        }

        const ctx = gsap.context(() => {
            gsap.utils
                .toArray<HTMLElement>("[data-scale-card]")
                .forEach((card) => {
                    gsap.fromTo(
                        card,
                        { scale: 0.9, autoAlpha: 0.5 },
                        {
                            scale: 1,
                            autoAlpha: 1,
                            ease: "none",
                            scrollTrigger: {
                                trigger: card,
                                start: "top 94%",
                                end: "top 46%",
                                scrub: 0.6,
                            },
                        },
                    );
                });
        }, root);

        return () => ctx.revert();
    }, [projects]);

    if (!projects.length) return null;

    return (
        <div ref={ref} className="mt-12 grid gap-5 md:grid-cols-2">
            {projects.map((p, i) => (
                <WorkingProjectCard key={p.slug} project={p} index={i} />
            ))}
        </div>
    );
}
