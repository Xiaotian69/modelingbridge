// @vitest-environment jsdom
// V2.1 integration: the AHP course and the linear programming lab live side by side.
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AppRoutes } from "./App";
import { lessonEntries, searchEntries, staticEntries } from "./app/searchIndex";
import { learning } from "./state/learning";

const LAZY = { timeout: 5000 };
beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  learning.resetForTests();
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]} future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
      <AppRoutes />
    </MemoryRouter>,
  );

describe("AHP course and LP lab together", () => {
  it("the LP lesson (shared reader) offers the lab after the graph and at the end of section 6", async () => {
    renderAt("/learn/linear-programming");
    const links = await screen.findAllByRole("link", { name: "打开交互实验室 →" }, LAZY);
    expect(links.map((a) => a.closest("section")?.id)).toEqual(["geometry", "sensitivity"]);
    // The sensitivity entry comes after the section's own content, before its navigation.
    const sensitivity = document.getElementById("sensitivity")!;
    const nav = within(sensitivity).getByRole("navigation");
    expect(links[1].compareDocumentPosition(nav) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("the AHP lesson has no LP lab entries, and its own lab still renders", async () => {
    renderAt("/learn/ahp");
    expect(await screen.findByText("改变判断，看权重和一致性如何变化", {}, LAZY)).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "打开交互实验室 →" })).not.toBeInTheDocument();
  });

  it("the LP lab page works inside the merged app", async () => {
    renderAt("/learn/linear-programming/lab?from=geometry");
    expect(await screen.findByRole("heading", { name: "线性规划交互实验室" }, LAZY)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "← 回到第 3 节「看见所有允许的计划」" })).toHaveAttribute(
      "href",
      "/learn/linear-programming#geometry",
    );
    expect(screen.getByText(/最优计划：A 40 m²、B 20 m²，利润 2600 元/, { selector: "strong" })).toBeInTheDocument();
  });

  it("search finds both new features", async () => {
    const entries = [...(await lessonEntries()), ...staticEntries()];
    expect(searchEntries(entries, "实验室", 10).some((h) => h.href === "/learn/linear-programming/lab")).toBe(true);
    expect(searchEntries(entries, "一致性", 10).some((h) => h.href === "/learn/ahp#consistency")).toBe(true);
    expect(searchEntries(entries, "练习", 10).filter((h) => h.group === "练习").map((h) => h.href)).toEqual(
      expect.arrayContaining(["/practice/linear-programming", "/practice/ahp"]),
    );
  });

  it("the course catalog shows the AHP course and the LP lab button", async () => {
    renderAt("/learn");
    expect(await screen.findByRole("link", { name: "开始 AHP 精讲" }, LAZY)).toHaveAttribute("href", "/learn/ahp");
    expect(screen.getByRole("link", { name: "交互实验室" })).toHaveAttribute("href", "/learn/linear-programming/lab");
  });
});
