// @vitest-environment jsdom
// The smaller interactives of 第零课: the process tabs (keyboard), the commute calculator (real counts)
// and the team board (no wrong answers, everyone involved).
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it } from "vitest";
import verified from "./intro-verified.json";
import { CommuteCalculator } from "./CommuteCalculator";
import { ProcessExplorer } from "./ProcessExplorer";
import { COMMUTE_STEPS } from "./process";
import { TEAM_TASKS, TeamBoard } from "./TeamBoard";

afterEach(cleanup);
const inRouter = (ui: JSX.Element) =>
  render(<MemoryRouter future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>{ui}</MemoryRouter>);

describe("ProcessExplorer", () => {
  it("shows one step at a time and moves with the arrow keys", () => {
    inRouter(<ProcessExplorer />);
    const tabs = screen.getAllByRole("tab");
    expect(tabs).toHaveLength(9);
    expect(tabs[0]).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tabpanel")).toHaveTextContent(COMMUTE_STEPS[0].result);
    fireEvent.keyDown(tabs[0], { key: "ArrowRight" });
    expect(screen.getAllByRole("tab")[1]).toHaveAttribute("aria-selected", "true");
    expect(document.activeElement).toBe(screen.getAllByRole("tab")[1]);
    fireEvent.keyDown(tabs[1], { key: "End" });
    expect(screen.getByRole("tabpanel")).toHaveTextContent("第 9 步 · 解释与改进");
    fireEvent.click(screen.getByRole("tab", { name: /检验/ }));
    expect(screen.getByRole("tabpanel")).toHaveTextContent("↺ 回到第 2、6 步");
    // The steps it loops back to are marked.
    expect(screen.getByRole("tab", { name: /明确目标/ })).toHaveClass("is-loop-target");
    expect(screen.getByRole("tab", { name: /建立关系/ })).toHaveClass("is-loop-target");
    fireEvent.keyDown(screen.getAllByRole("tab")[7], { key: "Home" });
    expect(screen.getByRole("tabpanel")).toHaveTextContent("第 1 步 · 发现问题");
  });
});

describe("CommuteCalculator", () => {
  it("counts on-time days from the data for every departure", () => {
    inRouter(<CommuteCalculator />);
    // The summary line (the <output> next to the slider is a status too).
    const result = () => document.querySelector("p.intro-result") as HTMLElement;
    const slider = screen.getByRole("slider");
    for (const d of verified.commute.departures) {
      fireEvent.change(slider, { target: { value: String(d.depart) } });
      const text = result().textContent!;
      expect(text).toContain(`${d.onTime} 天准时`);
      if (d.late.length) expect(text).toContain(`${d.late.length} 天迟到（第 ${d.late.join("、")} 天）`);
      else expect(text).toContain("没有一天迟到");
    }
    fireEvent.click(screen.getByRole("button", { name: "按最长用时（7:45）" }));
    expect(result()).toHaveTextContent("7:45 出门：记录的 10 天里 10 天准时，没有一天迟到。");
    fireEvent.click(screen.getByRole("button", { name: "按平均用时（7:48）" }));
    expect(result()).toHaveTextContent("7 天准时，3 天迟到（第 4、7、10 天）");
    expect(screen.getByText("15 分钟 · 8:03 到 · 迟到 3 分钟")).toBeInTheDocument();
  });
});

describe("TeamBoard", () => {
  it("never marks a choice wrong and ends with the shared-work summary", () => {
    inRouter(<TeamBoard />);
    const groups = screen.getAllByRole("group");
    expect(groups).toHaveLength(TEAM_TASKS.length);
    // Pick 论文与表达 for the data job (not the usual lead): explained, not crossed out.
    fireEvent.click(screen.getAllByRole("button", { name: "论文与表达" })[1]);
    expect(screen.getByText(/也可以。/)).toBeInTheDocument();
    expect(screen.queryByText(/✕/)).not.toBeInTheDocument();
    for (let i = 0; i < TEAM_TASKS.length; i++) fireEvent.click(screen.getAllByRole("button", { name: "模型分析" })[i]);
    expect(screen.getByText(/5 项都至少需要两类同学参与/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "重新分配" }));
    expect(screen.getByText("已选 0/5 项。选完五项会看到一个小结。")).toBeInTheDocument();
  });
});
