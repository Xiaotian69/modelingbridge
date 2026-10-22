import katex from "katex";
import { describe, expect, it } from "vitest";
import fixture from "./ahp-verified.json";
import { ahpSections, criteriaResult, globalScores, localResults, totalCR } from "./content";
import { ahpExerciseMeta } from "./exerciseMeta";
import { ahpPracticeBank, ahpQuestions } from "./questions";
import { AHP_CHECKPOINT_IDS, AHP_SECTIONS, AHP_SECTION_IDS } from "./sectionIds";
import { evaluate } from "../evaluate";
import { grade } from "../grading";
import { asGradable } from "../courseQuestion";
import { publishedQuestions } from "../questions";

const text = (blocks: (typeof ahpSections)[number]["blocks"]) =>
  blocks
    .map((b) => (b.type === "p" || b.type === "note" ? b.text : b.type === "table" ? b.rows.flat().join(" ") : ""))
    .join(" ");

describe("AHP lesson structure", () => {
  it("matches the light section list and has unique ids", () => {
    expect(ahpSections.map((s) => [s.id, s.title])).toEqual(AHP_SECTIONS.map((s) => [s.id, s.title]));
    expect(new Set(AHP_SECTION_IDS).size).toBe(AHP_SECTION_IDS.length);
  });

  it("parses every formula with KaTeX (throwOnError)", () => {
    for (const s of ahpSections)
      for (const b of s.blocks)
        if (b.type === "formula") expect(() => katex.renderToString(b.text, { throwOnError: true })).not.toThrow();
  });

  it("embeds every checkpoint exactly once and only known questions", () => {
    const embedded = ahpSections.flatMap((s) => s.blocks.filter((b) => b.type === "question").map((b) => (b as { id: string }).id));
    expect(embedded).toEqual(AHP_CHECKPOINT_IDS);
    for (const id of embedded) expect(ahpQuestions.some((q) => q.id === id)).toBe(true);
    expect(ahpSections.flatMap((s) => s.blocks).filter((b) => b.type === "ahp-lab")).toHaveLength(1);
  });

  it("states the verified numbers (computed, matching numpy)", () => {
    criteriaResult.weights.forEach((w, i) => expect(w).toBeCloseTo(fixture.lesson.criteria.weights[i], 9));
    globalScores.forEach((g, i) => expect(g).toBeCloseTo(fixture.global3[i], 9));
    expect(totalCR).toBeCloseTo(fixture.overallCR3, 9);
    localResults.forEach((r, k) =>
      r.weights.forEach((w, i) => expect(w).toBeCloseTo(fixture.lesson[(["C1", "C2", "C3"] as const)[k]].weights[i], 9)),
    );
    const synthesis = text(ahpSections.find((s) => s.id === "synthesis")!.blocks);
    expect(synthesis).toContain("0.421");
    expect(synthesis).toContain("0.366");
    const consistency = text(ahpSections.find((s) => s.id === "consistency")!.blocks);
    expect(consistency).toContain("CR = 0.0032");
    const weights = text(ahpSections.find((s) => s.id === "weights")!.blocks);
    expect(weights).toContain("0.648");
  });
});

describe("AHP questions", () => {
  it("have unique ids that never collide with the linear programming bank", () => {
    const ids = ahpQuestions.map((q) => q.id);
    expect(new Set(ids).size).toBe(ids.length);
    ids.forEach((id) => expect(id.startsWith("ahp-")).toBe(true));
    ids.forEach((id) => expect(publishedQuestions.some((q) => q.id === id)).toBe(false));
    expect(ahpPracticeBank.length).toBeGreaterThanOrEqual(5);
  });

  it("numeric answers equal the numpy reference values", () => {
    const answer = (id: string) => (ahpQuestions.find((q) => q.id === id) as { answer: number }).answer;
    const ex = fixture.exercises as Record<string, number>;
    for (const id of ["ahp-practice-1", "ahp-practice-2", "ahp-practice-3"]) expect(answer(id)).toBeCloseTo(ex[id], 9);
    // Practice 5 asks for 3 decimals; its stored value must round like numpy's.
    expect(answer("ahp-practice-5").toFixed(3)).toBe(fixture.lesson.criteria.geometric[1].toFixed(3));
  });

  it.each(ahpQuestions.map((q) => [q.id, q] as const))("%s: reference answer grades as correct; metadata is complete", (id, q) => {
    expect(grade(asGradable(q), q.type === "numeric" ? String(q.answer) : q.answer)).toBe("correct");
    const meta = ahpExerciseMeta[id];
    expect(meta).toBeDefined();
    expect(AHP_SECTION_IDS).toContain(meta.sectionId);
    expect(q.hints.length).toBeGreaterThan(0);
    for (const e of meta.errors) {
      if ("option" in e) {
        expect(q.type === "numeric" ? [] : q.options.map((o) => o.id)).toContain(e.option);
        expect(evaluate(q, q.type === "multiple" ? [e.option] : e.option)).toMatchObject({ status: "incorrect", tag: e.tag });
      } else {
        expect(q.type).toBe("numeric");
        // A diagnosed mistake must never be accepted as correct.
        expect(evaluate(q, String(e.value))).toMatchObject({ status: "incorrect", tag: e.tag });
      }
    }
  });

  it("diagnoses the CR mistakes with values re-derived from the formula", () => {
    const q = ahpQuestions.find((x) => x.id === "ahp-practice-2")!;
    const ci = (4.21 - 4) / 3;
    expect(evaluate(q, ci.toFixed(3))).toMatchObject({ tag: "只算到 CI" });
    expect(evaluate(q, (0.21 / 4 / 0.9).toFixed(4))).toMatchObject({ tag: "分母用了 n" });
    expect(evaluate(q, (ci / 0.58).toFixed(4))).toMatchObject({ tag: "RI 取错了阶数" });
    expect(evaluate(q, "0.078")).toEqual({ status: "correct" });
    expect(evaluate(q, "abc")).toEqual({ status: "invalid" });
  });
});
