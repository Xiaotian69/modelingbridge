/**
 * D-019 splash runtime. Inlined at the start of <body> (see vite.config.ts) so it can
 * paint before the app bundle arrives. It never blocks the app: React renders underneath,
 * and the overlay leaves once its animation and the app are both ready.
 */
import {
  MAX_DPR,
  NETWORK_COLORS,
  linkAlpha,
  linkPairs,
  nodeAlpha,
  nodeCount,
  nodeRadius,
  projectNodes,
  sphereNodes,
} from "../components/motion/networkGeometry";
import { readPrefs } from "../app/prefsStore";
import {
  HARD_CAP_MS,
  LOADING_HINT_MS,
  LOGO_DOT,
  LOGO_SEGMENTS,
  LOGO_VIEWBOX,
  SKIP_FADE_MS,
  SLOW_FRAME_MS,
  SLOW_FRAME_SAMPLE,
  FAST_TIMELINE,
  arrival,
  assignTargets,
  clamp01,
  easeInOutCubic,
  isLowEndDevice,
  logoTargets,
  shouldPlaySplash,
  timelineFor,
  totalDuration,
  type Timeline,
} from "./core";

import { APP_READY_EVENT, SPLASH_DONE_EVENT } from "./signal";
const SPLASH_SPIN = 0.00009; // ~2.5× the hero rotation, for a sense of start-up
const BG = "#0b1d24";

declare global {
  interface Window {
    __mbSplash?: SplashController;
  }
}

export type SplashController = { skip: () => void; done: Promise<void> };

function readEnv(win: Window) {
  let navigationType = "navigate";
  try {
    const entry = win.performance.getEntriesByType("navigation")[0] as
      | PerformanceNavigationTiming
      | undefined;
    if (entry?.type) navigationType = entry.type;
  } catch {
    /* Older browsers: treat as a fresh load. */
  }
  let reducedMotion = false;
  try {
    reducedMotion = win.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    /* ignore */
  }
  return {
    pathname: win.location.pathname,
    hash: win.location.hash,
    navigationType,
    restoredFromCache: false,
    reducedMotion,
    hidden: win.document.hidden,
    enabled: readPrefs().splash,
  };
}

function el<K extends keyof HTMLElementTagNameMap>(
  doc: Document,
  tag: K,
  css: string,
  text?: string,
) {
  const node = doc.createElement(tag);
  node.style.cssText = css;
  if (text) node.textContent = text;
  return node;
}

