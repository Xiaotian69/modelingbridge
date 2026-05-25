// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createEmptyQuestStates, questStages } from "../quest/stages";
import { saveQuestDraft, type QuestDraft } from "../quest/storage";
import { QuestPage } from "./Quest";

vi.mock("../api/client", () => ({
  getCase: vi.fn(),
}));

afterEach(() => {
  cleanup();
  localStorage.clear();
});

describe("QuestPage", () => {
  it("renders the default quest map and first task", () => {
    render(
      <MemoryRouter initialEntries={["/quest"]} future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
        <QuestPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { name: "数模闯关训练营" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /读题破冰/ })).toBeInTheDocument();
    expect(screen.getByText("先不要选模型，用自己的话复述这道题到底要解决什么。")).toBeInTheDocument();
    expect(screen.getByText("AI 教练提示")).toBeInTheDocument();
  });

  it("links to the workbench with quest context", () => {
    render(
      <MemoryRouter initialEntries={["/quest"]} future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
        <QuestPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole("link", { name: "打开 AI 工作台" })).toHaveAttribute("href", expect.stringContaining("problem_text="));
  });

  it("restores a saved default quest draft", () => {
    const states = createEmptyQuestStates("2026-05-25T00:00:00.000Z");
    states[0] = {
      ...states[0],
      answer: "我已经能说明这道题的背景、目标和限制。",
      completed: true,
    };
    const draft: QuestDraft = {
      activeStageId: "breakdown",
      states,
      checks: Object.fromEntries(questStages.map((stage) => [stage.id, stage.passConditions.map(() => false)])) as QuestDraft["checks"],
      updatedAt: "2026-05-25T00:00:00.000Z",
    };
    saveQuestDraft("default", draft);

    render(
      <MemoryRouter initialEntries={["/quest"]} future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
        <QuestPage />
      </MemoryRouter>,
    );

    expect(screen.getByText("把题目拆成 2-4 个可执行的小任务。")).toBeInTheDocument();
    expect(screen.getByText("1/7 关已通关")).toBeInTheDocument();
  });
});
