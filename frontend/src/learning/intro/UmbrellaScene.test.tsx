// @vitest-environment jsdom
// The umbrella scene draws the real numbers (one icon per umbrella, one dashed slot per person without
// one), moves exactly the transferred umbrellas, and keeps its rain off under reduced motion.
// The image slots show an illustration only when its file exists.
import "@testing-library/jest-dom/vitest";
import { cleanup, render } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { SCENARIOS, UMBRELLA, type UmbrellaCase } from "./data";
import { ILLUSTRATIONS, IntroFigure, illustrationSrc, type IllustrationId } from "./illustrations";
import { plan, transferRange } from "./math";
import { introSections } from "./content";
import { slotKind, slotOf, UmbrellaScene } from "./UmbrellaScene";
import introPage from "../../pages/IntroCourse.tsx?raw";

afterEach(cleanup);
// intro.css is read from disk (Vitest stubs CSS imports), as in design/motion.test.tsx.
let css = "";
beforeAll(async () => {
  const fs = (await import(/* @vite-ignore */ "node:fs" as string)) as { readFileSync(path: string, encoding: string): string };
  css = fs.readFileSync("src/learning/intro/intro.css", "utf8").split(String.fromCharCode(13)).join("");
});
const N = UMBRELLA.stock.a + UMBRELLA.stock.b;
const { min, max } = transferRange(UMBRELLA);

describe("slots", () => {
  it("every transfer puts exactly a umbrellas at A and b at B, each slot used once", () => {
    for (let x = min; x <= max; x++) {
      const p = plan(UMBRELLA, x);
      const slots = Array.from({ length: N }, (_, u) => slotOf(u, p.a, N));
      const at = (s: "a" | "b") => slots.filter((t) => t.station === s).map((t) => t.index).sort((m, n) => m - n);
      expect(at("a")).toEqual(Array.from({ length: p.a }, (_, i) => i));
      expect(at("b")).toEqual(Array.from({ length: p.b }, (_, i) => i));
    }
  });

  it("changing x moves exactly |Δx| umbrellas; all others keep their place", () => {
    for (const [from, to] of [[0, 20], [20, 25], [10, -15], [40, -20]]) {
      const before = plan(UMBRELLA, from).a;
      const after = plan(UMBRELLA, to).a;
      const moved = Array.from({ length: N }, (_, u) => u).filter(
        (u) => JSON.stringify(slotOf(u, before, N)) !== JSON.stringify(slotOf(u, after, N)),
      );
      expect(moved).toHaveLength(Math.abs(to - from));
    }
  });

  it("served, spare and unmet slots add up to the plan", () => {
    for (const s of SCENARIOS)
      for (const x of [min, 0, 20, max]) {
        const p = plan({ stock: UMBRELLA.stock, demand: s.demand }, x);
        const count = (umbrellas: number, demand: number, kind: string) =>
          Array.from({ length: Math.max(umbrellas, demand) }, (_, i) => slotKind(i, umbrellas, demand)).filter((k) => k === kind).length;
        expect(count(p.a, s.demand.a, "served")).toBe(p.servedA);
        expect(count(p.a, s.demand.a, "unmet")).toBe(p.shortA);
        expect(count(p.b, s.demand.b, "unmet")).toBe(p.shortB);
        expect(count(p.a, s.demand.a, "spare") + count(p.b, s.demand.b, "spare")).toBe(p.a + p.b - p.servedA - p.servedB);
      }
  });
});