/** Starts the splash if this load qualifies; returns null otherwise. */
export function runSplash(win: Window = window): SplashController | null {
  if (!shouldPlaySplash(readEnv(win))) return null;
  const doc = win.document;
  const width = win.innerWidth;
  const height = win.innerHeight;
  const lowEnd = isLowEndDevice(win.navigator as Navigator & { deviceMemory?: number });
  let timeline: Timeline = timelineFor(width, lowEnd);
  let fast = lowEnd;
  const mobile = width < 500;

  // ---------- DOM (inline styles: app CSS may not have loaded yet) ----------
  const overlay = el(
    doc,
    "div",
    `position:fixed;inset:0;z-index:2147483000;background:${BG};cursor:pointer;` +
      "touch-action:none;-webkit-tap-highlight-color:transparent;",
  );
  overlay.id = "mb-splash";
  overlay.setAttribute("aria-hidden", "true");
  const canvas = el(doc, "canvas", "position:absolute;inset:0;width:100%;height:100%;");
  const logoSize = Math.min(width, height) * (mobile ? 0.34 : 0.26);
  const cx = width / 2;
  const cy = height / 2 - (mobile ? 30 : 24);
  const word = el(
    doc,
    "div",
    `position:absolute;left:50%;top:${cy + logoSize / 2 + 18}px;transform:translate(-50%,8px);` +
      "opacity:0;color:#e6f2ef;text-align:center;white-space:nowrap;" +
      'font:600 30px/1.2 -apple-system,BlinkMacSystemFont,"Segoe UI","PingFang SC","Microsoft YaHei",sans-serif;letter-spacing:.08em;',
    "模桥",
  );
  const sub = el(
    doc,
    "span",
    "display:block;margin-top:6px;font-size:12px;font-weight:500;letter-spacing:.32em;color:#91e4c8;",
    "MODELINGBRIDGE",
  );
  word.appendChild(sub);
  const hintCss =
    "position:absolute;left:0;right:0;text-align:center;font:12px/1.4 sans-serif;color:#9fc3bb;opacity:0;transition:opacity .3s;";
  const hint = el(doc, "div", hintCss + "bottom:22px;", "轻触任意处跳过");
  const loading = el(doc, "div", hintCss + "bottom:46px;", "正在加载…");
  overlay.append(canvas, word, hint, loading);
  (doc.body || doc.documentElement).prepend(overlay);

  const dpr = Math.min(win.devicePixelRatio || 1, MAX_DPR);
  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);
  const ctx = canvas.getContext("2d");
  ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);

  // ---------- Geometry ----------
  const nodes = sphereNodes(nodeCount(width));
  const pairs = linkPairs(nodes);
  const targets = logoTargets(nodes.length);
  const sphereRadius = Math.min(width * 0.36, height * 0.37) * (mobile ? 0.9 : 0.62);
  const start = projectNodes(nodes, 0, cx, cy, sphereRadius);
  const { target, rank } = assignTargets(start, targets);
  const toScreen = (x: number, y: number) => ({
    x: cx + ((x - LOGO_VIEWBOX / 2) / LOGO_VIEWBOX) * logoSize,
    y: cy + ((y - 17.5) / LOGO_VIEWBOX) * logoSize,
  });
  const targetScreen = targets.map((t) => toScreen(t.x, t.y));

  // Where the logo and particles go when the overlay leaves: the real header logo and hero network.
  const headerTarget = () => {
    const mark = doc.querySelector(".site-header .brand-mark");
    const r = mark?.getBoundingClientRect();
    if (!r || !r.width) return { x: 32, y: 30, scale: 34 / logoSize };
    return { x: r.left + r.width / 2, y: r.top + r.height / 2, scale: r.width / logoSize };
  };
  const heroTargets = () => {
    const hero = doc.querySelector(".home-hero .math-network");
    const r = hero?.getBoundingClientRect();
    if (!r || r.width < 10) return null;
    const radius = Math.min(r.width * 0.36, r.height * 0.37);
    return projectNodes(nodes, 0, r.left + r.width / 2, r.top + r.height / 2, radius);
  };

  // ---------- State ----------
  let startAt = win.performance.now();
  let frame = 0;
  let finished = false;
  let skipping = false;
  let appReady = !!win.__mbAppReady;
  let exitAt = -1; // ms (relative) when exit began
  let frames = 0;
  let firstFrameAt = 0;
  let lastFrameAt = 0;
  let resolveDone: () => void = () => {};
  const done = new Promise<void>((r) => (resolveDone = r));
  let header: ReturnType<typeof headerTarget> | null = null;
  let hero: ReturnType<typeof heroTargets> = null;

  function draw(t: number) {
    if (!ctx) return;
    const { appear, converge, reveal } = timeline;
    const revealAt = appear + converge;
    const revealEnd = revealAt + reveal;
    if (exitAt < 0 && t >= revealEnd && appReady) {
      exitAt = t;
      header = headerTarget();
      hero = mobile ? null : heroTargets();
    }
    const exitK = exitAt < 0 ? 0 : easeInOutCubic(clamp01((t - exitAt) / timeline.exit));
    overlay.style.background = exitK > 0 ? `rgba(11,29,36,${1 - exitK})` : BG;
    ctx.clearRect(0, 0, width, height);

    // Particles: sphere → logo strokes → (desktop) back into the hero network.
    if (!fast) {
      const fadeIn = appear ? clamp01(t / appear) : 1;
      const sphere = projectNodes(nodes, t * SPLASH_SPIN, cx, cy, sphereRadius);
      const pos = sphere.map((p, i) => {
        const k = arrival(t, timeline, rank[i]);
        const goal = targetScreen[target[i]];
        let x = p.x + (goal.x - p.x) * k;
        let y = p.y + (goal.y - p.y) * k;
        if (exitK > 0) {
          if (hero) {
            x += (hero[i].x - x) * exitK;
            y += (hero[i].y - y) * exitK;
          } else {
            x += (x - cx) * exitK * 0.35;
            y += (y - cy) * exitK * 0.35;
          }
        }
        return { x, y, z: p.z, k };
      });
      for (const [i, j, d] of pairs) {
        const p = pos[i];
        const q = pos[j];
        const f = 1 - Math.max(p.k, q.k);
        if (f <= 0) continue;
        ctx.strokeStyle = NETWORK_COLORS.link(linkAlpha(p.z, q.z, d) * fadeIn * f);
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(q.x, q.y);
        ctx.stroke();
      }
      // Stroke links appear once neighbours have (almost) landed, so the bridge "assembles".
      const bySegment = new Map<number, { order: number; p: (typeof pos)[number] }[]>();
      pos.forEach((p, i) => {
        const tg = targets[target[i]];
        if (tg.segment < 0) return;
        const list = bySegment.get(tg.segment) ?? [];
        list.push({ order: tg.order, p });
        bySegment.set(tg.segment, list);
      });
      ctx.lineWidth = 1.2;
      bySegment.forEach((list) => {
        list.sort((a, b) => a.order - b.order);
        for (let i = 1; i < list.length; i++) {
          const a = list[i - 1].p;
          const b = list[i].p;
          const f = clamp01((Math.min(a.k, b.k) - 0.72) / 0.28);
          if (f <= 0) continue;
          ctx.strokeStyle = `rgba(145,228,200,${f * f * 0.85 * Math.pow(1 - exitK, 3)})`;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      });
      ctx.lineWidth = 1;
      for (const p of pos) {
        const alpha = Math.min(1, nodeAlpha(p.z) + p.k * 0.3) * fadeIn * (hero ? 1 : 1 - exitK);
        ctx.fillStyle = NETWORK_COLORS.node(alpha);
        ctx.beginPath();
        ctx.arc(p.x, p.y, nodeRadius(p.z) * (1 - p.k * 0.35), 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Crisp logo + one soft glow, then it glides into the header logo.
    const rv = reveal ? clamp01((t - revealAt) / reveal) : 1;
    if (rv > 0) {
      const h = header ?? { x: cx, y: cy, scale: 1 };
      const gx = cx + (h.x - cx) * exitK;
      const gy = cy + (h.y - cy) * exitK;
      const scale = 1 + (h.scale - 1) * exitK;
      ctx.save();
      ctx.translate(gx, gy);
      ctx.scale(scale, scale);
      ctx.translate(-cx, -cy);
      const color = `rgba(145,228,200,${rv * (1 - exitK * 0.7)})`;
      ctx.strokeStyle = color;
      ctx.fillStyle = color;
      ctx.lineWidth = 2.2 / Math.max(scale, 0.35);
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      ctx.shadowColor = "rgba(145,228,200,0.8)";
      ctx.shadowBlur = fast ? 0 : 14 * Math.sin(Math.PI * rv) * (1 - exitK);
      ctx.beginPath();
      for (const [x1, y1, x2, y2] of LOGO_SEGMENTS) {
        const a = toScreen(x1, y1);
        const b = toScreen(x2, y2);
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
      }
      ctx.stroke();
      const dot = toScreen(LOGO_DOT.x, LOGO_DOT.y);
      ctx.beginPath();
      ctx.arc(dot.x, dot.y, (LOGO_DOT.r * logoSize) / LOGO_VIEWBOX, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      const waiting = exitAt < 0 && t > revealEnd;
      word.style.opacity = String(
        waiting ? 0.85 + 0.15 * Math.sin(t / 190) : rv * (1 - clamp01(exitK * 2)),
      );
      word.style.transform = `translate(-50%,${8 * (1 - rv) - exitK * 10}px)`;
      loading.style.opacity = waiting && t > LOADING_HINT_MS ? "0.8" : "0";
    }
    hint.style.opacity = t > 300 && exitK === 0 ? "0.55" : "0";
    if (exitAt >= 0 && t >= exitAt + timeline.exit) finish();
  }

  function tick(now: number) {
    frame = 0;
    if (finished) return;
    const t = now - startAt;
    // Adaptive degrade: if the first frames are slow, switch to the simple Logo transition.
    frames++;
    if (frames === 1) firstFrameAt = now;
    lastFrameAt = now;
    if (!fast && frames === SLOW_FRAME_SAMPLE + 1 && (lastFrameAt - firstFrameAt) / SLOW_FRAME_SAMPLE > SLOW_FRAME_MS) {
      fast = true;
      timeline = FAST_TIMELINE;
      startAt = now;
      draw(0);
    } else draw(t);
    if (t > HARD_CAP_MS) finish();
    if (!finished) frame = win.requestAnimationFrame(tick);
  }

  function cleanup() {
    win.removeEventListener(APP_READY_EVENT, onReady);
    win.removeEventListener("keydown", onKey, true);
    win.removeEventListener("wheel", skip);
    doc.removeEventListener("visibilitychange", onVisibility);
    overlay.removeEventListener("pointerdown", skip);
    overlay.removeEventListener("touchmove", skip);
  }
  function finish() {
    if (finished) return;
    finished = true;
    if (frame) win.cancelAnimationFrame(frame);
    cleanup();
    overlay.remove();
    win.dispatchEvent(new Event(SPLASH_DONE_EVENT));
    resolveDone();
  }
  function skip() {
    if (finished || skipping) return;
    skipping = true;
    if (frame) win.cancelAnimationFrame(frame);
    frame = 0;
    cleanup();
    overlay.style.transition = `opacity ${SKIP_FADE_MS}ms ease-out`;
    overlay.style.opacity = "0";
    overlay.style.pointerEvents = "none";
    win.setTimeout(finish, SKIP_FADE_MS);
  }
  function onReady() {
    appReady = true;
  }
  function onKey(event: KeyboardEvent) {
    if (["Shift", "Control", "Alt", "Meta"].includes(event.key)) return;
    skip(); // Default action is kept: Tab still moves focus to the skip link.
  }
  function onVisibility() {
    if (doc.hidden) finish();
  }

  win.addEventListener(APP_READY_EVENT, onReady);
  win.addEventListener("keydown", onKey, true);
  win.addEventListener("wheel", skip, { passive: true });
  doc.addEventListener("visibilitychange", onVisibility);
  overlay.addEventListener("pointerdown", skip);
  overlay.addEventListener("touchmove", skip, { passive: true });
  if (!ctx) {
    // Canvas unavailable: nothing to animate, get out of the way immediately.
    finish();
  } else frame = win.requestAnimationFrame(tick);

  const controller = { skip, done };
  win.__mbSplash = controller;
  return controller;
}

export const SPLASH_TOTAL = {
  desktop: totalDuration(timelineFor(1440, false)),
  mobile: totalDuration(timelineFor(390, false)),
  fast: totalDuration(FAST_TIMELINE),
};
