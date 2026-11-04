"use client";

import { useId } from "react";
import { iconBase, type IconProps } from "./types";

/** Glowing 3D-styled honey droplet with inner highlight reflection. */
export default function HoneyDropIcon(props: IconProps) {
  const uid = useId().replace(/:/g, "");
  const body = `honeyBody-${uid}`;
  const sheen = `honeySheen-${uid}`;
  const glow = `honeyGlow-${uid}`;
  const { title, className, ...rest } = props;

  return (
    <svg
      {...iconBase(rest)}
      className={`transition-colors duration-300 ${className ?? ""}`}
    >
      {title ? <title>{title}</title> : null}
      <defs>
        <radialGradient id={body} cx="38%" cy="28%" r="72%">
          <stop offset="0%" stopColor="#FFE08A" />
          <stop offset="45%" stopColor="#F5B942" />
          <stop offset="100%" stopColor="#C67A12" />
        </radialGradient>
        <linearGradient id={sheen} x1="20%" y1="10%" x2="80%" y2="90%">
          <stop offset="0%" stopColor="#fff8e7" stopOpacity="0.85" />
          <stop offset="55%" stopColor="#fff8e7" stopOpacity="0" />
        </linearGradient>
        <filter id={glow} x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="2.2" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <ellipse cx="24" cy="42" rx="9" ry="2.2" fill="currentColor" opacity="0.18" />
      <g filter={`url(#${glow})`}>
        <path
          d="M24 5.5C24 5.5 12.5 18.2 12.5 28.4c0 6.4 5.1 11.6 11.5 11.6s11.5-5.2 11.5-11.6C35.5 18.2 24 5.5 24 5.5Z"
          fill={`url(#${body})`}
        />
        <path
          d="M24 5.5C24 5.5 12.5 18.2 12.5 28.4c0 6.4 5.1 11.6 11.5 11.6s11.5-5.2 11.5-11.6C35.5 18.2 24 5.5 24 5.5Z"
          fill={`url(#${sheen})`}
        />
        <ellipse
          cx="19.2"
          cy="22"
          rx="3.4"
          ry="5.2"
          fill="#fff8e7"
          opacity="0.55"
          transform="rotate(-18 19.2 22)"
        />
        <circle cx="28.5" cy="30.5" r="1.35" fill="#fff8e7" opacity="0.45" />
      </g>
    </svg>
  );
}
