import { useContext, useEffect, useMemo, useRef, type ReactElement, type ReactNode } from "react";
import { flushSync } from "react-dom";
import {
  Navigate,
  UNSAFE_NavigationContext,
  matchRoutes,
  parsePath,
  useLocation,
  type RouteObject,
  type To,
} from "react-router-dom";
import { motionScale } from "../design/motion";
import { isPreloadable } from "./lazyPage";
import { createTransitionPush, type MotionMode, type ViewTransitionLike } from "./transitionPush";

/** Fetches the code of every lazy page a pathname renders (layout and page). */
export function routePreloader(routes: RouteObject[]) {
  return (pathname: string): Promise<void> => {
    const pages = (matchRoutes(routes, pathname) ?? []).flatMap((match) => {
      const type: unknown = (match.route.element as ReactElement | undefined)?.type;
      return isPreloadable(type) ? [type] : [];
    });
    return Promise.all(pages.map((page) => page.preload())).then(() => undefined);
  };
}

/**
 * Where a static `<Navigate to="…">` route sends a pathname (e.g. 刷题 /practice), else null.
 * Pushing the target directly leaves the same history as push + redirect, and lets the
 * transition snapshot the real page instead of the blank redirect.
 */
export function resolveRedirect(routes: RouteObject[], pathname: string): string | null {
  const leaf = matchRoutes(routes, pathname)?.at(-1)?.route.element as ReactElement<{ to?: unknown }> | undefined;
  return leaf?.type === Navigate && typeof leaf.props.to === "string" && leaf.props.to.startsWith("/")
    ? leaf.props.to
    : null;
}

const pathnameOf = (to: To) => (typeof to === "string" ? parsePath(to).pathname : to.pathname);

function motionMode(): MotionMode {
  if (document.visibilityState === "hidden" || motionScale() === 0) return "off";
  return document.documentElement.dataset.motion === "lite" ? "lite" : "full";
}

type StartViewTransition = (update: () => Promise<void>) => ViewTransitionLike;

/**
 * Gives every Link / navigate() below it iOS-style page transitions (spec §5.2) by wrapping the
 * router's navigator: only `push` changes; replace (redirects), back / forward and hrefs are the
 * router's own. Requires a router without the v7_startTransition flag, so flushSync can put the
 * new page in the DOM before the View Transition takes its snapshot.
 */
export function TransitionNavigation({ routes, children }: { routes: RouteObject[]; children: ReactNode }) {
  const context = useContext(UNSAFE_NavigationContext);
  const location = useLocation();
  const latest = useRef(location);
  latest.current = location;
  const preload = useMemo(() => routePreloader(routes), [routes]);
  const controller = useMemo(() => {
    const { navigator } = context;
    return createTransitionPush({
      push: (to, state, opts) =>
        (navigator.push as (to: unknown, state?: unknown, opts?: unknown) => void)(to, state, opts),
      currentPath: () => latest.current.pathname,
      preload,
      start: (() => {
        const doc = document as Document & { startViewTransition?: StartViewTransition };
        return typeof doc.startViewTransition === "function"
          ? (update: () => Promise<void>) => {
              // An unfinished smooth scroll (TOC, 下一节) would otherwise resume on the new page
              // after the transition, undoing RouteScroll. Stop it where it is, before the snapshot.
              window.scrollTo({ top: window.scrollY, behavior: "instant" });
              return doc.startViewTransition!(update);
            }
          : undefined;
      })(),
      flush: (fn) => flushSync(fn),
      mode: motionMode,
      isLoading: () => !!document.querySelector('.page-loading, [data-route-pending="true"]'),
      setPhase: (dir, pending) => {
        const root = document.documentElement;
        if (dir) root.dataset.navDir = dir;
        else delete root.dataset.navDir;
        if (pending) root.dataset.navPending = "";
        else delete root.dataset.navPending;
      },
    });
  }, [context, preload]);
  useEffect(() => () => controller.dispose(), [controller]);
  // Prefetch on intent (hover, touch, focus) so the 300 ms budget at click time is usually met.
  useEffect(() => {
    const prefetch = (event: Event) => {
      const link = (event.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!link || link.target || link.hasAttribute("download") || link.origin !== window.location.origin) return;
      const path = resolveRedirect(routes, link.pathname) ?? link.pathname;
      preload(path).catch(() => {}); // a click retries; failures only cost the animation
    };
    const options = { capture: true, passive: true };
    for (const type of ["pointerover", "touchstart", "focusin"]) document.addEventListener(type, prefetch, options);
    return () => {
      for (const type of ["pointerover", "touchstart", "focusin"])
        document.removeEventListener(type, prefetch, options);
    };
  }, [routes, preload]);
  const value = useMemo(() => {
    const push = (to: To, state?: unknown, opts?: unknown) => {
      const path = pathnameOf(to);
      const redirect = path ? resolveRedirect(routes, path) : null;
      controller.push(redirect ?? to, state, opts);
    };
    return { ...context, navigator: Object.assign(Object.create(context.navigator), { push }) };
  }, [context, controller, routes]);
  return <UNSAFE_NavigationContext.Provider value={value}>{children}</UNSAFE_NavigationContext.Provider>;
}
