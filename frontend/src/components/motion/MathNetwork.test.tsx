// @vitest-environment jsdom
import { cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { MathNetwork } from "./MathNetwork";

let reduced = false;
const cancel = vi.fn();
const request = vi.fn(() => 42);
beforeEach(() => {
  reduced = false;
  vi.stubGlobal("requestAnimationFrame", request);
  vi.stubGlobal("cancelAnimationFrame", cancel);
  vi.stubGlobal("matchMedia", () => ({
    matches: reduced,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(
    new Proxy(
      {},
      { get: () => vi.fn(), set: () => true },
    ) as CanvasRenderingContext2D,
  );
  Object.defineProperty(document, "hidden", {
    configurable: true,
    value: false,
  });
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});
it("cancels scheduled work on unmount", () => {
  const { unmount } = render(<MathNetwork />);
  expect(request).toHaveBeenCalled();
  unmount();
  expect(cancel).toHaveBeenCalledWith(42);
});
it("renders a still network without scheduling frames for reduced motion", () => {
  reduced = true;
  render(<MathNetwork />);
  expect(request).not.toHaveBeenCalled();
});
it("pauses when the document is hidden and resumes when visible", () => {
  render(<MathNetwork />);
  Object.defineProperty(document, "hidden", {
    configurable: true,
    value: true,
  });
  document.dispatchEvent(new Event("visibilitychange"));
  expect(cancel).toHaveBeenCalledWith(42);
  request.mockClear();
  Object.defineProperty(document, "hidden", {
    configurable: true,
    value: false,
  });
  document.dispatchEvent(new Event("visibilitychange"));
  expect(request).toHaveBeenCalledOnce();
});
it("caps backing-store resolution on high-DPI devices", () => {
  vi.stubGlobal("devicePixelRatio", 4);
  const { container } = render(<MathNetwork />);
  const canvas = container.querySelector("canvas")!;
  expect(canvas.width).toBe(900);
  expect(canvas.height).toBe(690);
});
it("pauses outside the viewport and disconnects its observer", () => {
  let notify: (entries: { isIntersecting: boolean }[]) => void = () => {};
  const disconnect = vi.fn();
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      constructor(callback: typeof notify) {
        notify = callback;
      }
      observe = vi.fn();
      disconnect = disconnect;
    },
  );
  const { unmount } = render(<MathNetwork />);
  request.mockClear();
  notify([{ isIntersecting: false }]);
  expect(cancel).toHaveBeenCalledWith(42);
  expect(request).not.toHaveBeenCalled();
  notify([{ isIntersecting: true }]);
  expect(request).toHaveBeenCalledOnce();
  unmount();
  expect(disconnect).toHaveBeenCalledOnce();
});
it("reacts immediately to a changed reduced-motion preference", () => {
  let notify: (event: { matches: boolean }) => void = () => {};
  const remove = vi.fn();
  vi.stubGlobal("matchMedia", () => ({
    matches: false,
    addEventListener: (_: string, fn: typeof notify) => {
      notify = fn;
    },
    removeEventListener: remove,
  }));
  const { unmount } = render(<MathNetwork />);
  request.mockClear();
  notify({ matches: true });
  expect(cancel).toHaveBeenCalledWith(42);
  expect(request).not.toHaveBeenCalled();
  notify({ matches: false });
  expect(request).toHaveBeenCalledOnce();
  unmount();
  expect(remove).toHaveBeenCalledOnce();
});
