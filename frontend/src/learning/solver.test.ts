import { describe, expect, it } from "vitest";
import { solve, defaults } from "./solver";

describe("bounded workshop LP", () => {
  it("solves the complete example", () => {
    const r = solve(defaults);
    expect(r.value).toBe(2600);
    expect(r.optima).toEqual([[40, 20]]);
    expect(r.vertices).toHaveLength(4);
  });
  it("handles zero resources and ties without inventing a unique optimum", () => {
    expect(solve({ ...defaults, b1: 0 }).value).toBe(0);
    expect(solve({ ...defaults, a: 0, b: 0 }).optima).toHaveLength(4);
    expect(solve({ ...defaults, a: 80, b: 40 }).optima).toHaveLength(2);
  });
  it("distinguishes integer optimum from rounding", () => {
    expect(solve({ ...defaults, b1: 9, b2: 8 }).value).toBeCloseTo(250);
    const r = solve({ ...defaults, b1: 9, b2: 8 }, true);
    expect(r.value).toBe(230);
    expect(r.optima).toEqual([[2, 3]]);
  });
  it("rejects inputs outside the documented interactive domain", () => {
    for (const b1 of [-1, NaN, Infinity, 121])
      expect(() => solve({ ...defaults, b1 })).toThrow();
  });
});
