"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { WorkingProject } from "@/lib/working-projects";
import { asset } from "@/lib/asset";
import { ArrowUpRightIcon, GithubIcon } from "./Icons";

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
 * Scroll-pinned stand for live working projects — lift / blur / rise motion.
 */
export default function WorkingProjectStage({
  projects,
}: {
  projects: WorkingProject[];
}) {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const mediaRef = useRef<HTMLDivElement>(null);
  const copyRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  const total = projects.length;
  const project = projects[Math.min(active, Math.max(total - 1, 0))];

  useEffect(() => {
    const section = sectionRef.current;
    const stage = stageRef.current;
    const media = mediaRef.current;
    const copy = copyRef.current;
    if (!section || !stage || !media || !copy || total < 1) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let last = -1;

    const show = (index: number, instant = false) => {
      if (index === last && !instant) return;
      if (!projects[index]) return;
      const dir = index >= last ? 1 : -1;

      if (instant || reduced) {
        gsap.set([media, copy], { y: 0, opacity: 1, scale: 1, filter: "blur(0px)" });
        setActive(index);
        last = index;
        return;
      }

      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      tl.to([media, copy], {
        y: dir * -28,
        opacity: 0,
        scale: 0.94,
        filter: "blur(8px)",
        duration: 0.28,
        stagger: 0.04,
        ease: "power2.in",
      })
        .add(() => {
          flushSync(() => setActive(index));
          gsap.set([media, copy], {
            y: dir * 36,
            opacity: 0,
            scale: 0.92,
            filter: "blur(10px)",
          });
        })
        .to([media, copy], {
          y: 0,
          opacity: 1,
          scale: 1,
          filter: "blur(0px)",
          duration: 0.48,
          stagger: 0.05,
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
        end: () => `+=${Math.max(total, 2) * window.innerHeight * 0.75}`,
        pin: true,
        scrub: 0.55,
        anticipatePin: 1,
        onUpdate: (self) => {
          const idx = Math.min(total - 1, Math.floor(self.progress * total + 1e-6));
          show(idx);
        },
        onRefresh: (self) => {
          const idx = Math.min(total - 1, Math.floor(self.progress * total + 1e-6));
          show(idx, true);
        },
      });

      gsap.fromTo(
        stage,
        { y: 40, opacity: 0.5 },
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
  ).slice(0, 5);

  return (
    <section
      ref={sectionRef}
      className="relative"
      aria-labelledby="working-stage-live"
    >
      <div className="shell grid min-h-[100svh] items-center gap-10 py-14 lg:grid-cols-[0.9fr_1.1fr] lg:gap-14">
        <div>
          <p
            id="working-stage-live"
            className="font-mono text-2xs uppercase tracking-[0.16em] text-muted"
            aria-live="polite"
          >
            {String(active + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
            <span className="mx-2 opacity-40">·</span>
            {isLive ? "Live" : "Source"}
          </p>

          <h3 className="mt-4 text-[clamp(2rem,5vw,3.2rem)] leading-[0.98]">
            <span className="block text-muted">Shipping now,</span>
            <span className="grad-text">one build at a time</span>
          </h3>

          <p className="mt-5 max-w-md text-[15px] leading-relaxed text-muted">
            Scroll to step through live products currently in motion — preview,
            stack chips, and links for each build.
          </p>

          <ul className="mt-8 flex flex-wrap gap-2">
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
                          : "opacity-35"
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

        <div ref={stageRef} className="relative mx-auto w-full max-w-lg will-change-transform">
          <div
            aria-hidden
            className="absolute inset-x-6 top-6 h-full rounded-[28px] border bg-elev/40 opacity-40"
          />
          <div
            aria-hidden
            className="absolute inset-x-3 top-3 h-full rounded-[28px] border bg-elev/55 opacity-60"
          />
          <div
            aria-hidden
            className="absolute -inset-10 rounded-[40px] opacity-60 blur-3xl"
            style={{
              background:
                "radial-gradient(circle at 40% 30%, rgb(var(--c-glow-a) / 0.28), transparent 65%)",
            }}
          />

          <article className="relative overflow-hidden rounded-[28px] border bg-elev/90 shadow-[0_28px_70px_-36px_rgb(var(--c-glow-a)/0.8)] backdrop-blur-md">
            <div
              ref={mediaRef}
              className="relative aspect-[16/10] overflow-hidden border-b bg-surface will-change-transform"
            >
              <Image
                src={asset(project.screenshot)}
                alt={`${project.name} website screenshot`}
                fill
                sizes="(max-width: 1024px) 90vw, 520px"
                className="object-cover object-top"
                priority={active === 0}
              />
              <div className="absolute left-3 top-3 z-[1]">
                {isLive ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-elev/85 px-2.5 py-0.5 font-mono text-2xs uppercase tracking-[0.14em] text-brand-ink backdrop-blur-sm">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-500 opacity-60" />
                      <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-brand-500" />
                    </span>
                    Live
                  </span>
                ) : (
                  <span className="chip bg-elev/85 backdrop-blur-sm">Source</span>
                )}
              </div>
            </div>

            <div ref={copyRef} className="p-6 will-change-transform sm:p-7">
              <div className="flex items-center justify-between gap-3 font-mono text-2xs text-muted">
                <span>{project.framework || project.language}</span>
                <span>{(project.updated || project.created).slice(0, 4)}</span>
              </div>

              <h4 className="mt-3 text-2xl sm:text-[1.7rem]">
                <a
                  href={primaryHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-colors hover:text-brand-ink"
                >
                  {project.name}
                </a>
              </h4>

              <p className="mt-3 min-h-[3.6em] text-sm leading-relaxed text-muted">
                {project.description || project.detail}
              </p>

              <div className="mt-4 flex flex-wrap gap-1.5">
                {tags.map((t) => (
                  <span key={t} className="chip">
                    {t}
                  </span>
                ))}
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 border-t pt-5">
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
                <span className="ml-auto font-mono text-2xs text-muted">
                  {active === total - 1 ? "Last project" : "Scroll to next →"}
                </span>
              </div>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
