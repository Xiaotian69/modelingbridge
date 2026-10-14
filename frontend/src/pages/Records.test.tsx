// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PrefsProvider } from "../app/PrefsContext";
import { PRACTICE_KEY, READING_KEY } from "../learning/storage";
import { createEmptyQuestStates, questStages } from "../quest/stages";
import { saveQuestDraft } from "../quest/storage";
import { learning } from "../state/learning";
import { LEARNING_KEY } from "../state/learningStore";
import { RecordsPage } from "./Records";

const at = "2026-10-12T08:00:00.000Z";
function seed() {
  localStorage.setItem(
    LEARNING_KEY,
    JSON.stringify({
      schemaVersion: 2,
      reading: { lp: { lastSectionId: "derive", visited: ["problem", "variables", "geometry", "derive"], updatedAt: at } },
      checkpoints: { "think-1": { tried: true, lastResult: "incorrect", updatedAt: at } },
      exercises: {
        "self-1": { attempts: 1, lastStatus: "correct", helpLevel: 0, updatedAt: at },
        "practice-1": { attempts: 2, lastStatus: "incorrect", helpLevel: 2, updatedAt: at },
        "practice-2": { attempts: 0, draft: "26", helpLevel: 0, updatedAt: at },
      },
    }),
  );
  localStorage.setItem(PRACTICE_KEY, JSON.stringify({ "practice-1": { correct: false, attempts: 2, updated: at } }));
  localStorage.setItem(READING_KEY, JSON.stringify("derive"));
  const states = createEmptyQuestStates(at).map((s, i) => ({ ...s, completed: i < 2, answer: i < 3 ? "我的作答内容" : "" }));
  const checks = Object.fromEntries(questStages.map((s) => [s.id, s.passConditions.map(() => false)]));
  saveQuestDraft("case:bike-demand-demo", { activeStageId: "data", states, checks: checks as never, updatedAt: at });
  localStorage.setItem("mb_records", JSON.stringify([{ id: "1", savedAt: at, title: "七关实战报告：单车", summary: "完成进度：2/7", fullReport: "# 报告" }]));
}

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});
afterEach(() => {
  cleanup();
  learning.resetForTests();
});

const renderRecords = () => {
  learning.resetForTests();
  return render(
    <MemoryRouter future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
      <PrefsProvider>
        <RecordsPage />
      </PrefsProvider>
    </MemoryRouter>,
  );
};

describe("学习记录", () => {
  it("shows real progress from the learning store, quest drafts and reports", () => {
    seed();
    renderRecords();
    expect(screen.getByText(/上次读到第 4 节「不用软件，完整求出最优解」 · 读过 4\/10 节/)).toBeInTheDocument();
    expect(screen.getByText("章内检查点尝试过 1/4（检查点不计成绩）")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "继续阅读" })).toHaveAttribute("href", "/learn/linear-programming#derive");
    expect(screen.getByText(/✓ 1 · ✕ 1 待重练 · ◐ 1 有草稿 · ○ 3 未做/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "重练" })).toHaveAttribute("href", "/practice/linear-programming/practice-1");
    expect(screen.getByText(/提交 2 次 · 看过线索/)).toBeInTheDocument();
    expect(screen.getByText(/校园共享单车/)).toBeInTheDocument();
    expect(screen.getByText(/2\/7 关已通关/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "继续" })).toHaveAttribute("href", "/quest?case=bike-demand-demo");
    expect(screen.getByText("七关实战报告：单车")).toBeInTheDocument();
  });

  it("filters to wrong answers only", () => {
    seed();
    renderRecords();
    fireEvent.click(screen.getByRole("checkbox", { name: /只看错题/ }));
    const list = screen.getByRole("heading", { name: "专项练习" }).closest("section")!;
    expect(within(list).getAllByRole("listitem")).toHaveLength(1);
    expect(within(list).getByText("练习 1")).toBeInTheDocument();
  });

  it("clears only the chosen categories, including the V1 keys so nothing migrates back", () => {
    seed();
    renderRecords();
    fireEvent.click(screen.getByRole("button", { name: "清空学习数据…" }));
    expect(screen.getByText(/阅读位置 1 条、练习记录 3 条、检查点 1 条/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("checkbox", { name: /实战报告 1 份/ }));
    fireEvent.click(screen.getByRole("button", { name: "确认清空所选内容" }));
    expect(screen.getByText("已清空：课程与练习进度、七关草稿。")).toBeInTheDocument();
    expect(localStorage.getItem(PRACTICE_KEY)).toBeNull();
    expect(localStorage.getItem(READING_KEY)).toBeNull();
    expect(Object.keys(localStorage).some((k) => k.startsWith("mb_quest_draft:"))).toBe(false);
    expect(localStorage.getItem("mb_records")).not.toBeNull();
    // Every course (线性规划, 层次分析法, TOPSIS, 回归分析, 图论) now shows an empty reading position.
    expect(screen.getAllByText("还没有阅读记录。")).toHaveLength(5);
    // A fresh load stays empty (no re-migration from the old keys).
    cleanup();
    renderRecords();
    expect(screen.getAllByText("还没有阅读记录。")).toHaveLength(5);
    expect(screen.getByText(/✓ 0 · ✕ 0 待重练 · ◐ 0 有草稿 · ○ 6 未做/)).toBeInTheDocument();
  });

  it("exports everything as one JSON file", () => {
    seed();
    const create = vi.fn(() => "blob:x");
    Object.assign(URL, { createObjectURL: create, revokeObjectURL: vi.fn() });
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    renderRecords();
    fireEvent.click(screen.getByRole("button", { name: "导出 JSON" }));
    expect(click).toHaveBeenCalled();
    expect(screen.getByText("已导出学习数据 JSON。")).toBeInTheDocument();
    click.mockRestore();
  });

  it("disables clearing when there is nothing stored", () => {
    renderRecords();
    expect(screen.getByRole("button", { name: "清空学习数据…" })).toBeDisabled();
    expect(screen.getByText("还没有进行中的七关训练。")).toBeInTheDocument();
  });
});
