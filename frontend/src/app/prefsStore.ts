/**
 * Local display preferences. Shared by the inline boot scripts (theme, splash)
 * and the React app, so it must stay dependency-free.
 */
export const PREFS_KEY = "mb.v2.prefs";

export type ThemePref = "system" | "light" | "dark";
export type Prefs = { theme: ThemePref; splash: boolean };

export const DEFAULT_PREFS: Prefs = { theme: "system", splash: true };
const THEMES: ThemePref[] = ["system", "light", "dark"];

type StorageLike = Pick<Storage, "getItem" | "setItem">;

function storage(): StorageLike | null {
  try {
    return typeof localStorage === "undefined" ? null : localStorage;
  } catch {
    return null;
  }
}

export function readPrefs(store: StorageLike | null = storage()): Prefs {
  try {
    const raw: unknown = JSON.parse(store?.getItem(PREFS_KEY) || "null");
    if (!raw || typeof raw !== "object") return { ...DEFAULT_PREFS };
    const value = raw as Partial<Record<keyof Prefs, unknown>>;
    return {
      theme: THEMES.includes(value.theme as ThemePref)
        ? (value.theme as ThemePref)
        : DEFAULT_PREFS.theme,
      splash: typeof value.splash === "boolean" ? value.splash : DEFAULT_PREFS.splash,
    };
  } catch {
    return { ...DEFAULT_PREFS };
  }
}

/** Returns false when the browser refuses to store (private mode, blocked site data). */
export function writePrefs(prefs: Prefs, store: StorageLike | null = storage()): boolean {
  try {
    if (!store) return false;
    store.setItem(PREFS_KEY, JSON.stringify(prefs));
    return true;
  } catch {
    return false;
  }
}

export function resolveTheme(pref: ThemePref, prefersDark: boolean): "light" | "dark" {
  return pref === "system" ? (prefersDark ? "dark" : "light") : pref;
}

export function nextTheme(pref: ThemePref): ThemePref {
  return THEMES[(THEMES.indexOf(pref) + 1) % THEMES.length];
}

export function applyTheme(theme: "light" | "dark", root: HTMLElement = document.documentElement) {
  root.dataset.theme = theme;
}
