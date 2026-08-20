'use client';

import { useEffect, useRef, type ElementType, type ReactNode } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

type Direction = 'up' | 'down' | 'left' | 'right' | 'none';

const OFFSETS: Record<Direction, { x?: number; y?: number }> = {
  up: { y: 34 },
  down: { y: -34 },
  left: { x: 40 },
  right: { x: -40 },
  none: {},
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
  duration = 0.85,
  direction = 'up',
  stagger,
  id,
}: RevealProps) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      gsap.set(el, { autoAlpha: 1 });
      if (stagger) gsap.set(el.children, { autoAlpha: 1, x: 0, y: 0 });
      return;
    }

    const offset = OFFSETS[direction];
    const targets = stagger ? Array.from(el.children) : el;

    const ctx = gsap.context(() => {
      if (stagger) gsap.set(el, { autoAlpha: 1 });

      gsap.fromTo(
        targets,
        { autoAlpha: 0, ...offset, filter: 'blur(6px)' },
        {
          autoAlpha: 1,
          x: 0,
          y: 0,
          filter: 'blur(0px)',
          duration,
          delay,
          ease: 'power3.out',
          stagger: stagger ?? 0,
          scrollTrigger: {
            trigger: el,
            start: 'top 88%',
            once: true,
          },
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

/**
 * Splits a heading into words and floats them up in sequence. Used sparingly —
 * once per page, on the primary heading only.
 */
export function RevealWords({
  text,
  className = '',
  as: Tag = 'span',
  delay = 0,
}: {
  text: string;
  className?: string;
  as?: ElementType;
  delay?: number;
}) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const words = el.querySelectorAll<HTMLElement>('[data-word]');

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      gsap.set(words, { yPercent: 0, autoAlpha: 1 });
      return;
    }

    const ctx = gsap.context(() => {
      gsap.fromTo(
        words,
        { yPercent: 116, autoAlpha: 0 },
        {
          yPercent: 0,
          autoAlpha: 1,
          duration: 1,
          delay,
          ease: 'power4.out',
          stagger: 0.075,
        },
      );
    }, el);

    return () => ctx.revert();
  }, [delay, text]);

  return (
    <Tag ref={ref as never} className={className}>
      {text.split(' ').map((word, i) => (
        <span key={`${word}-${i}`} className="inline-block overflow-hidden pb-[0.12em] align-bottom">
          <span data-word className="inline-block">
            {word}
            {i < text.split(' ').length - 1 ? '\u00A0' : ''}
          </span>
        </span>
      ))}
    </Tag>
  );
}
