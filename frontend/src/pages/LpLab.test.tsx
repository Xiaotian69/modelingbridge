// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AppRoutes } from "../App";
import { LpLab } from "../learning/lab/LpLab";
import { learning } from "../state/learning";
import { LpLabPage } from "./LpLab";

beforeEach(() => {
  localStorage.clear();
  learning.resetForTests();
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
// The live-announced result next to the chart (the phone-only copy below the sliders repeats the lines).
const result = () =>
  screen.getByText((_, el) => !!el?.classList.contains("lab-result") && !el.classList.contains("lab-result-mobile"));
const slider = (name: RegExp) => screen.getByRole("slider", { name });

describe("线性规划交互实验室", () => {
  it("starts from the textbook model and recomputes on every change", () => {
    render(<LpLab />);
    expect(result()).toHaveTextContent("最优计划：A 40 m²、B 20 m²，利润 2600 元");
    expect(screen.getByLabelText("当前模型")).toHaveTextContent("max z = 40x + 50y");
    fireEvent.change(slider(/A 的利润/), { target: { value: "80" } });
    expect(screen.getByLabelText("当前模型")).toHaveTextContent("max z = 80x + 50y");
    expect(result()).toHaveTextContent("最优计划：A 40 m²、B 20 m²，利润 4200 元");
    fireEvent.change(slider(/B 的利润/), { target: { value: "10" } });
    expect(result()).toHaveTextContent("最优计划：A 50 m²、B 0 m²，利润 4000 元");
    // The corner table follows the same numbers.
    const table = screen.getByRole("table");
    expect(within(table).getByText(/4000 元 ← 最优/)).toBeInTheDocument();
  });

  it("presets show the three special situations honestly, and 恢复默认 brings the textbook back", () => {
    render(<LpLab />);
    fireEvent.click(screen.getByRole("button", { name: "多重最优" }));
    expect(result()).toHaveTextContent("多重最优解：最大利润 2000 元");
    fireEvent.click(screen.getByRole("button", { name: "无可行解" }));
    expect(result()).toHaveTextContent("无可行解");
    expect(result()).toHaveTextContent("最多只能生产 60 m²");
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    expect(screen.getByText("可行域为空")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "无界" }));
    expect(result()).toHaveTextContent("无界：利润可以无限增大");
    expect(screen.getByText("可行域延伸到图外，没有边界")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "恢复默认" }));
    expect(result()).toHaveTextContent("利润 2600 元");
  });

  it("adds the order requirement and finds the point where it becomes infeasible", () => {
    render(<LpLab />);
    fireEvent.click(screen.getByRole("checkbox", { name: /加入 x \+ y ≥ 订单量/ }));
    fireEvent.change(slider(/订单量/), { target: { value: "60" } });
    expect(result()).toHaveTextContent("最优计划：A 40 m²、B 20 m²");
    fireEvent.change(slider(/订单量/), { target: { value: "65" } });
    expect(result()).toHaveTextContent("无可行解");
  });
});

function Where() {
  const l = useLocation();
  return <span data-testid="where">{l.pathname + l.hash}</span>;
}

describe("entry from the lesson and the way back", () => {
  it("offers the lab in the geometry and sensitivity sections", async () => {
    render(
      <MemoryRouter initialEntries={["/learn/linear-programming"]} future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
        <AppRoutes />
      </MemoryRouter>,
    );
    const links = await screen.findAllByRole("link", { name: "打开交互实验室 →" }, { timeout: 5000 });
    expect(links.map((a) => a.getAttribute("href"))).toEqual([
      "/learn/linear-programming/lab?from=geometry",
      "/learn/linear-programming/lab?from=sensitivity",
    ]);
    expect(links[0].closest("section")).toHaveAttribute("id", "geometry");
  });

  it("goes back through history when opened from the lesson (exact reading position)", async () => {
    render(
      <MemoryRouter initialEntries={["/learn/linear-programming#sensitivity", { pathname: "/learn/linear-programming/lab", search: "?from=sensitivity", state: { fromLesson: true } }]} initialIndex={1}>
        <Routes>
          <Route path="/learn/linear-programming/lab" element={<LpLabPage />} />
          <Route path="*" element={<Where />} />
        </Routes>
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByRole("button", { name: "← 回到第 6 节「再多一小时，究竟值多少钱？」" }));
    expect(await screen.findByTestId("where")).toHaveTextContent("/learn/linear-programming#sensitivity");
  });

  it("links to the section when opened directly, and to the lesson without a section", () => {
    const { unmount } = render(
      <MemoryRouter initialEntries={["/learn/linear-programming/lab?from=geometry"]}>
        <LpLabPage />
      </MemoryRouter>,
    );
    expect(screen.getByRole("link", { name: "← 回到第 3 节「看见所有允许的计划」" })).toHaveAttribute("href", "/learn/linear-programming#geometry");
    unmount();
    render(
      <MemoryRouter initialEntries={["/learn/linear-programming/lab?from=evil"]}>
        <LpLabPage />
      </MemoryRouter>,
    );
    expect(screen.getByRole("link", { name: "← 回到线性规划精讲" })).toHaveAttribute("href", "/learn/linear-programming");
  });
});
