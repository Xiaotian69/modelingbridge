// @vitest-environment jsdom
// Motion design system regression tests.
import "@testing-library/jest-dom/vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { Link, MemoryRouter, Route, Routes, useNavigate } from "react-router-dom";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { DURATION, EASING, duration, isLowEndForMotion, motionScale } from "./motion";
import { Collapse } from "../components/motion/Collapse";
import { Layout } from "../layouts/Layout";
import { PrefsProvider } from "../app/PrefsContext";
import { ThemeToggle } from "../app/ThemeToggle";
import { HelpLadder } from "../practice/HelpLadder";

// tokens.css is read from disk (Vitest stubs CSS imports). Git may use CRLF on Windows.
let tokens = "";
beforeAll(async () => {
  const fs = (await import(/* @vite-ignore */ "node:fs" as string)) as {
    readFileSync(path: string, encoding: string): string;
  };
  tokens = fs.readFileSync("src/design/tokens.css", "utf8").split(String.fromCharCode(13)).join("");
});
let reduced = false;
beforeEach(() => {
  reduced = false;
  localStorage.clear();
  vi.stubGlobal("matchMedia", (q: string) => ({
    matches: q.includes("reduced-motion") ? reduced : false,
    addEventListener() {},
    removeEventListener() {},
  }));
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  document.documentElement.className = "";
});

describe("tokens: one source, mirrored exactly", () => {
  it.each(Object.entries(DURATION))("--dur-%s is %ims in CSS and JS", (name, ms) => {
    expect(tokens).toContain(`--dur-${name}: calc(${ms}ms * var(--motion-scale));`);
  });
  it.each(Object.entries(EASING))("--ease-%s matches", (name, curve) => {
    const cssName = name.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);
    expect(tokens).toContain(`--ease-${cssName}: ${curve};`);
  });
  it("keeps every duration inside the agreed ranges", () => {
    expect(DURATION.page).toBeGreaterThanOrEqual(180);
    expect(DURATION.page).toBeLessThanOrEqual(250);
    expect(DURATION.quick).toBeGreaterThanOrEqual(120);
    expect(DURATION.quick).toBeLessThanOrEqual(180);
  });
  it("turns everything off for reduced motion and shortens it on low-end devices", () => {
    expect(tokens).toMatch(/prefers-reduced-motion: reduce\)[\s\S]*--motion-scale: 0;/);
    expect(tokens).toContain(':root[data-motion="lite"] {\n  --motion-scale: 0.6;');
    expect(motionScale()).toBe(1);
    reduced = true;
    expect(motionScale()).toBe(0);
    expect(duration("page")).toBe(0);
    expect(isLowEndForMotion({ hardwareConcurrency: 2 })).toBe(true);
    expect(isLowEndForMotion({ connection: { saveData: true } })).toBe(true);
    expect(isLowEndForMotion({ deviceMemory: 8, hardwareConcurrency: 8 })).toBe(false);
  });
});

