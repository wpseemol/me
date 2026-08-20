'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import site from '@/data/site.json';
import { RevealWords } from './Reveal';
import { StatCounter } from './Section';
import { ArrowIcon, ArrowUpRightIcon } from './Icons';

type Token = { t: string; v: string };

const TOKEN_CLASS: Record<string, string> = {
  kw: 'text-[#C792EA]',
  var: 'text-[#82AAFF]',
  prop: 'text-[#7FDBCA]',
  str: 'text-[#ECC48D]',
  fn: 'text-[#82AAFF]',
  plain: 'text-slate-400',
};

/** Types the snippet out character by character, line by line. */
function CodeCard() {
  const lines = site.codeSnippet.lines as Token[][];
  const total = lines.reduce(
    (sum, l) => sum + l.reduce((s, t) => s + t.v.length, 0) + 1,
    0,
  );
  const [typed, setTyped] = useState(0);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setTyped(total);
      return;
    }
    const obj = { n: 0 };
    const tween = gsap.to(obj, {
      n: total,
      duration: 3.4,
      delay: 0.9,
      ease: 'none',
      onUpdate: () => setTyped(Math.floor(obj.n)),
    });
    return () => {
      tween.kill();
    };
  }, [total]);

  // Subtle 3D tilt toward the pointer.
  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (window.matchMedia('(hover: none)').matches) return;

    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      gsap.to(el, {
        rotateY: px * 9,
        rotateX: -py * 9,
        duration: 0.6,
        ease: 'power3.out',
        transformPerspective: 900,
      });
    };
    const onLeave = () =>
      gsap.to(el, { rotateX: 0, rotateY: 0, duration: 0.9, ease: 'power3.out' });

    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerleave', onLeave);
    return () => {
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerleave', onLeave);
    };
  }, []);

  let consumed = 0;
  const done = typed >= total;

  return (
    <div
      ref={cardRef}
      className="card overflow-hidden !bg-[#0d1020]/92 shadow-[0_30px_80px_-40px_rgba(108,76,245,0.85)]"
      style={{ transformStyle: 'preserve-3d' }}
    >
      <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
        <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
        <span className="ml-2 font-mono text-2xs text-slate-500">seemol.config.ts</span>
      </div>

      <pre className="overflow-x-auto px-4 py-5 font-mono text-[12px] leading-[1.75] sm:text-[13px]">
        <code>
          <span className="text-slate-600">{site.codeSnippet.comment}</span>
          {'\n'}
          {lines.map((line, li) => {
            const rendered = line.map((tok, ti) => {
              const start = consumed;
              consumed += tok.v.length;
              const take = Math.max(0, Math.min(tok.v.length, typed - start));
              if (take <= 0) return null;
              return (
                <span key={ti} className={TOKEN_CLASS[tok.t] ?? TOKEN_CLASS.plain}>
                  {tok.v.slice(0, take)}
                </span>
              );
            });
            consumed += 1; // newline
            return (
              <span key={li}>
                {rendered}
                {'\n'}
              </span>
            );
          })}
          <span
            className={`inline-block h-[1.05em] w-[0.55em] translate-y-[0.18em] bg-[#8E76F8] ${
              done ? 'animate-caret' : ''
            }`}
          />
        </code>
      </pre>
    </div>
  );
}

export default function Hero() {
  const p = site.profile;

  return (
    <section className="relative pt-32 sm:pt-40" aria-labelledby="hero-heading">
      <div className="shell">
        <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
          {/* ---------------------------------------------- copy column */}
          <div>
            <span className="inline-flex items-center gap-2.5 rounded-full border bg-elev/60 px-3.5 py-1.5 font-mono text-2xs uppercase tracking-[0.14em] text-muted backdrop-blur">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-pulseDot rounded-full bg-mint" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-mint" />
              </span>
              {p.availability}
            </span>

            <h1
              id="hero-heading"
              className="mt-6 text-[clamp(2.6rem,7.4vw,4.6rem)] leading-[0.98]"
            >
              <RevealWords text="Full-stack" as="span" className="block" delay={0.15} />
              <RevealWords
                text="web developer"
                as="span"
                className="block grad-text"
                delay={0.3}
              />
            </h1>

            <p className="mt-4 font-mono text-sm text-muted sm:text-[15px]">
              Laravel <span className="opacity-40">·</span> MERN{' '}
              <span className="opacity-40">·</span> Next.js{' '}
              <span className="opacity-40">·</span> Shopify
            </p>

            <p className="mt-6 max-w-xl text-[15px] leading-relaxed text-muted sm:text-[17px]">
              I&apos;m <strong className="font-semibold text-body">Seemol Chakroborti</strong> —
              I architect enterprise backends with Laravel, high-performance frontends with
              Next.js, and full-stack MERN applications that scale.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/contact" className="btn btn-primary">
                Hire me <ArrowIcon width={17} height={17} />
              </Link>
              <Link href="/projects" className="btn btn-ghost">
                View work <ArrowUpRightIcon width={16} height={16} />
              </Link>
            </div>

            <div className="mt-12 grid max-w-md grid-cols-3 gap-6 border-t pt-8">
              {site.stats.map((s) => (
                <StatCounter key={s.label} value={s.value} suffix={s.suffix} label={s.label} />
              ))}
            </div>
          </div>

          {/* ---------------------------------------------- visual column */}
          <div className="relative">
            <div className="relative mx-auto max-w-md">
              {/* Portrait, offset behind the code card */}
              <div className="relative ml-auto w-[62%] animate-floaty">
                <div
                  className="absolute -inset-3 rounded-[28px] opacity-70 blur-2xl"
                  style={{ background: 'linear-gradient(140deg,#6C4CF5,#E5468B)' }}
                />
                <div className="relative overflow-hidden rounded-[22px] border">
                  <Image
                    src={p.portraitMono}
                    alt={p.portraitMonoAlt}
                    width={520}
                    height={520}
                    priority
                    sizes="(max-width: 1024px) 45vw, 300px"
                    className="h-auto w-full object-cover"
                  />
                  <div
                    className="pointer-events-none absolute inset-0 mix-blend-soft-light"
                    style={{ background: 'linear-gradient(150deg,#6C4CF5,transparent 55%,#E5468B)' }}
                  />
                </div>
              </div>

              {/* Code card overlaps the portrait's lower-left */}
              <div className="relative -mt-16 w-[86%] sm:-mt-20">
                <CodeCard />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
