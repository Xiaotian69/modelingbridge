import { describe, expect, it } from "vitest";
import { q1, q2, q3, q4, q5, results, type Dimension, type ResultId, type ScoredOption } from "./config";
import { ALLROUND_GAP, computeResult, type Answers } from "./scoring";

/** 枚举所有计分相关的答案组合（第 1 题的估算、第 3 题的两两比较都不计分，固定即可）。 */
function* everyAnswer(guess = "w8"): Generator<Answers> {
  for (const follow of q1.follow)
    for (const method of q2.methods)
      for (const optimal of [true, false])
        for (const use of q3.uses)
          for (const o4 of q4.options)
            for (const o5 of q5.options)
              yield {
                q1: { guess, method: follow.id },
                q2: { meat: 0, veg: 0, optimal, method: method.id },
                q3: { choices: [0, 0, 0], use: use.id },
                q4: o4.id,
                q5: o5.id,
              };
}

const base: Answers = { q1: { guess: "w8", method: "relation" }, q2: { meat: 0, veg: 0, optimal: false, method: "calc" }, q3: { choices: [0, 0, 0], use: "follow" }, q4: "saturate", q5: "demand" };

describe("challenge scoring", () => {
  const counts = new Map<ResultId, number>();
  let total = 0;
  for (const a of everyAnswer()) {
    const id = computeResult(a).id;
    counts.set(id, (counts.get(id) ?? 0) + 1);
    total += 1;
  }

  it("every result type is reachable by some set of answers", () => {
    for (const id of Object.keys(results) as ResultId[]) expect(counts.get(id) ?? 0).toBeGreaterThan(0);
  });

  it("no single result swallows most answer combinations", () => {
    for (const n of counts.values()) expect(n / total).toBeLessThan(0.5);
  });

  it("is deterministic: the same answers always give the same result", () => {
    for (const a of everyAnswer()) expect(computeResult(structuredClone(a))).toEqual(computeResult(a));
  });

  it("Q1: whether your wait-time guess is right never changes the result", () => {
    for (const a of everyAnswer()) {
      const r = computeResult(a);
      for (const g of q1.guesses) {
        const q = a.q1 as { guess: string; method: string };
        expect(computeResult({ ...a, q1: { guess: g.id, method: q.method } })).toEqual(r);
      }
    }
  });

  it("every scored option in a question carries the same weight (2 points), so no reasonable answer is favoured", () => {
    const sum = (o: ScoredOption) => Object.values(o.points).reduce((a, b) => a + (b ?? 0), 0);
    for (const list of [q1.follow, q2.methods, q3.uses, q4.options, q5.options] as ScoredOption[][]) for (const o of list) expect(sum(o)).toBe(2);
  });

  it("each option moves the dimension its wording describes", () => {
    const delta = (patch: Partial<Answers>, dim: Dimension) => computeResult({ ...base, ...patch }).totals[dim] - computeResult(base).totals[dim];
    // 第 1 题：理清关系 / 算窗口 → 建模；掐表记录 → 编程；问同学 → 写作
    expect(delta({ q1: { guess: "w8", method: "extra" } }, "M")).toBe(0);
    expect(delta({ q1: { guess: "w8", method: "data" } }, "C")).toBe(2);
    expect(delta({ q1: { guess: "w8", method: "voice" } }, "W")).toBe(2);
    // 第 5 题：人数、产能 → 建模；抽样、外卖数据 → 编程（数据派）
    expect(delta({ q5: "supply" }, "M")).toBe(0);
    expect(delta({ q5: "sample" }, "C")).toBe(2);
    expect(delta({ q5: "data" }, "C")).toBe(2);
    const style = (patch: Partial<Answers>) => computeResult({ ...base, ...patch }).styles;
    expect(style({ q1: { guess: "w8", method: "extra" } }).optimize - style({}).optimize).toBe(1);
    expect(style({ q5: "supply" }).optimize - style({}).optimize).toBe(1);
  });

  it.each<[ResultId, Answers]>([
    ["abstract", base],
    ["optimize", { q1: { guess: "w8", method: "extra" }, q2: { meat: 5, veg: 10, optimal: true, method: "calc" }, q3: { choices: [0, 0, 0], use: "follow" }, q4: "saturate", q5: "supply" }],
    ["data", { q1: { guess: "w24", method: "data" }, q2: { meat: 0, veg: 0, optimal: false, method: "try" }, q3: { choices: [0, 0, 0], use: "check" }, q4: "extend", q5: "sample" }],
    ["express", { q1: { guess: "unsure", method: "voice" }, q2: { meat: 0, veg: 0, optimal: false, method: "explain" }, q3: { choices: [0, 0, 0], use: "write" }, q4: "context", q5: "demand" }],
    ["allround", { q1: { guess: "w8", method: "data" }, q2: { meat: 0, veg: 0, optimal: false, method: "calc" }, q3: { choices: [0, 0, 0], use: "write" }, q4: "context", q5: "data" }],
  ])("a typical %s path", (expected, answers) => {
    expect(computeResult(answers).id).toBe(expected);
  });

  it("rejects malformed answers instead of guessing", () => {
    expect(() => computeResult(base)).not.toThrow();
    expect(() => computeResult({ ...base, q1: { guess: "w99", method: "relation" } })).toThrow();
    expect(() => computeResult({ ...base, q1: { guess: "w8", method: "nope" } })).toThrow();
    expect(() => computeResult({ ...base, q5: "nope" })).toThrow();
  });

  it("all-round needs the three totals within the documented gap", () => {
    for (const a of everyAnswer()) {
      const r = computeResult(a);
      const v = [r.totals.M, r.totals.C, r.totals.W];
      expect(r.id === "allround").toBe(Math.max(...v) - Math.min(...v) <= ALLROUND_GAP);
    }
  });
});

