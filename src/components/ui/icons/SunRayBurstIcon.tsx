"use client";

import { useId } from "react";
import { iconBase, type IconProps } from "./types";

/** Multi-layer glowing sun with rotating ray accents. */
export default function SunRayBurstIcon({
  animate = false,
  ...props
}: IconProps & { animate?: boolean }) {
  const uid = useId().replace(/:/g, "");
  const core = `sunCore-${uid}`;
  const bloom = `sunBloom-${uid}`;
  const { title, className, ...rest } = props;

  return (
    <svg
      {...iconBase(rest)}
      className={`transition-colors duration-500 ${className ?? ""}`}
    >
      {title ? <title>{title}</title> : null}
      <defs>
        <radialGradient id={core} cx="50%" cy="45%" r="55%">
          <stop offset="0%" stopColor="#FFF4C2" />
          <stop offset="55%" stopColor="#FFC44D" />
          <stop offset="100%" stopColor="#F08A1A" />
        </radialGradient>
        <filter id={bloom} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="1.8" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <g
        className={animate ? "origin-center motion-safe:animate-spin-slow" : undefined}
        style={{ transformOrigin: "24px 24px" }}
        opacity="0.55"
      >
        {Array.from({ length: 12 }).map((_, i) => {
          const a = (i * 30 * Math.PI) / 180;
          const x1 = 24 + Math.cos(a) * 15;
          const y1 = 24 + Math.sin(a) * 15;
          const x2 = 24 + Math.cos(a) * (i % 2 === 0 ? 22.5 : 20);
          const y2 = 24 + Math.sin(a) * (i % 2 === 0 ? 22.5 : 20);
          return (
            <line
              key={i}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="currentColor"
              strokeWidth={i % 2 === 0 ? 2 : 1.35}
              strokeLinecap="round"
            />
          );
        })}
      </g>
      <circle
        cx="24"
        cy="24"
        r="14"
        fill="currentColor"
        opacity="0.12"
        filter={`url(#${bloom})`}
      />
      <circle cx="24" cy="24" r="9.5" fill={`url(#${core})`} />
      <ellipse cx="20.5" cy="21" rx="3" ry="2.2" fill="#fff8e0" opacity="0.55" />
    </svg>
  );
}
