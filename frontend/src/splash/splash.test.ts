// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  DESKTOP_TIMELINE,
  FAST_TIMELINE,
  HARD_CAP_MS,
  MOBILE_TIMELINE,
  SKIP_FADE_MS,
  LOGO_SEGMENTS,
  assignTargets,
  isLowEndDevice,
  logoTargets,
  shouldPlaySplash,
  timelineFor,
  totalDuration,
  type SplashEnv,
} from "./core";
import { runSplash } from "./runtime";
import { APP_READY_EVENT, SPLASH_DONE_EVENT, signalAppReady } from "./signal";
import { PREFS_KEY } from "../app/prefsStore";
import { nodeCount, sphereNodes } from "../components/motion/networkGeometry";

const env = (patch: Partial<SplashEnv> = {}): SplashEnv => ({
  pathname: "/",
  hash: "",
  navigationType: "navigate",
  restoredFromCache: false,
  reducedMotion: false,
  hidden: false,
  enabled: true,
  ...patch,
});

describe("shouldPlaySplash (D-019 trigger rules)", () => {
  it("plays on a fresh load or a reload of the homepage", () => {
    expect(shouldPlaySplash(env())).toBe(true);
    expect(shouldPlaySplash(env({ navigationType: "reload" }))).toBe(true);
    expect(shouldPlaySplash(env({ pathname: "/index.html" }))).toBe(true);
  });
  it.each<[string, Partial<SplashEnv>]>([
    ["deep link to a lesson", { pathname: "/learn/linear-programming" }],
    ["deep link to practice", { pathname: "/practice/linear-programming" }],
    ["homepage with an anchor", { hash: "#route-title" }],
    ["back / forward navigation", { navigationType: "back_forward" }],
    ["back-forward cache restore", { restoredFromCache: true }],
    ["reduced motion (D-019a)", { reducedMotion: true }],
    ["preference turned off (D-019b)", { enabled: false }],
    ["background tab (D-019c)", { hidden: true }],
  ])("does not play for %s", (_, patch) => {
    expect(shouldPlaySplash(env(patch))).toBe(false);
  });
});

describe("timeline and geometry", () => {
  it("lasts about 1.8 s on desktop, 1.5 s on phones, ≤ 0.8 s on low-end devices (D-019d)", () => {
    expect(totalDuration(DESKTOP_TIMELINE)).toBe(1800);
    expect(totalDuration(MOBILE_TIMELINE)).toBe(1500);
    expect(totalDuration(FAST_TIMELINE)).toBeLessThanOrEqual(800);
    expect(timelineFor(1440, false)).toBe(DESKTOP_TIMELINE);
    expect(timelineFor(390, false)).toBe(MOBILE_TIMELINE);
    expect(timelineFor(1440, true)).toBe(FAST_TIMELINE);
  });
  it("detects low-end devices conservatively", () => {
    expect(isLowEndDevice({ deviceMemory: 2 })).toBe(true);
    expect(isLowEndDevice({ hardwareConcurrency: 2 })).toBe(true);
    expect(isLowEndDevice({ deviceMemory: 8, hardwareConcurrency: 8 })).toBe(false);
    expect(isLowEndDevice({})).toBe(false);
  });
  it.each([88, 48])("places all %i particles on the logo strokes and dot", (n) => {
    const targets = logoTargets(n);
    expect(targets).toHaveLength(n);
    for (const t of targets) {
      expect(t.x).toBeGreaterThanOrEqual(4);
      expect(t.x).toBeLessThanOrEqual(32);
      expect(t.y).toBeGreaterThanOrEqual(6);
      expect(t.y).toBeLessThanOrEqual(27);
    }
    // Every stroke receives particles, so the whole bridge is drawn.
    for (let s = 0; s < LOGO_SEGMENTS.length; s++)
      expect(targets.filter((t) => t.segment === s).length).toBeGreaterThanOrEqual(2);
  });
  it("uses the same node counts as the homepage network and assigns each target once", () => {
    expect(nodeCount(1440)).toBe(88);
    expect(nodeCount(390)).toBe(48);
    const nodes = sphereNodes(48).map((n) => ({ x: n.x, y: n.y }));
    const { target, rank } = assignTargets(nodes, logoTargets(48));
    expect(new Set(target).size).toBe(48);
    expect(Math.min(...rank)).toBe(0);
    expect(Math.max(...rank)).toBeLessThan(1);
  });
});

const noop = () => {};

