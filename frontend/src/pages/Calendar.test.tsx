// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CalendarPage } from "./Calendar";

const renderAt = (path = "/library/calendar") =>
  render(
    <MemoryRouter initialEntries={[path]} future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
      <Routes>
        <Route path="/library/calendar" element={<CalendarPage />} />
      </Routes>
    </MemoryRouter>,
  );

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-10-13T04:00:00Z")); // 北京时间 2026-10-13 12:00
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

const row = (name: string) => {
  const hit = screen.getAllByRole("rowheader").find((r) => r.querySelector("strong")?.textContent === name);
  if (!hit) throw new Error(`no row ${name}`);
  return hit;
};

describe("赛事日历", () => {
  it("“接下来”按时间列出官方节点和倒计时", () => {
    renderAt();
    const next = screen.getByRole("region", { name: "接下来" });
    const first = within(next).getAllByRole("button")[0];
    expect(first).toHaveTextContent("10 天后");
    expect(first).toHaveTextContent("MathorCup 大数据");
    expect(first).toHaveTextContent("报名截止");
  });

  it("全年时间轴：报名与比赛分开，状态准确", () => {
    renderAt();
    expect(screen.getByRole("table", { name: "2026 年赛事时间轴" })).toBeInTheDocument();
    expect(row("国赛")).toHaveTextContent("已结束");
    expect(row("深圳杯")).toHaveTextContent("本年暂停");
    expect(row("亚太赛")).toHaveTextContent("报名中");
    expect(screen.getByRole("button", { name: /^国赛 向全国组委会报名截止：截止 9 月 7 日 20:00/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^国赛 比赛：9 月 10 日 18:00 – 9 月 13 日 20:00（官方已公布）/ })).toBeInTheDocument();
    expect(screen.getByText("10 月", { selector: ".is-current" })).toHaveAttribute("aria-current", "date");
  });

  it("2027 年：美赛为官方日期，其余为预计并有醒目提示", () => {
    renderAt("/library/calendar?year=2027");
    expect(screen.getByText(/斜纹条按最近一届官方日期推算/)).toBeInTheDocument();
    expect(row("国赛")).toHaveTextContent("预计 · 参考 2026 年");
    expect(row("美赛")).toHaveTextContent("报名截止前");
    expect(screen.getByRole("button", { name: /^国赛 比赛：约 9 月 9 日 18:00 – 9 月 12 日 20:00（预计（参考 2026 年））/ })).toBeInTheDocument();
  });

  it("详情：北京时间与官方时区、来源、核验日期、日历导出；Esc 关闭", () => {
    renderAt("/library/calendar?year=2027&c=mcm");
    const dialog = screen.getByRole("dialog", { name: /美国大学生数学建模竞赛/ });
    expect(within(dialog).getByText("1 月 29 日 06:00 – 2 月 2 日 09:00")).toBeInTheDocument();
    expect(within(dialog).getByText(/官方原文：美东时间（EST） 1 月 28 日 17:00 – 2 月 1 日 20:00/)).toBeInTheDocument();
    expect(within(dialog).getByRole("link", { name: /Contest Rules, Registration and Instructions/ })).toHaveAttribute("href", expect.stringContaining("comap.com"));
    expect(within(dialog).getByText(/核验于 2026-10-13/)).toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: /添加到日历/ })).toBeInTheDocument();
    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("预计的届次不提供日历导出，并说明不是官方安排", () => {
    renderAt("/library/calendar?year=2027&c=cumcm");
    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByText(/不是官方安排/)).toBeInTheDocument();
    expect(within(dialog).queryByRole("button", { name: /添加到日历/ })).not.toBeInTheDocument();
    expect(within(dialog).getAllByText("预计（参考 2026 年）").length).toBeGreaterThan(0);
  });

  it("按月列表：报名和比赛是两条，跨年事件单独分组", () => {
    renderAt();
    fireEvent.click(screen.getByRole("radio", { name: "按月列表" }));
    const sep = screen.getByRole("region", { name: "9 月" });
    expect(within(sep).getAllByText("国赛")).toHaveLength(2);
    expect(within(sep).getByText("向全国组委会报名截止")).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "2025 年" })).toHaveTextContent("华数杯国际");
  });

  it("筛选：类别与隐藏已结束", () => {
    renderAt();
    fireEvent.change(screen.getByLabelText("类别"), { target: { value: "研究生赛" } });
    expect(screen.getAllByRole("rowheader")).toHaveLength(1);
    fireEvent.change(screen.getByLabelText("类别"), { target: { value: "全部" } });
    fireEvent.click(screen.getByLabelText("隐藏已结束"));
    expect(screen.getAllByRole("rowheader").some((r) => r.querySelector("strong")?.textContent === "国赛")).toBe(false);
    expect(row("亚太赛")).toBeInTheDocument();
  });

  it("历史年份说明收录范围", () => {
    renderAt("/library/calendar?year=2025");
    expect(screen.getByText(/2025 年只收录了已从主办方原文核对过的赛事/)).toBeInTheDocument();
    expect(screen.getAllByRole("rowheader")).toHaveLength(1);
  });
});

