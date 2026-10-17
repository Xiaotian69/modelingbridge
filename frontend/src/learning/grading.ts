import type { Question } from "./questions";
export type Answer = string | string[];
export type Grade = "correct" | "incorrect" | "invalid";
export function grade(q: Question, answer: Answer): Grade {
  if (q.type === "numeric") {
    if (
      typeof answer !== "string" ||
      !/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(answer.trim())
    )
      return "invalid";
    const n = Number(answer);
    if (!Number.isFinite(n)) return "invalid";
    return Math.abs(n - q.answer) <= q.tolerance + 1e-9
      ? "correct"
      : "incorrect";
  }
  if (q.type === "multiple") {
    if (
      !Array.isArray(answer) ||
      !answer.length ||
      answer.some((a) => !q.options.some((o) => o.id === a))
    )
      return "invalid";
    const values = new Set(answer);
    return values.size === q.answer.length &&
      q.answer.every((a) => values.has(a))
      ? "correct"
      : "incorrect";
  }
  if (typeof answer !== "string" || !q.options.some((o) => o.id === answer))
    return "invalid";
  return answer === q.answer ? "correct" : "incorrect";
}
