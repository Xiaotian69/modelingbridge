import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { applyTheme, readPrefs, resolveTheme, writePrefs, PREFS_KEY, type Prefs } from "./prefsStore";

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

  useEffect(() => {
    applyTheme(resolvedTheme);
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
