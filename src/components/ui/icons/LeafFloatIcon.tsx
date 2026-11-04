import { iconBase, type IconProps } from "./types";

/** Sundarban mangrove leaf silhouette with tilt geometry. */
export default function LeafFloatIcon(props: IconProps) {
  const { title, ...rest } = props;
  return (
    <svg {...iconBase(rest)} className={`transition-colors duration-300 ${rest.className ?? ""}`}>
      {title ? <title>{title}</title> : null}
      <g transform="rotate(-18 24 24)">
        <path
          d="M24 6c8.5 4.5 14 13.2 13.2 22.4C36.4 38.2 30.2 43 24 43S11.6 38.2 10.8 28.4C10 19.2 15.5 10.5 24 6Z"
          fill="currentColor"
          opacity="0.88"
        />
        <path
          d="M24 10.5c0 9.5-.2 18.2-.4 28.2"
          stroke="#06140a"
          strokeOpacity="0.35"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
        <path
          d="M24 18c3.2 2.4 5.8 5.4 7.4 9M24 24c-2.8 2-5.2 4.6-6.8 7.6"
          stroke="#06140a"
          strokeOpacity="0.28"
          strokeWidth="1.15"
          strokeLinecap="round"
        />
        <ellipse
          cx="19"
          cy="16"
          rx="3.2"
          ry="5"
          fill="#d8ffe8"
          opacity="0.22"
          transform="rotate(-24 19 16)"
        />
      </g>
    </svg>
  );
}
