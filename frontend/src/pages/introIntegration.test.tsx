// @vitest-environment jsdom
// 第零课「认识数学建模」 is wired into everything: its own route, catalogue, home, search, the
// method course covers, records, “继续学习”, the recruitment game, and the local learning store,
// without touching what V1, V2.x and V3.0 visitors already saved.
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AppRoutes } from "../App";
import { lessonEntries, searchEntries, staticEntries } from "../app/searchIndex";
import { CHALLENGE_STORAGE_KEY } from "../challenge/config";
import { COURSES, INTRO_LESSON, LESSONS, courseById, courseOfQuestion } from "../learning/courses";
import { findQuestion } from "../learning/courseBanks";
import { INTRO_CHECKPOINT_IDS, INTRO_LAB_MILESTONE, INTRO_SECTIONS } from "../learning/intro/sectionIds";
import { PRACTICE_KEY, READING_KEY } from "../learning/storage";
import { introStatus } from "../learning/tracks";
import { learning } from "../state/learning";
import { LEARNING_KEY, SCHEMA_VERSION, emptyState, mergeStates, sanitizeState } from "../state/learningStore";
import { readContinueItems } from "./home/continueLearning";
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
function Where() {
  const l = useLocation();
  return <span data-testid="where">{l.pathname + l.search + l.hash}</span>;
}
const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]} future={router}>
      <AppRoutes />
      <Where />
    </MemoryRouter>,
  );
const finish = () => {
  for (const s of INTRO_SECTIONS) learning.setReading(s.id, "intro");
  learning.markMilestone(INTRO_LAB_MILESTONE);
};

describe("registry", () => {
  it("is a lesson before the five courses, without a practice bank or method", () => {
    expect(LESSONS.map((l) => l.id)).toEqual(["intro", "lp", "ahp", "topsis", "regression", "graph"]);
    expect(COURSES.map((c) => c.id)).toEqual(["lp", "ahp", "topsis", "regression", "graph"]);
    expect(INTRO_LESSON.lessonPath).toBe("/learn/introduction");
    expect(INTRO_LESSON.practicePath).toBeUndefined();
    expect(INTRO_LESSON.methodSlug).toBeUndefined();
    expect(courseById("intro").sections).toBe(INTRO_SECTIONS);
    for (const id of INTRO_CHECKPOINT_IDS) {
      expect(courseOfQuestion(id).id).toBe("intro");
      expect(findQuestion(id)).not.toBeNull();
    }
    // The LP bank keeps its unprefixed ids.
    expect(courseOfQuestion("self-1").id).toBe("lp");
  });
});

