"use client";

import type { CSSProperties, ReactNode } from "react";

type Props = {
  children: ReactNode;
  className?: string;
  /** Animation delay in seconds */
  delay?: number;
  /** Peak travel in px (default 6 → y: [-6, 6, -6]) */
  amplitude?: number;
  /** Loop duration in seconds (default 4) */
  duration?: number;
  style?: CSSProperties;
};

/**
 * Gentle floating wrapper: y oscillates [-amp, amp, -amp] with ease-in-out.
 * Disabled automatically under prefers-reduced-motion via CSS.
 */
export default function FloatingBadge({
  children,
  className = "",
  delay = 0,
  amplitude = 6,
  duration = 4,
  style,
}: Props) {
  return (
    <div
      className={`will-change-transform motion-safe:animate-float-badge ${className}`}
      style={
        {
          ...style,
          "--float-amp": `${amplitude}px`,
          "--float-dur": `${duration}s`,
          animationDelay: `${delay}s`,
        } as CSSProperties
      }
    >
      {children}
    </div>
  );
}
