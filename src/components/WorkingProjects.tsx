"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { WorkingProject } from "@/lib/working-projects";
import { ArrowUpRightIcon, GithubIcon } from "./Icons";
import ProjectPagePreview from "./ProjectPagePreview";

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

/** Entrance tilt only — cards settle flat/centered in the grid. */
const TILT = [-8, 6, -5, 7, -6, 4, -5, 5];

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
    project.technologies.length
      ? project.technologies
      : project.languages.length
        ? project.languages
        : [project.language]
  ).slice(0, 5);
  const tilt = TILT[index % TILT.length]!;

  return (
    <article
      data-scale-card
      className="group relative flex flex-col overflow-hidden rounded-card border bg-elev/80 backdrop-blur-xs will-change-transform transition-[border-color,box-shadow] duration-500 hover:border-[color-mix(in_oklab,var(--brand-500)_45%,transparent)] hover:shadow-[0_22px_48px_-22px_rgb(var(--c-glow-a)/0.55)]"
      style={{ transformOrigin: "center center" }}
      data-tilt={tilt}
    >
      <ProjectPagePreview
        src={project.screenshot}
        alt={`${project.name} live website screenshot`}
        live={isLive}
        className="border-b"
      />

      <div className="relative z-[1] flex flex-1 flex-col p-6 sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <span className="inline-flex items-center gap-2 font-mono text-2xs text-muted">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{
                background: LANG_COLOR[project.language] ?? "var(--brand-400)",
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
            className="text-inherit transition-colors hover:text-brand-ink"
          >
            {project.name}
          </a>
        </h3>

        <p className="mt-3 max-w-prose text-sm leading-relaxed text-muted">
          {project.description || project.detail}
        </p>

        {(project.framework || project.cms) && (
          <dl className="mt-4 grid gap-1.5 font-mono text-2xs text-muted sm:grid-cols-2">
            {project.framework ? (
              <div>
                <dt className="inline uppercase tracking-[0.14em] opacity-60">
                  Framework{" "}
                </dt>
                <dd className="inline text-body">{project.framework}</dd>
              </div>
            ) : null}
            {project.cms ? (
              <div>
                <dt className="inline uppercase tracking-[0.14em] opacity-60">
                  CMS{" "}
                </dt>
                <dd className="inline text-body">{project.cms}</dd>
              </div>
            ) : null}
          </dl>
        )}

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
      gsap.set(root.querySelectorAll("[data-scale-card]"), {
        clearProps: "all",
      });
      return;
    }

    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>("[data-scale-card]").forEach((card, i) => {
        const tilt = Number(card.dataset.tilt ?? TILT[i % TILT.length]);
        // Start ~70%, zoom to 100% as it scrolls into center — stays aligned.
        gsap.fromTo(
          card,
          {
            scale: 0.7,
            autoAlpha: 0.4,
            y: 48,
            rotate: tilt,
            x: 0,
            transformOrigin: "50% 50%",
          },
          {
            scale: 1,
            autoAlpha: 1,
            y: 0,
            x: 0,
            rotate: 0,
            ease: "none",
            scrollTrigger: {
              trigger: card,
              start: "top 92%",
              end: "top 48%",
              scrub: 1.05,
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
      className="mx-auto mt-12 grid w-full max-w-5xl gap-6 md:grid-cols-2 md:gap-8"
    >
      {projects.map((p, i) => (
        <WorkingProjectCard key={p.slug} project={p} index={i} />
      ))}
    </div>
  );
}
