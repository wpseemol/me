import type { ReactNode, SVGProps } from "react";

type IconP = SVGProps<SVGSVGElement>;

function I({ children, ...p }: IconP & { children: ReactNode }) {
  return (
    <svg viewBox="0 0 48 48" width="1em" height="1em" fill="none" aria-hidden {...p}>
      {children}
    </svg>
  );
}

export const SKILL_ACCENT: Record<string, string> = {
  HTML: "#E34F26",
  CSS: "#1572B6",
  "Tailwind CSS": "#38BDF8",
  React: "#61DAFB",
  "Next.js": "#A3A3A3",
  TypeScript: "#3178C6",
  Laravel: "#FF2D20",
  PHP: "#777BB4",
  "Node.js": "#5FA04E",
  Express: "#888888",
  MongoDB: "#47A248",
  MySQL: "#4479A1",
  Redis: "#DC382D",
  Docker: "#2496ED",
};

export const SKILL_ICON: Record<string, (p: IconP) => ReactNode> = {
  HTML: (p) => (
    <I {...p}>
      <path d="M8 6h32l-3 34-13 4-13-4L8 6Z" fill="currentColor" opacity="0.92" />
      <path d="M24 38.5 34.2 35.6 36.6 10H24v28.5Z" fill="#000" opacity="0.18" />
      <path d="M16.5 18h15.2l-.35 4H20.6l.25 2.8h9.9l-.55 6.1L24 33.2l-6.2-1.7-.4-4.4h3.9l.2 2.1 2.5.7 2.5-.7.2-2.1H16.8l.7-7.8Z" fill="#fff" />
    </I>
  ),
  CSS: (p) => (
    <I {...p}>
      <path d="M8 6h32l-3 34-13 4-13-4L8 6Z" fill="currentColor" opacity="0.92" />
      <path d="M24 38.5 34.2 35.6 36.6 10H24v28.5Z" fill="#000" opacity="0.18" />
      <path d="M17 18h14.5l-.4 4.2H21.2l.2 2.4h9.2l-.7 7.5L24 34.2l-5.9-1.6-.35-3.8h3.85l.15 1.7 2.25.6 2.25-.6.2-2.2H17.6L18.4 18Z" fill="#fff" />
    </I>
  ),
  "Tailwind CSS": (p) => (
    <I {...p}>
      <path
        d="M24 12c-5.3 0-8.6 2.65-10 7.95 2-2.65 4.3-3.65 7-3 1.55.37 2.65 1.45 3.9 2.65C26.9 21.7 29 23.7 33 23.7c5.3 0 8.6-2.65 10-7.95-2 2.65-4.3 3.65-7 3-1.55-.37-2.65-1.45-3.9-2.65C30.1 14 28 12 24 12Zm-10 12.3c-5.3 0-8.6 2.65-10 7.95 2-2.65 4.3-3.65 7-3 1.55.37 2.65 1.45 3.9 2.65 2 2.1 4.1 4.1 8.1 4.1 5.3 0 8.6-2.65 10-7.95-2 2.65-4.3 3.65-7 3-1.55-.37-2.65-1.45-3.9-2.65-2-2.1-4.1-4.1-8.1-4.1Z"
        fill="currentColor"
      />
    </I>
  ),
  React: (p) => (
    <I {...p}>
      <circle cx="24" cy="24" r="3.2" fill="currentColor" />
      <ellipse cx="24" cy="24" rx="18" ry="7.2" stroke="currentColor" strokeWidth="2" />
      <ellipse cx="24" cy="24" rx="18" ry="7.2" stroke="currentColor" strokeWidth="2" transform="rotate(60 24 24)" />
      <ellipse cx="24" cy="24" rx="18" ry="7.2" stroke="currentColor" strokeWidth="2" transform="rotate(120 24 24)" />
    </I>
  ),
  "Next.js": (p) => (
    <I {...p}>
      <circle cx="24" cy="24" r="16" stroke="currentColor" strokeWidth="2.2" />
      <path d="M20 16h3.2l8.6 13.2V16H35v16h-3.1L23.2 18.7V32H20V16Z" fill="currentColor" />
    </I>
  ),
  TypeScript: (p) => (
    <I {...p}>
      <rect x="7" y="7" width="34" height="34" rx="6" fill="currentColor" />
      <path d="M14.5 20.5h19v3.4H26.2V34h-3.8V23.9h-7.9v-3.4Z" fill="#fff" />
    </I>
  ),
  Laravel: (p) => (
    <I {...p}>
      <path
        d="m10 18 7-4 7 4v8l-7 4-7-4v-8Zm14 0 7-4 7 4v3.5l-7 4V32l-7-4V18Z"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
    </I>
  ),
  PHP: (p) => (
    <I {...p}>
      <ellipse cx="24" cy="24" rx="18" ry="11" fill="currentColor" opacity="0.9" />
      <path d="M13 21.5h5.2c2.1 0 3.4 1 3.4 2.8 0 1.9-1.4 3-3.5 3H15.6V32h-2.6v-10.5Zm2.6 3.8h2c.9 0 1.4-.4 1.4-1.1s-.5-1-1.4-1h-2v2.1Zm9.2-3.8h2.6l2.4 7.2 2.4-7.2h2.6L30.4 32h-2.7l-2.9-10.5Zm11.3 0H41v2.5h-2.3V32h-2.6V24h-2.3v-2.5Z" fill="#fff" />
    </I>
  ),
  "Node.js": (p) => (
    <I {...p}>
      <path
        d="M24 7.5 38 15.5v16.8L24 40.5 10 32.3V15.5L24 7.5Z"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
      <path d="M18.5 22.5c0-3.2 2-5.2 5.4-5.2 2.6 0 4.4 1.2 5.1 3.2l-2.5 1.3c-.4-1-.9-1.6-2.5-1.6-1.5 0-2.5.9-2.5 2.3v5c0 1.4 1 2.3 2.5 2.3 1.6 0 2.1-.7 2.5-1.6l2.5 1.3c-.7 2-2.5 3.2-5.1 3.2-3.4 0-5.4-2-5.4-5.2v-5Z" fill="currentColor" />
    </I>
  ),
  Express: (p) => (
    <I {...p}>
      <path d="M8 24h32" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M12 16h10l4 16h10" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="36" cy="16" r="2.4" fill="currentColor" />
    </I>
  ),
  MongoDB: (p) => (
    <I {...p}>
      <path
        d="M24 6c2.5 6.5 10 10.5 10 20.5S28 40 24 42c-4-2-10-5.5-10-15.5S21.5 12.5 24 6Z"
        fill="currentColor"
      />
      <path d="M24 14v24" stroke="#06140a" strokeOpacity="0.35" strokeWidth="2" strokeLinecap="round" />
    </I>
  ),
  MySQL: (p) => (
    <I {...p}>
      <path d="M10 28c2.5-8 8-14 16.5-14 6 0 9.5 3 11.5 8" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M14 20c3 6 7 10 14 12 5 1.4 9 .8 12-1" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
      <circle cx="34" cy="30" r="2.2" fill="currentColor" />
    </I>
  ),
  Redis: (p) => (
    <I {...p}>
      <path d="m8 20 16-6 16 6-16 6L8 20Z" fill="currentColor" opacity="0.95" />
      <path d="m8 26 16 6 16-6" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" />
      <path d="m8 32 16 6 16-6" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" opacity="0.7" />
    </I>
  ),
  Docker: (p) => (
    <I {...p}>
      <path d="M8 28.5h28c2.2 0 5.5-1.6 6.8-4.2-1.5.7-3.2 1-5.2.6-5.4-1.1-6.3-5.2-6.3-5.2s-3.1 1.8-7.4 1.8H8v7Z" fill="currentColor" />
      <rect x="11" y="20" width="5" height="5" rx="0.8" fill="currentColor" />
      <rect x="17.5" y="20" width="5" height="5" rx="0.8" fill="currentColor" />
      <rect x="24" y="20" width="5" height="5" rx="0.8" fill="currentColor" />
      <rect x="17.5" y="13.5" width="5" height="5" rx="0.8" fill="currentColor" />
      <rect x="24" y="13.5" width="5" height="5" rx="0.8" fill="currentColor" />
      <rect x="30.5" y="20" width="5" height="5" rx="0.8" fill="currentColor" />
    </I>
  ),
};
