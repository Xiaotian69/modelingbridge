// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import fixture from "./topsis-verified.json";
import { DATA, DIRECTIONS } from "./data";
import { IdealPlane } from "./IdealPlane";
import { normaliseWeights, topsis } from "./math";
import { TopsisLab } from "./TopsisLab";

afterEach(cleanup);

const ranking = () =>
  within(screen.getByText("排名（按贴近度 C）").parentElement!)
    .getAllByRole("listitem")
    .map((li) => li.textContent!.replace(/\s+/g, ""));
const resultText = () => screen.getByText(/当前设置下|贴近度几乎相同/).closest(".lab-result")!.textContent!;
const press = (name: string | RegExp, container: HTMLElement = document.body) =>
  fireEvent.click(within(container).getByRole("button", { name }));
const f3 = (x: number) => x.toFixed(3);
const rank = (closeness: number[], order: number[]) =>
  order.map((i, k) => `${k + 1}.${"甲乙丙丁戊己"[i]}${f3(closeness[i])}`);

describe("TOPSIS 排名实验", () => {
  it("starts from the lesson's result (AHP weights) with the verified numbers", () => {
    render(<TopsisLab />);
    expect(ranking()).toEqual(rank(fixture.lesson.ahp.closeness, fixture.lesson.ahp.order));
    expect(resultText()).toContain("与课程中的结果相同");
    const weights = within(screen.getByRole("list", { name: "当前权重" })).getAllByRole("listitem");
    weights.forEach((li, j) => expect(li).toHaveTextContent(f3(fixture.ahp.weights[j])));
  });

  it("switches to equal and entropy weights and reports the new winner", () => {
    render(<TopsisLab />);
    press("等权重");
    expect(ranking()).toEqual(rank(fixture.lesson.equal.closeness, fixture.lesson.equal.order));
    expect(resultText()).toContain("第一名变了：课程中（小林的 AHP 权重）是丁，现在是戊");
    press("熵权法");
    expect(ranking()).toEqual(rank(fixture.lesson.entropy.closeness, fixture.lesson.entropy.order));
    const weights = within(screen.getByRole("list", { name: "当前权重" })).getAllByRole("listitem");
    weights.forEach((li, j) => expect(li).toHaveTextContent(f3(fixture.entropy.weights[j])));
  });

  it("recomputes from custom weights (no canned numbers) and refuses all-zero weights", () => {
    render(<TopsisLab />);
    press("自己设定");
    const sliders = screen.getAllByRole("slider");
    expect(sliders).toHaveLength(4);
    fireEvent.change(sliders[0], { target: { value: "0" } });
    fireEvent.change(sliders[1], { target: { value: "2" } });
    fireEvent.change(sliders[2], { target: { value: "7" } });
    fireEvent.change(sliders[3], { target: { value: "1" } });
    const expected = topsis(DATA, normaliseWeights([0, 2, 7, 1]), DIRECTIONS);
    expect(ranking()).toEqual(rank(expected.closeness as number[], expected.order));
    for (const s of sliders) fireEvent.change(s, { target: { value: "0" } });
    expect(screen.getByRole("alert")).toHaveTextContent("至少给一个指标大于 0 的重要程度");
    expect(screen.queryByText("排名（按贴近度 C）")).not.toBeInTheDocument();
  });

  it("shows what a wrong direction does: the most expensive room scores 1", () => {
    render(<TopsisLab />);
    press("越大越好", screen.getByRole("group", { name: "月租的方向" }));
    expect(ranking()[0]).toBe("1.戊1.000");
    expect(resultText()).toContain("你把月租的方向改得与课程不同");
    press("恢复课程设置");
    expect(ranking()).toEqual(rank(fixture.lesson.ahp.closeness, fixture.lesson.ahp.order));
  });

  it("adds the sixth room and names the rank reversal", () => {
    render(<TopsisLab />);
    fireEvent.click(screen.getByRole("checkbox", { name: /加入新房源己/ }));
    expect(ranking()).toEqual(rank(fixture.lesson.sixRooms.closeness, fixture.lesson.sixRooms.order));
    expect(resultText()).toContain("新房源己排第 4，可原来五套房之间的顺序变了：加入前 丁 > 乙 > 戊 > 甲 > 丙，加入后 乙 > 丁 > 戊 > 甲 > 丙");
    expect(resultText()).toContain("逆序现象");
  });

  it("marks the best and worst cell of every column for screen readers too", () => {
    render(<TopsisLab />);
    const table = screen.getByRole("table");
    expect(within(table).getAllByText("（该列最好）")).toHaveLength(4);
    expect(within(table).getAllByText("（该列最差）")).toHaveLength(4);
  });
});

describe("理想解平面图", () => {
  it("shows 2-criterion and full distances for the selected room", () => {
    render(<IdealPlane />);
    expect(screen.getByRole("button", { name: "丁" })).toHaveAttribute("aria-pressed", "true");
    const d = fixture.lesson.ahp;
    expect(screen.getByText(/四个指标一起算/)).toHaveTextContent(`D⁺ = ${f3(d.dPlus[3])}，D⁻ = ${f3(d.dMinus[3])}`);
    press("丙");
    expect(screen.getByText(/四个指标一起算/)).toHaveTextContent(`D⁺ = ${f3(d.dPlus[2])}，D⁻ = ${f3(d.dMinus[2])}`);
    // 2-criterion distance for 丙 (月租 column 0, 面积 column 2), recomputed from the fixture.
    const w = d.weighted[2];
    const two = Math.hypot(w[0] - d.best[0], w[2] - d.best[2]);
    expect(screen.getByText(/只看这两个指标/)).toHaveTextContent(`丙到理想房 ${f3(two)}`);
  });
});
