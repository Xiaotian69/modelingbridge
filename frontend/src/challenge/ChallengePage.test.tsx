// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AppRoutes } from "../App";
import { CHALLENGE_STORAGE_KEY, event, q3 } from "./config";

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
async function playOptimizer(fromIntro = true) {
  if (fromIntro) click("开始挑战");
  expect(await screen.findByRole("heading", { name: /食堂窗口/ })).toBeInTheDocument();
  click(/几百人同时涌进来/);
  click(/窗口开得少/);
  click(/刷卡机/);
  click("确认这三个");
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

  expect(screen.getByRole("heading", { name: /三门选修课/ })).toBeInTheDocument();
  expect(screen.getByRole("table", { name: "三门选修课的情况" })).toHaveTextContent("无平时作业，期末开卷");
  // 必须三个两难都选过才能确认；确认前可以随便改
  expect(screen.getByRole("button", { name: "还有 3 个两难没选" })).toBeDisabled();
  fireEvent.click(screen.getAllByRole("radio", { name: "避开早八，明显更重要" })[0]);
  fireEvent.click(screen.getAllByRole("radio", { name: "给分高，明显更重要" })[0]);
  fireEvent.click(screen.getAllByRole("radio", { name: "给分高，明显更重要" })[1]);
  fireEvent.click(screen.getAllByRole("radio", { name: "两个一样重要" })[2]);
  click("确认，帮我选课");
  expect(screen.getByText("推荐你选：心理学与生活")).toBeInTheDocument();
  expect(screen.getByText(/你最看重「给分高」（权重 71%），这一项最好的是心理学与生活。心理学与生活综合 4\.57 分，第二名电影鉴赏 4\.14 分/)).toBeInTheDocument();
  expect(screen.getByText(q3.simulatedNote)).toBeInTheDocument();
  expect(screen.getByText(/三句判断前后一致/)).toBeInTheDocument();
  expect(screen.getByText("看看是怎么算的")).toBeInTheDocument();
  radio(/就按它选/);
  click("下一题");

  expect(screen.getByRole("heading", { name: /图书馆/ })).toBeInTheDocument();
  radio(/快到座位上限/);
  click("确认答案");
  click("下一题");

  expect(screen.getByRole("heading", { name: /奶茶/ })).toBeInTheDocument();
  radio(/找数据/); // 点错了，确认前可以改
  radio(/从店出发/);
  expect(screen.getByRole("radio", { name: /从店出发/ })).toHaveAttribute("aria-checked", "true");
  expect(screen.getByRole("radio", { name: /找数据/ })).toHaveAttribute("aria-checked", "false");
  click("确认答案");
  click("看我的结果");
}