describe("the lesson page", () => {
  it("opens directly, with nine sections, no practice button and a way to skip ahead", async () => {
    renderAt("/learn/introduction");
    expect(await screen.findByRole("heading", { level: 1, name: "认识数学建模" }, LAZY)).toBeInTheDocument();
    expect(screen.getByText("从一个现实问题开始，学会像建模者一样思考。")).toBeInTheDocument();
    const toc = screen.getAllByRole("navigation", { name: "本章目录" })[0];
    expect(within(toc).getAllByRole("link").map((a) => a.getAttribute("href"))).toEqual(INTRO_SECTIONS.map((s) => `/learn/introduction#${s.id}`));
    expect(screen.queryByRole("link", { name: /专项练习/ })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "已有基础？直接选路线" })).toHaveAttribute("href", "/learn/introduction#intro-next");
    // The last section turns back to the catalogue instead of a practice page.
    expect(screen.getByRole("link", { name: "回到精讲目录 →" })).toHaveAttribute("href", "/learn");
    expect(screen.getByText("本课术语")).toBeInTheDocument();
    // Every interactive piece is on the page.
    expect(screen.getByRole("tablist", { name: "建模步骤" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "用两周的记录，检验一个出门时刻" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "五项工作，谁来牵头？" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "下雨前，伞该怎么调？" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "刚才的每一步，对应建模流程的哪一步" })).toBeInTheDocument();
    expect(document.querySelectorAll("[data-checkpoint]")).toHaveLength(6);
    // The six scene illustrations, each with its own description.
    const imgs = [...document.querySelectorAll(".intro-figure img")];
    expect(imgs).toHaveLength(6);
    expect(new Set(imgs.map((i) => i.getAttribute("alt"))).size).toBe(6);
  });

  it("ends with three routes into the existing courses and the completion card", async () => {
    renderAt("/learn/introduction");
    const next = (await screen.findByRole("heading", { level: 2, name: "学完这一课，下一步去哪儿" }, LAZY)).closest("section")!;
    const links = [...next.querySelectorAll(".learn-track-courses a")].map((a) => a.getAttribute("href"));
    expect(links).toEqual(["/learn/linear-programming", "/learn/graph", "/learn/regression", "/learn/ahp", "/learn/topsis"]);
    expect(screen.getByRole("heading", { name: "还差一点，就完成第零课了。" })).toBeInTheDocument();
    fireEvent.click(within(next).getByRole("link", { name: "回归分析" }));
    expect(await screen.findByRole("heading", { level: 1, name: /明天卖多少杯/ }, LAZY)).toBeInTheDocument();
    expect(screen.getByTestId("where")).toHaveTextContent("/learn/regression");
  });

  it("saves a checkpoint answer in the learning record", async () => {
    renderAt("/learn/introduction");
    const cp = (await screen.findByText(/关于“早八几点出门”/, {}, LAZY)).closest("[data-checkpoint]") as HTMLElement;
    fireEvent.click(within(cp).getByLabelText("昨天从宿舍走到教学楼用了 13 分钟"));
    fireEvent.click(within(cp).getByRole("button", { name: "核对" }));
    expect(within(cp).getByRole("status")).toHaveTextContent("这是一条数据");
    expect(learning.get().state.checkpoints["intro-think-1"]).toMatchObject({ tried: true, lastResult: "incorrect" });
    fireEvent.click(within(cp).getByLabelText("到达时刻 = 出门时刻 + 900 米 ÷ 步行速度"));
    fireEvent.click(within(cp).getByRole("button", { name: "核对" }));
    expect(within(cp).getByRole("status")).toHaveTextContent("✓ 对了");
    expect(JSON.parse(localStorage.getItem(LEARNING_KEY)!).checkpoints["intro-think-1"].lastResult).toBe("correct");
  });

  it("offers to continue where the learner stopped, and shows completion", async () => {
    learning.setReading("intro-team", "intro");
    renderAt("/learn/introduction");
    expect(await screen.findByRole("link", { name: "继续第 4 节：一支建模队，怎样分工又合作" }, LAZY)).toHaveAttribute(
      "href",
      "/learn/introduction#intro-team",
    );
    cleanup();
    finish();
    renderAt("/learn/introduction");
    expect(await screen.findByRole("heading", { name: "你已经完成了「认识数学建模」。" }, LAZY)).toBeInTheDocument();
    expect(introStatus(learning.get().state)).toMatchObject({ complete: true, reachedEnd: true });
  });

  it("every method course points back to 第零课 once, on its cover", async () => {
    for (const c of COURSES) {
      const view = renderAt(c.lessonPath);
      const hint = await screen.findByText(/第一次接触数学建模？可以先读第零课/, {}, LAZY);
      expect(within(hint).getByRole("link")).toHaveAttribute("href", "/learn/introduction");
      expect(screen.getAllByText(/第一次接触数学建模？/)).toHaveLength(1);
      view.unmount();
    }
  });
});

