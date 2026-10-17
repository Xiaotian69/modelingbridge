// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import fixture from "./regression-verified.json";
import { SALES, TEMPERATURE } from "./data";
import { RegressionFigure } from "./Figures";
import { mean, sseOf } from "./math";
import { RegressionLab } from "./RegressionLab";

afterEach(cleanup);

const stat = (name: string) => screen.getByText(name).closest("div")!.querySelector("dd")!.textContent;
const result = () => screen.getByText(/残差平方和比最小二乘多|几乎一样/).closest(".lab-result")!.textContent!;
const sliders = () => screen.getAllByRole("slider");
const set = (i: number, v: number) => fireEvent.change(sliders()[i], { target: { value: String(v) } });
const xBar = mean(TEMPERATURE);

describe("最小二乘实验", () => {
  it("starts from a flat line at the mean and reports how much worse it is than least squares", () => {
    render(<RegressionLab />);
    expect(sliders()).toHaveLength(2);
    expect(stat("最小二乘 SSE")).toBe(fixture.simple.sse.toFixed(1));
    const flat = sseOf(TEMPERATURE, SALES, 209, 0);
    expect(stat("你的 SSE")).toBe(flat.toFixed(1));
    expect(result()).toContain(`多 ${Math.round((flat / fixture.simple.sse - 1) * 100)}%`);
    expect(result()).toContain("现在是一条水平线");
  });

  it("recomputes SSE for any line the learner sets (no canned numbers)", () => {
    render(<RegressionLab />);
    set(0, 3);
    set(1, 200);
    const expected = sseOf(TEMPERATURE, SALES, 200 - 3 * xBar, 3);
    expect(stat("你的 SSE")).toBe(expected.toFixed(1));
    expect(stat("你的直线")).toBe(`ŷ = ${(200 - 3 * xBar).toFixed(2)} + 3.00x`);
  });

  it("can get within 0.5 % of least squares with the sliders, never below it", () => {
    render(<RegressionLab />);
    set(0, 4.35);
    set(1, 208.5);
    expect(result()).toContain("几乎一样");
    expect(sseOf(TEMPERATURE, SALES, 208.5 - 4.35 * xBar, 4.35)).toBeGreaterThan(fixture.simple.sse);
  });

  it("shows the least squares line through (x̄, ȳ), the event day and the weekend model", () => {
    render(<RegressionLab />);
    fireEvent.click(screen.getByRole("checkbox", { name: "显示最小二乘直线" }));
    expect(screen.getByText(/经过点 \(x̄, ȳ\)/)).toHaveTextContent(`(${xBar.toFixed(1)}, ${mean(SALES).toFixed(1)})`);
    fireEvent.click(screen.getByRole("checkbox", { name: /加入活动日/ }));
    expect(screen.getByText(/只多了一个活动日/)).toHaveTextContent(
      `斜率就从 ${fixture.simple.slope.toFixed(2)} 变成 ${fixture.withEvent.slope.toFixed(2)}，R² 从 ${fixture.simple.r2.toFixed(3)} 变成 ${fixture.withEvent.r2.toFixed(3)}`,
    );
    expect(stat("最小二乘 SSE")).toBe(fixture.withEvent.sse.toFixed(1));
    fireEvent.click(screen.getByRole("checkbox", { name: /加入活动日/ }));
    fireEvent.click(screen.getByRole("checkbox", { name: "区分周末（多元回归）" }));
    expect(stat("R²（一元 / 多元）")).toBe(`${fixture.simple.r2.toFixed(3)} / ${fixture.multiple.r2.toFixed(3)}`);
    expect(screen.getByText(/两条线平行/)).toHaveTextContent(`周末线高出 ${fixture.multiple.coefficients[2].toFixed(1)} 杯`);
    fireEvent.click(screen.getByRole("button", { name: "重新开始" }));
    expect((sliders()[0] as HTMLInputElement).value).toBe("0");
  });
});

describe("static figures", () => {
  it("describe what they show in text for screen readers", () => {
    const { container, unmount } = render(<RegressionFigure view="residuals" />);
    expect(container.querySelector("desc")!.textContent).toContain("全部为正");
    expect(container.querySelectorAll(".reg-point.is-weekend")).toHaveLength(4);
    unmount();
    render(<RegressionFigure view="two-lines" />);
    expect(within(screen.getByRole("img")).getByText(/周末线比它整体高 32\.85 杯/)).toBeInTheDocument();
  });
});
