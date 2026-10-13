import { describe, expect, it } from "vitest";
import { q1, q2, q3, q4, q5, results, type ResultId } from "./config";
import { computeResult, type Answers } from "./scoring";

/** 枚举所有可能的答案组合（第 3 题的两两比较不计分，固定即可）。 */
function* everyAnswer(): Generator<Answers> {
  const ids = q1.options.map((o) => o.id);
  const triples: string[][] = [];
  for (let i = 0; i < ids.length; i++)
    for (let j = i + 1; j < ids.length; j++)
      for (let k = j + 1; k < ids.length; k++) triples.push([ids[i], ids[j], ids[k]]);
  for (const t of triples)
    for (const method of q2.methods)
      for (const optimal of [true, false])
        for (const use of q3.uses)
          for (const o4 of q4.options)
            for (const o5 of q5.options)
              yield {
                q1: t,
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
    for (const a of everyAnswer()) {
      expect(computeResult(structuredClone(a))).toEqual(computeResult(a));
    }
  });

  it.each<[ResultId, Answers]>([
    ["abstract", { q1: ["arrive", "window", "camera"], q2: { meat: 0, veg: 0, optimal: false, method: "calc" }, q3: { choices: [0, 0, 0], use: "follow" }, q4: "saturate", q5: "demand" }],
    ["optimize", { q1: ["arrive", "window", "card"], q2: { meat: 5, veg: 10, optimal: true, method: "calc" }, q3: { choices: [0, 0, 0], use: "follow" }, q4: "saturate", q5: "supply" }],
    ["data", { q1: ["card", "camera", "hot"], q2: { meat: 0, veg: 0, optimal: false, method: "try" }, q3: { choices: [0, 0, 0], use: "check" }, q4: "extend", q5: "data" }],
    ["express", { q1: ["hot", "wall", "arrive"], q2: { meat: 0, veg: 0, optimal: false, method: "explain" }, q3: { choices: [0, 0, 0], use: "write" }, q4: "context", q5: "assume" }],
    ["allround", { q1: ["arrive", "card", "hot"], q2: { meat: 0, veg: 0, optimal: false, method: "calc" }, q3: { choices: [0, 0, 0], use: "check" }, q4: "context", q5: "assume" }],
  ])("a typical %s path", (expected, answers) => {
    expect(computeResult(answers).id).toBe(expected);
  });

  it("rejects malformed answers instead of guessing", () => {
    const bad = { q1: ["arrive", "arrive", "card"], q2: { meat: 0, veg: 0, optimal: false, method: "calc" }, q3: { choices: [0, 0, 0] as (0)[], use: "follow" }, q4: "extend", q5: "data" };
    expect(() => computeResult(bad)).toThrow();
    expect(() => computeResult({ ...bad, q1: ["arrive", "card", "hot"], q5: "nope" })).toThrow();
  });

});
