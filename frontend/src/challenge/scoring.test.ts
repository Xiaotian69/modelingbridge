import { describe, expect, it } from "vitest";
import { q1, q2, q3, q4, q5, results, type ResultId } from "./config";
import { ALLROUND_GAP, computeResult, type Answers } from "./scoring";

const CAUSES = q1.options.filter((o) => o.kind === "cause").map((o) => o.id);
const triples = (ids: string[]) => {
  const out: string[][] = [];
  for (let i = 0; i < ids.length; i++)
    for (let j = i + 1; j < ids.length; j++) for (let k = j + 1; k < ids.length; k++) out.push([ids[i], ids[j], ids[k]]);
  return out;
};

/** 枚举所有计分相关的答案组合（第 1 题选哪 3 个因素、第 3 题的两两比较都不计分，固定即可）。 */
function* everyAnswer(factors = CAUSES): Generator<Answers> {
  for (const verify of q1.verify)
    for (const method of q2.methods)
      for (const optimal of [true, false])
        for (const use of q3.uses)
          for (const o4 of q4.options)
            for (const o5 of q5.options)
              yield {
                q1: { factors, method: verify.id },
                q2: { meat: 0, veg: 0, optimal, method: method.id },
                q3: { choices: [0, 0, 0], use: use.id },
                q4: o4.id,
                q5: o5.id,
              };
}

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

  it("Q1: which three factors you pick never changes the result, only how you would verify does", () => {
    const allTriples = triples(q1.options.map((o) => o.id));
    expect(allTriples).toHaveLength(20);
    for (const a of everyAnswer()) {
      const base = computeResult(a);
      for (const t of allTriples) {
        const q = a.q1 as { factors: string[]; method: string };
        expect(computeResult({ ...a, q1: { factors: t, method: q.method } })).toEqual(base);
      }
    }
  });

  it("Q1: each verify option moves the matching dimension", () => {
    const base: Answers = { q1: { factors: CAUSES, method: "relation" }, q2: { meat: 0, veg: 0, optimal: false, method: "calc" }, q3: { choices: [0, 0, 0], use: "follow" }, q4: "saturate", q5: "demand" };
    const totals = (method: string) => computeResult({ ...base, q1: { factors: CAUSES, method } }).totals;
    expect(totals("relation").M - totals("data").M).toBe(2);
    expect(totals("data").C - totals("relation").C).toBe(2);
    expect(totals("voice").W - totals("relation").W).toBe(2);
    const optimize = (method: string) => computeResult({ ...base, q1: { factors: CAUSES, method } }).styles.optimize;
    expect(optimize("extra") - optimize("relation")).toBe(1);
  });

  it.each<[ResultId, Answers]>([
    ["abstract", { q1: { factors: CAUSES, method: "relation" }, q2: { meat: 0, veg: 0, optimal: false, method: "calc" }, q3: { choices: [0, 0, 0], use: "follow" }, q4: "saturate", q5: "demand" }],
    ["optimize", { q1: { factors: CAUSES, method: "extra" }, q2: { meat: 5, veg: 10, optimal: true, method: "calc" }, q3: { choices: [0, 0, 0], use: "follow" }, q4: "saturate", q5: "supply" }],
    ["data", { q1: { factors: CAUSES, method: "data" }, q2: { meat: 0, veg: 0, optimal: false, method: "try" }, q3: { choices: [0, 0, 0], use: "check" }, q4: "extend", q5: "data" }],
    ["express", { q1: { factors: CAUSES, method: "voice" }, q2: { meat: 0, veg: 0, optimal: false, method: "explain" }, q3: { choices: [0, 0, 0], use: "write" }, q4: "context", q5: "assume" }],
    ["allround", { q1: { factors: CAUSES, method: "data" }, q2: { meat: 0, veg: 0, optimal: false, method: "calc" }, q3: { choices: [0, 0, 0], use: "write" }, q4: "context", q5: "data" }],
  ])("a typical %s path", (expected, answers) => {
    expect(computeResult(answers).id).toBe(expected);
  });

  it("rejects malformed answers instead of guessing", () => {
    const ok: Answers = { q1: { factors: CAUSES, method: "relation" }, q2: { meat: 0, veg: 0, optimal: false, method: "calc" }, q3: { choices: [0, 0, 0], use: "follow" }, q4: "extend", q5: "data" };
    expect(() => computeResult(ok)).not.toThrow();
    expect(() => computeResult({ ...ok, q1: { factors: ["arrive", "arrive", "hot"], method: "relation" } })).toThrow();
    expect(() => computeResult({ ...ok, q1: { factors: ["arrive", "nope", "hot"], method: "relation" } })).toThrow();
    expect(() => computeResult({ ...ok, q1: { factors: CAUSES, method: "nope" } })).toThrow();
    expect(() => computeResult({ ...ok, q5: "nope" })).toThrow();
  });

  it("all-round needs the three totals within the documented gap", () => {
    for (const a of everyAnswer()) {
      const r = computeResult(a);
      const v = [r.totals.M, r.totals.C, r.totals.W];
      expect(r.id === "allround").toBe(Math.max(...v) - Math.min(...v) <= ALLROUND_GAP);
    }
  });
});

describe("legacy saves from the first live version", () => {
  // 线上第一版存的 q1 是 3 个因素的数组，每个因素给 1 分；回访时必须算出和当时一样的结果
  it.each<[ResultId, Answers]>([
    ["abstract", { q1: ["arrive", "window", "camera"], q2: { meat: 0, veg: 0, optimal: false, method: "calc" }, q3: { choices: [0, 0, 0], use: "follow" }, q4: "saturate", q5: "demand" }],
    ["optimize", { q1: ["arrive", "window", "card"], q2: { meat: 5, veg: 10, optimal: true, method: "calc" }, q3: { choices: [0, 0, 0], use: "follow" }, q4: "saturate", q5: "supply" }],
    ["data", { q1: ["card", "camera", "hot"], q2: { meat: 0, veg: 0, optimal: false, method: "try" }, q3: { choices: [0, 0, 0], use: "check" }, q4: "extend", q5: "data" }],
    ["express", { q1: ["hot", "wall", "arrive"], q2: { meat: 0, veg: 0, optimal: false, method: "explain" }, q3: { choices: [0, 0, 0], use: "write" }, q4: "context", q5: "assume" }],
    ["allround", { q1: ["arrive", "card", "hot"], q2: { meat: 0, veg: 0, optimal: false, method: "calc" }, q3: { choices: [0, 0, 0], use: "check" }, q4: "context", q5: "assume" }],
  ])("old answers still give %s", (expected, answers) => {
    expect(computeResult(answers).id).toBe(expected);
  });

  it("old saves are still validated", () => {
    expect(() =>
      computeResult({ q1: ["arrive", "arrive", "card"], q2: { meat: 0, veg: 0, optimal: false, method: "calc" }, q3: { choices: [0, 0, 0], use: "follow" }, q4: "extend", q5: "data" }),
    ).toThrow();
  });
});
