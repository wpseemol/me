"use client";

import { useId } from "react";
import { iconBase, type IconProps } from "./types";

/** "100% Wild Harvested" shield with subtle sparkle. */
export default function OrganicShieldBadge(props: IconProps) {
  const uid = useId().replace(/:/g, "");
  const fill = `shieldFill-${uid}`;
  const { title = "100% Wild Harvested", className, ...rest } = props;

  return (
    <svg
      {...iconBase(rest, { viewBox: "0 0 64 64", width: 56, height: 56 })}
      className={`transition-colors duration-300 ${className ?? ""}`}
    >
      <title>{title}</title>
      <defs>
        <linearGradient id={fill} x1="50%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%" stopColor="#2f9e6b" />
          <stop offset="100%" stopColor="#176b45" />
        </linearGradient>
      </defs>
      <path
        d="M32 6c8.5 4.2 16 5.2 22 5.8v18.4c0 12.8-8.4 23.6-22 27.8C18.4 53.8 10 43 10 30.2V11.8C16 11.2 23.5 10.2 32 6Z"
        fill={`url(#${fill})`}
      />
      <path
        d="M32 10.2c7.2 3.4 13.6 4.3 18.6 4.8v15c0 10.4-6.8 19.2-18.6 22.8C20.2 49.2 13.4 40.4 13.4 30V15c5-.5 11.4-1.4 18.6-4.8Z"
        fill="none"
        stroke="#d8ffe8"
        strokeOpacity="0.35"
        strokeWidth="1.2"
      />
      <path
        d="M22.5 31.5 28.8 37.5 42 23.5"
        stroke="#f3fff7"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="46" cy="14" r="1.4" fill="#fff7c2" opacity="0.9" />
      <circle cx="50" cy="20" r="0.9" fill="#fff7c2" opacity="0.65" />
      <circle cx="18" cy="16" r="0.8" fill="#fff7c2" opacity="0.5" />
      <text
        x="32"
        y="52"
        textAnchor="middle"
        fill="currentColor"
        fontSize="5.2"
        fontFamily="ui-monospace, monospace"
        letterSpacing="0.08em"
        opacity="0.85"
      >
        WILD
      </text>
    </svg>
  );
}
