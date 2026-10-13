import { describe, expect, it } from "vitest";
import { questStages } from "../../quest/stages";
import { PROMPT_TASK_TYPES, REVIEW_LABEL, fillTemplate, placeholdersOf, promptTemplates, publishedPrompts } from ".";

describe("prompt library content (03 §3.9)", () => {
  it("publishes exactly 15 templates and preserves the nine existing deep links", () => {
    expect(publishedPrompts).toHaveLength(15);
    expect(publishedPrompts.map((p) => p.id)).toEqual(expect.arrayContaining([
      "pr.breakdown.base", "pr.breakdown.io", "pr.assumption.check", "pr.method.compare", "pr.data.plan",
      "pr.code.debug", "pr.chart.plan", "pr.paper.selfcheck", "pr.ai.usage",
    ]));
    const ids = promptTemplates.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
    ids.forEach((id) => expect(id).toMatch(/^pr\.[a-z]+\.[a-z]+$/));
  });

  it.each(promptTemplates.map((p) => [p.id, p] as const))("%s: placeholders and variables match one to one", (_, p) => {
    expect(placeholdersOf(p.templateText).sort()).toEqual(p.variables.map((v) => v.key).sort());
    expect(p.variables.some((v) => v.required)).toBe(true);
    p.variables.forEach((v) => expect(v.example.trim()).not.toBe(""));
  });

  it.each(promptTemplates.map((p) => [p.id, p] as const))("%s: required metadata and valid stage / task", (_, p) => {
    expect(p.licenseStatus).toBe("original");
    expect(p.source.author).toContain("原创");
    expect(p.version).toMatch(/^\d+\.\d+$/);
    expect(p.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(PROMPT_TASK_TYPES).toContain(p.taskType);
    expect(p.stage.length).toBeGreaterThan(0);
    p.stage.forEach((s) => expect(questStages.map((q) => q.id)).toContain(s));
    expect(p.limits).toMatch(/捏造/);
    expect(p.contests.length).toBeGreaterThan(0);
    p.contests.forEach((c) => expect(["general", "CUMCM", "MCM-ICM", "campus"]).toContain(c));
  });

  it("never calls a template 已审核 unless the owner reviewed it", () => {
    expect(REVIEW_LABEL["self-checked"].short).toBe("待复核");
    expect(REVIEW_LABEL["self-checked"].long).not.toMatch(/已审核/);
    // Release 2.0.0-preview: no template has been owner-reviewed yet.
    expect(publishedPrompts.every((p) => p.reviewStatus === "self-checked")).toBe(true);
  });

  it("only pre-fills public problem text, never a student's own work", () => {
    promptTemplates.flatMap((p) => p.variables).forEach((v) => {
      if (v.prefillFrom) expect(v.prefillFrom).toBe("quest.problemText");
    });
  });

  it("every 七关 stage has at least one related template", () => {
    questStages.forEach((s) => expect(publishedPrompts.some((p) => p.stage.includes(s.id))).toBe(true));
  });

  it("fills values, highlights missing placeholders and never invents text", () => {
    const { output, missing, parts } = fillTemplate("问 {甲} 和 {乙}，再问 {甲}", { 甲: " 一 " });
    expect(output).toBe("问 一 和 {乙}，再问 一");
    expect(missing).toEqual(["乙"]);
    expect(parts.filter((p) => p.kind === "missing")).toHaveLength(1);
  });
});
