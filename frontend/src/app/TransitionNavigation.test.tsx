// @vitest-environment jsdom
// Page transitions wired into the router: links, state, modifier clicks and redirects keep
// working exactly as before, with or without View Transitions.
import "@testing-library/jest-dom/vitest";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { Link, MemoryRouter, Route, Routes, createRoutesFromChildren, useLocation } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App, { AppRoutes } from "../App";
import { RouteScroll } from "../components/motion/RouteScroll";
import { learning } from "../state/learning";
import { TransitionNavigation, resolveRedirect, routePreloader } from "./TransitionNavigation";
import { lazyPage } from "./lazyPage";

// The fake replaces the real API (whose types the DOM lib already declares).
const doc = document as unknown as { startViewTransition?: unknown };
const LAZY = { timeout: 5000 };
const APP_ROUTES = createRoutesFromChildren(AppRoutes().props.children);

function LocationProbe() {
  const location = useLocation();
  return (
    <output data-testid="probe">
      {location.pathname}|{JSON.stringify(location.state ?? null)}
    </output>
  );
}
const probe = () => screen.getByTestId("probe").textContent!;

/** Behaves like the real API: update runs after the old snapshot, finished after the update. */
function installViewTransitions() {
  const start = vi.fn((update: () => Promise<void>) => {
    const done = Promise.resolve().then(update);
    return { ready: done, finished: done.then(() => undefined), updateCallbackDone: done, skipTransition: vi.fn() };
  });
  doc.startViewTransition = start;
  return start;
}

