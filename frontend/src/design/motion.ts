/**
 * Motion design system, JS side. CSS (design/tokens.css) is the source; these numbers mirror
 * it for the few animations driven from script (page enter, help-ladder height).
 * `motion.test.ts` fails if the two drift apart.
 *
 * Principles: smooth, natural, consistent, restrained. Motion never blocks clicks, keys,
 * reading or typing, and disappears entirely under prefers-reduced-motion.
 */
export const DURATION = {
  /** Buttons, tabs, search results, hover/press feedback (120–180 ms). */
  quick: 140,
  /** Page enter (180–250 ms). */
  page: 220,
  /** Expand / collapse: feedback, hints, help ladder, TOC. */
  expand: 220,
  /** Sliding sheets: mobile menu, future AI drawer. */
  panel: 260,
  /** Light / dark switch. */
  theme: 240,
  /** Soft highlight of the section a learner was sent to. */
  highlight: 1800,
} as const;

export const EASING = {
  standard: "cubic-bezier(0.2, 0, 0, 1)",
  enter: "cubic-bezier(0.05, 0.7, 0.1, 1)",
  exit: "cubic-bezier(0.3, 0, 0.8, 0.15)",
  /** Damped spring (zeta 0.82); CSS falls back to `standard` where linear() is unsupported. */
  spring: "linear(0, 0.051, 0.167, 0.31, 0.454, 0.586, 0.699, 0.79, 0.86, 0.913, 0.951, 0.977, 0.993, 1.003, 1.009, 1.011, 1.011, 1.01, 1.009, 1.007, 1.006, 1.004, 1.003, 1.002, 1)",
  /** Bouncier spring (zeta 0.6) for press release; CSS falls back to `enter`. */
  springBouncy: "linear(0, 0.071, 0.237, 0.438, 0.635, 0.804, 0.932, 1.02, 1.07, 1.092, 1.093, 1.082, 1.064, 1.045, 1.027, 1.013, 1.002, 0.996, 0.992, 0.991, 0.992, 0.993, 0.995, 0.997, 0.998, 0.999, 1, 1.001, 1)",
} as const;

export function prefersReducedMotion(): boolean {
  try {
    return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
  } catch {
    return false;
  }
}

/** Current --motion-scale (0 when reduced motion is on, 0.6 on low-end devices). */
export function motionScale(): number {
  if (prefersReducedMotion()) return 0;
  try {
    const raw = getComputedStyle(document.documentElement).getPropertyValue("--motion-scale").trim();
    const value = parseFloat(raw);
    return Number.isFinite(value) && value >= 0 ? value : 1;
  } catch {
    return 1;
  }
}

/** Duration in ms for a token, already scaled; 0 means “do not animate”. */
export const duration = (name: keyof typeof DURATION) => DURATION[name] * motionScale();

/** Low-end devices get shorter, opacity-first motion (set before first paint by themeBoot). */
export function isLowEndForMotion(nav: { deviceMemory?: number; hardwareConcurrency?: number; connection?: { saveData?: boolean } }) {
  return (
    (typeof nav.deviceMemory === "number" && nav.deviceMemory <= 2) ||
    (typeof nav.hardwareConcurrency === "number" && nav.hardwareConcurrency <= 2) ||
    nav.connection?.saveData === true
  );
}
