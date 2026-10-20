import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  markRouteSettled,
  registerPendingRestore,
  settleGeneration,
  waitForRouteSettled,
} from "../components/motion/routeSettled";
import {
  createTransitionPush,
  isViewTransitionNavigation,
  type MotionMode,
  type TransitionDeps,
  type ViewTransitionLike,
} from "./transitionPush";

beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  vi.useRealTimers();
  registerPendingRestore(null);
});

describe("routeSettled", () => {
  it("resolves true when marked after", async () => {
    const wait = waitForRouteSettled(settleGeneration(), 100);
    markRouteSettled();
    await expect(wait).resolves.toBe(true);
  });
  it("resolves false after timeout", async () => {
    const wait = waitForRouteSettled(settleGeneration(), 100);
    await vi.advanceTimersByTimeAsync(100);
    await expect(wait).resolves.toBe(false);
  });
  it("marking twice settles once, and a late mark after timeout changes nothing", async () => {
    const results: boolean[] = [];
    const g = settleGeneration();
    void waitForRouteSettled(g, 100).then((v) => results.push(v));
    markRouteSettled();
    markRouteSettled();
    await vi.advanceTimersByTimeAsync(200);
    expect(results).toEqual([true]);
  });
  it("is already settled when the generation moved before waiting", async () => {
    const g = settleGeneration();
    markRouteSettled();
    await expect(waitForRouteSettled(g, 100)).resolves.toBe(true);
  });
});

