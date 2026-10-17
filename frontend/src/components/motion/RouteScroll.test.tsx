// @vitest-environment jsdom
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import {
  Link,
  MemoryRouter,
  Route,
  Routes,
  useNavigate,
} from "react-router-dom";
import { useState } from "react";
import { afterEach, expect, it, vi } from "vitest";
import { RouteScroll } from "./RouteScroll";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});
it("waits for asynchronous article content before restoring Back position", async () => {
  const scroll = vi.spyOn(window, "scrollTo").mockImplementation(() => {});
  let frame: FrameRequestCallback = () => {};
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
    frame = callback;
    return 1;
  });
  vi.stubGlobal("cancelAnimationFrame", vi.fn());
  function Article() {
    const [ready, setReady] = useState(false);
    return (
      <div data-route-pending={!ready || undefined}>
        <button onClick={() => setReady(true)}>Load article</button>
        <Link to="/other">Leave</Link>
        {ready && <p>Long article</p>}
      </div>
    );
  }
  function Other() {
    const navigate = useNavigate();
    return <button onClick={() => navigate(-1)}>Back</button>;
  }
  render(
    <MemoryRouter
      initialEntries={["/article"]}
      future={{ v7_relativeSplatPath: true, v7_startTransition: true }}
    >
      <RouteScroll />
      <Routes>
        <Route path="article" element={<Article />} />
        <Route path="other" element={<Other />} />
      </Routes>
    </MemoryRouter>,
  );
  fireEvent.click(screen.getByText("Load article"));
  await act(async () => {
    frame(0);
  });
  vi.stubGlobal("scrollY", 1200);
  fireEvent.scroll(window);
  fireEvent.click(screen.getByText("Leave"));
  await act(async () => {
    frame(0);
  });
  fireEvent.click(screen.getByText("Back"));
  scroll.mockClear();
  await act(async () => {
    frame(0);
  });
  expect(scroll).not.toHaveBeenCalled();
  fireEvent.click(screen.getByText("Load article"));
  await act(async () => {});
  await act(async () => {
    frame(0);
  });
  expect(scroll).toHaveBeenLastCalledWith({ top: 1200, behavior: "instant" });
});
