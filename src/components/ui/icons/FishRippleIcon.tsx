import { iconBase, type IconProps } from "./types";

/** Minimalist wave ripple curves and splash particles for coastal accents. */
export default function FishRippleIcon(props: IconProps) {
  const { title, ...rest } = props;
  return (
    <svg {...iconBase(rest)} className={`transition-colors duration-300 ${rest.className ?? ""}`}>
      {title ? <title>{title}</title> : null}
      <path
        d="M6 20c4.5-4 9-4 13.5 0S29 24 33.5 20 42 16 42 16"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        opacity="0.85"
      />
      <path
        d="M8 28c4-3.2 8-3.2 12 0s8 3.2 12 0 8-3.2 12 0"
        stroke="currentColor"
        strokeWidth="1.35"
        strokeLinecap="round"
        opacity="0.45"
      />
      <path
        d="M10 35c3.2-2.4 6.4-2.4 9.6 0s6.4 2.4 9.6 0"
        stroke="currentColor"
        strokeWidth="1.15"
        strokeLinecap="round"
        opacity="0.28"
      />
      <circle cx="18" cy="12" r="1.4" fill="currentColor" opacity="0.55" />
      <circle cx="26" cy="9" r="1" fill="currentColor" opacity="0.4" />
      <circle cx="31" cy="13.5" r="0.85" fill="currentColor" opacity="0.35" />
      <circle cx="22.5" cy="7" r="0.7" fill="currentColor" opacity="0.3" />
      <path
        d="M20 11.5c1.2-2.8 3.8-4.2 6.4-3.2"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinecap="round"
        opacity="0.4"
      />
    </svg>
  );
}