describe("倒计时自动更新（不刷新页面）", () => {
  const setVisibility = (state: "visible" | "hidden") => {
    Object.defineProperty(document, "visibilityState", { configurable: true, get: () => state });
    document.dispatchEvent(new Event("visibilitychange"));
  };
  beforeEach(() => {
    vi.useRealTimers();
    vi.useFakeTimers({ toFake: ["Date", "setTimeout", "clearTimeout", "setInterval", "clearInterval"] });
    vi.setSystemTime(new Date("2026-10-23T03:59:30Z")); // 北京时间 10-23 11:59:30，报名 12:00 截止
  });
  afterEach(() => {
    setVisibility("visible");
  });

  const firstCard = () => within(screen.getByRole("region", { name: "接下来" })).getAllByRole("button")[0];

  it("到达截止的那一分钟自动切换倒计时和状态", () => {
    renderAt();
    expect(firstCard()).toHaveTextContent("1 分钟后");
    expect(firstCard()).toHaveTextContent("报名截止");
    expect(row("MathorCup 大数据")).toHaveTextContent("报名中");
    act(() => vi.advanceTimersByTime(31_000)); // 跨过 12:00
    expect(firstCard()).toHaveTextContent("MathorCup 大数据");
    expect(firstCard()).toHaveTextContent("初赛开始");
    expect(firstCard()).toHaveTextContent("6 小时后");
    expect(row("MathorCup 大数据")).toHaveTextContent("报名已截止 · 即将开赛");
    act(() => vi.advanceTimersByTime(60_000));
    expect(firstCard()).toHaveTextContent("5 小时 59 分钟后");
  });

  it("只保留一个对齐整分钟的定时器；标签页隐藏时暂停，恢复时立即校正", () => {
    renderAt();
    expect(vi.getTimerCount()).toBe(1);
    act(() => setVisibility("hidden"));
    expect(vi.getTimerCount()).toBe(0);
    vi.setSystemTime(new Date("2026-10-23T10:00:30Z")); // 后台期间时间过去了约 6 小时
    act(() => setVisibility("visible"));
    expect(row("MathorCup 大数据")).toHaveTextContent("初赛进行中");
    expect(firstCard()).toHaveTextContent("初赛结束");
    expect(vi.getTimerCount()).toBe(1);
  });

  it("窗口重新获得焦点或从往返缓存恢复时也会校正，且不会叠加定时器", () => {
    renderAt();
    vi.setSystemTime(new Date("2026-10-23T04:30:00Z"));
    act(() => { window.dispatchEvent(new Event("focus")); });
    expect(row("MathorCup 大数据")).toHaveTextContent("报名已截止");
    act(() => { window.dispatchEvent(new Event("pageshow")); window.dispatchEvent(new Event("focus")); });
    expect(vi.getTimerCount()).toBe(1);
  });

  it("卸载后不留下定时器和监听", () => {
    const removeDoc = vi.spyOn(document, "removeEventListener");
    const removeWin = vi.spyOn(window, "removeEventListener");
    const { unmount } = renderAt();
    unmount();
    expect(vi.getTimerCount()).toBe(0);
    expect(removeDoc).toHaveBeenCalledWith("visibilitychange", expect.any(Function));
    expect(removeWin).toHaveBeenCalledWith("focus", expect.any(Function));
    expect(removeWin).toHaveBeenCalledWith("pageshow", expect.any(Function));
  });

  it("待核实的节点显示为“待核实”，不画成日期", () => {
    vi.setSystemTime(new Date("2026-10-13T04:00:00Z"));
    renderAt("/library/calendar?c=shuwei-spring");
    const dialog = screen.getByRole("dialog");
    const pendingRow = within(dialog).getAllByRole("row").find((r) => r.textContent?.includes("报名截止时间未能在官网再次核对"))!;
    expect(pendingRow).toHaveTextContent("待核实");
    expect(pendingRow).not.toHaveTextContent("官方已公布");
  });
});
