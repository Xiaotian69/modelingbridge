import { describe, expect, it } from "vitest";
import { TASKS, type Role } from "./content";
import { evidenceFor, suggestionFor, summarize, taskOutcome, type Answers, type TaskAnswer } from "./scoring";

const base = (): Answers => ({ experience: {}, interests: [], tasks: {}, preference: [] });
const right = (role: Role, n = 3): Record<string, TaskAnswer> =>
  Object.fromEntries(TASKS.filter((t) => t.role === role).slice(0, n).map((t) => [t.id, { choice: t.answer }]));
const wrongAll = (role: Role): Record<string, TaskAnswer> =>
  Object.fromEntries(
    TASKS.filter((t) => t.role === role).map((t) => [t.id, { choice: [t.options.find((o) => !t.answer.includes(o.id))!.id] }]),
  );
const skipAll = (role: Role): Record<string, TaskAnswer> =>
  Object.fromEntries(TASKS.filter((t) => t.role === role).map((t) => [t.id, { skipped: true as const }]));

describe("taskOutcome", () => {
  it("needs exactly the reference set for multi-select tasks", () => {
    const multi = TASKS.find((t) => t.kind === "multi")!;
    expect(taskOutcome(multi, { choice: multi.answer })).toBe("correct");
    expect(taskOutcome(multi, { choice: [...multi.answer].reverse() })).toBe("correct");
    expect(taskOutcome(multi, { choice: [multi.answer[0]] })).toBe("wrong");
    expect(taskOutcome(multi, { skipped: true })).toBe("skipped");
    expect(taskOutcome(multi, undefined)).toBe("missing");
  });
});

describe("suggestion rules", () => {
  it("follows the documented table", () => {
    expect(suggestionFor("strong", "good")).toBe("start");
    expect(suggestionFor("some", "good")).toBe("start");
    expect(suggestionFor("strong", "mixed")).toBe("basics");
    expect(suggestionFor("strong", "insufficient")).toBe("basics");
    expect(suggestionFor("none", "good")).toBe("try");
    expect(suggestionFor("some", "insufficient")).toBe("unclear");
    expect(suggestionFor("none", "insufficient")).toBe("unclear");
    expect(suggestionFor("some", "mixed")).toBe("weak");
    expect(suggestionFor("none", "mixed")).toBe("weak");
  });

  it("records skipped tasks separately from wrong answers", () => {
    const skipped = evidenceFor("code", { ...base(), tasks: skipAll("code") });
    const wrong = evidenceFor("code", { ...base(), tasks: wrongAll("code") });
    expect([skipped.correct, skipped.wrong, skipped.skipped]).toEqual([0, 0, 3]);
    expect(skipped.taskLevel).toBe("insufficient");
    expect(skipped.suggestion).toBe("unclear");
    expect([wrong.correct, wrong.wrong, wrong.skipped]).toEqual([0, 3, 0]);
    expect(wrong.taskLevel).toBe("mixed");
  });

  it("keeps interest, experience and task performance apart", () => {
    // 只说喜欢、任务没做对：兴趣明显 → 从基础练起，而不是“适合”或“不适合”
    const likes = evidenceFor("code", { ...base(), interests: ["i-code-clean", "i-code-debug"], tasks: wrongAll("code"), experience: { code: "project" } });
    expect(likes.interestLevel).toBe("strong");
    expect(likes.suggestion).toBe("basics");
    expect(likes.notes.join()).toContain("说明不了你的能力");
    // 没接触过、也没选兴趣，但任务全对：值得试一次，并说明上手门槛
    const able = evidenceFor("code", { ...base(), tasks: right("code"), experience: { code: "none" } });
    expect(able.interestLevel).toBe("none");
    expect(able.suggestion).toBe("try");
    expect(able.notes.join()).toContain("答对了 3 题");
    // 经验本身不改变建议
    const withExp = evidenceFor("code", { ...base(), tasks: right("code"), experience: { code: "project" } });
    expect(withExp.suggestion).toBe(able.suggestion);
  });

  it("caps interest picks at two and adds one for the after-task preference; 还说不清 adds nothing", () => {
    const e = evidenceFor("write", { ...base(), interests: ["i-write-explain", "i-write-chart"], preference: ["write"] });
    expect(e.interestScore).toBe(3);
    const unsure = evidenceFor("write", { ...base(), preference: ["unsure"] });
    expect(unsure.interestScore).toBe(0);
  });

  it("can suggest several roles and never collapses the result to one label", () => {
    const answers: Answers = {
      ...base(),
      interests: ["i-model-split", "i-write-explain"],
      preference: ["model", "write"],
      tasks: { ...right("model"), ...right("write"), ...right("code", 2) },
    };
    const result = summarize(answers);
    expect(result).toHaveLength(3);
    expect(result.filter((e) => e.suggestion === "start").map((e) => e.role)).toEqual(["model", "write"]);
    expect(result[2]).toMatchObject({ role: "code", suggestion: "try" });
  });
});
