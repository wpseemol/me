import { iconBase, type IconProps } from "./types";

/** High-speed fresh delivery icon with motion lines. */
export default function FastExpressTruckIcon(props: IconProps) {
  const { title, ...rest } = props;
  return (
    <svg {...iconBase(rest)} className={`transition-colors duration-300 ${rest.className ?? ""}`}>
      {title ? <title>{title}</title> : null}
      <g stroke="currentColor" strokeLinecap="round" fill="none">
        <path d="M4 18h8M5.5 22.5h7M7 27h5.5" strokeWidth="1.35" opacity="0.45" />
        <rect
          x="14"
          y="15"
          width="18"
          height="14"
          rx="2.2"
          strokeWidth="1.7"
        />
        <path
          d="M32 20h5.2l4.3 5.2V29H32"
          strokeWidth="1.7"
          strokeLinejoin="round"
        />
        <circle cx="20" cy="31.5" r="2.6" strokeWidth="1.6" />
        <circle cx="35" cy="31.5" r="2.6" strokeWidth="1.6" />
        <path d="M14 21h10" strokeWidth="1.3" opacity="0.5" />
      </g>
      <path
        d="M38 12.5c2.2-1.2 4.6-1.1 6.5.4"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        opacity="0.4"
      />
    </svg>
  );
}
