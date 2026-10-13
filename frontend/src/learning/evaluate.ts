/**
 * Turns the verified `grade()` result into teaching feedback. Correctness is decided by
 * grading.ts only; this file adds partial credit for multi-select and mistake diagnosis.
 */
import { grade, type Answer } from "./grading";
import { asGradable, type CourseQuestion } from "./courseQuestion";
import { metaForQuestion } from "./courseBanks";

export type Evaluation =
  | { status: "invalid" }
  | { status: "correct" }
  | { status: "partial"; message: string }
  | { status: "incorrect"; tag?: string; message?: string };

export function evaluate(q: CourseQuestion, answer: Answer): Evaluation {
  const result = grade(asGradable(q), answer);
  if (result === "invalid") return { status: "invalid" };
  if (result === "correct") return { status: "correct" };
  const errors = metaForQuestion(q.id).errors;
  if (q.type === "numeric") {
    const value = Number(answer);
    const hit = errors.find((e) => "value" in e && Math.abs(e.value - value) <= q.tolerance + 1e-9);
    return hit ? { status: "incorrect", tag: hit.tag, message: hit.message } : { status: "incorrect" };
  }
  const chosen = Array.isArray(answer) ? answer : [answer];
  const hit = errors.find((e) => "option" in e && chosen.includes(e.option));
  if (hit) return { status: "incorrect", tag: hit.tag, message: hit.message };
  if (q.type === "multiple") {
    // Only right options chosen, but not all of them: say how many are missing, not which.
    const missing = q.answer.filter((a) => !chosen.includes(a)).length;
    if (chosen.every((c) => q.answer.includes(c)) && missing > 0)
      return { status: "partial", message: `选对了 ${chosen.length} 项，还有 ${missing} 项没有选上。` };
  }
  return { status: "incorrect" };
}

/** Three help levels: 启发, 线索, 完整解析 (design doc §5.3, D-016). */
export function helpLevels(q: CourseQuestion): [string, string | null, { answer: string; explanation: string }] {
  return [q.hints[0], q.hints[1] ?? metaForQuestion(q.id).clue ?? null, { answer: q.answerLabel, explanation: q.explanation }];
}