let reduced = false;
beforeEach(() => {
  reduced = false;
  localStorage.clear();
  sessionStorage.clear();
  learning.resetForTests();
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
  vi.spyOn(window, "scrollTo").mockImplementation(() => {});
  vi.stubGlobal("matchMedia", (q: string) => ({
    matches: q.includes("reduced-motion") ? reduced : false,
    addEventListener() {},
    removeEventListener() {},
  }));
});
afterEach(() => {
  cleanup();
  delete doc.startViewTransition;
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

const renderApp = (path = "/", extra?: JSX.Element) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <TransitionNavigation routes={APP_ROUTES}>
        <RouteScroll />
        <AppRoutes />
        <LocationProbe />
        {extra}
      </TransitionNavigation>
    </MemoryRouter>,
  );

describe("TransitionNavigation", () => {
  it("without startViewTransition, links navigate normally", async () => {
    renderApp("/");
    fireEvent.click(screen.getByRole("link", { name: /从第零课开始/ }));
    await waitFor(() => expect(probe()).toMatch(/^\/learn\/introduction\|/), LAZY);
  });

  it("with startViewTransition, a forward link runs one transition and lands", async () => {
    // Warm cache (the test runner's first import alone can exceed the 300 ms preload budget).
    await routePreloader(APP_ROUTES)("/learn/introduction");
    const start = installViewTransitions();
    renderApp("/");
    fireEvent.click(screen.getByRole("link", { name: /从第零课开始/ }));
    await waitFor(() => expect(probe()).toMatch(/^\/learn\/introduction\|/), LAZY);
    expect(start).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(document.documentElement.dataset.navDir).toBeUndefined());
    expect(document.documentElement.dataset.navPending).toBeUndefined();
  });

  it("a View Transition replaces Layout's own page fade (one animation, not two)", async () => {
    await routePreloader(APP_ROUTES)("/learn/introduction");
    const animate = vi.fn(() => ({ cancel() {} }));
    Object.defineProperty(HTMLElement.prototype, "animate", { value: animate, configurable: true });
    try {
      installViewTransitions();
      renderApp("/");
      animate.mockClear();
      fireEvent.click(screen.getByRole("link", { name: /从第零课开始/ }));
      await waitFor(() => expect(probe()).toMatch(/^\/learn\/introduction\|/), LAZY);
      const pageFades = animate.mock.calls.filter((_call, i) => {
        const el = animate.mock.contexts[i] as HTMLElement | undefined;
        return el?.id === "main-content";
      });
      expect(pageFades).toHaveLength(0);
    } finally {
      delete (HTMLElement.prototype as { animate?: unknown }).animate;
    }
  });

  it("stops an in-flight smooth scroll before the old snapshot (else it resumes on the new page)", async () => {
    await routePreloader(APP_ROUTES)("/learn/introduction");
    const start = installViewTransitions();
    renderApp("/");
    const scrollTo = vi.mocked(window.scrollTo);
    scrollTo.mockClear();
    fireEvent.click(screen.getByRole("link", { name: /从第零课开始/ }));
    await waitFor(() => expect(start).toHaveBeenCalledTimes(1), LAZY);
    const stop = scrollTo.mock.calls.findIndex(
      (args) => JSON.stringify(args[0]) === JSON.stringify({ top: window.scrollY, behavior: "instant" }),
    );
    expect(stop).toBeGreaterThanOrEqual(0);
    expect(scrollTo.mock.invocationCallOrder[stop]).toBeLessThan(start.mock.invocationCallOrder[0]);
  });

  it("resolves route redirects to their target", () => {
    expect(resolveRedirect(APP_ROUTES, "/practice")).toBe("/practice/linear-programming");
    expect(resolveRedirect(APP_ROUTES, "/calendar")).toBe("/library/calendar");
    expect(resolveRedirect(APP_ROUTES, "/learn")).toBeNull();
  });

  it("the 刷题 redirect commits its target inside the transition, not a blank page", async () => {
    await routePreloader(APP_ROUTES)("/practice/linear-programming");
    const seenAtSnapshot: string[] = [];
    doc.startViewTransition = vi.fn((update: () => Promise<void>) => {
      const done = Promise.resolve()
        .then(update)
        .then(() => {
          seenAtSnapshot.push(probe());
        });
      return { ready: done, finished: done, updateCallbackDone: done, skipTransition: vi.fn() };
    });
    renderApp("/", <Link to="/practice">practice</Link>);
    fireEvent.click(screen.getByRole("link", { name: "practice" }));
    await waitFor(() => expect(seenAtSnapshot).toHaveLength(1), LAZY);
    expect(seenAtSnapshot[0]).toMatch(/^\/practice\/linear-programming\|/);
    expect(document.querySelector(".page-loading")).toBeNull();
  });

  it("prefetches a page's code on hover, touch and focus", async () => {
    const factory = vi.fn(() => Promise.resolve({ default: () => <p>far</p> }));
    const Far = lazyPage(factory);
    const routes = createRoutesFromChildren(
      <>
        <Route path="/" element={<Link to="/far">far</Link>} />
        <Route path="/far" element={<Far />} />
      </>,
    );
    render(
      <MemoryRouter initialEntries={["/"]}>
        <TransitionNavigation routes={routes}>
          <Routes>
            <Route path="/" element={<Link to="/far">far</Link>} />
            <Route path="/far" element={<Far />} />
          </Routes>
        </TransitionNavigation>
      </MemoryRouter>,
    );
    const link = screen.getByRole("link", { name: "far" });
    fireEvent.pointerOver(link);
    await waitFor(() => expect(factory).toHaveBeenCalledTimes(1));
    fireEvent.touchStart(link);
    fireEvent.focusIn(link);
    expect(factory).toHaveBeenCalledTimes(1); // cached after the first fetch
  });

  it("reduced motion never calls startViewTransition", async () => {
    reduced = true;
    const start = installViewTransitions();
    renderApp("/");
    fireEvent.click(screen.getByRole("link", { name: /从第零课开始/ }));
    await waitFor(() => expect(probe()).toMatch(/^\/learn\/introduction\|/), LAZY);
    expect(start).not.toHaveBeenCalled();
  });

  it("Link state survives the wrapper", async () => {
    installViewTransitions();
    render(
      <MemoryRouter initialEntries={["/a"]}>
        <TransitionNavigation routes={[]}>
          <Routes>
            <Route path="/a" element={<Link to="/a/b" state={{ restore: { scrollY: 5 } }}>deeper</Link>} />
            <Route path="/a/b" element={<p>b</p>} />
          </Routes>
          <LocationProbe />
        </TransitionNavigation>
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByRole("link", { name: "deeper" }));
    await waitFor(() => expect(probe()).toBe('/a/b|{"restore":{"scrollY":5}}'), LAZY);
  });

  it("ctrl-click is not intercepted", async () => {
    const start = installViewTransitions();
    renderApp("/");
    fireEvent.click(screen.getByRole("link", { name: /从第零课开始/ }), { ctrlKey: true });
    await act(async () => {
      await new Promise((r) => setTimeout(r, 350));
    });
    expect(start).not.toHaveBeenCalled();
    expect(probe()).toMatch(/^\/\|/);
  });

  it("Navigate redirects (replace) pass straight through", async () => {
    const start = installViewTransitions();
    renderApp("/", <Link to="/practice">practice</Link>);
    fireEvent.click(screen.getByRole("link", { name: "practice" }));
    await waitFor(() => expect(probe()).toMatch(/^\/practice\/linear-programming\|/), LAZY);
    expect(start.mock.calls.length).toBeLessThanOrEqual(1);
  });

  it("the real app shell runs links through the transition navigator", async () => {
    await routePreloader(APP_ROUTES)("/learn/introduction");
    const start = installViewTransitions();
    window.history.replaceState(null, "", "/");
    render(<App />);
    fireEvent.click(await screen.findByRole("link", { name: /从第零课开始/ }, LAZY));
    await waitFor(() => expect(window.location.pathname).toBe("/learn/introduction"), LAZY);
    expect(start).toHaveBeenCalledTimes(1);
    window.history.replaceState(null, "", "/");
  });
});
