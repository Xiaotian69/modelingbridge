// @vitest-environment jsdom

import { beforeEach, describe, expect, it } from "vitest";
import { createEmptyQuestStates, questStages } from "./stages";
import { clearQuestDraft, getQuestDraftKey, loadQuestDraft, saveQuestDraft, type QuestDraft } from "./storage";

describe("quest draft storage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("saves and loads a quest draft by source id", () => {
    const draft: QuestDraft = {
      activeStageId: "breakdown",
      states: createEmptyQuestStates("2026-05-25T00:00:00.000Z"),
      checks: Object.fromEntries(questStages.map((stage) => [stage.id, stage.passConditions.map(() => false)])) as QuestDraft["checks"],
      updatedAt: "2026-05-25T00:00:00.000Z",
    };
    draft.states[0] = {
      ...draft.states[0],
      answer: "我已经能说清题目目标和限制。",
      completed: true,
    };

    saveQuestDraft("case:bike", draft);

    expect(loadQuestDraft("case:bike")).toEqual(draft);
    expect(loadQuestDraft("case:other")).toBeNull();
  });

  it("returns null for invalid stored JSON", () => {
    localStorage.setItem(getQuestDraftKey("broken"), "{bad json");

    expect(loadQuestDraft("broken")).toBeNull();
  });

  it("clears a stored draft", () => {
    const draft: QuestDraft = {
      activeStageId: "read_problem",
      states: createEmptyQuestStates("2026-05-25T00:00:00.000Z"),
      checks: Object.fromEntries(questStages.map((stage) => [stage.id, stage.passConditions.map(() => false)])) as QuestDraft["checks"],
      updatedAt: "2026-05-25T00:00:00.000Z",
    };

    saveQuestDraft("default", draft);
    clearQuestDraft("default");

    expect(loadQuestDraft("default")).toBeNull();
  });
});
