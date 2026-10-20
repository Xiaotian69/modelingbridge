import { createElement, lazy, type ComponentType } from "react";

/** A route page whose code can be fetched ahead of navigation. */
export type PreloadablePage<T extends ComponentType<any>> = T & { preload(): Promise<void> };

/**
 * React.lazy plus preload. React.lazy suspends on its first render even when the module is
 * already downloaded, so a View Transition's flushSync would flash the Suspense fallback. Once
 * `preload()` has resolved this renders the loaded component directly and never suspends.
 * Only the page's own module is covered: children it lazy-loads may still suspend.
 */
export function lazyPage<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>,
): PreloadablePage<T> {
  let resolved: T | null = null;
  let pending: Promise<void> | null = null;
  const preload = () =>
    (pending ??= factory().then(
      (module) => {
        resolved = module.default;
      },
      (error: unknown) => {
        pending = null; // a later navigation may retry (e.g. after a flaky network)
        throw error;
      },
    ));
  const Lazy = lazy(() => preload().then(() => ({ default: resolved! })));
  // React reconciles a resolved lazy type with its component, so a page first shown through
  // Lazy is not remounted when later renders hand over the component directly.
  const Page = (props: object) => createElement((resolved ?? Lazy) as ComponentType<object>, props);
  return Object.assign(Page, { preload }) as unknown as PreloadablePage<T>;
}

export function isPreloadable(type: unknown): type is { preload(): Promise<void> } {
  return typeof type === "function" && typeof (type as { preload?: unknown }).preload === "function";
}
