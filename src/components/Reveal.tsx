'use client';

import { useEffect, useRef, type ElementType, type ReactNode } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { introDone } from '@/lib/intro';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger, SplitText);
}

type Direction = 'up' | 'down' | 'left' | 'right' | 'none';

const OFFSETS: Record<Direction, { x?: number; y?: number }> = {
  up: { y: 38 },
  down: { y: -38 },
  left: { x: 44 },
  right: { x: -44 },
  none: {},
};

const prefersReduced = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * A left/right reveal parks its target 44px off-axis until it scrolls into
 * view. On a phone that is 44px of horizontal overflow sitting below the fold
 * for the whole session — invisible behind `overflow-x`, but it still widens
 * the scroll area and makes iOS rubber-band sideways. Narrow screens get the
 * vertical version instead, which reads the same in a single column anyway.
 */
const resolveOffset = (direction: Direction) => {
  if (direction !== 'left' && direction !== 'right') return OFFSETS[direction];
  const narrow = window.matchMedia('(max-width: 639px)').matches;
  return narrow ? OFFSETS.up : OFFSETS[direction];
};

interface RevealProps {
  children: ReactNode;
  as?: ElementType;
  className?: string;
  delay?: number;
  duration?: number;
  direction?: Direction;
  /** Stagger direct children instead of animating the wrapper as one block. */
  stagger?: number;
  id?: string;
}

export default function Reveal({
  children,
  as: Tag = 'div',
  className = '',
  delay = 0,
  duration = 0.9,
  direction = 'up',
  stagger,
  id,
}: RevealProps) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (prefersReduced()) {
      gsap.set(el, { autoAlpha: 1 });
      if (stagger) gsap.set(el.children, { autoAlpha: 1, x: 0, y: 0 });
      return;
    }

    const offset = resolveOffset(direction);
    const targets = stagger ? Array.from(el.children) : el;

    const ctx = gsap.context(() => {
      if (stagger) gsap.set(el, { autoAlpha: 1 });

      gsap.fromTo(
        targets,
        { autoAlpha: 0, ...offset, filter: 'blur(7px)' },
        {
          autoAlpha: 1,
          x: 0,
          y: 0,
          filter: 'blur(0px)',
          duration,
          delay,
          ease: 'expo.out',
          stagger: stagger ?? 0,
          scrollTrigger: { trigger: el, start: 'top 88%', once: true },
        },
      );
    }, el);

    return () => ctx.revert();
  }, [delay, duration, direction, stagger]);

  return (
    <Tag ref={ref as never} id={id} className={className} data-reveal>
      {children}
    </Tag>
  );
}

/* ------------------------------------------------------------------------ */

interface SplitRevealProps {
  children: ReactNode;
  as?: ElementType;
  className?: string;
  delay?: number;
  /** `lines` for headings, `words` for short display type. */
  type?: 'lines' | 'words';
  /** Play on mount (hero) instead of waiting to be scrolled into view. */
  onLoad?: boolean;
}

/**
 * Masked type reveal: each line is clipped by its own box and slides up out of
 * it with a touch of rotation, so the text arrives rather than fades.
 *
 * `autoSplit` re-splits when the web font finishes loading or the box is
 * resized — without it, lines measured against the fallback font end up broken
 * in the wrong places, which is the classic SplitText bug.
 */
