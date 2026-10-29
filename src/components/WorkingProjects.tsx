"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { WorkingProject } from "@/lib/working-projects";
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
    const primaryHref = project.homepage || project.github;
    const isLive = Boolean(project.homepage);
    const tags = (
        project.languages.length ? project.languages : [project.language]
    ).slice(0, 4);

    return (
        <article
            data-scale-card
            className="group relative flex flex-col overflow-hidden rounded-card border bg-elev/70 p-6 backdrop-blur-xs will-change-transform transition-[border-color,box-shadow,translate] duration-500 hover:-translate-y-1.5 hover:border-[color-mix(in_oklab,var(--brand-500)_45%,transparent)] hover:shadow-[0_18px_44px_-22px_rgb(var(--c-glow-a)/0.55)] sm:p-8"
            style={{
                transformOrigin:
                    index % 2 === 0 ? "left center" : "right center",
            }}
        >
            <div
                aria-hidden
                className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                style={{
                    background:
                        "radial-gradient(circle, color-mix(in oklab, var(--brand-500) 28%, transparent), transparent 70%)",
                }}
            />

            <div className="relative flex items-start justify-between gap-4">
                <div className="flex flex-wrap items-center gap-2">
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
                    {isLive ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-mono text-2xs uppercase tracking-[0.14em] text-brand-ink">
                            <span className="relative flex h-1.5 w-1.5">
                                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-500 opacity-60" />
                                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-brand-500" />
                            </span>
                            Live
                        </span>
                    ) : (
                        <span className="chip">Source</span>
                    )}
                </div>
                <span className="font-mono text-2xs text-muted">
                    {yearOf(project.updated) || yearOf(project.created)}
                </span>
            </div>

            {/* Stretched title link makes the whole card clickable; footer links sit above it. */}
            <h3 className="mt-5 text-xl sm:text-2xl">
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
        </article>
    );
}

/**
 * Recent / in-progress builds from /db/*.md.
 * Cards scale up as they enter the viewport (GSAP scrub) — client-only, fine
 * with static export.
 */
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
                    // Scale only — hover lift stays in CSS so scrub and hover don't fight.
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
        <div
            ref={ref}
            className="mt-12 grid gap-5 md:grid-cols-2"
        >
            {projects.map((p, i) => (
                <WorkingProjectCard key={p.slug} project={p} index={i} />
            ))}
        </div>
    );
}
