'use client';

import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import Logo from './Logo';
import { finishIntro, markIntroSeen, shouldPlayIntro } from '@/lib/intro';

const BOOT = [
  'resolving stack…',
  'laravel · mern · next.js',
  'ready',
];

/**
 * The page boots rather than loads.
 *
 * A single GSAP timeline: logo in, a counter that runs 000 → 100 against real
 * boot lines, then three panels shear away upward on a stagger. It plays once
 * per tab. Everything else on the page waits on `introDone`, so nothing
 * animates behind the curtain.
 */
export default function Intro() {
  const rootRef = useRef<HTMLDivElement>(null);
  const counterRef = useRef<HTMLSpanElement>(null);
  const [play, setPlay] = useState<boolean | null>(null);

  useEffect(() => {
    const willPlay = shouldPlayIntro();
    setPlay(willPlay);
    if (!willPlay) finishIntro();
  }, []);

  useEffect(() => {
    if (!play) return;
    const root = rootRef.current;
    if (!root) return;

    document.body.style.overflow = 'hidden';
    const counter = { n: 0 };

    const tl = gsap.timeline({
      defaults: { ease: 'power3.out' },
      onComplete: () => {
        document.body.style.overflow = '';
        markIntroSeen();
        finishIntro();
        setPlay(false);
      },
    });

    tl.from('[data-intro-logo]', { autoAlpha: 0, y: 18, duration: 0.6 })
      .from('[data-intro-line]', { autoAlpha: 0, y: 8, stagger: 0.14, duration: 0.4 }, '-=0.25')
      .to(
        counter,
        {
          n: 100,
          duration: 1.15,
          ease: 'power2.inOut',
          onUpdate: () => {
            if (counterRef.current) {
              counterRef.current.textContent = String(Math.round(counter.n)).padStart(3, '0');
            }
          },
        },
        '-=0.55',
      )
      .to('[data-intro-bar]', { scaleX: 1, duration: 1.15, ease: 'power2.inOut' }, '<')
      .to('[data-intro-content]', { autoAlpha: 0, y: -14, duration: 0.35 }, '+=0.12')
      // Three panels rather than one: the reveal reads as a shutter opening,
      // and the stagger gives the page underneath a direction to arrive from.
      .to(
        '[data-intro-panel]',
        {
          yPercent: -100,
          duration: 0.85,
          ease: 'expo.inOut',
          stagger: 0.07,
        },
        '-=0.1',
      );

    return () => {
      tl.kill();
      document.body.style.overflow = '';
    };
  }, [play]);

  if (play !== true) return null;

  return (
    <div
      ref={rootRef}
      aria-hidden="true"
      className="fixed inset-0 z-[100] flex items-center justify-center"
    >
      <div className="absolute inset-0 flex">
        {[0, 1, 2].map((i) => (
          <div key={i} data-intro-panel className="h-full flex-1 bg-ink" />
        ))}
      </div>

      <div data-intro-content className="relative flex flex-col items-center gap-6 px-6">
        <div data-intro-logo>
          <Logo size="lg" />
        </div>

        <div className="h-px w-56 overflow-hidden bg-line sm:w-72">
          <div
            data-intro-bar
            className="h-full w-full origin-left scale-x-0"
            style={{ background: 'var(--grad)' }}
          />
        </div>

        <div className="flex w-56 items-baseline justify-between font-mono text-2xs text-muted sm:w-72">
          <span className="flex flex-col gap-1">
            {BOOT.map((line) => (
              <span key={line} data-intro-line>
                {line}
              </span>
            ))}
          </span>
          <span ref={counterRef} className="text-brand-ink tabular-nums">
            000
          </span>
        </div>
      </div>
    </div>
  );
}
