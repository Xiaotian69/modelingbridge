// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, describe, expect, it } from "vitest";
import { Layout } from "./Layout";

afterEach(cleanup);

function renderAt(path: string) {
  render(
    <MemoryRouter
      initialEntries={[path]}
      future={{ v7_relativeSplatPath: true, v7_startTransition: true }}
    >
      <Routes>
        <Route element={<Layout />}>
          <Route path="*" element={<div />} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

describe("Layout", () => {
  it("shows the four learning actions plus 学习记录, and keeps lower-frequency pages in the footer", () => {
    renderAt("/");
    const main = screen.getByRole("navigation", { name: "主导航" });
    expect(within(main).getByRole("link", { name: "精讲" })).toHaveAttribute("href", "/learn");
    expect(within(main).getByRole("link", { name: "刷题" })).toHaveAttribute("href", "/practice");
    expect(within(main).getByRole("link", { name: "实战" })).toHaveAttribute("href", "/quest");
    expect(within(main).getByRole("link", { name: "资料" })).toHaveAttribute("href", "/library");
    expect(screen.getByRole("link", { name: "学习记录" })).toHaveAttribute("href", "/records");
    const footer = screen.getByRole("navigation", { name: "更多内容" });
    expect(within(footer).getByRole("link", { name: "赛事日历" })).toHaveAttribute("href", "/library/calendar");
    expect(within(footer).getByRole("link", { name: "案例库" })).toHaveAttribute("href", "/cases");
    // The experimental workbench is no longer the loudest header action, but stays reachable.
    expect(within(footer).getByRole("link", { name: "AI 工作台（实验）" })).toHaveAttribute("href", "/workbench");
    expect(screen.queryByText("AI 数模助手")).not.toBeInTheDocument();
  });

  it("marks the current section, including pages that belong to it", () => {
    renderAt("/cases/bike-demand-demo");
    const main = screen.getByRole("navigation", { name: "主导航" });
    expect(within(main).getByRole("link", { name: "实战" })).toHaveAttribute("aria-current", "page");
    expect(within(main).getByRole("link", { name: "精讲" })).not.toHaveAttribute("aria-current");
  });

  it("pins not-yet-migrated pages to the legacy light surface, but not the home page", () => {
    renderAt("/quest");
    expect(document.getElementById("main-content")).toHaveClass("legacy-surface");
    cleanup();
    renderAt("/");
    expect(document.getElementById("main-content")).not.toHaveClass("legacy-surface");
  });
});