function deferred() {
  let resolve!: () => void;
  let reject!: (e: unknown) => void;
  const promise = new Promise<void>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

function makeDeps(overrides: Partial<TransitionDeps> = {}) {
  let path = "/learn";
  let key = "k0";
  const preloads = new Map<string, ReturnType<typeof deferred>>();
  const transitions: (ViewTransitionLike & { skipTransition: ReturnType<typeof vi.fn> })[] = [];
  const phases: [string | null, boolean][] = [];
  const pushed: string[] = [];
  let loading = false;
  let mode: MotionMode = "full";
  const deps: TransitionDeps = {
    push: vi.fn((to) => {
      path = typeof to === "string" ? to : (to.pathname ?? path);
      key = `k${pushed.length + 1}`;
      pushed.push(path);
    }),
    currentPath: () => path,
    locationKey: () => key,
    preload: vi.fn((pathname: string) => {
      const d = deferred();
      preloads.set(pathname, d);
      return d.promise;
    }),
    start: vi.fn((update: () => Promise<void>) => {
      const done = Promise.resolve().then(update);
      const vt = {
        ready: done,
        finished: done.then(() => undefined),
        skipTransition: vi.fn(),
      };
      transitions.push(vt);
      return vt;
    }),
    flush: (fn) => fn(),
    mode: () => mode,
    isLoading: () => loading,
    setPhase: (dir, pending) => phases.push([dir, pending]),
    ...overrides,
  };
  return {
    deps,
    preloads,
    transitions,
    phases,
    pushed,
    setLoading: (v: boolean) => (loading = v),
    setMode: (m: MotionMode) => (mode = m),
    popTo: (p: string) => {
      path = p;
      key = "pop";
    },
  };
}

/** Lets microtasks run and the route settle immediately after a commit. */
async function settleSoon() {
  await vi.advanceTimersByTimeAsync(0);
  markRouteSettled();
  await vi.advanceTimersByTimeAsync(0);
}

describe("createTransitionPush", () => {
  it("animates forward: preload → start → commit once", async () => {
    const t = makeDeps();
    const { push } = createTransitionPush(t.deps);
    push("/learn/ahp");
    expect(t.deps.push).not.toHaveBeenCalled();
    t.preloads.get("/learn/ahp")!.resolve();
    await settleSoon();
    expect(t.deps.start).toHaveBeenCalledTimes(1);
    expect(t.pushed).toEqual(["/learn/ahp"]);
    expect(t.phases).toContainEqual(["forward", false]);
    expect(t.transitions[0].skipTransition).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(0);
    expect(t.phases.at(-1)).toEqual([null, false]);
    expect(isViewTransitionNavigation()).toBe(false);
  });

  it("settles without waiting for a frame: the pending scroll restore runs right after the commit", async () => {
    // Browsers pause rendering (and requestAnimationFrame) while a View Transition update runs.
    const restore = vi.fn(() => markRouteSettled());
    const t = makeDeps({
      push: vi.fn(() => registerPendingRestore(restore)), // RouteScroll registers during the commit
    });
    const { push } = createTransitionPush(t.deps);
    push("/learn/ahp");
    t.preloads.get("/learn/ahp")!.resolve();
    await vi.advanceTimersByTimeAsync(0);
    expect(restore).toHaveBeenCalledTimes(1);
    expect(t.transitions[0].skipTransition).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(200);
    expect(t.transitions[0].skipTransition).not.toHaveBeenCalled();
  });

  it("latest intent wins: A preloads after B", async () => {
    const t = makeDeps();
    const { push } = createTransitionPush(t.deps);
    push("/learn/ahp");
    push("/learn/topsis");
    t.preloads.get("/learn/topsis")!.resolve();
    await settleSoon();
    t.preloads.get("/learn/ahp")!.resolve();
    await settleSoon();
    await vi.advanceTimersByTimeAsync(400);
    expect(t.pushed).toEqual(["/learn/topsis"]);
  });

  it("a click during a running transition does not commit the older target", async () => {
    // A's transition has started but its update has not run yet when B arrives.
    let pendingUpdate: (() => Promise<void>) | null = null;
    const t = makeDeps({
      start: vi.fn((update: () => Promise<void>) => {
        pendingUpdate = update;
        const vt = { ready: Promise.resolve(), finished: Promise.resolve(), skipTransition: vi.fn() };
        return vt;
      }),
    });
    const { push } = createTransitionPush(t.deps);
    push("/learn/ahp");
    t.preloads.get("/learn/ahp")!.resolve();
    await vi.advanceTimersByTimeAsync(0);
    const updateA = pendingUpdate!;
    push("/learn/topsis");
    await updateA();
    t.preloads.get("/learn/topsis")!.resolve();
    await vi.advanceTimersByTimeAsync(0);
    const updateB = pendingUpdate!();
    markRouteSettled();
    await updateB;
    expect(t.pushed).toEqual(["/learn/topsis"]);
  });

  it("preload slower than 300ms commits once without a transition, late resolve is ignored", async () => {
    const t = makeDeps();
    const { push } = createTransitionPush(t.deps);
    push("/learn/ahp");
    await vi.advanceTimersByTimeAsync(299);
    expect(t.pushed).toEqual([]);
    await vi.advanceTimersByTimeAsync(1);
    expect(t.pushed).toEqual(["/learn/ahp"]);
    expect(t.deps.start).not.toHaveBeenCalled();
    t.preloads.get("/learn/ahp")!.resolve();
    await settleSoon();
    expect(t.pushed).toEqual(["/learn/ahp"]);
    expect(t.phases.at(-1)).toEqual([null, false]);
  });

  it("preload failure commits plainly", async () => {
    const t = makeDeps();
    const { push } = createTransitionPush(t.deps);
    push("/learn/ahp");
    t.preloads.get("/learn/ahp")!.reject(new Error("chunk"));
    await settleSoon();
    expect(t.pushed).toEqual(["/learn/ahp"]);
    expect(t.deps.start).not.toHaveBeenCalled();
  });

  it("start throwing commits once", async () => {
    const t = makeDeps({
      start: vi.fn(() => {
        throw new Error("InvalidStateError");
      }),
    });
    const { push } = createTransitionPush(t.deps);
    push("/learn/ahp");
    t.preloads.get("/learn/ahp")!.resolve();
    await settleSoon();
    expect(t.pushed).toEqual(["/learn/ahp"]);
    expect(isViewTransitionNavigation()).toBe(false);
    expect(t.phases.at(-1)).toEqual([null, false]);
  });

  it("settle timeout skips the animation but does not commit again", async () => {
    const t = makeDeps();
    const { push } = createTransitionPush(t.deps);
    push("/learn/ahp");
    t.preloads.get("/learn/ahp")!.resolve();
    await vi.advanceTimersByTimeAsync(0);
    expect(t.pushed).toEqual(["/learn/ahp"]);
    await vi.advanceTimersByTimeAsync(100);
    expect(t.transitions[0].skipTransition).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(500);
    expect(t.pushed).toEqual(["/learn/ahp"]);
  });

  it("loading after commit skips", async () => {
    const t = makeDeps();
    t.setLoading(true);
    const { push } = createTransitionPush(t.deps);
    push("/learn/ahp");
    t.preloads.get("/learn/ahp")!.resolve();
    await vi.advanceTimersByTimeAsync(0);
    expect(t.pushed).toEqual(["/learn/ahp"]);
    expect(t.transitions[0].skipTransition).toHaveBeenCalled();
  });

  it.each([
    ["mode off", "/learn/ahp", "off"],
    ["kind none", "/learn", "full"],
  ] as const)("%s → plain push, no preload wait", async (_label, to, mode) => {
    const t = makeDeps();
    t.setMode(mode);
    const { push } = createTransitionPush(t.deps);
    push(to);
    expect(t.pushed).toEqual([to]);
    expect(t.deps.preload).not.toHaveBeenCalled();
    expect(t.deps.start).not.toHaveBeenCalled();
  });

  it("no View Transitions support → plain push", () => {
    const t = makeDeps({ start: undefined });
    const { push } = createTransitionPush(t.deps);
    push("/learn/ahp");
    expect(t.pushed).toEqual(["/learn/ahp"]);
  });

  it("lite uses fade", async () => {
    const t = makeDeps();
    t.setMode("lite");
    const { push } = createTransitionPush(t.deps);
    push("/learn/ahp");
    t.preloads.get("/learn/ahp")!.resolve();
    await settleSoon();
    expect(t.phases).toContainEqual(["fade", false]);
    expect(t.phases).not.toContainEqual(["forward", false]);
  });

  it("POP during preload abandons", async () => {
    const t = makeDeps();
    const { push } = createTransitionPush(t.deps);
    push("/learn/ahp");
    t.popTo("/");
    t.preloads.get("/learn/ahp")!.resolve();
    await settleSoon();
    await vi.advanceTimersByTimeAsync(400);
    expect(t.deps.push).not.toHaveBeenCalled();
    expect(t.phases.at(-1)).toEqual([null, false]);
  });

  it("dispose abandons pending", async () => {
    const t = makeDeps();
    const nav = createTransitionPush(t.deps);
    nav.push("/learn/ahp");
    nav.dispose();
    t.preloads.get("/learn/ahp")!.resolve();
    await settleSoon();
    await vi.advanceTimersByTimeAsync(400);
    expect(t.deps.push).not.toHaveBeenCalled();
  });

  it("passes state and options through untouched", async () => {
    const t = makeDeps();
    const { push } = createTransitionPush(t.deps);
    const state = { restore: { scrollY: 5 } };
    push({ pathname: "/learn/ahp", hash: "#x" }, state, { preventScrollReset: true });
    t.preloads.get("/learn/ahp")!.resolve();
    await settleSoon();
    expect(t.deps.push).toHaveBeenCalledWith({ pathname: "/learn/ahp", hash: "#x" }, state, {
      preventScrollReset: true,
    });
  });
});