describe("runSplash runtime", () => {
  let reduced = false;
  beforeEach(() => {
    vi.useFakeTimers({
      toFake: ["setTimeout", "clearTimeout", "requestAnimationFrame", "cancelAnimationFrame", "performance"],
    });
    reduced = false;
    localStorage.clear();
    window.history.replaceState(null, "", "/");
    window.__mbAppReady = false;
    vi.stubGlobal("matchMedia", () => ({ matches: reduced, addEventListener() {}, removeEventListener() {} }));
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(
      // One shared no-op: thousands of frames must not allocate a mock per call.
      new Proxy({}, { get: () => noop, set: () => true }) as CanvasRenderingContext2D,
    );
    Object.defineProperty(window, "innerWidth", { configurable: true, value: 1440 });
    Object.defineProperty(window, "innerHeight", { configurable: true, value: 900 });
    Object.defineProperty(document, "hidden", { configurable: true, value: false });
  });
  afterEach(() => {
    document.getElementById("mb-splash")?.remove();
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });
  const overlay = () => document.getElementById("mb-splash");

  it("plays on the homepage and leaves by itself once the app is ready (no click needed)", async () => {
    const done = vi.fn();
    window.addEventListener(SPLASH_DONE_EVENT, done, { once: true });
    const splash = runSplash(window);
    expect(splash).not.toBeNull();
    expect(overlay()).not.toBeNull();
    expect(overlay()).toHaveProperty("ariaHidden", "true");
    signalAppReady(window);
    vi.advanceTimersByTime(1700);
    expect(overlay()).not.toBeNull();
    vi.advanceTimersByTime(250);
    expect(overlay()).toBeNull();
    expect(done).toHaveBeenCalledTimes(1);
    await expect(splash!.done).resolves.toBeUndefined();
  });

  it("holds on the logo while the app is not ready, then leaves after it is", () => {
    runSplash(window);
    vi.advanceTimersByTime(3000);
    expect(overlay()).not.toBeNull();
    expect(overlay()!.textContent).toContain("正在加载");
    window.dispatchEvent(new Event(APP_READY_EVENT));
    vi.advanceTimersByTime(600);
    expect(overlay()).toBeNull();
  });

  it("never stays longer than the hard cap, even if the app never signals", () => {
    runSplash(window);
    vi.advanceTimersByTime(HARD_CAP_MS + 100);
    expect(overlay()).toBeNull();
  });

  it("skips on click / key with a short fade", () => {
    runSplash(window);
    vi.advanceTimersByTime(400);
    overlay()!.dispatchEvent(new Event("pointerdown"));
    vi.advanceTimersByTime(SKIP_FADE_MS + 10);
    expect(overlay()).toBeNull();

    runSplash(window);
    vi.advanceTimersByTime(200);
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
    vi.advanceTimersByTime(SKIP_FADE_MS + 10);
    expect(overlay()).toBeNull();
  });

  it("does not react to modifier keys alone", () => {
    runSplash(window);
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Shift" }));
    vi.advanceTimersByTime(SKIP_FADE_MS + 10);
    expect(overlay()).not.toBeNull();
  });

  it("ends immediately when the tab goes to the background", () => {
    runSplash(window);
    Object.defineProperty(document, "hidden", { configurable: true, value: true });
    document.dispatchEvent(new Event("visibilitychange"));
    expect(overlay()).toBeNull();
  });

  it("does not play on deep links, with reduced motion, or when turned off", () => {
    window.history.replaceState(null, "", "/learn/linear-programming#derive");
    expect(runSplash(window)).toBeNull();
    window.history.replaceState(null, "", "/");
    reduced = true;
    expect(runSplash(window)).toBeNull();
    reduced = false;
    localStorage.setItem(PREFS_KEY, JSON.stringify({ theme: "system", splash: false }));
    expect(runSplash(window)).toBeNull();
    expect(overlay()).toBeNull();
  });

  it("uses the short Logo transition on low-end devices", () => {
    Object.defineProperty(window.navigator, "hardwareConcurrency", { configurable: true, value: 2 });
    signalAppReady(window);
    runSplash(window);
    vi.advanceTimersByTime(totalDuration(FAST_TIMELINE) + 50);
    expect(overlay()).toBeNull();
    Object.defineProperty(window.navigator, "hardwareConcurrency", { configurable: true, value: 8 });
  });

  it("gets out of the way at once when canvas is unavailable", () => {
    vi.mocked(HTMLCanvasElement.prototype.getContext).mockReturnValue(null);
    runSplash(window);
    expect(overlay()).toBeNull();
  });
});
