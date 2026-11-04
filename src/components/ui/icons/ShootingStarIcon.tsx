"use client";

import { useId } from "react";
import { iconBase, type IconProps } from "./types";

/** Angled streak star icon for dark-mode ambient trails. */
export default function ShootingStarIcon(props: IconProps) {
  const uid = useId().replace(/:/g, "");
  const trail = `starTrail-${uid}`;
  const { title, className, ...rest } = props;

  return (
    <svg
      {...iconBase(rest)}
      className={`transition-colors duration-300 ${className ?? ""}`}
    >
      {title ? <title>{title}</title> : null}
      <defs>
        <linearGradient id={trail} x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0" />
          <stop offset="70%" stopColor="currentColor" stopOpacity="0.55" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0.95" />
        </linearGradient>
      </defs>
      <path
        d="M8 38C18 28 28 18 36.5 11.5"
        stroke={`url(#${trail})`}
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <path
        d="M10 36.5C18.5 28 27 19.5 34.5 13.5"
        stroke="currentColor"
        strokeWidth="0.9"
        strokeLinecap="round"
        opacity="0.35"
      />
      <path
        d="M37.2 7.8l1.55 3.35 3.55.4-2.7 2.55.8 3.45-3.2-1.85-3.2 1.85.8-3.45-2.7-2.55 3.55-.4z"
        fill="currentColor"
      />
      <circle cx="22" cy="24" r="0.7" fill="currentColor" opacity="0.45" />
      <circle cx="16" cy="29.5" r="0.55" fill="currentColor" opacity="0.3" />
    </svg>
  );
}
