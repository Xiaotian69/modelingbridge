import { describe, expect, it } from "vitest";
import { activeNav } from "./navigation";
import {
  DEFAULT_PREFS,
  PREFS_KEY,
  nextTheme,
  readPrefs,
  resolveTheme,
  writePrefs,
} from "./prefsStore";
import { searchEntries, staticEntries } from "./searchIndex";

const memory = () => {
  const data = new Map<string, string>();
  return {
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => void data.set(k, v),
    data,
  };
};

describe("navigation", () => {
  it.each([
    ["/", "/"],
    ["/learn", "/learn"],
    ["/learn/linear-programming", "/learn"],
    ["/practice/linear-programming", "/practice"],
    ["/quest", "/quest"],
    ["/cases/bike-demand-demo", "/quest"],
    ["/library/tools", "/library"],
    ["/records", "/records"],
    ["/about", null],
    ["/learning", null],
  ])("%s belongs to %s", (path, expected) => {
    expect(activeNav(path)).toBe(expected);
  });
});

describe("preferences", () => {
  it("defaults to system theme with the splash on", () => {
    expect(readPrefs(memory())).toEqual(DEFAULT_PREFS);
    expect(DEFAULT_PREFS).toEqual({ theme: "system", splash: true, nudges: true });
  });
  it("round-trips and ignores invalid values field by field", () => {
    const store = memory();
    expect(writePrefs({ theme: "dark", splash: false, nudges: false }, store)).toBe(true);
    expect(readPrefs(store)).toEqual({ theme: "dark", splash: false, nudges: false });
    store.setItem(PREFS_KEY, JSON.stringify({ theme: "purple", splash: "yes" }));
    expect(readPrefs(store)).toEqual(DEFAULT_PREFS);
    store.setItem(PREFS_KEY, "{not json");
    expect(readPrefs(store)).toEqual(DEFAULT_PREFS);
  });
  it("reports failure when storage refuses writes", () => {
    const refusing = {
      getItem: () => null,
      setItem: () => {
        throw new DOMException("blocked", "SecurityError");
      },
    };
    expect(writePrefs(DEFAULT_PREFS, refusing)).toBe(false);
    expect(writePrefs(DEFAULT_PREFS, null)).toBe(false);
  });
  it("resolves and cycles themes", () => {
    expect(resolveTheme("system", true)).toBe("dark");
    expect(resolveTheme("system", false)).toBe("light");
    expect(resolveTheme("light", true)).toBe("light");
    expect(nextTheme("system")).toBe("light");
    expect(nextTheme("light")).toBe("dark");
    expect(nextTheme("dark")).toBe("system");
  });
});

describe("home search index", () => {
  const entries = staticEntries();
  it("links taught methods to the lesson and the rest to the quick reference", () => {
    const lp = entries.find((e) => e.id === "method:linear-programming")!;
    expect(lp.href).toBe("/learn/linear-programming");
    const others = entries.filter((e) => e.group === "方法速查" && e !== lp);
    expect(others.length).toBeGreaterThan(0);
    for (const e of others) expect(e.href.startsWith("/learn/reference#model-")).toBe(true);
  });
  it("keeps classic problems without a teaching case on the experimental workbench", () => {
    const experimental = entries.filter((e) => e.group === "赛题" && e.href.startsWith("/workbench"));
    expect(experimental.length).toBeGreaterThan(0);
    for (const e of experimental) expect(e.badge).toBe("AI 工作台（实验）");
  });
  it("requires every term to match and returns nothing for an empty query", () => {
    expect(searchEntries(entries, "   ")).toEqual([]);
    expect(searchEntries(entries, "线性规划 练习").map((e) => e.id)).toContain("practice:lp");
    expect(searchEntries(entries, "线性规划 不存在的词")).toEqual([]);
  });
});
