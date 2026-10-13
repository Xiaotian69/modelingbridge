import { useLayoutEffect, useRef } from "react";
import { useLocation, useNavigationType } from "react-router-dom";
import { prefersReducedMotion } from "../../design/motion";

/** Room for sticky bars above a hash target: its CSS scroll-margin-top, else 90px. */
function offsetFor(target: HTMLElement) {
  const margin = parseFloat(getComputedStyle(target).scrollMarginTop);
  return Number.isFinite(margin) && margin > 0 ? margin : 90;
}

/**
 * Where to land after a navigation that asked to come back to a spot, e.g. the return bar:
 * keep `anchorId` at the same distance from the top as when the learner left
 * (robust to content above it changing), else fall back to `scrollY`.
 */
export type ScrollRestore = { anchorId?: string; anchorTop?: number; scrollY?: number };

const STORE_KEY = "mb.v2.scroll";
/**
 * History key + URL. On a full page load every URL gets the router key "default", so the key
 * alone would make a new deep link (e.g. /learn/ahp#synthesis) reuse the position saved for
 * whatever page was loaded before it in this tab. Reloading the same URL still restores.
 */
const positionKey = (l: { key: string; pathname: string; search: string; hash: string }) =>
  `${l.key}|${l.pathname}${l.search}${l.hash}`;
const MAX_ENTRIES = 50;

/** Back/forward positions per history entry; kept in sessionStorage so they survive a reload. */
function loadPositions(): Map<string, number> {
  try {
    const raw = JSON.parse(sessionStorage.getItem(STORE_KEY) || "[]") as [string, number][];
    return new Map(raw.filter(([k, v]) => typeof k === "string" && Number.isFinite(v)));
  } catch {
    return new Map();
  }
}
function savePositions(map: Map<string, number>) {
  try {
    sessionStorage.setItem(STORE_KEY, JSON.stringify([...map].slice(-MAX_ENTRIES)));
  } catch {
    /* in-memory positions still work for this page view */
  }
}

/**
 * Scroll policy (motion system):
 * - Back / forward: restore the saved position instantly (no animation to fight).
 * - New page: land instantly (the page itself fades in); hash → target minus sticky offset.
 * - Same page, new hash (TOC, 上一节 / 下一节): smooth scroll, unless reduced motion.
 * Waits for lazy content before resolving anything.
 */
export function RouteScroll() {
  const location = useLocation();
  const navigation = useNavigationType();
  const positions = useRef<Map<string, number> | null>(null);
  if (!positions.current) positions.current = loadPositions();
  const previousPath = useRef<string | null>(null);
  useLayoutEffect(() => {
    const previous = window.history.scrollRestoration;
    window.history.scrollRestoration = "manual";
    return () => {
      window.history.scrollRestoration = previous;
    };
  }, []);
  useLayoutEffect(() => {
    const samePage = previousPath.current === location.pathname;
    previousPath.current = location.pathname;
    const restoreRequest = (location.state as { restore?: ScrollRestore } | null)?.restore;
    let done = false;
    let frame = 0;
    const restore = () => {
      if (
        done ||
        document.querySelector('.page-loading, [data-route-pending="true"]')
      )
        return;
      const saved =
        navigation === "POP" ? positions.current!.get(positionKey(location)) : undefined;
      let target: HTMLElement | null = null;
      try {
        target = location.hash
          ? document.getElementById(decodeURIComponent(location.hash.slice(1)))
          : null;
      } catch {
        /* Malformed URL hash: use page top. */
      }
      let requested: number | undefined;
      if (restoreRequest) {
        const anchor = restoreRequest.anchorId ? document.getElementById(restoreRequest.anchorId) : null;
        if (anchor && typeof restoreRequest.anchorTop === "number")
          requested = anchor.getBoundingClientRect().top + window.scrollY - restoreRequest.anchorTop;
        else if (typeof restoreRequest.scrollY === "number") requested = restoreRequest.scrollY;
      }
      const top = Math.max(
        0,
        saved ??
          requested ??
          (target ? target.getBoundingClientRect().top + window.scrollY - offsetFor(target) : 0),
      );
      const smooth = samePage && navigation !== "POP" && !!target && !prefersReducedMotion();
      window.scrollTo({ top, behavior: smooth ? "smooth" : "instant" });
      done = true;
    };
    const observer = new MutationObserver(() => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(restore);
    });
    observer.observe(document.getElementById("main-content") || document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["data-route-pending"],
    });
    frame = requestAnimationFrame(restore);
    const record = () => {
      if (!done) return;
      positions.current!.set(positionKey(location), window.scrollY);
    };
    const persist = () => savePositions(positions.current!);
    window.addEventListener("scroll", record, { passive: true });
    window.addEventListener("pagehide", persist);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("scroll", record);
      window.removeEventListener("pagehide", persist);
      persist();
    };
  }, [location.key, location.hash, location.pathname, location.search, location.state, navigation]);
  return null;
}
