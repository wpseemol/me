"use client";

import { useId } from "react";
import { iconBase, type IconProps } from "./types";

/** Smooth crescent moon with ambient aura and trailing stardust dots. */
export default function CrescentGlowIcon(props: IconProps) {
  const uid = useId().replace(/:/g, "");
  const aura = `moonAura-${uid}`;
  const face = `moonFace-${uid}`;
  const { title, className, ...rest } = props;

  return (
    <svg
      {...iconBase(rest)}
      className={`transition-colors duration-500 ${className ?? ""}`}
    >
      {title ? <title>{title}</title> : null}
      <defs>
        <radialGradient id={aura} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.35" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={face} x1="30%" y1="15%" x2="80%" y2="90%">
          <stop offset="0%" stopColor="#F4F0FF" />
          <stop offset="100%" stopColor="#B8C0E8" />
        </linearGradient>
      </defs>
      <circle cx="24" cy="24" r="18" fill={`url(#${aura})`} />
      <path
        d="M28.2 8.4a14 14 0 1 0 11.4 20.2A12.2 12.2 0 0 1 28.2 8.4Z"
        fill={`url(#${face})`}
      />
      <circle cx="24" cy="18" r="1.6" fill="#9aa3c7" opacity="0.35" />
      <circle cx="21" cy="26" r="1.1" fill="#9aa3c7" opacity="0.28" />
      <circle cx="36" cy="12" r="1.15" fill="currentColor" opacity="0.7" />
      <circle cx="40" cy="19" r="0.8" fill="currentColor" opacity="0.45" />
      <circle cx="38.5" cy="27" r="0.65" fill="currentColor" opacity="0.35" />
      <circle cx="33" cy="8.5" r="0.55" fill="currentColor" opacity="0.4" />
    </svg>
  );
}
