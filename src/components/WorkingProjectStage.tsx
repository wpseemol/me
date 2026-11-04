"use client";

import { useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { WorkingProject } from "@/lib/working-projects";
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

/**
 * Centered modern project stand — no wide empty side column.
 */
export default function WorkingProjectStage({
  projects,
}: {
  projects: WorkingProject[];
}) {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLElement>(null);
  const [active, setActive] = useState(0);

  const total = projects.length;
  const project = projects[Math.min(active, Math.max(total - 1, 0))];

  useEffect(() => {
    const section = sectionRef.current;
    const stage = stageRef.current;
    const card = cardRef.current;
    if (!section || !stage || !card || total < 1) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let last = -1;

    const show = (index: number, instant = false) => {
      if (index === last && !instant) return;
      if (!projects[index]) return;
      const dir = index >= last ? 1 : -1;

      if (instant || reduced) {
        gsap.set(card, { y: 0, opacity: 1, scale: 1, filter: "blur(0px)" });
        setActive(index);
        last = index;
        return;
      }

      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      tl.to(card, {
        y: dir * -24,
        opacity: 0,
        scale: 0.96,
        filter: "blur(8px)",
        duration: 0.26,
        ease: "power2.in",
      })
        .add(() => {
          flushSync(() => setActive(index));
          gsap.set(card, {
            y: dir * 28,
            opacity: 0,
            scale: 0.96,
            filter: "blur(8px)",
          });
        })
        .to(card, {
          y: 0,
          opacity: 1,
          scale: 1,
          filter: "blur(0px)",
          duration: 0.45,
          ease: "expo.out",
        });

      last = index;
    };

    if (reduced) {
      show(0, true);
      return;
    }

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: section,
        start: "top top",
        end: () => `+=${Math.max(total, 2) * window.innerHeight * 0.72}`,
        pin: true,
        scrub: 0.55,
        anticipatePin: 1,
        onUpdate: (self) => {
          const idx = Math.min(
            total - 1,
            Math.floor(self.progress * total + 1e-6),
          );
          show(idx);
        },
        onRefresh: (self) => {
          const idx = Math.min(
            total - 1,
            Math.floor(self.progress * total + 1e-6),
          );
          show(idx, true);
        },
      });

      gsap.fromTo(
        stage,
        { y: 36, opacity: 0.55 },
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

      show(0, true);
    }, section);

    return () => ctx.revert();
  }, [projects, total]);

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
      <div className="shell flex min-h-[100svh] flex-col items-center justify-center gap-6 py-10">
        <div className="flex w-full max-w-3xl flex-col items-center text-center">
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

          <ul className="mt-5 flex flex-wrap justify-center gap-2">
            {projects.map((p, i) => {
              const on = i === active;
              return (
                <li key={p.slug}>
                  <span
                    className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-all duration-400 ${
                      on
                        ? "border-[color-mix(in_oklab,var(--brand-500)_50%,transparent)] bg-elev/90 text-brand-ink shadow-[0_10px_28px_-16px_rgb(var(--c-glow-a)/0.7)]"
                        : i < active
                          ? "opacity-70"
                          : "opacity-40"
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        p.homepage ? "bg-signal" : "bg-muted"
                      }`}
                    />
                    {p.name}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>

        <div ref={stageRef} className="relative mx-auto w-full max-w-3xl will-change-transform">
          <div
            aria-hidden
            className="absolute -inset-8 rounded-[40px] opacity-55 blur-3xl"
            style={{
              background:
                "radial-gradient(circle at 50% 30%, rgb(var(--c-glow-a) / 0.28), transparent 65%)",
            }}
          />

          <article
            ref={cardRef}
            className="group relative overflow-hidden rounded-[28px] border bg-elev/90 shadow-[0_28px_70px_-36px_rgb(var(--c-glow-a)/0.8)] backdrop-blur-md will-change-transform"
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
              <div>
                <div className="flex items-center gap-3 font-mono text-2xs text-muted">
                  <span>{project.framework || project.language}</span>
                  <span className="opacity-40">·</span>
                  <span>{(project.updated || project.created).slice(0, 4)}</span>
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
                  {project.description || project.detail}
                </p>
              </div>

              <div className="flex flex-col justify-between gap-4 sm:items-end sm:text-right">
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
                      {hostLabel(project.homepage)}
                      <ArrowUpRightIcon width={15} height={15} />
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
                  </a>
                </div>
                <p className="font-mono text-2xs text-muted">
                  {active === total - 1
                    ? "Last project"
                    : "Scroll page for next project →"}
                </p>
              </div>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