describe("/challenge", () => {
  it("opens directly as a standalone page (deep link with a source parameter)", async () => {
    renderAt("/challenge?src=poster");
    expect(await screen.findByRole("heading", { name: /建模队里的哪种人/ })).toBeInTheDocument();
    expect(screen.queryByRole("navigation", { name: "主导航" })).not.toBeInTheDocument();
    expect(screen.getByText(/无需注册/)).toBeInTheDocument();
    expect(screen.queryByText(/不收集个人信息/)).not.toBeInTheDocument();
    expect(screen.getByText(/财大数学建模协会/)).toBeInTheDocument();
    expect(screen.queryByText(/抽奖/)).not.toBeInTheDocument(); // lottery 默认关闭
    expect(events[0]).toEqual({ name: "challenge_enter", src: "poster" });
  });

  it("plays all five questions to a result with the QQ group and a tracked course link", async () => {
    renderAt("/challenge?src=booth");
    await playOptimizer();

    expect(screen.getByRole("heading", { name: /建模手/ })).toHaveTextContent("优化派");
    expect(screen.getByText(/最佳搭档/)).toHaveTextContent("论文手");
    expect(screen.getByText(event.qqGroup)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "加入财大数学建模协会" })).toBeInTheDocument();
    expect(screen.getByTestId("celebration")).toBeInTheDocument();
    expect(screen.getByText("挑战完成")).toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/抽奖|不收集个人信息|(?<!财大)数学建模协会 QQ/);
    expect(screen.getByText(/趣味倾向，不是能力测评/)).toBeInTheDocument();
    expect(screen.getByText(/就是线性规划的最优解/)).toBeInTheDocument();
    for (const link of screen.getAllByRole("link").filter((l) => l.getAttribute("href")?.startsWith("/learn")))
      expect(link.getAttribute("href")).toContain("from=challenge");

    const writeText = vi.fn(() => Promise.resolve());
    Object.assign(navigator, { clipboard: { writeText } });
    click("复制群号");
    expect(await screen.findByText(/已复制招新群号/)).toBeInTheDocument();
    expect(screen.getByText("QQ 招新群")).toBeInTheDocument();
    expect(writeText).toHaveBeenCalledWith(event.qqGroup);

    // 协会介绍：默认收起，展开后分三组，并能从里面直接复制群号
    const disclose = screen.getByRole("button", { name: /在协会能做什么/ });
    expect(disclose).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(disclose);
    expect(disclose).toHaveAttribute("aria-expanded", "true");
    for (const label of ["加入就有", "可以一起做", "计划开展"]) expect(screen.getByRole("region", { name: label })).toBeInTheDocument();
    expect(screen.getByText("以群通知为准")).toBeInTheDocument();
    expect(screen.getAllByText("适合你").length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole("button", { name: "复制招新群号，进群了解" }));
    await vi.waitFor(() => expect(writeText).toHaveBeenCalledTimes(2));

    expect(events.map((e) => e.name)).toEqual(["challenge_enter", "challenge_start", "challenge_complete", "challenge_copy_group", "challenge_society_open", "challenge_copy_group"]);
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
    // 刷新后恢复结果，但不再放庆祝动画
    expect(screen.queryByTestId("celebration")).not.toBeInTheDocument();
    click("再测一次");
    expect(screen.getByRole("heading", { name: /食堂窗口/ })).toBeInTheDocument();
  });

  it("ignores unknown sources and broken saved data", async () => {
    localStorage.setItem(CHALLENGE_STORAGE_KEY, JSON.stringify({ v: 1, step: "result", result: "data", answers: { q1: ["x"] } }));
    renderAt("/challenge?src=<script>");
    expect(await screen.findByRole("button", { name: "开始挑战" })).toBeInTheDocument();
    expect(events[0]).toEqual({ name: "challenge_enter", src: "direct" });
  });

  it("celebrates once per finish, clears itself, and restarts cleanly", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    renderAt("/challenge");
    await playOptimizer();
    expect(screen.getByTestId("celebration")).toBeInTheDocument();
    await vi.advanceTimersByTimeAsync(2500);
    expect(screen.queryByTestId("celebration")).not.toBeInTheDocument(); // 截图时不残留
    click("再测一次"); // 直接回到第 1 题
    await playOptimizer(false);
    expect(screen.getByTestId("celebration")).toBeInTheDocument(); // 第二次完成照样有
    vi.useRealTimers();
  });

  it("skips the confetti when the system asks for reduced motion", async () => {
    vi.stubGlobal("matchMedia", (q: string) => ({ matches: q.includes("reduce"), media: q, addEventListener() {}, removeEventListener() {} }));
    renderAt("/challenge");
    await playOptimizer();
    expect(screen.getByRole("heading", { name: /建模手/ })).toBeInTheDocument();
    expect(screen.queryByTestId("celebration")).not.toBeInTheDocument();
  });

  it("Q3 reports a contradiction using the player's own words", async () => {
    renderAt("/challenge");
    click("开始挑战");
    click(/几百人同时涌进来/);
    click(/窗口开得少/);
    click(/刷卡机/);
    click("确认这三个");
    click("下一题");
    fireEvent.click(screen.getByRole("button", { name: "荤菜多一串" }));
    click("就这么吃");
    radio(/先算钱和时间/);
    click("下一题");
    fireEvent.click(screen.getAllByRole("radio", { name: "给分高，稍微更重要" })[0]); // 给分 > 作业
    fireEvent.click(screen.getAllByRole("radio", { name: "避开早八，稍微更重要" })[0]); // 避开早八 > 给分
    fireEvent.click(screen.getAllByRole("radio", { name: "作业少，稍微更重要" })[1]); // 作业 > 避开早八
    click("确认，帮我选课");
    expect(screen.getByText(/这三句没法排出一个先后顺序/)).toHaveTextContent("给分高比作业少稍微重要；避开早八比给分高稍微重要；作业少比避开早八稍微重要");

    // 改改判断：回到可编辑状态，改完推荐跟着变
    click(/改改判断/);
    fireEvent.click(screen.getAllByRole("radio", { name: "避开早八，明显更重要" })[0]);
    fireEvent.click(screen.getAllByRole("radio", { name: "避开早八，明显更重要" })[1]);
    fireEvent.click(screen.getAllByRole("radio", { name: "两个一样重要" })[0]);
    click("确认，帮我选课");
    expect(screen.getByText("推荐你选：电影鉴赏")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "下一题" })).toBeDisabled(); // 改过判断要重新回答“怎么用”
  });
});
