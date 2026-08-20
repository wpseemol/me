import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{ts,tsx,mdx}', './data/**/*.json'],
  theme: {
    extend: {
      colors: {
        ink: 'rgb(var(--c-bg) / <alpha-value>)',
        elev: 'rgb(var(--c-elev) / <alpha-value>)',
        surface: 'rgb(var(--c-surface) / <alpha-value>)',
        line: 'rgb(var(--c-line) / <alpha-value>)',
        body: 'rgb(var(--c-text) / <alpha-value>)',
        muted: 'rgb(var(--c-muted) / <alpha-value>)',
        violet: {
          DEFAULT: '#6C4CF5',
          soft: '#8E76F8',
          deep: '#4B2FD0',
        },
        magenta: {
          DEFAULT: '#E5468B',
          soft: '#F073A9',
        },
        amber: { DEFAULT: '#FFB020' },
        mint: { DEFAULT: '#40DCA0' },
      },
      fontFamily: {
        display: ['var(--font-display)', 'system-ui', 'sans-serif'],
        sans: ['var(--font-body)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '1rem', letterSpacing: '0.08em' }],
      },
      maxWidth: {
        shell: '76rem',
        prose: '68ch',
      },
      borderRadius: {
        card: '1.125rem',
      },
      transitionDuration: {
        '400': '400ms',
      },
      transitionTimingFunction: {
        out: 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
      keyframes: {
        caret: { '0%,49%': { opacity: '1' }, '50%,100%': { opacity: '0' } },
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        pulseDot: {
          '0%,100%': { transform: 'scale(1)', opacity: '1' },
          '50%': { transform: 'scale(1.35)', opacity: '0.55' },
        },
        floaty: {
          '0%,100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
      },
      animation: {
        caret: 'caret 1.05s step-end infinite',
        marquee: 'marquee 38s linear infinite',
        pulseDot: 'pulseDot 2.2s ease-in-out infinite',
        floaty: 'floaty 6s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};

export default config;
