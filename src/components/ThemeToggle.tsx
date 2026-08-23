'use client';

import { useTheme } from './ThemeProvider';

export default function ThemeToggle({ className = '' }: { className?: string }) {
  const { theme, ready, toggle } = useTheme();
  const dark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={(e) => toggle({ x: e.clientX, y: e.clientY })}
      aria-label={dark ? 'Switch to light theme' : 'Switch to dark theme'}
      title={dark ? 'Switch to light theme' : 'Switch to dark theme'}
      className={`group relative grid h-10 w-10 place-items-center overflow-hidden rounded-full border bg-elev/70 backdrop-blur-sm transition-all duration-300 ease-out hover:border-brand-500/50 hover:shadow-[0_0_0_4px_rgb(var(--c-glow-a)/0.14)] ${className}`}
    >
      {/* gradient bloom on hover */}
      <span
        aria-hidden
        className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background:
            'radial-gradient(circle at 50% 120%, rgb(var(--c-glow-b) / 0.32), transparent 65%)',
        }}
      />

      <span
        aria-hidden
        className="relative h-5 w-5 transition-transform duration-500 ease-out"
        style={{ transform: ready ? `rotate(${dark ? 0 : 180}deg)` : undefined }}
      >
        {/* Sun ↔ moon morph: the mask circle slides in to bite a crescent */}
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none">
          <defs>
            <mask id="tt-moon">
              <rect width="24" height="24" fill="white" />
              <circle
                cx={dark ? 17 : 30}
                cy={dark ? 7 : 0}
                r="8"
                fill="black"
                style={{ transition: 'cx 0.5s cubic-bezier(0.16,1,0.3,1), cy 0.5s cubic-bezier(0.16,1,0.3,1)' }}
              />
            </mask>
          </defs>

          <circle
            cx="12"
            cy="12"
            r={dark ? 8.4 : 5.2}
            mask="url(#tt-moon)"
            fill="url(#tt-grad)"
            style={{ transition: 'r 0.5s cubic-bezier(0.16,1,0.3,1)' }}
          />

          <linearGradient id="tt-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--brand-400)" />
            <stop offset="100%" stopColor="var(--accent-400)" />
          </linearGradient>

          {/* Sun rays — scale away in dark mode */}
          <g
            stroke="url(#tt-grad)"
            strokeWidth="1.9"
            strokeLinecap="round"
            style={{
              opacity: dark ? 0 : 1,
              transform: `scale(${dark ? 0.4 : 1})`,
              transformOrigin: 'center',
              transition: 'opacity 0.4s ease, transform 0.5s cubic-bezier(0.16,1,0.3,1)',
            }}
          >
            <line x1="12" y1="1.4" x2="12" y2="3.4" />
            <line x1="12" y1="20.6" x2="12" y2="22.6" />
            <line x1="1.4" y1="12" x2="3.4" y2="12" />
            <line x1="20.6" y1="12" x2="22.6" y2="12" />
            <line x1="4.5" y1="4.5" x2="5.9" y2="5.9" />
            <line x1="18.1" y1="18.1" x2="19.5" y2="19.5" />
            <line x1="4.5" y1="19.5" x2="5.9" y2="18.1" />
            <line x1="18.1" y1="5.9" x2="19.5" y2="4.5" />
          </g>
        </svg>
      </span>
    </button>
  );
}