describe("findable from everywhere", () => {
  it("is the start of the home route and the newcomer door", () => {
    inRouter(<HomePage />);
    const route = screen.getByRole("heading", { name: "一条路线，三种练法" }).parentElement!;
    expect(within(route).getAllByRole("listitem")[0]).toHaveTextContent("认识建模第零课");
    expect(within(route).getByRole("link", { name: "认识建模" })).toHaveAttribute("href", "/learn/introduction");
    expect(screen.getByRole("link", { name: /从第零课开始/ })).toHaveAttribute("href", "/learn/introduction");
    expect(screen.queryByText(/筹备中，可以直接开始/)).not.toBeInTheDocument();
  });

  it("is the general entry of 精讲目录, with this browser's progress", () => {
    const view = inRouter(<LearnPage />);
    const zero = document.querySelector(".learn-zero")!;
    expect(within(zero as HTMLElement).getByText("未开始")).toBeInTheDocument();
    view.unmount();
    learning.setReading("intro-map", "intro");
    const again = inRouter(<LearnPage />);
    expect(within(document.querySelector(".learn-zero") as HTMLElement).getByRole("link", { name: "上次读到第 6 节 · 继续" })).toHaveAttribute(
      "href",
      "/learn/introduction#intro-map",
    );
    again.unmount();
    finish();
    inRouter(<LearnPage />);
    expect(within(document.querySelector(".learn-zero") as HTMLElement).getByText("已完成")).toBeInTheDocument();
  });

  it("shows up in local search before and after the lesson text loads", async () => {
    const base = staticEntries();
    for (const q of ["入门", "什么是数学建模", "新手", "第零课"]) expect(searchEntries(base, q).some((h) => h.href === "/learn/introduction")).toBe(true);
    const all = [...(await lessonEntries()), ...base];
    expect(searchEntries(all, "分工", 10).some((h) => h.href === "/learn/introduction#intro-team")).toBe(true);
    expect(searchEntries(all, "雨伞", 10).some((h) => h.href.startsWith("/learn/introduction"))).toBe(true);
    expect(searchEntries(all, "竞赛是什么样", 10).some((h) => h.href === "/learn/introduction#intro-contest")).toBe(true);
    const ids = all.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("appears in 继续学习 and in 学习记录", async () => {
    learning.setReading("intro-umbrella", "intro");
    expect(readContinueItems()[0]).toMatchObject({ kind: "reading", lesson: "intro", href: "/learn/introduction#intro-umbrella" });
    inRouter(<HomePage />);
    expect(screen.getByText(/认识数学建模 · 第 7 节/)).toBeInTheDocument();
    cleanup();
    learning.markMilestone(INTRO_LAB_MILESTONE);
    renderAt("/records");
    const card = (await screen.findByText("第零课 · 认识数学建模", {}, LAZY)).closest(".records-card")!;
    expect(card).toHaveTextContent("上次读到第 7 节「我的第一次建模：下雨了，伞够用吗？」");
    expect(card).toHaveTextContent("雨伞案例：已完成");
    cleanup();
    finish();
    renderAt("/records");
    expect((await screen.findByText("第零课 · 认识数学建模", {}, LAZY)).closest(".records-card")).toHaveTextContent("已完成 · 读过 9/9 节，雨伞案例已完成");
  });

  it("is offered on every game result as a quiet extra link, without replacing the recommendation", async () => {
    const save = {
      v: 1,
      step: "result",
      answers: { q1: "optimize", q2: { meat: 5, veg: 10, optimal: true, method: "calc" }, q3: { choices: [-2, -2, 0], use: "follow" }, q4: "saturate", q5: "supply" },
      result: "optimize",
    };
    localStorage.setItem(CHALLENGE_STORAGE_KEY, JSON.stringify(save));
    renderAt("/challenge");
    const link = await screen.findByRole("link", { name: "从第零课开始 →" }, LAZY);
    expect(link).toHaveAttribute("href", "/learn/introduction?from=challenge");
    expect(link.closest("section")).toHaveTextContent("线性规划交互实验室 →");
    fireEvent.click(link);
    expect(await screen.findByRole("heading", { level: 1, name: "认识数学建模" }, LAZY)).toBeInTheDocument();
  });
});

describe("local learning data from earlier versions", () => {
  /** A V3.0 RC visitor (no intro, no milestones) with progress in every course and a quest draft. */
  const v30 = {
    schemaVersion: 2,
    reading: {
      lp: { lastSectionId: "derive", visited: ["problem", "variables", "geometry", "derive"], updatedAt: "2026-10-15T08:00:00.000Z" },
      ahp: { lastSectionId: "weights", visited: ["decision", "hierarchy", "scale", "weights"], updatedAt: "2026-10-15T09:00:00.000Z" },
      topsis: { lastSectionId: "ideal", visited: ["rooms", "direction", "normalise", "weights", "ideal"], updatedAt: "2026-10-16T08:00:00.000Z" },
      regression: { lastSectionId: "least-squares", visited: ["least-squares"], updatedAt: "2026-10-16T09:00:00.000Z" },
      graph: { lastSectionId: "dijkstra", visited: ["campus", "graph", "matrix", "dijkstra-idea", "dijkstra"], updatedAt: "2026-10-16T10:00:00.000Z" },
    },
    checkpoints: { "graph-think-1": { tried: true, lastResult: "correct", updatedAt: "2026-10-16T10:01:00.000Z" } },
    exercises: {
      "practice-1": { attempts: 2, lastStatus: "correct", helpLevel: 1, updatedAt: "2026-10-13T08:05:00.000Z" },
      "regression-practice-3": { attempts: 1, lastStatus: "incorrect", draft: "12.5", helpLevel: 2, updatedAt: "2026-10-16T09:05:00.000Z" },
    },
    lastActivity: { kind: "lesson", id: "dijkstra", at: "2026-10-16T10:00:00.000Z" },
  };
  const QUEST = "mb_quest_draft:case:evaluation-topsis-demo";

  it("V3.0 data loads unchanged, and reading 第零课 adds to it without touching anything else", () => {
    localStorage.setItem(LEARNING_KEY, JSON.stringify(v30));
    localStorage.setItem(READING_KEY, JSON.stringify("derive"));
    localStorage.setItem(PRACTICE_KEY, JSON.stringify({ "practice-1": { correct: true, attempts: 2, updated: "2026-10-13T08:05:00.000Z" } }));
    localStorage.setItem(QUEST, JSON.stringify({ states: [{ completed: true, answer: "x" }], updatedAt: "2026-10-16T11:00:00.000Z" }));
    learning.resetForTests();
    expect(learning.get().state).toEqual(v30);
    learning.setReading("intro-what", "intro");
    learning.recordCheckpoint("intro-think-1", true);
    learning.markMilestone(INTRO_LAB_MILESTONE);
    const saved = JSON.parse(localStorage.getItem(LEARNING_KEY)!);
    expect(saved.schemaVersion).toBe(2);
    for (const id of ["lp", "ahp", "topsis", "regression", "graph"]) expect(saved.reading[id]).toEqual(v30.reading[id as keyof typeof v30.reading]);
    expect(saved.exercises).toEqual(v30.exercises);
    expect(saved.checkpoints["graph-think-1"]).toEqual(v30.checkpoints["graph-think-1"]);
    expect(saved.reading.intro.lastSectionId).toBe("intro-what");
    expect(Object.keys(saved.milestones)).toEqual([INTRO_LAB_MILESTONE]);
    // V1 rollback keys and quest drafts are untouched.
    expect(JSON.parse(localStorage.getItem(READING_KEY)!)).toBe("derive");
    expect(Object.keys(JSON.parse(localStorage.getItem(PRACTICE_KEY)!))).toEqual(["practice-1"]);
    expect(JSON.parse(localStorage.getItem(QUEST)!).states[0].answer).toBe("x");
  });

  it("an older build reading the new data drops only the 第零课 extras (same schema version, nothing read-only)", () => {
    // What V3.0 RC (before 第零课) does on load: sanitize with its own lesson list. Simulate it by
    // removing the parts that build cannot know and checking the rest survives the round trip.
    const newer = { ...v30, reading: { ...v30.reading, intro: { lastSectionId: "intro-map", visited: ["intro-map"], updatedAt: "2026-10-17T08:00:00.000Z" } }, milestones: { [INTRO_LAB_MILESTONE]: { at: "2026-10-17T08:10:00.000Z" } } };
    expect(SCHEMA_VERSION).toBe(2);
    const clean = sanitizeState(JSON.parse(JSON.stringify(newer)))!;
    expect(clean).toEqual(newer);
    const { intro: _intro, ...olderReading } = clean.reading;
    const { milestones: _m, ...older } = { ...clean, reading: olderReading };
    expect(sanitizeState(older)).toEqual(v30);
  });

  it("V1-only and V2.2 visitors still migrate, with 第零课 empty", () => {
    localStorage.setItem(READING_KEY, JSON.stringify("geometry"));
    localStorage.setItem(PRACTICE_KEY, JSON.stringify({ "practice-2": { correct: false, attempts: 3, updated: "2026-09-01T00:00:00.000Z" } }));
    learning.resetForTests();
    const { state } = learning.get();
    expect(state.reading.lp?.lastSectionId).toBe("geometry");
    expect(state.reading.intro).toBeUndefined();
    expect(state.milestones).toBeUndefined();
    expect(introStatus(state)).toMatchObject({ complete: false, lab: null, tried: 0 });
  });

  it("ignores malformed milestones and merges them across tabs (first time kept)", () => {
    const raw = { ...emptyState(), milestones: { ok: { at: "2026-10-17T01:00:00.000Z" }, bad: { at: 3 }, worse: "x" } };
    expect(sanitizeState(raw)!.milestones).toEqual({ ok: { at: "2026-10-17T01:00:00.000Z" } });
    expect(sanitizeState({ ...emptyState(), milestones: { bad: 1 } })!.milestones).toBeUndefined();
    const mine = { ...emptyState(), milestones: { a: { at: "2026-10-17T02:00:00.000Z" } } };
    const theirs = { ...emptyState(), milestones: { a: { at: "2026-10-17T01:00:00.000Z" }, b: { at: "2026-10-17T03:00:00.000Z" } } };
    expect(mergeStates(mine, theirs).milestones).toEqual({ a: { at: "2026-10-17T01:00:00.000Z" }, b: { at: "2026-10-17T03:00:00.000Z" } });
    expect(mergeStates(emptyState(), emptyState()).milestones).toBeUndefined();
  });

  it("学习记录 › 清空 also clears 第零课", () => {
    finish();
    learning.clearAll();
    const { state } = learning.get();
    expect(state.reading.intro).toBeUndefined();
    expect(state.milestones).toBeUndefined();
  });
});
