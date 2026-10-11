import { describe, expect, it } from "vitest";
import katex from "katex";
import samples from "./verified-samples.json";
import { solve } from "./solver";
import { sections } from "./content";
import { publishedQuestions } from "./questions";
import { grade } from "./grading";

describe("independent numerical verification", () => {
  it.each(samples)(
    "matches HiGHS for $parameters",
    ({ parameters, value, integerValue }) => {
      for (const integer of [false, true]) {
        const r = solve(parameters, integer);
        expect(r.value).toBeCloseTo(integer ? integerValue : value, 7);
        for (const [x, y] of r.optima) {
          expect(2 * x + y).toBeLessThanOrEqual(parameters.b1 + 1e-8);
          expect(x + 2 * y).toBeLessThanOrEqual(parameters.b2 + 1e-8);
          if (integer) {
            expect(Number.isInteger(x)).toBe(true);
            expect(Number.isInteger(y)).toBe(true);
          }
        }
      }
    },
  );
  it("parses every formula and verifies every embedded question reference", () => {
    const ids = new Set(sections.map((s) => s.id));
    expect(ids.size).toBe(sections.length);
    for (const s of sections)
      for (const b of s.blocks) {
        if (b.type === "formula")
          expect(() =>
            katex.renderToString(b.text, {
              throwOnError: true,
              strict: "error",
            }),
          ).not.toThrow();
        if (b.type === "question")
          expect(publishedQuestions.some((q) => q.id === b.id)).toBe(true);
      }
  });
  it("accepts each reviewed answer and includes all four objective types", () => {
    expect(new Set(publishedQuestions.map((q) => q.type)).size).toBe(4);
    for (const q of publishedQuestions)
      expect(grade(q, q.type === "numeric" ? String(q.answer) : q.answer)).toBe(
        "correct",
      );
  });
});
