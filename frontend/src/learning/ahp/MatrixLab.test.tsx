// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { CRITERIA_UPPER, LOCAL_UPPER } from "./data";
import { analyse, fromUpperTriangle, positionToValue, synthesise } from "./math";
import { MatrixLab } from "./MatrixLab";

afterEach(cleanup);

const sliders = () => screen.getAllByRole("slider");
const weightOf = (name: string) =>
  within(screen.getByText("权重（特征向量法）").parentElement!)
    .getByText(name)
    .closest("li")!
    .querySelector("b")!.textContent;
const crCell = () => screen.getByText("CR = CI / RI").parentElement!;
const firstPlace = () => within(screen.getByText(/实习推荐/).parentElement!).getAllByRole("listitem")[0];

describe("判断矩阵实验", () => {
  it("starts from the lesson's judgments with the verified numbers", () => {
    render(<MatrixLab />);
    expect(sliders()).toHaveLength(3);
    expect(weightOf("成长空间")).toBe("0.648");
    expect(weightOf("薪资待遇")).toBe("0.230");
    expect(crCell()).toHaveTextContent("0.0032 < 0.1 ✓");
    expect(firstPlace()).toHaveTextContent("B 研究所");
    expect(screen.getByText("一致性可以接受")).toBeInTheDocument();
  });

  it("recomputes weights, CR and the ranking from any new judgment (no canned numbers)", () => {
    render(<MatrixLab />);
    // Slider k = 0 compares 薪资待遇 (left) with 成长空间 (right); far left = 薪资 9 times as important.
    fireEvent.change(sliders()[0], { target: { value: "-8" } });
    const upper = [positionToValue(8), CRITERIA_UPPER[1], CRITERIA_UPPER[2]];
    const expected = analyse(fromUpperTriangle(3, upper));
    expect(weightOf("薪资待遇")).toBe(expected.weights[0].toFixed(3));
    expect(weightOf("成长空间")).toBe(expected.weights[1].toFixed(3));
    expect(crCell()).toHaveTextContent(expected.cr!.toFixed(4));
    expect(sliders()[0]).toHaveAttribute("aria-valuetext", "薪资待遇比成长空间极端重要（9）");
    // Matrix shows the reciprocal automatically.
    expect(screen.getByRole("table")).toHaveTextContent("1/9");
    // This judgment contradicts the others strongly: the lab says so and names the conflicting pair.
    expect(expected.acceptable).toBe(false);
    expect(screen.getByText("判断前后矛盾，需要修改")).toBeInTheDocument();
    expect(screen.getByText(/最矛盾的是/)).toBeInTheDocument();
    // Ranking follows the same weights.
    const local = ["C1", "C2", "C3"].map((c) => analyse(fromUpperTriangle(3, LOCAL_UPPER[c])).weights);
    const scores = synthesise(expected.weights, local);
    const best = scores.indexOf(Math.max(...scores));
    expect(firstPlace()).toHaveTextContent(["A 互联网公司", "B 研究所", "C 本地企业"][best]);
    expect(firstPlace()).toHaveTextContent(scores[best].toFixed(3));
  });

  it("presets: consistent judgments give CR = 0; circular judgments fail and are explained", () => {
    render(<MatrixLab />);
    fireEvent.click(screen.getByRole("button", { name: "完全一致的判断" }));
    expect(crCell()).toHaveTextContent("0.0000 < 0.1 ✓");
    expect(screen.getByText("λmax").nextSibling).toHaveTextContent("3.0000");
    fireEvent.click(screen.getByRole("button", { name: "前后矛盾的判断" }));
    expect(crCell()).toHaveTextContent("≥ 0.1 ✕");
    expect(screen.getByText(/最矛盾的是/)).toHaveTextContent(/最接近的标度/);
    expect(screen.getByText(/不应作为结论/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "小林的判断" }));
    expect(weightOf("成长空间")).toBe("0.648");
  });

  it("switches to four criteria with RI(4) = 0.90 and six comparisons", () => {
    render(<MatrixLab />);
    fireEvent.click(screen.getByRole("button", { name: /4 个准则/ }));
    expect(sliders()).toHaveLength(6);
    expect(screen.getByText("RI(4)").nextSibling).toHaveTextContent("0.90");
    expect(weightOf("团队氛围")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "前后矛盾的判断" }));
    expect(crCell()).toHaveTextContent("≥ 0.1 ✕");
  });
});
