import { EASING, duration } from "./motion";

/**
 * The page-enter fade + rise (motion system §page) on the main content. Layout plays it on
 * forward navigation; a View Transition that had to be skipped plays it as its fallback.
 * No-op under reduced motion; opacity only on low-end devices.
 */
export function playPageEnter(main: HTMLElement | null | undefined): Animation | undefined {
  const ms = duration("page");
  if (!ms) return undefined;
  const lite = document.documentElement.dataset.motion === "lite";
  return main?.animate?.(
    lite
      ? [{ opacity: 0.6 }, { opacity: 1 }]
      : [
          { opacity: 0.6, transform: "translateY(6px)" },
          { opacity: 1, transform: "none" },
        ],
    { duration: ms, easing: EASING.enter },
  );
}
