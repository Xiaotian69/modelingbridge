/** Inlined into <head> before first paint so a dark preference never flashes white. */
import { applyTheme, readPrefs, resolveTheme } from "./prefsStore";
import { isLowEndForMotion } from "../design/motion";

let prefersDark = false;
try {
  prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
} catch {
  /* Very old browsers: stay light. */
}
applyTheme(resolveTheme(readPrefs().theme, prefersDark));
// Low-end devices: shorter motion (tokens scale by 0.6) and no page slide.
try {
  if (isLowEndForMotion(navigator as Navigator & { deviceMemory?: number }))
    document.documentElement.dataset.motion = "lite";
} catch {
  /* ignore */
}
