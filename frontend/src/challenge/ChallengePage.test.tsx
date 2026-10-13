// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AppRoutes } from "../App";
import { CHALLENGE_STORAGE_KEY, event } from "./config";

const events: { name: string; [k: string]: string }[] = [];
const listener = (e: Event) => events.push((e as CustomEvent).detail);

beforeEach(() => {
  localStorage.clear();
  events.length = 0;
  window.addEventListener("mb:challenge", listener);
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
  vi.stubGlobal("fetch", vi.fn(() => Promise.reject(new Error("offline"))));
  window.scrollTo = vi.fn() as unknown as typeof window.scrollTo;
});
afterEach(() => {
  cleanup();
  window.removeEventListener("mb:challenge", listener);
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]} future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
      <AppRoutes />
    </MemoryRouter>,
  );
const click = (name: string | RegExp) => fireEvent.click(screen.getByRole("button", { name }));
const radio = (name: string | RegExp) => fireEvent.click(screen.getByRole("radio", { name }));

/** 一条“建模手 · 优化派”路径，第 2 题找到最优解。 */
async function playOptimizer() {
  click("开始挑战");
  expect(await screen.findByRole("heading", { name: /食堂窗口/ })).toBeInTheDocument();
  click(/几百人同时涌进来/);
  click(/窗口开得少/);
  click(/刷卡机/);
  click("就这三个");
  click("下一题");

  expect(screen.getByRole("heading", { name: /20 块钱和 30 分钟/ })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "拖动滑块点菜" })).toBeDisabled();
  fireEvent.change(screen.getByRole("slider", { name: /^荤菜/ }), { target: { value: "10" } });
  fireEvent.change(screen.getByRole("slider", { name: /^素菜/ }), { target: { value: "5" } });
  expect(screen.getByText("钱不够了！")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "超出了，调一调" })).toBeDisabled();
  fireEvent.change(screen.getByRole("slider", { name: /^荤菜/ }), { target: { value: "5" } });
  fireEvent.change(screen.getByRole("slider", { name: /^素菜/ }), { target: { value: "10" } });
  expect(screen.getByText("35")).toBeInTheDocument();
  click("就这么吃");
  expect(screen.getByText("你找到了最优解！")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "下一题" })).toBeDisabled();
  radio(/先算钱和时间/);
  click("下一题");

  expect(screen.getByRole("heading", { name: /三个社团/ })).toBeInTheDocument();
  fireEvent.click(screen.getAllByRole("radio", { name: "兴趣更重要" })[0]);
  fireEvent.click(screen.getAllByRole("radio", { name: "兴趣更重要" })[1]);
  fireEvent.click(screen.getAllByRole("radio", { name: "一样" })[2]);
  click("算一算该选谁");
  expect(screen.getByText(/推荐：摄影社/)).toBeInTheDocument();
  radio(/照着权重选/);
  click("下一题");

  expect(screen.getByRole("heading", { name: /图书馆/ })).toBeInTheDocument();
  radio(/快到座位上限/);
  click("揭晓");
  click("下一题");

  expect(screen.getByRole("heading", { name: /奶茶/ })).toBeInTheDocument();
  radio(/从店出发/);
  click("看我的结果");
}

describe("/challenge", () => {
  it("opens directly as a standalone page (deep link with a source parameter)", async () => {
    renderAt("/challenge?src=poster");
    expect(await screen.findByRole("heading", { name: /建模队里的哪种人/ })).toBeInTheDocument();
    expect(screen.queryByRole("navigation", { name: "主导航" })).not.toBeInTheDocument();
    expect(screen.getByText(/无需注册/)).toBeInTheDocument();
    expect(screen.getByText(/不收集个人信息/)).toBeInTheDocument();
    expect(events[0]).toEqual({ name: "challenge_enter", src: "poster" });
  });

  it("plays all five questions to a result with the QQ group and a tracked course link", async () => {
    renderAt("/challenge?src=booth");
    await playOptimizer();

    expect(screen.getByRole("heading", { name: /建模手/ })).toHaveTextContent("优化派");
    expect(screen.getByText(/最佳搭档/)).toHaveTextContent("论文手");
    expect(screen.getByText(event.qqGroup)).toBeInTheDocument();
    expect(screen.getByText(/趣味倾向，不是能力测评/)).toBeInTheDocument();
    expect(screen.getByText(/就是线性规划的最优解/)).toBeInTheDocument();
    for (const link of screen.getAllByRole("link").filter((l) => l.getAttribute("href")?.startsWith("/learn")))
      expect(link.getAttribute("href")).toContain("from=challenge");

    const writeText = vi.fn(() => Promise.resolve());
    Object.assign(navigator, { clipboard: { writeText } });
    click("复制群号");
    expect(await screen.findByText(/已复制/)).toBeInTheDocument();
    expect(writeText).toHaveBeenCalledWith(event.qqGroup);

    expect(events.map((e) => e.name)).toEqual(["challenge_enter", "challenge_start", "challenge_complete", "challenge_copy_group"]);
    expect(events[2]).toMatchObject({ src: "booth", result: "optimize" });
    // 不带任何个人信息：只有事件名、渠道、结果类型
    for (const e of events) expect(Object.keys(e).every((k) => ["name", "src", "result"].includes(k))).toBe(true);
  });

  it("keeps the result after a refresh, in its own storage key only", async () => {
    const first = renderAt("/challenge");
    await playOptimizer();
    first.unmount();
    expect(Object.keys(localStorage)).toEqual([CHALLENGE_STORAGE_KEY]);

    renderAt("/challenge");
    expect(await screen.findByRole("heading", { name: /建模手/ })).toBeInTheDocument();
    click("再测一次");
    expect(screen.getByRole("heading", { name: /食堂窗口/ })).toBeInTheDocument();
  });

  it("ignores unknown sources and broken saved data", async () => {
    localStorage.setItem(CHALLENGE_STORAGE_KEY, JSON.stringify({ v: 1, step: "result", result: "data", answers: { q1: ["x"] } }));
    renderAt("/challenge?src=<script>");
    expect(await screen.findByRole("button", { name: "开始挑战" })).toBeInTheDocument();
    expect(events[0]).toEqual({ name: "challenge_enter", src: "direct" });
  });
});
