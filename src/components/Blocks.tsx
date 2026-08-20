'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import site from '@/data/site.json';
import { ArrowUpRightIcon, CheckIcon } from './Icons';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

/* ------------------------------------------------------------- marquee */

export function TechMarquee() {
  const names = site.stack.map((s) => s.name);
  const row = [...names, ...names];

  return (
    <div className="mask-fade-x relative overflow-hidden border-y py-5" aria-hidden="true">
      <div className="flex w-max animate-marquee gap-10 pr-10 will-change-transform">
        {row.map((n, i) => (
          <span
            key={`${n}-${i}`}
            className="flex shrink-0 items-center gap-10 font-display text-lg font-semibold text-muted"
          >
            {n}
            <span className="h-1.5 w-1.5 rounded-full bg-violet/50" />
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
    const bars = el.querySelectorAll<HTMLElement>('[data-fill]');
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const ctx = gsap.context(() => {
      bars.forEach((bar) => {
        const level = Number(bar.dataset.fill ?? 0);
        if (reduced) {
          gsap.set(bar, { width: `${level}%` });
          return;
        }
        gsap.fromTo(
          bar,
          { width: '0%' },
          {
            width: `${level}%`,
            duration: 1.25,
            ease: 'power3.out',
            scrollTrigger: { trigger: bar, start: 'top 92%', once: true },
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
            <span className="font-mono text-2xs text-muted">{s.group}</span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface">
            <div
              data-fill={s.level}
              className="h-full rounded-full"
              style={{ width: 0, background: 'linear-gradient(90deg,#6C4CF5,#E5468B)' }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

/* -------------------------------------------------------- service card */

type Service = (typeof site.services)[number];

export function ServiceCard({ service, index }: { service: Service; index: number }) {
  return (
    <article id={service.slug} className="card scroll-mt-28 p-6 sm:p-7">
      <div className="flex items-start justify-between gap-4">
        <span className="font-mono text-2xs uppercase tracking-[0.18em] text-muted">
          {String(index + 1).padStart(2, '0')}
        </span>
        <span
          className="h-9 w-9 shrink-0 rounded-[11px] opacity-90"
          style={{
            background: `linear-gradient(${135 + index * 25}deg,#6C4CF5,#E5468B)`,
          }}
        />
      </div>

      <h3 className="mt-5 text-xl sm:text-[1.35rem]">{service.title}</h3>
      <p className="mt-3 text-sm leading-relaxed text-muted">{service.summary}</p>

      <ul className="mt-5 space-y-2">
        {service.deliverables.slice(0, 4).map((d) => (
          <li key={d} className="flex items-start gap-2.5 text-sm text-muted">
            <CheckIcon width={15} height={15} className="mt-0.5 shrink-0 text-violet-soft" />
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
  PHP: '#8892BF',
  TypeScript: '#3178C6',
  JavaScript: '#F7DF1E',
  Liquid: '#7AB55C',
};

export function ProjectCard({ project }: { project: Project }) {
  return (
    <article className="card group flex flex-col p-6 sm:p-7">
      <div className="flex items-center justify-between gap-3">
        <span className="inline-flex items-center gap-2 font-mono text-2xs text-muted">
          <span
            className="h-2.5 w-2.5 rounded-full"
            style={{ background: LANG_COLOR[project.language] ?? '#8E76F8' }}
          />
          {project.language}
        </span>
        <span className="font-mono text-2xs text-muted">{project.year}</span>
      </div>

      <h3 className="mt-4 text-lg sm:text-xl">{project.name}</h3>
      <p className="mt-3 text-sm leading-relaxed text-muted">{project.detail}</p>

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
        className="mt-6 inline-flex items-center gap-1.5 border-t pt-5 text-sm font-semibold text-violet-soft transition-colors hover:text-magenta"
      >
        View source on GitHub
        <ArrowUpRightIcon
          width={15}
          height={15}
          className="transition-transform duration-300 ease-out group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
        />
      </a>
    </article>
  );
}

/* ------------------------------------------------------------- process */

export function ProcessList() {
  return (
    <ol className="relative border-l pl-7">
      {site.process.map((step, i) => (
        <li key={step.step} className="relative pb-9 last:pb-0">
          <span
            className="absolute -left-[35px] grid h-6 w-6 place-items-center rounded-full font-mono text-[10px] font-bold text-white"
            style={{ background: `linear-gradient(140deg,#6C4CF5,#E5468B)` }}
          >
            {i + 1}
          </span>
          <span className="font-mono text-2xs uppercase tracking-[0.18em] text-muted">
            {step.step}
          </span>
          <h3 className="mt-1.5 text-lg">{step.title}</h3>
          <p className="mt-2 max-w-prose text-sm leading-relaxed text-muted">{step.body}</p>
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
                <span className="font-display text-base font-bold sm:text-lg">{item.q}</span>
                <span
                  aria-hidden
                  className="grid h-7 w-7 shrink-0 place-items-center rounded-full border text-muted transition-transform duration-400 ease-out"
                  style={{ transform: isOpen ? 'rotate(45deg)' : 'none' }}
                >
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                </span>
              </button>
            </h3>
            <div
              id={`faq-panel-${i}`}
              className="grid transition-all duration-400 ease-out"
              style={{ gridTemplateRows: isOpen ? '1fr' : '0fr' }}
            >
              <div className="overflow-hidden">
                <p className="max-w-prose pb-6 text-sm leading-relaxed text-muted">{item.a}</p>
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
          className="absolute inset-0 opacity-[0.14]"
          style={{ background: 'linear-gradient(120deg,#6C4CF5,#E5468B)' }}
        />
        <div className="relative">
          <h2 className="text-[clamp(1.7rem,4vw,2.6rem)]">
            Have something you need built?
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-[15px] leading-relaxed text-muted">
            Tell me what the product has to do and where it&apos;s stuck. You&apos;ll get a
            written scope back — deliverables, timeline and price — before anyone writes code.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/contact" className="btn btn-primary">
              Start a project
            </Link>
            <a href={`mailto:${site.profile.email}`} className="btn btn-ghost">
              {site.profile.email}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