describe("spring tokens", () => {
  it("defaults to the standard curve where linear() is unsupported", () => {
    expect(tokens).toContain("--ease-spring: var(--ease-standard);");
    expect(tokens).toContain("--ease-spring-bouncy: var(--ease-enter);");
  });
  it("upgrades inside @supports linear()", () => {
    expect(tokens).toMatch(
      /@supports \(transition-timing-function: linear\(0, 1\)\)\s*\{\s*:root\s*\{[^}]*--ease-spring: linear\(/,
    );
    expect(EASING.spring.startsWith("linear(0, ")).toBe(true);
    expect(EASING.springBouncy.endsWith(", 1)")).toBe(true);
  });
});

describe("press feedback", () => {
  let css = "";
  beforeAll(async () => {
    const fs = (await import(/* @vite-ignore */ "node:fs" as string)) as {
      readFileSync(path: string, encoding: string): string;
    };
    css = fs.readFileSync("src/design/motion.css", "utf8").split(String.fromCharCode(13)).join("");
  });
  it("shrinks pressed buttons and card links slightly", () => {
    expect(css).toMatch(/a\.interactive-card:active[^{]*\{[^}]*transform: scale\(0\.97\)/);
    expect(css).toMatch(/\.btn:active[^{]*\{[^}]*transform: scale\(0\.97\)/);
  });
  it("lifts cards on hover only for a real pointer", () => {
    expect(css).toMatch(
      /@media \(hover: hover\) and \(pointer: fine\)\s*\{[^@]*a\.interactive-card:hover[^{]*\{[^}]*translateY\(-2px\)/,
    );
  });
  it("turns press and hover transforms off for reduced motion", () => {
    const reducedBlock = css.slice(css.lastIndexOf("@media (prefers-reduced-motion: reduce)"));
    expect(reducedBlock).toMatch(/a\.interactive-card[\s\S]*transform: none/);
  });
});

describe("Collapse", () => {
  it("hides closed content from focus and assistive tech, and keeps it while closing", () => {
    const { rerender } = render(<Collapse open={false}>{null}</Collapse>);
    const box = document.querySelector(".mb-collapse") as HTMLElement & { inert: boolean };
    expect(box).toHaveAttribute("aria-hidden", "true");
    expect(box.inert).toBe(true);
    rerender(<Collapse open>{<p>反馈</p>}</Collapse>);
    expect(box).not.toHaveAttribute("aria-hidden");
    expect(box.inert).toBe(false);
    expect(box).toHaveAttribute("data-open", "true");
    // Parent stops rendering the content: it stays (hidden) for the closing transition.
    rerender(<Collapse open={false}>{null}</Collapse>);
    expect(screen.getByText("反馈")).toBeInTheDocument();
    expect(box).toHaveAttribute("data-open", "false");
  });
});

describe("page enter", () => {
  function Nav() {
    const navigate = useNavigate();
    return (
      <>
        <Link to="/b">去 B</Link>
        <Link to="/c">去 C</Link>
        <button onClick={() => navigate(-1)}>后退</button>
      </>
    );
  }
  const renderShell = () =>
    render(
      <MemoryRouter initialEntries={["/a"]} future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
        <Routes>
          <Route element={<Layout />}>
            <Route path="*" element={<Nav />} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

  it("fades in on forward navigation with the page tokens, never on back/forward", () => {
    const cancel = vi.fn();
    const animate = vi.fn((..._args: unknown[]) => ({ cancel }) as unknown as Animation);
    Object.defineProperty(HTMLElement.prototype, "animate", { configurable: true, value: animate });
    renderShell();
    expect(animate).not.toHaveBeenCalled(); // initial load is a POP
    fireEvent.click(screen.getByText("去 B"));
    expect(animate).toHaveBeenCalledTimes(1);
    expect(animate.mock.calls[0][1]).toEqual({ duration: DURATION.page, easing: EASING.enter });
    // Rapid switching: the running animation is cancelled before the next starts.
    fireEvent.click(screen.getByText("去 C"));
    expect(cancel).toHaveBeenCalled();
    expect(animate).toHaveBeenCalledTimes(2);
    fireEvent.click(screen.getByText("后退"));
    expect(animate).toHaveBeenCalledTimes(2);
    delete (HTMLElement.prototype as unknown as Record<string, unknown>).animate;
  });

  it("does not animate at all with reduced motion", () => {
    reduced = true;
    const animate = vi.fn();
    Object.defineProperty(HTMLElement.prototype, "animate", { configurable: true, value: animate });
    renderShell();
    fireEvent.click(screen.getByText("去 B"));
    expect(animate).not.toHaveBeenCalled();
    delete (HTMLElement.prototype as unknown as Record<string, unknown>).animate;
  });
});

describe("theme switch", () => {
  it("cross-fades colours briefly, then removes the transition class", () => {
    vi.useFakeTimers();
    render(
      <PrefsProvider>
        <ThemeToggle />
      </PrefsProvider>,
    );
    const root = document.documentElement;
    fireEvent.click(screen.getByRole("button", { name: /主题/ })); // system → light (same colours)
    fireEvent.click(screen.getByRole("button", { name: /主题/ })); // light → dark
    expect(root.dataset.theme).toBe("dark");
    expect(root).toHaveClass("theme-transition");
    act(() => {
      vi.advanceTimersByTime(DURATION.theme + 100);
    });
    expect(root).not.toHaveClass("theme-transition");
    vi.useRealTimers();
  });
  it("switches instantly with reduced motion", () => {
    reduced = true;
    render(
      <PrefsProvider>
        <ThemeToggle />
      </PrefsProvider>,
    );
    fireEvent.click(screen.getByRole("button", { name: /主题/ }));
    fireEvent.click(screen.getByRole("button", { name: /主题/ }));
    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(document.documentElement).not.toHaveClass("theme-transition");
  });
});

describe("help ladder", () => {
  it("eases between the heights of two levels instead of jumping", () => {
    const animate = vi.fn(() => ({ cancel() {} }) as unknown as Animation);
    Object.defineProperty(HTMLElement.prototype, "animate", { configurable: true, value: animate });
    let height = 120;
    vi.spyOn(HTMLElement.prototype, "offsetHeight", "get").mockImplementation(() => height);
    const props = {
      onLevel: () => {},
      recommendSolution: false,
      nudge: "启发",
      clue: "线索",
      solution: { answer: "答案", explanation: "解析" },
      knowledgeLink: null,
    };
    const { rerender } = render(<HelpLadder level={1} {...props} />);
    expect(animate).not.toHaveBeenCalled();
    height = 200;
    rerender(<HelpLadder level={3} {...props} />);
    expect(animate).toHaveBeenCalledWith([{ height: "120px" }, { height: "200px" }], {
      duration: DURATION.expand,
      easing: EASING.standard,
    });
    delete (HTMLElement.prototype as unknown as Record<string, unknown>).animate;
  });
});