export function SplitReveal({
  children,
  as: Tag = 'div',
  className = '',
  delay = 0,
  type = 'lines',
  onLoad = false,
}: SplitRevealProps) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (prefersReduced()) {
      gsap.set(el, { autoAlpha: 1 });
      return;
    }

    let ctx: gsap.Context | undefined;
    let cancelled = false;

    const run = () => {
      if (cancelled || !ref.current) return;

      ctx = gsap.context(() => {
        gsap.set(el, { autoAlpha: 1 });

        SplitText.create(el, {
          type,
          mask: type,
          autoSplit: true,
          linesClass: 'overflow-hidden',
          onSplit: (self) => {
            const parts = type === 'lines' ? self.lines : self.words;
            return gsap.from(parts, {
              yPercent: 112,
              rotate: type === 'lines' ? 2.5 : 0,
              duration: 1,
              delay,
              ease: 'expo.out',
              stagger: 0.08,
              ...(onLoad
                ? {}
                : { scrollTrigger: { trigger: el, start: 'top 88%', once: true } }),
            });
          },
        });
      }, el);
    };

    // Split against the real font, and never behind the intro curtain.
    const ready = Promise.all([
      document.fonts?.ready ?? Promise.resolve(),
      onLoad ? introDone : Promise.resolve(),
    ]);
    ready.then(run);

    return () => {
      cancelled = true;
      ctx?.revert();
    };
  }, [delay, type, onLoad]);

  return (
    <Tag ref={ref as never} className={className} data-reveal>
      {children}
    </Tag>
  );
}

/* ------------------------------------------------------------------------ */

/**
 * Slides one intact block up out of a clipping mask.
 *
 * Use this instead of SplitReveal for gradient type. `background-clip: text`
 * paints the gradient at the element that owns the background — split the text
 * into transformed child spans and the glyphs move away from the paint, so the
 * heading disappears. Keeping the element whole keeps one continuous gradient
 * across the whole line, which is what you want anyway.
 */
export function MaskReveal({
  children,
  as: Tag = 'span',
  className = '',
  delay = 0,
  onLoad = false,
}: {
  children: ReactNode;
  as?: ElementType;
  className?: string;
  delay?: number;
  onLoad?: boolean;
}) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (prefersReduced()) {
      gsap.set(el, { autoAlpha: 1, yPercent: 0 });
      return;
    }

    let ctx: gsap.Context | undefined;
    let cancelled = false;

    const run = () => {
      if (cancelled || !ref.current) return;
      ctx = gsap.context(() => {
        gsap.fromTo(
          el,
          { yPercent: 112, autoAlpha: 0 },
          {
            yPercent: 0,
            autoAlpha: 1,
            duration: 1.05,
            delay,
            ease: 'expo.out',
            ...(onLoad
              ? {}
              : { scrollTrigger: { trigger: el, start: 'top 90%', once: true } }),
          },
        );
      }, el);
    };

    (onLoad ? introDone : Promise.resolve()).then(run);

    return () => {
      cancelled = true;
      ctx?.revert();
    };
  }, [delay, onLoad]);

  return (
    <span className="line-mask">
      <Tag ref={ref as never} className={className} data-reveal>
        {children}
      </Tag>
    </span>
  );
}

/* ------------------------------------------------------------------------ */

/**
 * Fades a block in on mount once the intro is out of the way. For hero
 * furniture that shouldn't be line-split (badges, buttons, stat rows).
 */
export function LoadIn({
  children,
  as: Tag = 'div',
  className = '',
  delay = 0,
  stagger,
}: {
  children: ReactNode;
  as?: ElementType;
  className?: string;
  delay?: number;
  stagger?: number;
}) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (prefersReduced()) {
      gsap.set(el, { autoAlpha: 1 });
      if (stagger) gsap.set(el.children, { autoAlpha: 1, y: 0 });
      return;
    }

    let ctx: gsap.Context | undefined;
    let cancelled = false;

    introDone.then(() => {
      if (cancelled || !ref.current) return;
      ctx = gsap.context(() => {
        if (stagger) gsap.set(el, { autoAlpha: 1 });
        gsap.fromTo(
          stagger ? Array.from(el.children) : el,
          { autoAlpha: 0, y: 20 },
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.9,
            delay,
            ease: 'expo.out',
            stagger: stagger ?? 0,
          },
        );
      }, el);
    });

    return () => {
      cancelled = true;
      ctx?.revert();
    };
  }, [delay, stagger]);

  return (
    <Tag ref={ref as never} className={className} data-reveal>
      {children}
    </Tag>
  );
}
