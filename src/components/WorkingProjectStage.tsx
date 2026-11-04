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

/** Scattered deck poses for inactive project cards (playing-card feel). */
const SCATTER = [
  { x: "-34%", y: "10%", rotate: -16, scale: 0.72 },
  { x: "36%", y: "-8%", rotate: 14, scale: 0.7 },
  { x: "-28%", y: "-22%", rotate: -9, scale: 0.66 },
  { x: "30%", y: "20%", rotate: 18, scale: 0.68 },
  { x: "-8%", y: "28%", rotate: -5, scale: 0.64 },
  { x: "12%", y: "-28%", rotate: 8, scale: 0.62 },
] as const;

/**
 * Featured working project stays center-stage.
 * Other projects fan out behind it like a scattered card deck on scroll.
 */
export default function WorkingProjectStage({
  projects,
}: {
  projects: WorkingProject[];
}) {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLElement>(null);
  const scatterRef = useRef<HTMLDivElement>(null);
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

    const fanScatter = (index: number) => {
      const nodes = scatterRef.current?.querySelectorAll<HTMLElement>(
        "[data-scatter-card]",
      );
      if (!nodes?.length) return;

      let pose = 0;
      nodes.forEach((el) => {
        const i = Number(el.dataset.index);
        if (i === index) {
          gsap.to(el, {
            opacity: 0,
            scale: 0.9,
            duration: 0.35,
            ease: "power2.out",
          });
          return;
        }
        const s = SCATTER[pose % SCATTER.length]!;
        pose += 1;
        gsap.to(el, {
          x: s.x,
          y: s.y,
          rotate: s.rotate,
          scale: s.scale,
          opacity: 0.88,
          duration: 0.55,
          ease: "power3.out",
          overwrite: "auto",
        });
      });
    };

    const show = (index: number, instant = false) => {
      if (index === last && !instant) return;
      if (!projects[index]) return;
      const dir = index >= last ? 1 : -1;

      if (instant || reduced) {
        gsap.set(card, { y: 0, opacity: 1, scale: 1, filter: "blur(0px)" });
        setActive(index);
        fanScatter(index);
        last = index;
        return;
      }

      // Gravity handoff — drop out, then settle in. No heavy blur that
      // makes the screenshot / copy look like it “vanished”.
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      tl.to(card, {
        y: dir * -18,
        opacity: 0,
        scale: 0.97,
        duration: 0.28,
        ease: "power2.in",
      })
        .add(() => {
          flushSync(() => setActive(index));
          fanScatter(index);
          gsap.set(card, {
            y: dir * 32,
            opacity: 0,
            scale: 0.94,
          });
        })
        .to(card, {
          y: 0,
          opacity: 1,
          scale: 1,
          duration: 0.55,
          ease: "power3.out",
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

      // Entrance: cards fly in from a stacked deck into scatter.
      const nodes = scatterRef.current?.querySelectorAll<HTMLElement>(
        "[data-scatter-card]",
      );
      nodes?.forEach((el, i) => {
        gsap.fromTo(
          el,
          { opacity: 0, scale: 0.5, rotate: 0, x: 0, y: 40 },
          {
            opacity: 0.88,
            duration: 0.7,
            delay: 0.05 * i,
            ease: "power3.out",
            scrollTrigger: {
              trigger: section,
              start: "top 80%",
              toggleActions: "play none none reverse",
            },
            onComplete: () => {
              if (last >= 0) fanScatter(last);
              else fanScatter(0);
            },
          },
        );
      });

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

          {/* Scattered deck — other projects behind the hero card */}
          <div
            ref={scatterRef}
            aria-hidden
            className="pointer-events-none absolute inset-0 z-0"
          >
            {projects.map((p, i) => (
              <div
                key={p.slug}
                data-scatter-card
                data-index={i}
                className="absolute inset-[8%] overflow-hidden rounded-[22px] border bg-elev/80 shadow-[0_18px_40px_-24px_rgb(0_0_0/0.55)] backdrop-blur-sm will-change-transform"
                style={{
                  opacity: 0,
                  transformOrigin: "center center",
                }}
              >
                <div className="relative h-36 overflow-hidden border-b sm:h-44">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={p.screenshot}
                    alt=""
                    className="h-full w-full object-cover object-top opacity-90"
                  />
                </div>
                <div className="p-3">
                  <p className="truncate text-sm font-semibold">{p.name}</p>
                  <p className="mt-0.5 truncate font-mono text-2xs text-muted">
                    {p.framework || p.language}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <article
            ref={cardRef}
            className="group relative z-10 overflow-hidden rounded-[28px] border bg-elev/90 shadow-[0_28px_70px_-36px_rgb(var(--c-glow-a)/0.8)] backdrop-blur-md will-change-transform"
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
                  <span>
                    {(project.updated || project.created).slice(0, 4)}
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
