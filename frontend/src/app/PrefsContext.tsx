import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { applyTheme, readPrefs, resolveTheme, writePrefs, PREFS_KEY, type Prefs } from "./prefsStore";
import { duration } from "../design/motion";

type PrefsValue = {
  prefs: Prefs;
  /** Persists locally; `saved` is false when the browser refuses storage. */
  update: (patch: Partial<Prefs>) => void;
  saved: boolean;
  resolvedTheme: "light" | "dark";
};

const PrefsContext = createContext<PrefsValue | null>(null);

const darkQuery = () => {
  try {
    return window.matchMedia?.("(prefers-color-scheme: dark)") ?? null;
  } catch {
    return null;
  }
};

export function PrefsProvider({ children }: { children: ReactNode }) {
  const [prefs, setPrefs] = useState<Prefs>(() => readPrefs());
  const latest = useRef(prefs);
  const [saved, setSaved] = useState(true);
  const [systemDark, setSystemDark] = useState(() => darkQuery()?.matches ?? false);
  const resolvedTheme = resolveTheme(prefs.theme, systemDark);

  // Theme switch: colours cross-fade for --dur-theme via a short-lived class (CSS transitions,
  // so clicks and typing are never blocked; View Transitions would freeze input meanwhile).
  const applied = useRef<string | null>(null);
  useEffect(() => {
    const root = document.documentElement;
    const first = applied.current === null;
    applied.current = resolvedTheme;
    const ms = duration("theme");
    if (first || !ms || root.dataset.theme === resolvedTheme) {
      applyTheme(resolvedTheme);
      return;
    }
    root.classList.add("theme-transition");
    applyTheme(resolvedTheme);
    const timer = window.setTimeout(() => root.classList.remove("theme-transition"), ms + 60);
    return () => {
      window.clearTimeout(timer);
      root.classList.remove("theme-transition");
    };
  }, [resolvedTheme]);

  useEffect(() => {
    const media = darkQuery();
    const onChange = (event: MediaQueryListEvent) => setSystemDark(event.matches);
    media?.addEventListener?.("change", onChange);
    // Another tab changed preferences.
    const onStorage = (event: StorageEvent) => {
      if (event.key !== PREFS_KEY) return;
      latest.current = readPrefs();
      setPrefs(latest.current);
    };
    window.addEventListener("storage", onStorage);
    return () => {
      media?.removeEventListener?.("change", onChange);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const update = useCallback((patch: Partial<Prefs>) => {
    const next = { ...latest.current, ...patch };
    latest.current = next;
    setPrefs(next);
    setSaved(writePrefs(next));
  }, []);

  return (
    <PrefsContext.Provider value={{ prefs, update, saved, resolvedTheme }}>
      {children}
    </PrefsContext.Provider>
  );
}

/** Components rendered outside the provider (isolated tests) read current values, read-only. */
export function usePrefs(): PrefsValue {
  const value = useContext(PrefsContext);
  return value ?? { prefs: readPrefs(), update: () => {}, saved: false, resolvedTheme: "light" };
}
