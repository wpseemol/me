/**
 * Shared ambient field bus — pinned stages publish accent/progress so
 * CanvasField can shift particles + glow with each scroll content change.
 */

export type FieldAtmosphere = {
  /** Hex accent for the current item (skill / project). */
  accent: string;
  /** 0–1 progress through the active pinned stage. */
  progress: number;
  /** 0–1 how strongly the stage owns the field (0 = default ambient). */
  intensity: number;
  /** Unique stamp when content index changes — triggers a particle burst. */
  pulse: number;
};

type Listener = (state: FieldAtmosphere) => void;

const DEFAULT: FieldAtmosphere = {
  accent: "",
  progress: 0,
  intensity: 0,
  pulse: 0,
};

let state: FieldAtmosphere = { ...DEFAULT };
const listeners = new Set<Listener>();

export function getFieldAtmosphere() {
  return state;
}

export function setFieldAtmosphere(partial: Partial<FieldAtmosphere>) {
  state = { ...state, ...partial };
  listeners.forEach((fn) => fn(state));
}

export function clearFieldAtmosphere() {
  state = { ...DEFAULT };
  listeners.forEach((fn) => fn(state));
}

export function subscribeFieldAtmosphere(fn: Listener) {
  listeners.add(fn);
  fn(state);
  return () => {
    listeners.delete(fn);
  };
}

/** Stable accent from a project slug / index. */
const PROJECT_ACCENTS = [
  "#1b63ff",
  "#2496ED",
  "#38BDF8",
  "#22c55e",
  "#a855f7",
  "#f59e0b",
  "#ec4899",
  "#14b8a6",
] as const;

export function projectAccent(slug: string, index: number) {
  let h = 0;
  for (let i = 0; i < slug.length; i++) {
    h = (h + slug.charCodeAt(i) * (i + 1)) % PROJECT_ACCENTS.length;
  }
  return PROJECT_ACCENTS[(h + index) % PROJECT_ACCENTS.length]!;
}
