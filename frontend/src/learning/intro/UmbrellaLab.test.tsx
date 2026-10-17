// @vitest-environment jsdom
// The umbrella case: one step at a time, real numbers from math.ts, illegal plans refused,
// the optimum recognised, demand changes recomputed, reset, and the milestone stored locally.
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { learning } from "../../state/learning";
import { LEARNING_KEY } from "../../state/learningStore";
import { optimum, plan } from "./math";
import { SCENARIOS, UMBRELLA } from "./data";
import { INTRO_LAB_MILESTONE } from "./sectionIds";
import { UmbrellaLab } from "./UmbrellaLab";

beforeEach(() => {
  localStorage.clear();
  learning.resetForTests();
});
afterEach(cleanup);

const renderLab = () =>
  render(
    <MemoryRouter future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
      <UmbrellaLab />
    </MemoryRouter>,
  );
const click = (name: string | RegExp) => fireEvent.click(screen.getByRole("button", { name }));
const next = () => screen.getByRole("button", { name: "下一步 →" });
const status = () => screen.getAllByRole("status").map((s) => s.textContent).join(" ");
const stepHeading = () => screen.getByRole("heading", { level: 4 }).textContent;

function toStep4() {
  fireEvent.click(screen.getByLabelText(/借不到伞的人数：A、B 两点/));
  click("确定");
  click("下一步 →");
  fireEvent.change(screen.getByLabelText("不调配时借不到伞的人数"), { target: { value: "20" } });
  click("核对");
  click("下一步 →");
  fireEvent.click(screen.getByLabelText(/从 B 点调到 A 点的伞数 x/));
  click("下一步 →");
}
const slider = () => screen.getAllByRole("slider")[0];