describe("UmbrellaScene", () => {
  const draw = (x: number, demand: UmbrellaCase["demand"]) => {
    const view = render(<UmbrellaScene x={x} demand={demand} />);
    const q = (sel: string) => view.container.querySelectorAll(sel).length;
    return { view, q };
  };

  it("draws one icon per umbrella and one dashed slot per person left without one", () => {
    for (const x of [0, 10, 20, -5]) {
      const p = plan(UMBRELLA, x);
      const { view, q } = draw(x, UMBRELLA.demand);
      expect(q("use.intro-umbrella")).toBe(N);
      expect(q("use.is-served")).toBe(p.servedA + p.servedB);
      expect(q("rect.is-unmet")).toBe(p.shortage);
      expect(view.container).toHaveTextContent(`伞 ${p.a} · 需要 ${UMBRELLA.demand.a}`);
      expect(view.container).toHaveTextContent(`伞 ${p.b} · 需要 ${UMBRELLA.demand.b}`);
      view.unmount();
    }
    // Demand above the stock: the extra people are dashed slots too.
    const p = plan({ stock: UMBRELLA.stock, demand: { a: 70, b: 20 } }, 40);
    const { q } = draw(40, { a: 70, b: 20 });
    expect(q("rect.is-unmet")).toBe(p.shortage);
  });

  it("is decorative (the lab states every number in text) and rains only when asked", () => {
    const { view, q } = draw(0, UMBRELLA.demand);
    expect(view.getByTestId("umbrella-scene")).toHaveAttribute("aria-hidden", "true");
    expect(q(".intro-scene-rain")).toBe(1);
    view.unmount();
    expect(render(<UmbrellaScene x={0} demand={UMBRELLA.demand} rain={false} />).container.querySelector(".intro-scene-rain")).toBeNull();
  });

  it("turns the rain off and makes transfers instant under reduced motion", () => {
    expect(css).toMatch(/@media \(prefers-reduced-motion: reduce\) \{\s*\.intro-scene-rain \{\s*display: none;/);
    // The transfer duration and stagger are multiplied by --motion-scale (0 under reduced motion).
    expect(css).toMatch(/transform calc\(650ms \* var\(--motion-scale\)\)[^;]*calc\(var\(--i, 0\) \* 14ms \* var\(--motion-scale\)\)/);
  });
});

describe("illustration slots", () => {
  const ids = Object.keys(ILLUSTRATIONS) as IllustrationId[];

  it("render nothing until the file exists, then the image with its alt text", () => {
    expect(render(<IntroFigure id="intro-02-walk-to-class" files={{}} />).container).toBeEmptyDOMElement();
    const files = { "./img/intro-02-walk-to-class.webp": "/assets/walk.webp", "./img/intro-02-walk-to-class-old.png": "/x.png" };
    const { container } = render(<IntroFigure id="intro-02-walk-to-class" files={files} />);
    const img = container.querySelector("img")!;
    expect(img).toHaveAttribute("src", "/assets/walk.webp");
    expect(img).toHaveAttribute("alt", ILLUSTRATIONS["intro-02-walk-to-class"].alt);
    expect(img).toHaveAttribute("loading", "lazy");
    expect(img).toHaveAttribute("width", "1600");
    expect(container).toHaveTextContent("同一段路，题目没说的条件很多。");
  });

  it("match names exactly", () => {
    expect(illustrationSrc("intro-03-map-vs-metro", { "./img/intro-03-map-vs-metro-draft.png": "a" })).toBeNull();
    expect(illustrationSrc("intro-03-map-vs-metro", { "./img/intro-03-map-vs-metro.jpg": "b" })).toBe("b");
  });

  it("all six images are in the repository, as small WebP files", async () => {
    const fs = (await import(/* @vite-ignore */ "node:fs" as string)) as { statSync(path: string): { size: number } };
    for (const id of ids) {
      expect(illustrationSrc(id), id).not.toBeNull();
      expect(fs.statSync(`src/learning/intro/img/${id}.webp`).size, id).toBeLessThan(150_000);
    }
  });

  it("six slots, each placed once (the cover holds the first)", () => {
    expect(ids).toHaveLength(6);
    const placed = introSections.flatMap((s) => s.blocks.filter((b) => b.type === "intro-figure").map((b) => (b as { id: string }).id));
    expect(placed).toEqual(ids.slice(1));
    expect(introPage).toContain('<IntroFigure id="intro-01-rain-umbrellas" />');
    for (const id of ids) expect(ILLUSTRATIONS[id].alt.length).toBeGreaterThan(20);
  });
});
