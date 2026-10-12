// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AppRoutes } from "./App";

beforeEach(() => {
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
  // Library pages call the optional backend; keep them offline in tests.
  vi.stubGlobal("fetch", vi.fn(() => Promise.reject(new Error("offline"))));
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

function Where() {
  const { pathname } = useLocation();
  return <output data-testid="where">{pathname}</output>;
}
const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]} future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
      <AppRoutes />
      <Where />
    </MemoryRouter>,
  );

describe("V2 routes and legacy URL compatibility", () => {
  it.each([
    ["/resources", "/library"],
    ["/tools", "/library/tools"],
    ["/calendar", "/library/calendar"],
    ["/practice", "/practice/linear-programming"],
  ])("redirects %s to %s", async (from, to) => {
    renderAt(from);
    expect(await screen.findByTestId("where")).toHaveTextContent(to);
    await screen.findByRole("navigation", { name: "主导航" });
  });

  it("keeps the 资料中心 tabs for the re-homed pages", async () => {
    renderAt("/library/calendar");
    const tab = await screen.findByRole("link", { name: "赛事日历", current: "page" });
    expect(tab).toHaveAttribute("href", "/library/calendar");
    expect(screen.getByRole("link", { name: "模板与工具" })).toHaveAttribute("href", "/library/tools");
  });

  it("keeps the experimental workbench reachable by URL", async () => {
    renderAt("/workbench");
    expect(await screen.findByTestId("where")).toHaveTextContent("/workbench");
    expect(screen.queryByRole("heading", { name: "没有找到这个页面" })).not.toBeInTheDocument();
  });

  it("shows a 404 page instead of silently sending unknown URLs home", async () => {
    renderAt("/no-such-page");
    expect(await screen.findByRole("heading", { name: "没有找到这个页面" })).toBeInTheDocument();
    expect(screen.getByTestId("where")).toHaveTextContent("/no-such-page");
    expect(screen.getByRole("link", { name: "回到首页" })).toHaveAttribute("href", "/");
  });
});
