import { parsePath, type To } from "react-router-dom";
import { runPendingRestore, settleGeneration, waitForRouteSettled } from "../components/motion/routeSettled";
import { navKind, type NavKind } from "./navMotion";

export type MotionMode = "full" | "lite" | "off";
export type ViewTransitionLike = {
  finished: Promise<unknown>;
  ready: Promise<unknown>;
  skipTransition(): void;
};
type Direction = Exclude<NavKind, "none">;

export type TransitionDeps = {
  /** The router's own navigator.push. */
  push(to: To, state?: unknown, opts?: unknown): void;
  currentPath(): string;
  preload(pathname: string): Promise<void>;
  /** document.startViewTransition, bound; undefined where unsupported. */
  start?: (update: () => Promise<void>) => ViewTransitionLike;
  /** flushSync: the new page must be in the DOM before the update callback returns. */
  flush(fn: () => void): void;
  mode(): MotionMode;
  /** A route-level or page-level loading placeholder is showing. */
  isLoading(): boolean;
  setPhase(dir: Direction | null, pending: boolean): void;
  /** Plays the ordinary page fade when a started transition had to be skipped. */
  fallback?(): void;
  preloadTimeoutMs?: number;
  settleTimeoutMs?: number;
};

let viewTransitionNavigation = false;
/** True while a navigation runs inside a View Transition; Layout then skips its own page fade. */
export const isViewTransitionNavigation = () => viewTransitionNavigation;

/**
 * Forward navigations through a View Transition (spec §5.2). Rules:
 * - the latest push wins; older pending pushes never commit;
 * - preload waits at most 300 ms, then the page opens without animation;
 * - every push commits at most once, whatever times out or throws afterwards;
 * - after the commit, a page still loading or a scroll not settled within 100 ms skips the
 *   animation, never the navigation.
 */
export function createTransitionPush(deps: TransitionDeps) {
  const preloadTimeout = deps.preloadTimeoutMs ?? 300;
  const settleTimeout = deps.settleTimeoutMs ?? 100;
  let seq = 0;
  let current: ViewTransitionLike | null = null;

  const stopCurrent = () => {
    current?.skipTransition();
    current = null;
  };
  const reset = () => {
    viewTransitionNavigation = false;
    deps.setPhase(null, false);
  };

  function push(to: To, state?: unknown, opts?: unknown) {
    const id = ++seq;
    const from = deps.currentPath();
    const target = (typeof to === "string" ? parsePath(to) : to).pathname || from;
    const kind = navKind(from, target);
    const mode = deps.mode();
    let committed = false;
    const commit = () => {
      if (committed) return;
      committed = true;
      deps.push(to, state, opts);
    };

    if (kind === "none" || mode === "off" || !deps.start) {
      stopCurrent();
      reset();
      commit();
      return;
    }
    const start = deps.start;
    // Abandon when a newer push exists or the page changed underneath (back / forward). A replace
    // on the same page (filters, search params) must not swallow the click.
    const stale = () => id !== seq || deps.currentPath() !== from;
    deps.setPhase(null, true);

    let timer: ReturnType<typeof setTimeout> | undefined;
    const timedOut = new Promise<"timeout">((resolve) => {
      timer = setTimeout(() => resolve("timeout"), preloadTimeout);
    });
    const loaded = deps.preload(target).then(
      () => "ready" as const,
      () => "failed" as const,
    );
    void Promise.race([loaded, timedOut]).then((outcome) => {
      clearTimeout(timer);
      if (stale()) {
        if (id === seq) reset(); // back / forward: nothing newer owns the phase
        return;
      }
      if (outcome !== "ready") {
        stopCurrent();
        reset();
        commit();
        return;
      }
      // Re-read now: reduced motion, a hidden tab or lite mode may have changed while waiting.
      const modeNow = deps.mode();
      if (modeNow === "off") {
        stopCurrent();
        reset();
        commit();
        return;
      }
      const dir: Direction = modeNow === "lite" ? "fade" : kind;
      stopCurrent();
      let vt: ViewTransitionLike | null = null;
      let skipEarly = false;
      const skip = () => {
        if (vt) vt.skipTransition();
        else skipEarly = true;
      };
      viewTransitionNavigation = true;
      deps.setPhase(dir, false);
      try {
        vt = start(async () => {
          if (stale()) {
            skip(); // a newer click arrived before the old snapshot was taken
            return;
          }
          const before = settleGeneration();
          deps.flush(commit);
          runPendingRestore(); // frames are paused during this callback: scroll now, not next frame
          if (deps.isLoading()) {
            skip();
            return;
          }
          const settled = await waitForRouteSettled(before, settleTimeout);
          if (!settled || deps.isLoading()) skip();
        });
      } catch {
        reset();
        commit();
        return;
      }
      if (skipEarly) vt.skipTransition();
      current = vt;
      const done = vt;
      // Skipped after the commit (still loading, scroll not settled, browser gave up): the page
      // is there but nothing animated it, so play the ordinary fade, once, unless a newer
      // navigation or back / forward has taken over.
      done.ready.catch(() => {
        if (id === seq && committed) deps.fallback?.();
      });
      void done.finished
        .catch(() => {})
        .finally(() => {
          if (current !== done) return;
          current = null;
          reset();
        });
    });
  }

  /** Back / forward or unmount: drop any pending push and stop a running transition now. */
  function cancel() {
    seq += 1;
    stopCurrent();
    reset();
  }

  return { push, cancel, dispose: cancel };
}
