// Page transition styles (spec §5.1): CSS is stubbed in Vitest, so read the file itself.
import { beforeAll, describe, expect, it } from "vitest";

let css = "";
let shell = "";
let main = "";
beforeAll(async () => {
  // Same trick as motion.test: node:fs has no types in this browser-targeted project.
  const fs = (await import(/* @vite-ignore */ "node:fs" as string)) as {
    readFileSync(path: string, encoding: string): string;
  };
  const read = (path: string) => fs.readFileSync(path, "utf8").split(String.fromCharCode(13)).join("");
  css = read("src/design/viewTransitions.css");
  shell = read("src/app/shell.css");
  main = read("src/main.tsx");
});

describe("view transition styles", () => {
  it("only animate when the user has not asked for reduced motion", () => {
    expect(css.trim().startsWith("/*")).toBe(true);
    const outside = css.replace(/@media \(prefers-reduced-motion: no-preference\)\s*\{[\s\S]*\}\s*$/, "");
    expect(outside).not.toMatch(/animation/);
  });
  it("never block clicks during a transition", () => {
    expect(css).toMatch(/::view-transition\s*\{[^}]*pointer-events: none/);
  });
  it("slide forward and back with the spring, cross-fade otherwise, within 400 ms", () => {
    for (const dir of ["forward", "back", "fade"]) {
      expect(css).toContain(`:root[data-nav-dir="${dir}"]::view-transition-old(root)`);
      expect(css).toContain(`:root[data-nav-dir="${dir}"]::view-transition-new(root)`);
    }
    expect(css).toContain("var(--ease-spring)");
    const durations = [...css.matchAll(/calc\((\d+)ms \* var\(--motion-scale\)\)/g)].map((m) => Number(m[1]));
    expect(durations.length).toBeGreaterThan(0);
    expect(Math.max(...durations)).toBeLessThanOrEqual(400);
  });
  it("keep the header still and show progress while a page is loading", () => {
    expect(shell).toMatch(/\.site-header \{[^}]*view-transition-name: mb-header/);
    expect(css).toMatch(/:root\[data-nav-pending\][^{]*\{[^}]*cursor: progress/);
  });
  it("is loaded after the motion system", () => {
    expect(main.indexOf('import "./design/viewTransitions.css"')).toBeGreaterThan(main.indexOf('import "./design/motion.css"'));
  });
});
