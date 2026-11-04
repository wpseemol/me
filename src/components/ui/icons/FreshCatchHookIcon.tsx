import { iconBase, type IconProps } from "./types";

/** Coastal fisherman verification hook badge. */
export default function FreshCatchHookIcon(props: IconProps) {
  const { title, ...rest } = props;
  return (
    <svg {...iconBase(rest)} className={`transition-colors duration-300 ${rest.className ?? ""}`}>
      {title ? <title>{title}</title> : null}
      <circle
        cx="24"
        cy="24"
        r="18"
        fill="currentColor"
        opacity="0.08"
      />
      <circle
        cx="24"
        cy="24"
        r="18"
        stroke="currentColor"
        strokeWidth="1.4"
        opacity="0.35"
      />
      <path
        d="M24 10.5v4.2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <circle cx="24" cy="9.2" r="2.2" fill="currentColor" />
      <path
        d="M24 14.7c0 10.5 0 14.8 6.8 14.8 4.4 0 7.2-3.2 7.2-7.1"
        stroke="currentColor"
        strokeWidth="2.1"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M34.5 19.8 37.8 22.2 33.8 24"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M14 31.5c2.8-1.8 5.8-1.8 8.6 0"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        opacity="0.4"
      />
    </svg>
  );
}
