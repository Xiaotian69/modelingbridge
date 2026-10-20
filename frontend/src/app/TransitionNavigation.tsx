import { useContext, useEffect, useMemo, useRef, type ReactElement, type ReactNode } from "react";
import { flushSync } from "react-dom";
import { UNSAFE_NavigationContext, matchRoutes, useLocation, type RouteObject } from "react-router-dom";
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
      locationKey: () => latest.current.key,
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
  const value = useMemo(
    () => ({ ...context, navigator: Object.assign(Object.create(context.navigator), { push: controller.push }) }),
    [context, controller],
  );
  return <UNSAFE_NavigationContext.Provider value={value}>{children}</UNSAFE_NavigationContext.Provider>;
}
