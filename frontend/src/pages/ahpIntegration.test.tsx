// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { lessonEntries, searchEntries, staticEntries } from "../app/searchIndex";
import { learning } from "../state/learning";
import { HomePage } from "./Home";
import { LearnPage } from "./Learn";

beforeEach(() => {
  localStorage.clear();
  learning.resetForTests();
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
const inRouter = (ui: JSX.Element) =>
  render(<MemoryRouter future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>{ui}</MemoryRouter>);

describe("AHP is findable", () => {
  it("opens 评价决策 on the home route and counts two open lessons", () => {
    inRouter(<HomePage />);
    const route = screen.getByRole("heading", { name: "一条路线，三种练法" }).parentElement!;
    expect(within(route).getByRole("link", { name: "评价决策" })).toHaveAttribute("href", "/learn/ahp");
    expect(screen.getByText(/已开放 2 篇精讲/)).toBeInTheDocument();
  });

  it("offers the course and its practice in 精讲目录, and the method index points to it", () => {
    inRouter(<LearnPage />);
    expect(screen.getByRole("link", { name: "开始 AHP 精讲" })).toHaveAttribute("href", "/learn/ahp");
    expect(screen.getByRole("link", { name: "AHP 专项练习" })).toHaveAttribute("href", "/practice/ahp");
    expect(screen.getByRole("link", { name: /AHP 层次分析法.*精讲已开放/ })).toHaveAttribute("href", "/learn/ahp");
  });

  it("finds lesson sections, practice and the method in local search", async () => {
    const entries = [...(await lessonEntries()), ...staticEntries()];
    const hits = searchEntries(entries, "一致性", 10);
    expect(hits.some((h) => h.href === "/learn/ahp#consistency")).toBe(true);
    expect(searchEntries(entries, "判断矩阵", 10).some((h) => h.href === "/practice/ahp")).toBe(true);
    expect(searchEntries(entries, "AHP", 10).some((h) => h.id === "method:ahp" && h.href === "/learn/ahp")).toBe(true);
  });

  it("continues the most recently read lesson from the home page", () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-10-13T08:00:00Z"));
    learning.setReading("derive");
    vi.setSystemTime(new Date("2026-10-13T09:00:00Z"));
    learning.setReading("weights", "ahp");
    vi.useRealTimers();
    inRouter(<HomePage />);
    const strip = screen.getByRole("heading", { name: "继续学习" }).closest("section")!;
    expect(within(strip).getByText(/层次分析法（AHP） · 第 4 节 · 从判断矩阵到权重/)).toBeInTheDocument();
    expect(within(strip).getByRole("link", { name: "继续阅读" })).toHaveAttribute("href", "/learn/ahp#weights");
  });
});
