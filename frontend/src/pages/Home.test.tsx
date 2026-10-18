// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { HomePage } from "./Home";
import { learning } from "../state/learning";
import { event } from "../challenge/event";
import { sourceFrom } from "../challenge/analytics";

beforeEach(() => {
  localStorage.clear();
  learning.resetForTests();
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
  // V3.0: the newcomer door starts at 第零课, with linear programming one click away.
  expect(screen.getByRole("link", { name: /从第零课开始/ })).toHaveAttribute("href", "/learn/introduction");
  expect(screen.getAllByRole("link", { name: "线性规划" })[0]).toHaveAttribute("href", "/learn/linear-programming");
  expect(screen.getByRole("combobox")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "七关实战" })).toHaveAttribute("href", "/quest");
  expect(screen.queryByText(/AI.*在线/)).not.toBeInTheDocument();
  expect(screen.getAllByRole("link").some((l) => l.hasAttribute("download"))).toBe(false);
});

it("shows only the open stops of the route as links", () => {
  renderHome();
  const lp = screen.getAllByRole("link", { name: "线性规划" });
  expect(lp[0]).toHaveAttribute("href", "/learn/linear-programming");
  expect(screen.getByRole("link", { name: "回归预测" })).toHaveAttribute("href", "/learn/regression");
  expect(screen.queryByRole("link", { name: "综合项目" })).not.toBeInTheDocument();
  expect(screen.getByText("综合项目")).toBeInTheDocument();
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
  learning.resetForTests(); // a new page load: V1 records are migrated into the V2 store
  renderHome();
  const strip = screen.getByRole("heading", { name: "继续学习" }).closest("section")!;
  expect(within(strip).getByRole("link", { name: "继续阅读" })).toHaveAttribute(
    "href",
    "/learn/linear-programming#derive",
  );
  expect(within(strip).getByText(/1 题待重练/)).toBeInTheDocument();
  expect(within(strip).getByText(/第 4 节 · 不用软件，完整求出最优解/)).toBeInTheDocument();
});

it("searches methods locally and marks methods without a lesson as 速查", () => {
  renderHome();
  const box = screen.getByRole("combobox");
  fireEvent.focus(box);
  fireEvent.change(box, { target: { value: "ARIMA" } });
  const list = screen.getByRole("listbox", { name: "搜索结果" });
  expect(within(list).getByText("速查 · 精讲筹备中")).toBeInTheDocument();
  // TOPSIS has had a lesson since V3.0.
  fireEvent.change(box, { target: { value: "TOPSIS" } });
  expect(within(screen.getByRole("listbox")).getAllByText("精讲可学").length).toBeGreaterThan(0);
  fireEvent.change(box, { target: { value: "线性规划" } });
  expect(within(screen.getByRole("listbox")).getAllByText("精讲可学").length).toBeGreaterThan(0);
});

describe("recruitment notice", () => {
  const original = { ...event };
  afterEach(() => Object.assign(event, original));

  it("shows the society, the QQ group from the shared event config and the challenge entry", () => {
    renderHome();
    const notice = screen.getByRole("region", { name: `${event.societyName}正在招新` });
    expect(within(notice).getByText(event.qqGroup)).toBeInTheDocument();
    expect(within(notice).getByText(event.groupName)).toBeInTheDocument();
    expect(within(notice).getByText(event.joinNote)).toBeInTheDocument();
    const game = within(notice).getByRole("link", { name: /约 3 分钟/ });
    expect(game).toHaveAttribute("href", "/challenge?src=site");
    // 公告入口的渠道值在白名单里，不会被静默归为 direct
    expect(sourceFrom("?src=site")).toBe("site");
    // 不虚构截止日期、人数或福利
    expect(notice.textContent).not.toMatch(/截止|名额|抽奖|奖品|\d+ ?人/);
  });

  it("copies the group number and falls back to selecting it when copying fails", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
    renderHome();
    fireEvent.click(screen.getByRole("button", { name: "复制群号" }));
    expect(await screen.findByText(/已复制群号/)).toBeInTheDocument();
    expect(writeText).toHaveBeenCalledWith(event.qqGroup);
    cleanup();

    Object.defineProperty(navigator, "clipboard", { value: { writeText: vi.fn().mockRejectedValue(new Error("denied")) }, configurable: true });
    Object.defineProperty(document, "execCommand", { value: vi.fn().mockReturnValue(false), configurable: true });
    renderHome();
    fireEvent.click(screen.getByRole("button", { name: "复制群号" }));
    expect(await screen.findByText(/没能自动复制/)).toBeInTheDocument();
    expect(window.getSelection()!.toString()).toBe(event.qqGroup);
    Object.defineProperty(navigator, "clipboard", { value: undefined, configurable: true });
  });

  it("is controlled by the shared activity switch", () => {
    event.active = false;
    renderHome();
    expect(screen.queryByRole("button", { name: "复制群号" })).not.toBeInTheDocument();
    expect(screen.queryByText(event.qqGroup)).not.toBeInTheDocument();
    // 学习入口照常
    expect(screen.getByRole("link", { name: /从第零课开始/ })).toBeInTheDocument();
  });

  it("links the separate team-roles exploration, distinct from the challenge", () => {
    renderHome();
    expect(screen.getByRole("link", { name: /找到你的建模起点/ })).toHaveAttribute("href", "/learn/team-roles");
    expect(screen.getByRole("heading", { name: "不确定先学建模、编程还是论文？" })).toBeInTheDocument();
  });
});
