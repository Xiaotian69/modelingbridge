// @vitest-environment jsdom
// Scroll policy: smooth inside a page, instant across pages, return lands where you left.
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { Link, MemoryRouter, Route, Routes, useNavigate } from "react-router-dom";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { RouteScroll } from "./RouteScroll";

let frame: FrameRequestCallback = () => {};
let scroll: ReturnType<typeof vi.spyOn>;
let reduced = false;
beforeEach(() => {
  reduced = false;
  sessionStorage.clear();
  scroll = vi.spyOn(window, "scrollTo").mockImplementation(() => {});
  vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
    frame = cb;
    return 1;
  });
  vi.stubGlobal("cancelAnimationFrame", vi.fn());
  vi.stubGlobal("matchMedia", () => ({ matches: reduced, addEventListener() {}, removeEventListener() {} }));
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});
const tick = () => act(async () => frame(0));

function Page() {
  const navigate = useNavigate();
  return (
    <div>
      <Link to="#part">本页小节</Link>
      <Link to="/other#part">别页小节</Link>
      <button onClick={() => navigate("/exercise", { state: { restore: { anchorId: "fb", anchorTop: 100, scrollY: 999 } } })}>
        回到原题
      </button>
      <section id="part">part</section>
      <div id="fb">feedback</div>
    </div>
  );
}
const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]} future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
      <RouteScroll />
      <Routes>
        <Route path="*" element={<Page />} />
      </Routes>
    </MemoryRouter>,
  );

it("scrolls smoothly to a section on the same page, instantly when arriving from another page", async () => {
  renderAt("/lesson");
  await tick();
  fireEvent.click(screen.getByText("本页小节"));
  await tick();
  expect(scroll).toHaveBeenLastCalledWith(expect.objectContaining({ behavior: "smooth" }));
  fireEvent.click(screen.getByText("别页小节"));
  await tick();
  expect(scroll).toHaveBeenLastCalledWith(expect.objectContaining({ behavior: "instant" }));
});

it("never smooth-scrolls under reduced motion", async () => {
  reduced = true;
  renderAt("/lesson");
  await tick();
  fireEvent.click(screen.getByText("本页小节"));
  await tick();
  expect(scroll).toHaveBeenLastCalledWith(expect.objectContaining({ behavior: "instant" }));
});

it("returns to the exercise with the feedback at the same height it had when leaving", async () => {
  vi.stubGlobal("scrollY", 0);
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function (this: HTMLElement) {
    return { top: this.id === "fb" ? 700 : 0 } as DOMRect;
  });
  renderAt("/lesson");
  await tick();
  fireEvent.click(screen.getByText("回到原题"));
  await tick();
  // Anchor is 700px down the page; it was 100px from the top when the learner left.
  expect(scroll).toHaveBeenLastCalledWith({ top: 600, behavior: "instant" });
});

it("keeps back/forward positions across a reload of the page", async () => {
  const { unmount } = renderAt("/lesson");
  await tick();
  vi.stubGlobal("scrollY", 840);
  fireEvent.scroll(window);
  unmount(); // positions are persisted when the router unmounts / the page hides
  const saved = JSON.parse(sessionStorage.getItem("mb.v2.scroll") || "[]") as [string, number][];
  expect(saved.some(([, y]) => y === 840)).toBe(true);
});

it("a new deep link opened by full page load goes to its section, not the previous page's position", async () => {
  // First full load in this tab: /lesson, scrolled to 840 (stored under the router key "default").
  const first = renderAt("/lesson");
  await tick();
  vi.stubGlobal("scrollY", 840);
  fireEvent.scroll(window);
  first.unmount();
  // Second full load in the same tab: another URL with a hash (also key "default").
  vi.stubGlobal("scrollY", 0);
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({ top: 700 } as DOMRect);
  renderAt("/other#part");
  await tick();
  expect(scroll).toHaveBeenLastCalledWith({ top: 610, behavior: "instant" });
  // Reloading the first URL still restores where the learner was.
  cleanup();
  renderAt("/lesson");
  await tick();
  expect(scroll).toHaveBeenLastCalledWith({ top: 840, behavior: "instant" });
});
