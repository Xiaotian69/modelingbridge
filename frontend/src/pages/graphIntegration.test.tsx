// @vitest-environment jsdom
// The graph theory course is wired into the catalogue, search, home “继续学习”, records and the
// practice loop with its return bar, like the other courses.
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AppRoutes } from "../App";
import { lessonEntries, searchEntries, staticEntries } from "../app/searchIndex";
import { courseOfQuestion } from "../learning/courses";
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

describe("graph theory is findable", () => {
  it("is in 精讲目录 with its practice; the method index points to it", () => {
    inRouter(<LearnPage />);
    expect(screen.getByRole("link", { name: "开始图论精讲" })).toHaveAttribute("href", "/learn/graph");
    expect(screen.getByRole("link", { name: "图论专项练习" })).toHaveAttribute("href", "/practice/graph");
    expect(screen.getByRole("link", { name: "15 道图论练习 →" })).toHaveAttribute("href", "/practice/graph");
    expect(screen.getByRole("link", { name: /网络流 \/ 图模型.*精讲已开放/ })).toHaveAttribute("href", "/learn/graph");
  });

  it("finds lesson sections, the lab, practice and the method in local search", async () => {
    const entries = [...(await lessonEntries()), ...staticEntries()];
    expect(searchEntries(entries, "dijkstra", 10).some((h) => h.href === "/learn/graph#dijkstra")).toBe(true);
    expect(searchEntries(entries, "最小生成树", 10).some((h) => h.href === "/learn/graph#mst")).toBe(true);
    expect(searchEntries(entries, "最短路", 10).some((h) => h.href === "/practice/graph")).toBe(true);
    expect(searchEntries(entries, "施工", 10).some((h) => h.id === "lab:graph")).toBe(true);
    const ids = entries.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("continues the graph lesson from the home page", () => {
    learning.setReading("mst", "graph");
    inRouter(<HomePage />);
    const strip = screen.getByRole("heading", { name: "继续学习" }).closest("section")!;
    expect(within(strip).getByText(/图论与网络优化 · 第 6 节 · 用最少的线连通所有地点：最小生成树/)).toBeInTheDocument();
    expect(within(strip).getByRole("link", { name: "继续阅读" })).toHaveAttribute("href", "/learn/graph#mst");
  });
});

describe("practice loop", () => {
  it("routes ids and labels", () => {
    expect(courseOfQuestion("graph-practice-10").id).toBe("graph");
    expect(practiceLabel("graph-self-3")).toBe("自测 3");
  });

  it("diagnoses a stale construction answer, sends the learner to the section and brings them back", async () => {
    renderAt("/practice/graph/graph-practice-10");
    expect(await screen.findByRole("heading", { name: "图论与网络优化专项练习" }, LAZY)).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("你的数值答案"), { target: { value: "1080" } });
    fireEvent.click(screen.getByRole("button", { name: "提交答案" }));
    expect(screen.getByText(/错误类型：参数没有更新/)).toBeInTheDocument();
    fireEvent.click(screen.getAllByRole("button", { name: /情景分析 · 第 5 节/ })[0]);
    expect(await screen.findByTestId("where")).toHaveTextContent("/learn/graph#dijkstra");
    expect(JSON.parse(sessionStorage.getItem(RETURN_KEY)!).to).toEqual({ sectionId: "dijkstra", lessonId: "graph" });
    fireEvent.click(await screen.findByRole("link", { name: "← 回到 练习 10" }, LAZY));
    expect(await screen.findByLabelText("你的数值答案", {}, LAZY)).toHaveValue("1080");
    const saved = JSON.parse(localStorage.getItem(LEARNING_KEY)!);
    expect(saved.exercises["graph-practice-10"]).toMatchObject({ attempts: 1, lastStatus: "incorrect" });
  });
});

describe("lesson and records", () => {
  it("renders the lesson with its maps, both labs and checkpoints", async () => {
    renderAt("/learn/graph");
    expect(await screen.findByRole("heading", { level: 1, name: /招新日/ }, LAZY)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "一步一步运行 Dijkstra 算法" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "一步一步运行 Kruskal 算法" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "专项练习（15 题）" })).toHaveAttribute("href", "/practice/graph");
    expect(screen.getAllByRole("region", { name: /检查点/ })).toHaveLength(6);
  });

  it("shows a graph card on the records page", async () => {
    learning.setReading("graph", "graph");
    renderAt("/records");
    const card = (await screen.findByText("图论与网络优化精讲", {}, LAZY)).closest(".records-card")!;
    expect(card).toHaveTextContent("读过 1/11 节");
  });
});
