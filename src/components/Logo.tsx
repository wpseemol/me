'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * `>_wpseemol`
 *
 * The handle is a shell prompt, so the logo is a shell prompt — not a letter in
 * a rounded square. The chevron is drawn as SVG rather than typed as a glyph so
 * its weight and angle stay identical at every size and in every font fallback.
 * The underscore is a real block caret that blinks on a step-end timing
 * function, the way a terminal cursor actually behaves.
 */

const SIZES = {
  sm: { text: 'text-[15px]', chevron: 11, caret: 'h-[2px] w-[8px]', gap: 'gap-[3px]' },
  md: { text: 'text-[19px]', chevron: 13, caret: 'h-[2px] w-[10px]', gap: 'gap-[4px]' },
  lg: { text: 'text-[26px]', chevron: 18, caret: 'h-[3px] w-[14px]', gap: 'gap-[5px]' },
} as const;

const WORD = 'wpseemol';
const GLYPHS = '{}[]<>/\\|$#*+=~^&%';

export function LogoMark({ size = 14, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      viewBox="0 0 14 16"
      width={size}
      height={(size / 14) * 16}
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <path
        d="M2 3.5 L8 8 L2 12.5"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

interface LogoProps {
  /** Visual scale. `sm` is the nav, `lg` is the intro curtain. */
  size?: keyof typeof SIZES;
  /** Renders the full name underneath — used in the header only. */
  withName?: boolean;
  /** Set by the parent when it owns the hover state (e.g. a whole nav link). */
  hovered?: boolean;
  className?: string;
}

export default function Logo({
  size = 'sm',
  withName = false,
  hovered,
  className = '',
}: LogoProps) {
  const s = SIZES[size];
  const [word, setWord] = useState(WORD);
  const [selfHover, setSelfHover] = useState(false);
  const frame = useRef<number>(0);
  const active = hovered ?? selfHover;

  /**
   * Resolve-from-noise on hover: each character settles into place left to
   * right, like text arriving over a slow connection. Runs on a plain rAF loop
   * rather than GSAP so the header never waits on the animation bundle.
   */
  const scramble = useCallback(() => {
    if (typeof window === 'undefined') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    cancelAnimationFrame(frame.current);
    const start = performance.now();
    const DURATION = 460;

    const tick = (now: number) => {
      const t = Math.min((now - start) / DURATION, 1);
      const settled = t * WORD.length;

      setWord(
        WORD.split('')
          .map((ch, i) =>
            i < settled ? ch : GLYPHS[Math.floor(Math.random() * GLYPHS.length)],
          )
          .join(''),
      );

      if (t < 1) frame.current = requestAnimationFrame(tick);
      else setWord(WORD);
    };

    frame.current = requestAnimationFrame(tick);
  }, []);

  useEffect(() => () => cancelAnimationFrame(frame.current), []);

  return (
    <span
      className={`inline-flex flex-col leading-none ${className}`}
      onPointerEnter={() => {
        setSelfHover(true);
        scramble();
      }}
      onPointerLeave={() => setSelfHover(false)}
    >
      <span className={`inline-flex items-baseline font-mono font-bold ${s.gap} ${s.text}`}>
        <span className="inline-flex items-center self-center text-brand-ink">
          <LogoMark size={s.chevron} />
        </span>

        <span
          aria-hidden="true"
          className={`inline-block self-end rounded-full bg-brand-ink ${s.caret} ${
            active ? '' : 'animate-caret'
          }`}
          style={{ marginBottom: '0.12em' }}
        />

        {/* The scramble would be read out as noise, so the real word is
            exposed separately and the animated one is hidden. */}
        <span className="sr-only">wpseemol</span>
        <span aria-hidden="true" className="tracking-[-0.02em] tabular-nums">
          {word}
        </span>
      </span>

      {withName ? (
        <span className="mt-1 font-mono text-[9px] uppercase tracking-[0.16em] text-muted">
          Seemol Chakroborti
        </span>
      ) : null}
    </span>
  );
}
