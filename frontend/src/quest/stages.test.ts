import { describe, expect, it } from "vitest";
import {
  buildQuestReportMarkdown,
  getQuestProgress,
  getStageUnlockState,
  questStages,
  type QuestStageState,
} from "./stages";

describe("questStages", () => {
  it("defines the seven math-modeling training stages in order", () => {
    expect(questStages.map((stage) => stage.id)).toEqual([
      "read_problem",
      "breakdown",
      "data",
      "model",
      "code",
      "charts",
      "paper",
    ]);
    expect(questStages[0].title).toBe("读题破冰");
    expect(questStages[6].title).toBe("论文框架");
  });
});

describe("getQuestProgress", () => {
  it("returns completed count and rounded percent", () => {
    const states: QuestStageState[] = questStages.map((stage, index) => ({
      stageId: stage.id,
      answer: index < 3 ? `answer-${index}` : "",
      completed: index < 3,
      updatedAt: "2026-05-25T00:00:00.000Z",
    }));

    expect(getQuestProgress(states)).toEqual({
      completed: 3,
      total: 7,
      percent: 43,
    });
  });
});

describe("getStageUnlockState", () => {
  it("unlocks the first incomplete stage and keeps later stages locked", () => {
    const states: QuestStageState[] = questStages.map((stage, index) => ({
      stageId: stage.id,
      answer: index === 0 ? "I understand the goal" : "",
      completed: index === 0,
      updatedAt: "2026-05-25T00:00:00.000Z",
    }));

    expect(getStageUnlockState(questStages[0].id, states)).toBe("completed");
    expect(getStageUnlockState(questStages[1].id, states)).toBe("available");
    expect(getStageUnlockState(questStages[2].id, states)).toBe("locked");
  });
});

describe("buildQuestReportMarkdown", () => {
  it("keeps AI advice separate from student judgment", () => {
    const states: QuestStageState[] = questStages.map((stage, index) => ({
      stageId: stage.id,
      answer: index === 0 ? "My own problem understanding" : "",
      completed: index === 0,
      updatedAt: "2026-05-25T00:00:00.000Z",
    }));

    const report = buildQuestReportMarkdown({
      title: "共享单车需求预测",
      sourceLabel: "案例训练副本",
      states,
      aiUsageNote: "AI only gave hints.",
    });

    expect(report).toContain("# 数模闯关通关报告");
    expect(report).toContain("## 我的判断");
    expect(report).toContain("My own problem understanding");
    expect(report).toContain("## AI 使用记录");
    expect(report).toContain("AI only gave hints.");
  });
});