describe("saves made before this revision", () => {
  // 线上第一版（f02a0de）：q1 是 3 个因素的数组（每个 1 分），q5 可能是已删除的 "assume"（W2）
  it.each<[ResultId, Answers]>([
    ["abstract", { q1: ["arrive", "window", "camera"], q2: { meat: 0, veg: 0, optimal: false, method: "calc" }, q3: { choices: [0, 0, 0], use: "follow" }, q4: "saturate", q5: "demand" }],
    ["optimize", { q1: ["arrive", "window", "card"], q2: { meat: 5, veg: 10, optimal: true, method: "calc" }, q3: { choices: [0, 0, 0], use: "follow" }, q4: "saturate", q5: "supply" }],
    ["data", { q1: ["card", "camera", "hot"], q2: { meat: 0, veg: 0, optimal: false, method: "try" }, q3: { choices: [0, 0, 0], use: "check" }, q4: "extend", q5: "data" }],
    ["express", { q1: ["hot", "wall", "arrive"], q2: { meat: 0, veg: 0, optimal: false, method: "explain" }, q3: { choices: [0, 0, 0], use: "write" }, q4: "context", q5: "assume" }],
    ["allround", { q1: ["arrive", "card", "hot"], q2: { meat: 0, veg: 0, optimal: false, method: "calc" }, q3: { choices: [0, 0, 0], use: "check" }, q4: "context", q5: "assume" }],
  ])("first live version still gives %s", (expected, answers) => {
    expect(computeResult(answers).id).toBe(expected);
  });

  it("the intermediate { factors, method } shape (local preview only) is still scored by its method", () => {
    const old = { ...base, q1: { factors: ["arrive", "window", "hot"], method: "voice" } };
    expect(computeResult(old)).toEqual(computeResult({ ...base, q1: { guess: "w8", method: "voice" } }));
  });

  it("old saves are still validated", () => {
    expect(() => computeResult({ ...base, q1: ["arrive", "arrive", "card"] })).toThrow();
  });
});