describe("UmbrellaLab", () => {
  it("starts at step 1 and only moves on after the step is done", () => {
    renderLab();
    expect(stepHeading()).toBe("第 1 步 · 明确目标");
    expect(next()).toBeDisabled();
    expect(screen.getByText("先选一个，再点“确定”。")).toBeInTheDocument();
    // A different measure is not marked wrong, it is explained with a computed number.
    fireEvent.click(screen.getByLabelText(/两个点雨伞数量的差/));
    click("确定");
    expect(status()).toContain("这个数能算，但回答的是别的问题");
    expect(status()).toContain(`两点各放 30 把时，A 点仍有 ${plan(UMBRELLA, 10).shortA} 人借不到伞`);
    expect(status()).toContain("本题的目标：借不到伞的人数，越少越好。");
    expect(next()).toBeEnabled();
    fireEvent.click(screen.getByLabelText(/调动的雨伞数量/));
    click("确定");
    expect(status()).toContain(`A 点有 ${plan(UMBRELLA, 0).shortA} 人借不到伞`);
    expect(status()).toContain("次要考虑");
  });

  it("checks the current shortage with a diagnosis for common mistakes", () => {
    renderLab();
    fireEvent.click(screen.getByLabelText(/借不到伞的人数：A、B 两点/));
    click("确定");
    click("下一步 →");
    expect(stepHeading()).toBe("第 2 步 · 看清现状");
    const input = screen.getByLabelText("不调配时借不到伞的人数");
    fireEvent.change(input, { target: { value: "0" } });
    click("核对");
    expect(status()).toContain("伞放错了地方");
    expect(next()).toBeDisabled();
    fireEvent.change(input, { target: { value: "40" } });
    click("核对");
    expect(status()).toContain("把 A 点的需求 40 当成了缺口");
    fireEvent.change(input, { target: { value: "二十" } });
    click("核对");
    expect(status()).toContain("请输入一个整数");
    fireEvent.change(input, { target: { value: "20" } });
    click("核对");
    expect(status()).toContain("合计 20 人借不到伞");
    expect(next()).toBeEnabled();
  });

  it("shows the real shortage for every transfer, refuses impossible ones and recognises the optimum", () => {
    renderLab();
    toStep4();
    expect(stepHeading()).toBe("第 4 步 · 动手调配");
    expect(status()).toContain("不调配：A 点 20 把、B 点 40 把，借不到伞的有 20 人（A 点缺 20，B 点缺 0）");
    for (const x of [-20, -5, 0, 7, 10, 25, 40]) {
      fireEvent.change(slider(), { target: { value: String(x) } });
      const p = plan(UMBRELLA, x);
      expect(status()).toContain(`A 点 ${p.a} 把、B 点 ${p.b} 把，借不到伞的有 ${p.shortage} 人`);
    }
    // Not optimal: no way forward yet, a hint instead of a cross.
    fireEvent.change(slider(), { target: { value: "10" } });
    click("就用这个方案");
    expect(status()).toContain("还能更好");
    expect(status()).toContain("这个方案有 10 人借不到伞，而最少可以是 0 人");
    expect(next()).toBeDisabled();
    // Typed values outside the stock are refused and the plan stays.
    const exact = screen.getByLabelText("输入调配数量 x");
    for (const [value, message] of [
      ["41", "B 点现在只有 40 把伞，最多只能调 40 把到 A 点。"],
      ["-21", "A 点现在只有 20 把伞，最多只能调 20 把到 B 点。"],
      ["2.5", "雨伞要一把一把地调，请输入整数。"],
    ]) {
      fireEvent.change(exact, { target: { value } });
      fireEvent.keyDown(exact, { key: "Enter" });
      expect(screen.getByRole("alert")).toHaveTextContent(`${message}方案保持 x = 10。`);
      expect(slider()).toHaveValue("10");
    }
    // The +/- buttons stop at the limits.
    fireEvent.change(slider(), { target: { value: "40" } });
    expect(screen.getByRole("button", { name: "多调 1 把" })).toBeDisabled();
    // Enumerate every plan: the curve names the optimum.
    click("把每一种调法都算一遍");
    expect(screen.getByRole("img")).toHaveAttribute("aria-label", expect.stringContaining("一共 61 种调法，x = 20 时最少，为 0 人"));
    fireEvent.change(exact, { target: { value: "20" } });
    fireEvent.keyDown(exact, { key: "Enter" });
    click("就用这个方案");
    expect(status()).toContain("这是最优方案");
    expect(status()).toContain("x = 20 是唯一的最优方案");
    expect(next()).toBeEnabled();
  });

  it("recomputes when the demand forecast is wrong, including several optimal plans and too little stock", () => {
    renderLab();
    toStep4();
    fireEvent.change(slider(), { target: { value: "20" } });
    click("就用这个方案");
    click("下一步 →");
    expect(stepHeading()).toBe("第 5 步 · 如果预测不准");
    expect(next()).toBeDisabled();
    for (const s of SCENARIOS.slice(1)) {
      click(s.label);
      const c = { stock: UMBRELLA.stock, demand: s.demand };
      const o = optimum(c);
      const rows = within(screen.getByRole("table")).getAllByRole("row");
      expect(rows[1]).toHaveTextContent(`你的方案从 B 调 20 把到 A${plan(c, 20).shortA}${plan(c, 20).shortB}${plan(c, 20).shortage}`);
      expect(rows[2].textContent).toContain(String(plan(c, o.fewestMoves).shortage));
      if (o.low !== o.high) expect(status()).toContain(`x 取 ${o.low} 到 ${o.high} 之间的任何整数`);
    }
    click("A 点多来 10 人");
    expect(status()).toContain("需求一共 70 人，超过了 60 把伞，无论怎样调配，至少有 10 人借不到");
    click("宿舍区有活动");
    expect(status()).toContain("你的方案会让 15 人借不到伞，比最优方案多 15 人");
    // Free sliders: B needs far more, the best plan moves umbrellas from A to B.
    const [a, b] = screen.getAllByRole("slider");
    fireEvent.change(a, { target: { value: "5" } });
    fireEvent.change(b, { target: { value: "50" } });
    expect(within(screen.getByRole("table")).getAllByRole("row")[2]).toHaveTextContent("从 A 调 10 把到 B000");
    expect(next()).toBeEnabled();
  });

  it("stores completion once, and restarts cleanly without forgetting it", () => {
    renderLab();
    toStep4();
    fireEvent.change(slider(), { target: { value: "20" } });
    click("就用这个方案");
    click("下一步 →");
    click("A 点多来 10 人");
    click("下一步 →");
    expect(stepHeading()).toBe("第 6 步 · 小结");
    expect(screen.getByText(/已在此浏览器的学习记录中标记：雨伞案例完成/)).toBeInTheDocument();
    const saved = JSON.parse(localStorage.getItem(LEARNING_KEY)!);
    expect(Object.keys(saved.milestones)).toEqual([INTRO_LAB_MILESTONE]);
    expect(screen.getByRole("link", { name: "继续：回头看完整流程 →" })).toHaveAttribute("href", "/#intro-review");
    click("↺ 再做一遍");
    expect(stepHeading()).toBe("第 1 步 · 明确目标");
    expect(screen.getAllByRole("radio").filter((r) => (r as HTMLInputElement).checked)).toHaveLength(0);
    expect(screen.getByText("你在此浏览器里已经完成过一次，可以再做一遍。")).toBeInTheDocument();
    // The first time is kept.
    expect(JSON.parse(localStorage.getItem(LEARNING_KEY)!).milestones).toEqual(saved.milestones);
  });

  it("the header reset works from any step and goes back to the default data", () => {
    renderLab();
    toStep4();
    fireEvent.change(slider(), { target: { value: "33" } });
    click("↺ 重新开始");
    expect(stepHeading()).toBe("第 1 步 · 明确目标");
    toStep4();
    expect(slider()).toHaveValue("0");
    expect(status()).toContain("借不到伞的有 20 人");
  });
});
