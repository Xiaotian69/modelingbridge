import { describe, expect, it } from "vitest";
import { sections } from "./content";
import { exerciseMeta, metaFor } from "./exerciseMeta";
import { evaluate, helpLevels } from "./evaluate";
import { publishedQuestions, questions } from "./questions";
import { LP_SECTIONS, LP_SECTION_IDS } from "./sectionIds";
import { defaults, solve } from "./solver";

describe("stable IDs and links", () => {
  it("keeps the V1 question IDs exactly", () => {
    expect(questions.map((q) => q.id)).toEqual([
      "think-1",
      "self-1",
      "self-2",
      "self-3",
      "practice-1",
      "practice-2",
      "practice-3",
    ]);
  });
  it("mirrors the lesson's section IDs and titles", () => {
    expect(LP_SECTIONS.map((s) => [s.id, s.title])).toEqual(sections.map((s) => [s.id, s.title]));
  });
  it("links every published question to an existing lesson section", () => {
    for (const q of publishedQuestions) {
      expect(exerciseMeta[q.id], q.id).toBeDefined();
      expect(LP_SECTION_IDS).toContain(metaFor(q.id).sectionId);
    }
  });
  it("gives every question three help levels with a real second level", () => {
    for (const q of publishedQuestions) {
      const [first, second, full] = helpLevels(q);
      expect(first.length).toBeGreaterThan(5);
      expect(second, q.id).toBeTruthy();
      expect(full.answer).toBe(q.answerLabel);
    }
  });
});

describe("mistake patterns are deterministic and mathematically right", () => {
  it("only diagnose options that are actually wrong", () => {
    for (const q of publishedQuestions) {
      if (q.type === "numeric") continue;
      const right = Array.isArray(q.answer) ? q.answer : [q.answer];
      for (const e of metaFor(q.id).errors) {
        expect("option" in e).toBe(true);
        if (!("option" in e)) continue;
        expect(q.options.map((o) => o.id)).toContain(e.option);
        expect(right).not.toContain(e.option);
      }
    }
  });
  it("numeric patterns never equal the reference answer", () => {
    for (const q of publishedQuestions) {
      if (q.type !== "numeric") continue;
      for (const e of metaFor(q.id).errors)
        if ("value" in e) expect(Math.abs(e.value - q.answer)).toBeGreaterThan(q.tolerance);
    }
  });
  it("re-derives each numeric diagnosis from the verified solver", () => {
    // practice-1: single-product contributions and swapped pairing.
    expect(40 * 40).toBe(1600);
    expect(50 * 20).toBe(1000);
    expect(50 * 40 + 40 * 20).toBe(2800);
    // practice-2: old optimum and the two axis vertices after raising assembly to 100.
    expect(solve(defaults).value).toBe(2600);
    const raised = solve({ ...defaults, b2: 100 });
    expect(raised.value).toBeCloseTo(3000);
    const profit = ([x, y]: [number, number]) => 40 * x + 50 * y;
    const vertexValues = raised.vertices.map(profit).map((v) => Math.round(v));
    expect(vertexValues).toEqual(expect.arrayContaining([2500, 2000]));
    // practice-3: continuous optimum, naive rounding, and the x = 0 integer point.
    expect(solve({ ...defaults, b1: 9, b2: 8 }).value).toBeCloseTo(250);
    expect(profit([3, 2])).toBe(220);
    expect(profit([0, 4])).toBe(200);
    expect(solve({ ...defaults, b1: 9, b2: 8 }, true).value).toBe(230);
  });
});

describe("evaluate()", () => {
  const q = (id: string) => publishedQuestions.find((x) => x.id === id)!;
  it("uses the verified grader for correctness", () => {
    expect(evaluate(q("practice-1"), "2600").status).toBe("correct");
    expect(evaluate(q("practice-1"), "").status).toBe("invalid");
    expect(evaluate(q("self-2"), ["constant", "divisible"]).status).toBe("correct");
  });
  it("diagnoses known mistakes without revealing the answer", () => {
    const r = evaluate(q("practice-1"), "1600");
    expect(r).toMatchObject({ status: "incorrect", tag: "只算了一种产品" });
    expect(JSON.stringify(r)).not.toContain("2600");
    expect(evaluate(q("self-1"), "c")).toMatchObject({ status: "incorrect", tag: "把上限写成了必须用完" });
    expect(evaluate(q("practice-3"), "250")).toMatchObject({ tag: "忽略了整数要求" });
  });
  it("does not guess when the mistake is unknown", () => {
    expect(evaluate(q("practice-1"), "1234")).toEqual({ status: "incorrect" });
  });
  it("reports partial multi-select answers by count only", () => {
    const r = evaluate(q("self-2"), ["constant"]);
    expect(r).toEqual({ status: "partial", message: "选对了 1 项，还有 1 项没有选上。" });
    expect(evaluate(q("self-2"), ["constant", "always"])).toMatchObject({ status: "incorrect" });
  });
});
