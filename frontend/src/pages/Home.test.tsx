// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { HomePage } from "./Home";

beforeEach(() => {
  localStorage.clear();
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
const renderHome = () =>
  render(
    <MemoryRouter future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
      <HomePage />
    </MemoryRouter>,
  );

it("offers two doors to real pages without presenting AI as online or offering downloads", () => {
  renderHome();
  expect(screen.getByRole("link", { name: /开始第一课/ })).toHaveAttribute(
    "href",
    "/learn/linear-programming",
  );
  expect(screen.getByRole("combobox")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "七关实战" })).toHaveAttribute("href", "/quest");
  expect(screen.queryByText(/AI.*在线/)).not.toBeInTheDocument();
  expect(screen.getAllByRole("link").some((l) => l.hasAttribute("download"))).toBe(false);
});

it("shows only the open stops of the route as links", () => {
  renderHome();
  const lp = screen.getAllByRole("link", { name: "线性规划" });
  expect(lp[0]).toHaveAttribute("href", "/learn/linear-programming");
  expect(screen.queryByRole("link", { name: "回归预测" })).not.toBeInTheDocument();
  expect(screen.getByText("回归预测")).toBeInTheDocument();
});

it("hides 继续学习 for first-time visitors and shows it when local progress exists", () => {
  renderHome();
  expect(screen.queryByRole("heading", { name: "继续学习" })).not.toBeInTheDocument();
  cleanup();
  localStorage.setItem("mb_learning_reading_v1", JSON.stringify("derive"));
  localStorage.setItem(
    "mb_learning_practice_v1",
    JSON.stringify({ "practice-1": { correct: false, attempts: 2, updated: "2026-10-12T00:00:00.000Z" } }),
  );
  renderHome();
  const strip = screen.getByRole("heading", { name: "继续学习" }).closest("section")!;
  expect(within(strip).getByRole("link", { name: "继续阅读" })).toHaveAttribute(
    "href",
    "/learn/linear-programming#derive",
  );
  expect(within(strip).getByText(/1 题待重练/)).toBeInTheDocument();
});

it("searches methods locally and marks methods without a lesson as 速查", () => {
  renderHome();
  const box = screen.getByRole("combobox");
  fireEvent.focus(box);
  fireEvent.change(box, { target: { value: "TOPSIS" } });
  const list = screen.getByRole("listbox", { name: "搜索结果" });
  expect(within(list).getByText("速查 · 精讲筹备中")).toBeInTheDocument();
  fireEvent.change(box, { target: { value: "线性规划" } });
  expect(within(screen.getByRole("listbox")).getAllByText("精讲可学").length).toBeGreaterThan(0);
});
