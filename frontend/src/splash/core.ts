/** Pure splash logic (D-019): when to play, timing, and where particles land. */

export type SplashEnv = {
  pathname: string;
  hash: string;
  /** PerformanceNavigationTiming.type: "navigate" | "reload" | "back_forward" | "prerender". */
  navigationType: string;
  /** pageshow restored the page from the back/forward cache. */
  restoredFromCache: boolean;
  reducedMotion: boolean;
  hidden: boolean;
  enabled: boolean;
};

/** Only a fresh load or reload of the homepage plays the splash. */
export function shouldPlaySplash(env: SplashEnv): boolean {
  const home = env.pathname === "/" || env.pathname === "/index.html";
  return (
    env.enabled &&
    home &&
    !env.hash &&
    !env.reducedMotion &&
    !env.hidden &&
    !env.restoredFromCache &&
    env.navigationType !== "back_forward"
  );
}

export type Timeline = { appear: number; converge: number; reveal: number; exit: number };
export const DESKTOP_TIMELINE: Timeline = { appear: 350, converge: 650, reveal: 350, exit: 450 };
export const MOBILE_TIMELINE: Timeline = { appear: 250, converge: 600, reveal: 250, exit: 400 };
/** Simplified Logo transition for low-end devices or dropped frames (≤ 0.8 s). */
export const FAST_TIMELINE: Timeline = { appear: 0, converge: 0, reveal: 300, exit: 450 };
export const SKIP_FADE_MS = 250;
export const LOADING_HINT_MS = 2600;
export const HARD_CAP_MS = 8000;
export const MOBILE_BREAKPOINT = 500;
/** Average frame time above this during the first frames switches to the fast path. */
export const SLOW_FRAME_MS = 34;
export const SLOW_FRAME_SAMPLE = 8;

export const totalDuration = (t: Timeline) => t.appear + t.converge + t.reveal + t.exit;

export function timelineFor(width: number, lowEnd: boolean): Timeline {
  if (lowEnd) return FAST_TIMELINE;
  return width < MOBILE_BREAKPOINT ? MOBILE_TIMELINE : DESKTOP_TIMELINE;
}

export function isLowEndDevice(nav: { deviceMemory?: number; hardwareConcurrency?: number }) {
  return (
    (typeof nav.deviceMemory === "number" && nav.deviceMemory <= 2) ||
    (typeof nav.hardwareConcurrency === "number" && nav.hardwareConcurrency <= 2)
  );
}

/** Strokes of the bridge mark, identical to components/ui/Brand.tsx (36×36 viewBox). */
export const LOGO_SEGMENTS: [number, number, number, number][] = [
  [4, 27, 4, 10],
  [4, 10, 18, 22],
  [18, 22, 32, 10],
  [32, 10, 32, 27],
  [4, 10, 18, 27],
  [18, 27, 32, 10],
];
export const LOGO_DOT = { x: 18, y: 8, r: 2 };
export const LOGO_VIEWBOX = 36;
const DOT_PARTICLES = 5;

export type LogoTarget = { x: number; y: number; segment: number; order: number };

/** Spread `count` particles along the logo strokes by length, a few on the dot. */
export function logoTargets(count: number): LogoTarget[] {
  const onStrokes = count - DOT_PARTICLES;
  const lengths = LOGO_SEGMENTS.map(([x1, y1, x2, y2]) => Math.hypot(x2 - x1, y2 - y1));
  const total = lengths.reduce((a, b) => a + b, 0);
  const counts = lengths.map((l) => Math.max(2, Math.round((onStrokes * l) / total)));
  counts[counts.length - 1] += onStrokes - counts.reduce((a, b) => a + b, 0);
  const out: LogoTarget[] = [];
  LOGO_SEGMENTS.forEach(([x1, y1, x2, y2], segment) => {
    const k = counts[segment];
    for (let i = 0; i < k; i++) {
      const t = k === 1 ? 0 : i / (k - 1);
      out.push({ x: x1 + (x2 - x1) * t, y: y1 + (y2 - y1) * t, segment, order: i });
    }
  });
  for (let i = 0; i < DOT_PARTICLES; i++) {
    const a = (i / DOT_PARTICLES) * Math.PI * 2;
    out.push({ x: LOGO_DOT.x + Math.cos(a) * 1.1, y: LOGO_DOT.y + Math.sin(a) * 1.1, segment: -1, order: i });
  }
  return out;
}

/**
 * Pair particles with targets by screen position (left→right) so the logo
 * sweeps in instead of particles crossing randomly. Returns target index per particle
 * and a 0..1 rank used to stagger arrivals.
 */
export function assignTargets(
  particles: { x: number; y: number }[],
  targets: { x: number; y: number }[],
): { target: number[]; rank: number[] } {
  const key = (p: { x: number; y: number }) => p.x + p.y * 0.3;
  const byParticle = particles.map((p, i) => [key(p), i] as const).sort((a, b) => a[0] - b[0]);
  const byTarget = targets.map((p, i) => [key(p), i] as const).sort((a, b) => a[0] - b[0]);
  const target = new Array<number>(particles.length);
  const rank = new Array<number>(particles.length);
  byParticle.forEach(([, pi], k) => {
    target[pi] = byTarget[k][1];
    rank[pi] = k / particles.length;
  });
  return { target, rank };
}

export const clamp01 = (t: number) => (t < 0 ? 0 : t > 1 ? 1 : t);
export const easeInOutCubic = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

/** Arrival progress (0..1) of a particle with stagger rank during the converge phase. */
export function arrival(t: number, timeline: Timeline, rank: number) {
  if (timeline.converge === 0) return 1;
  const start = timeline.appear + rank * timeline.converge * 0.35;
  return easeInOutCubic(clamp01((t - start) / (timeline.converge * 0.65)));
}
