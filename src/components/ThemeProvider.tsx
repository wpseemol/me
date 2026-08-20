'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';

type Theme = 'light' | 'dark';

type Ctx = {
  theme: Theme;
  ready: boolean;
  toggle: (origin?: { x: number; y: number }) => void;
};

const ThemeCtx = createContext<Ctx>({ theme: 'dark', ready: false, toggle: () => {} });

export const useTheme = () => useContext(ThemeCtx);

export const STORAGE_KEY = 'wpseemol-theme';

/**
 * Runs before paint so the correct theme class is on <html> from the very
 * first frame. Without this you get a white flash on every hard load.
 */
export const themeInitScript = `
(function(){
  try {
    var k='${STORAGE_KEY}';
    var s=localStorage.getItem(k);
    var m=window.matchMedia('(prefers-color-scheme: light)').matches?'light':'dark';
    var t=(s==='light'||s==='dark')?s:m;
    var e=document.documentElement;
    e.classList.add('js');
    e.classList.toggle('dark', t==='dark');
    e.style.colorScheme=t;
  } catch(_){
    document.documentElement.classList.add('dark','js');
  }
})();
`;

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>('dark');
  const [ready, setReady] = useState(false);

  // Sync React state with whatever themeInitScript already decided.
  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark');
    setTheme(isDark ? 'dark' : 'light');
    setReady(true);
  }, []);

  // Follow the OS only while the visitor hasn't made an explicit choice.
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: light)');
    const onChange = (e: MediaQueryListEvent) => {
      if (localStorage.getItem(STORAGE_KEY)) return;
      const next: Theme = e.matches ? 'light' : 'dark';
      document.documentElement.classList.toggle('dark', next === 'dark');
      document.documentElement.style.colorScheme = next;
      setTheme(next);
    };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const apply = useCallback((next: Theme) => {
    const el = document.documentElement;
    el.classList.toggle('dark', next === 'dark');
    el.style.colorScheme = next;
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* storage can be blocked — the theme still applies for this session */
    }
    setTheme(next);
  }, []);

  const toggle = useCallback(
    (origin?: { x: number; y: number }) => {
      const next: Theme = theme === 'dark' ? 'light' : 'dark';
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      if (typeof document.startViewTransition !== 'function' || reduced) {
        apply(next);
        return;
      }

      // Anchor the circular wipe on the button that was pressed.
      const el = document.documentElement;
      const x = origin ? (origin.x / window.innerWidth) * 100 : 50;
      const y = origin ? (origin.y / window.innerHeight) * 100 : 0;
      el.style.setProperty('--wipe-x', `${x}%`);
      el.style.setProperty('--wipe-y', `${y}%`);
      el.classList.add('theme-wipe');

      const transition = document.startViewTransition(() => {
        apply(next);
      });
      transition.finished.finally(() => el.classList.remove('theme-wipe'));
    },
    [theme, apply],
  );

  return (
    <ThemeCtx.Provider value={{ theme, ready, toggle }}>{children}</ThemeCtx.Provider>
  );
}
