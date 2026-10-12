/** Inlined into <head> before first paint so a dark preference never flashes white. */
import { applyTheme, readPrefs, resolveTheme } from "./prefsStore";

let prefersDark = false;
try {
  prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
} catch {
  /* Very old browsers: stay light. */
}
applyTheme(resolveTheme(readPrefs().theme, prefersDark));
