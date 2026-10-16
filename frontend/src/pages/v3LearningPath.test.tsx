// @vitest-environment jsdom
// V3.0 招新学习版: how a newcomer finds the five courses, and that learning data saved by
// earlier versions (V1 keys, V2.1/V2.2 state) survives the three new courses unchanged.
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AppRoutes } from "../App";
import { COURSES } from "../learning/courses";
import { practiceBankOf } from "../learning/courseBanks";
import { PRACTICE_KEY, READING_KEY } from "../learning/storage";
import { learning } from "../state/learning";
import { LEARNING_KEY } from "../state/learningStore";
import { HomePage } from "./Home";
import { LearnPage } from "./Learn";

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
const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]} future={router}>
      <AppRoutes />
    </MemoryRouter>,
  );

describe("home route", () => {
  it("has one stop per track, including 网络优化 for the graph course", () => {
    inRouter(<HomePage />);
    const route = screen.getByRole("heading", { name: "一条路线，三种练法" }).parentElement!;
    const stops = within(route).getAllByRole("listitem").map((li) => li.querySelector("a, b")!.textContent);
    expect(stops).toEqual(["认识建模", "线性规划", "网络优化", "回归预测", "评价决策", "综合项目"]);
    expect(within(route).getByRole("link", { name: "网络优化" })).toHaveAttribute("href", "/learn/graph");
    expect(route.querySelector("ol")!.getAttribute("style")).toContain("--stops: 6");
    // Every open stop leads to a real course.
    for (const a of within(route).getAllByRole("link"))
      expect(COURSES.some((c) => c.lessonPath === a.getAttribute("href"))).toBe(true);
  });
});

describe("精讲目录: where to start", () => {
  const guide = () => screen.getByRole("heading", { name: "从哪里开始" }).closest("section")!;

  it("recommends linear programming first and lists every course once, in three tracks", () => {
    inRouter(<LearnPage />);
    expect(within(guide()).getByText(/建议先学/)).toHaveTextContent("线性规划");
    const tracks = within(guide()).getAllByRole("listitem").filter((li) => li.querySelector(".learn-track-name"));
    expect(tracks.map((t) => t.querySelector("b")!.textContent)).toEqual(["优化", "预测", "评价"]);
    const links = tracks.flatMap((t) => [...t.querySelectorAll(".learn-track-courses > li > a")].map((a) => a.getAttribute("href")));
    expect(links).toEqual(["/learn/linear-programming", "/learn/graph", "/learn/regression", "/learn/ahp", "/learn/topsis"]);
    expect([...links].sort()).toEqual(COURSES.map((c) => c.lessonPath).sort());
  });

  it("shows this browser's progress per course: not started, where to continue, finished", () => {
    learning.setReading("weights", "topsis");
    for (const s of COURSES.find((c) => c.id === "graph")!.sections) learning.setReading(s.id, "graph");
    inRouter(<LearnPage />);
    const item = (href: string) => guide().querySelector(`.learn-track-courses a[href="${href}"]`)!.closest("li")!;
    expect(item("/learn/linear-programming")).toHaveTextContent("未开始");
    expect(within(item("/learn/topsis")).getByRole("link", { name: "上次读到第 4 节 · 继续" })).toHaveAttribute("href", "/learn/topsis#weights");
    expect(item("/learn/graph")).toHaveTextContent("已读完全部 11 节");
  });

  it("groups the course cards by track and keeps every practice count true", () => {
    inRouter(<LearnPage />);
    const groups = [...document.querySelectorAll(".learn-group b")].map((b) => b.textContent);
    expect(groups).toEqual(["优化", "预测", "评价"]);
    const counts: Record<string, number> = { "线性规划": 6, "图论": 15, "回归": 15, " AHP ": 8, " TOPSIS ": 12 };
    const ids: Record<string, (typeof COURSES)[number]["id"]> = { "线性规划": "lp", "图论": "graph", "回归": "regression", " AHP ": "ahp", " TOPSIS ": "topsis" };
    for (const [name, n] of Object.entries(counts)) {
      expect(screen.getByRole("link", { name: `${n} 道${name}练习 →` })).toBeInTheDocument();
      expect(practiceBankOf(ids[name])).toHaveLength(n);
    }
  });

  it("says which course teaches each method in the index", () => {
    inRouter(<LearnPage />);
    expect(screen.getByRole("link", { name: /回归 \/ 随机森林.*精讲已开放：回归分析/ })).toHaveAttribute("href", "/learn/regression");
    expect(screen.getByRole("link", { name: /网络流 \/ 图模型.*精讲已开放：图论与网络优化/ })).toHaveAttribute("href", "/learn/graph");
    expect(screen.getByRole("link", { name: /时间序列预测.*仅速查/ })).toBeInTheDocument();
  });
});

