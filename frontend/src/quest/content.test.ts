import { describe, expect, it } from "vitest";
import {
  getCaseQuestSeed,
  getCoachPrompt,
  getModelCardsForCase,
  getStageSeed,
  renderCoachPrompt,
} from "./content";

describe("quest content adapter", () => {
  it("maps a case route slug to seven stage seeds", () => {
    const seed = getCaseQuestSeed("bike-demand-demo");

    expect(seed?.caseId).toBe("bike_demand");
    expect(seed?.caseSlug).toBe("bike-demand-demo");
    expect(Object.keys(seed?.stages ?? {})).toHaveLength(7);
    expect(getStageSeed("bike-demand-demo", "read_problem")?.taskBrief).toContain("给了什么");
    expect(getStageSeed("bike-demand-demo", "model")?.commonMistakes[0]).toContain("ARIMA");
  });

  it("returns stable coach prompts and renders variables", () => {
    const prompt = getCoachPrompt("read_problem", "check");

    expect(prompt?.promptId).toBe("P1-check");
    expect(prompt?.inputVars).toContain("studentAnswer");
    expect(prompt?.prohibitions).toContain("不替学生重写摘要");

    const rendered = renderCoachPrompt(prompt!, {
      studentAnswer: "我认为这是一道预测与调度结合的题。",
      passConditions: "能说清题目目标",
    });

    expect(rendered).toContain("我认为这是一道预测与调度结合的题。");
    expect(rendered).toContain("能说清题目目标");
    expect(rendered).not.toContain("{{studentAnswer}}");
  });

  it("provides recommended model cards for the modeling stage", () => {
    const cards = getModelCardsForCase("evaluation-topsis-demo");

    expect(cards.map((card) => card.modelId)).toEqual(expect.arrayContaining(["entropy_topsis", "ahp"]));
    expect(cards.find((card) => card.modelId === "entropy_topsis")?.noviceQuestions.length).toBeGreaterThanOrEqual(3);
  });
});
