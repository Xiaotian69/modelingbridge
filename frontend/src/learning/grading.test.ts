import { expect, it } from "vitest";
import { grade } from "./grading";
import { questions } from "./questions";

it("grades numeric answers with explicit tolerance, rejects malformed numbers", () => {
  const q = questions.find((q) => q.id === "practice-2")!;
  expect(grade(q, "3000.01")).toBe("correct");
  expect(grade(q, "3001")).toBe("incorrect");
  for (const answer of ["", "  ", "Infinity", "NaN", "3000元", "0xBB8"])
    expect(grade(q, answer)).toBe("invalid");
});
it("requires the exact set for multiple choice, independent of order", () => {
  const q = questions.find((q) => q.id === "self-2")!;
  expect(grade(q, ["constant", "divisible"])).toBe("correct");
  expect(grade(q, ["constant"])).toBe("incorrect");
  expect(grade(q, [])).toBe("invalid");
});
