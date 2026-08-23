/**
 * One promise the whole app can await before playing an entrance animation.
 *
 * Without this, the hero types itself out behind the intro curtain and the
 * visitor arrives at a page that has already finished animating. The safety
 * timeout matters: if the intro ever fails to mount or throws, the page still
 * reveals itself rather than staying invisible forever.
 */

let resolveReady: () => void = () => {};

export const introDone: Promise<void> =
  typeof window === 'undefined'
    ? Promise.resolve()
    : new Promise<void>((resolve) => {
        resolveReady = resolve;
        window.setTimeout(resolve, 4000);
      });

export function finishIntro() {
  resolveReady();
}

/** Shown once per tab. A repeat visitor within a session skips straight in. */
export const INTRO_SEEN_KEY = 'wpseemol-intro-seen';

export function shouldPlayIntro() {
  if (typeof window === 'undefined') return false;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
  try {
    return sessionStorage.getItem(INTRO_SEEN_KEY) !== '1';
  } catch {
    return true;
  }
}

export function markIntroSeen() {
  try {
    sessionStorage.setItem(INTRO_SEEN_KEY, '1');
  } catch {
    /* private mode — the intro just plays again next load */
  }
}
