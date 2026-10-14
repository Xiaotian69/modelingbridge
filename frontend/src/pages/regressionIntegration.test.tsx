// @vitest-environment jsdom
// The regression course is wired into the catalogue, home route, search, home “继续学习”,
// records and the practice loop with its return bar, like the other courses.
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AppRoutes } from "../App";
import { lessonEntries, searchEntries, staticEntries } from "../app/searchIndex";
import { courseOfQuestion } from "../learning/courses";
import { metaForQuestion } from "../learning/courseBanks";
import { learning } from "../state/learning";
import { LEARNING_KEY } from "../state/learningStore";
import { RETURN_KEY } from "../state/returnTicket";
import { HomePage } from "./Home";
import { LearnPage } from "./Learn";
import { practiceLabel } from "./Practice";

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  learning.resetForTests();
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
const LAZY = { timeout: 5000 };
const router = { v7_relativeSplatPath: true, v7_startTransition: true };
const inRouter = (ui: JSX.Element) => render(<MemoryRouter future={router}>{ui}</MemoryRouter>);
function Where() {
  const l = useLocation();
  return <span data-testid="where">{l.pathname + l.hash}</span>;
}
const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]} future={router}>
      <AppRoutes />
      <Where />
    </MemoryRouter>,
  );

describe("regression is findable", () => {
  it("is on the home route", () => {
    inRouter(<HomePage />);
    const route = screen.getByRole("heading", { name: "一条路线，三种练法" }).parentElement!;
    expect(within(route).getByRole("link", { name: "回归预测" })).toHaveAttribute("href", "/learn/regression");
  });

  it("is in 精讲目录 with its practice; the method index points to it", () => {
    inRouter(<LearnPage />);
    expect(screen.getByRole("link", { name: "开始回归精讲" })).toHaveAttribute("href", "/learn/regression");
    expect(screen.getByRole("link", { name: "回归专项练习" })).toHaveAttribute("href", "/practice/regression");
    expect(screen.getByRole("link", { name: "15 道回归练习 →" })).toHaveAttribute("href", "/practice/regression");
    expect(screen.getByRole("link", { name: /回归 \/ 随机森林.*精讲已开放/ })).toHaveAttribute("href", "/learn/regression");
  });

  it("finds lesson sections, the lab, practice and the method in local search", async () => {
    const entries = [...(await lessonEntries()), ...staticEntries()];
    expect(searchEntries(entries, "最小二乘", 10).some((h) => h.href === "/learn/regression#least-squares")).toBe(true);
    expect(searchEntries(entries, "残差", 10).some((h) => h.href === "/practice/regression")).toBe(true);
    expect(searchEntries(entries, "异常值", 10).some((h) => h.id === "lab:regression")).toBe(true);
    expect(searchEntries(entries, "多元回归", 10).some((h) => h.href === "/learn/regression#multiple")).toBe(true);
    const ids = entries.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("continues the regression lesson from the home page", () => {
    learning.setReading("fit", "regression");
    inRouter(<HomePage />);
    const strip = screen.getByRole("heading", { name: "继续学习" }).closest("section")!;
    expect(within(strip).getByText(/回归分析 · 第 5 节 · 拟合得好不好：R² 与残差/)).toBeInTheDocument();
    expect(within(strip).getByRole("link", { name: "继续阅读" })).toHaveAttribute("href", "/learn/regression#fit");
  });
});

describe("practice loop", () => {
  it("routes ids and labels", () => {
    expect(courseOfQuestion("regression-practice-4").id).toBe("regression");
    expect(practiceLabel("regression-practice-12")).toBe("练习 12");
    expect(metaForQuestion("regression-practice-4").sectionId).toBe("fit");
  });

  it("diagnoses an R² mistake, sends the learner to the section and brings them back", async () => {
    renderAt("/practice/regression/regression-practice-4");
    expect(await screen.findByRole("heading", { name: "回归分析专项练习" }, LAZY)).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("你的数值答案"), { target: { value: "0.4" } });
    fireEvent.click(screen.getByRole("button", { name: "提交答案" }));
    expect(screen.getByText(/错误类型：只算了 SSE \/ SST/)).toBeInTheDocument();
    fireEvent.click(screen.getAllByRole("button", { name: /R² · 第 5 节/ })[0]);
    expect(await screen.findByTestId("where")).toHaveTextContent("/learn/regression#fit");
    expect(JSON.parse(sessionStorage.getItem(RETURN_KEY)!).to).toEqual({ sectionId: "fit", lessonId: "regression" });
    fireEvent.click(await screen.findByRole("link", { name: "← 回到 练习 4" }, LAZY));
    expect(await screen.findByLabelText("你的数值答案", {}, LAZY)).toHaveValue("0.4");
    const saved = JSON.parse(localStorage.getItem(LEARNING_KEY)!);
    expect(saved.exercises["regression-practice-4"]).toMatchObject({ attempts: 1, lastStatus: "incorrect" });
    expect(Object.keys(JSON.parse(localStorage.getItem("mb_learning_practice_v1") || "{}"))).not.toContain(
      "regression-practice-4",
    );
  });

  it("lists all four topics on the practice page", async () => {
    renderAt("/practice/regression");
    const nav = await screen.findByRole("navigation", { name: "选择专题" }, LAZY);
    expect(within(nav).getAllByRole("link").map((a) => a.textContent)).toEqual([
      "线性规划",
      "层次分析法（AHP）",
      "TOPSIS 综合评价",
      "回归分析",
    ]);
  });
});

describe("lesson and records", () => {
  it("renders the lesson with its figures, lab, checkpoints and the bridge to LP", async () => {
    renderAt("/learn/regression");
    expect(await screen.findByRole("heading", { level: 1, name: /明天卖多少杯/ }, LAZY)).toBeInTheDocument();
    expect(screen.getByText("拖动直线，让残差平方和尽量小")).toBeInTheDocument();
    expect(screen.getAllByRole("img").length).toBeGreaterThanOrEqual(4);
    expect(screen.getByRole("link", { name: "专项练习（15 题）" })).toHaveAttribute("href", "/practice/regression");
    const bridge = screen.getByRole("complementary", { name: /相关精讲 · 线性规划/ });
    expect(within(bridge).getByRole("link")).toHaveAttribute("href", "/learn/linear-programming#variables");
    expect(screen.getAllByRole("region", { name: /检查点/ })).toHaveLength(6);
  });

  it("shows a regression card on the records page", async () => {
    learning.setReading("model", "regression");
    renderAt("/records");
    const card = (await screen.findByText("回归分析精讲", {}, LAZY)).closest(".records-card")!;
    expect(card).toHaveTextContent("读过 1/11 节");
    expect(card).toHaveTextContent("章内检查点尝试过 0/6");
  });
});
