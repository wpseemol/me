import { iconBase, type IconProps } from "./types";

/** Subtle geometric hexagon honeycomb badge. */
export default function BeeHoneycombIcon(props: IconProps) {
  const { title, ...rest } = props;
  const hex =
    "M12 2.5 19.5 7v9L12 20.5 4.5 16V7L12 2.5Z";

  return (
    <svg {...iconBase(rest)} className={`transition-colors duration-300 ${rest.className ?? ""}`}>
      {title ? <title>{title}</title> : null}
      <g transform="translate(12 10) scale(0.72)" fill="currentColor">
        <path d={hex} opacity="0.22" transform="translate(-10 -8)" />
        <path d={hex} opacity="0.38" transform="translate(6 -8)" />
        <path d={hex} opacity="0.28" transform="translate(-10 8)" />
        <path d={hex} opacity="0.42" transform="translate(6 8)" />
        <path d={hex} opacity="0.72" transform="translate(-2 0)" />
      </g>
      <path
        d="M24 14.2 29.2 17.2v6L24 26.2l-5.2-3v-6L24 14.2Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
        opacity="0.9"
      />
    </svg>
  );
}