describe("course bridges", () => {
  it("linear programming §2 points to regression; regression points to the data skill", async () => {
    renderAt("/learn/linear-programming");
    const lp = await screen.findByRole("complementary", { name: /相关精讲 · 回归分析/ }, LAZY);
    expect(lp.closest("section")).toHaveAttribute("id", "variables");
    expect(within(lp).getByRole("link")).toHaveAttribute("href", "/learn/regression");
    cleanup();
    renderAt("/learn/regression");
    const skill = await screen.findByRole("complementary", { name: /AI 技能包 · 第 3 步/ }, LAZY);
    expect(within(skill).getByRole("link")).toHaveAttribute("href", "/library/skills/data");
    fireEvent.click(within(skill).getByRole("link"));
    expect(await screen.findByRole("heading", { name: /数据诊断与处理/ }, LAZY)).toBeInTheDocument();
  });
});

describe("learning data saved by earlier versions", () => {
  /** What a V2.2 visitor had: V2 state for LP and AHP plus the V1 mirror keys. */
  const v22 = {
    schemaVersion: 2,
    reading: {
      lp: { lastSectionId: "derive", visited: ["problem", "variables", "geometry", "derive"], updatedAt: "2026-10-13T08:00:00.000Z" },
      ahp: { lastSectionId: "consistency", visited: ["decision", "hierarchy", "scale", "weights", "consistency"], updatedAt: "2026-10-14T08:00:00.000Z" },
    },
    checkpoints: { "think-1": { tried: true, lastResult: "correct", updatedAt: "2026-10-13T08:01:00.000Z" } },
    exercises: {
      "practice-1": { attempts: 2, lastStatus: "correct", helpLevel: 1, updatedAt: "2026-10-13T08:05:00.000Z" },
      "ahp-practice-2": { attempts: 1, lastStatus: "incorrect", draft: "0.07", helpLevel: 0, updatedAt: "2026-10-14T08:05:00.000Z" },
    },
    lastActivity: { kind: "exercise", id: "ahp-practice-2", at: "2026-10-14T08:05:00.000Z" },
  };

  it("keeps every LP and AHP record, shows the new courses as not started, and adds to them safely", async () => {
    localStorage.setItem(LEARNING_KEY, JSON.stringify(v22));
    localStorage.setItem(READING_KEY, JSON.stringify("derive"));
    localStorage.setItem(PRACTICE_KEY, JSON.stringify({ "practice-1": { correct: true, attempts: 2, updated: "2026-10-13T08:05:00.000Z" } }));
    learning.resetForTests();
    const { state } = learning.get();
    expect(state.reading).toEqual(v22.reading);
    expect(state.exercises["ahp-practice-2"]).toMatchObject({ attempts: 1, lastStatus: "incorrect", draft: "0.07" });
    expect(state.checkpoints["think-1"]).toMatchObject({ lastResult: "correct" });

    // Reading a new course and answering its question leaves the old records as they were.
    learning.setReading("ideal", "topsis");
    learning.recordCheckpoint("graph-think-1", true);
    const saved = JSON.parse(localStorage.getItem(LEARNING_KEY)!);
    expect(saved.reading.lp).toEqual(v22.reading.lp);
    expect(saved.reading.ahp).toEqual(v22.reading.ahp);
    expect(saved.reading.topsis.lastSectionId).toBe("ideal");
    expect(saved.exercises).toEqual(v22.exercises);
    // The V1 rollback keys still describe linear programming only.
    expect(JSON.parse(localStorage.getItem(READING_KEY)!)).toBe("derive");
    expect(Object.keys(JSON.parse(localStorage.getItem(PRACTICE_KEY)!))).toEqual(["practice-1"]);

    renderAt("/records");
    const card = async (title: string) => (await screen.findByText(`${title}精讲`, {}, LAZY)).closest(".records-card")!;
    expect(await card("线性规划")).toHaveTextContent("读过 4/");
    expect(await card("层次分析法（AHP）")).toHaveTextContent("读过 5/10 节");
    expect(await card("TOPSIS 综合评价")).toHaveTextContent("读过 1/11 节");
    expect(await card("回归分析")).toHaveTextContent("还没有阅读记录。");
    expect(await card("图论与网络优化")).toHaveTextContent("章内检查点尝试过 1/6");
  });

  it("a V1-only visitor (before V2) still migrates, with the new courses empty", () => {
    localStorage.setItem(READING_KEY, JSON.stringify("geometry"));
    localStorage.setItem(PRACTICE_KEY, JSON.stringify({ "practice-2": { correct: false, attempts: 3, updated: "2026-09-01T00:00:00.000Z" } }));
    learning.resetForTests();
    const { state } = learning.get();
    expect(state.reading.lp?.lastSectionId).toBe("geometry");
    expect(state.exercises["practice-2"]).toMatchObject({ attempts: 3, lastStatus: "incorrect", legacy: true });
    for (const id of ["topsis", "regression", "graph"] as const) expect(state.reading[id]).toBeUndefined();
  });
});
