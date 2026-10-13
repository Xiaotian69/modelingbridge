import { describe, expect, it } from "vitest";
import { ahpWeights, judgementMatrix, rankClubs } from "./ahp";
import { q3 } from "./config";

describe("第 3 题：极简 AHP", () => {
  it("equal judgements give equal weights and are consistent", () => {
    const { weights, cr, consistent } = ahpWeights([0, 0, 0]);
    weights.forEach((w) => expect(w).toBeCloseTo(1 / 3, 10));
    expect(cr).toBeCloseTo(0, 10);
    expect(consistent).toBe(true);
  });

  it("builds a reciprocal judgement matrix", () => {
    const m = judgementMatrix([-1, 1, 0]);
    expect(m[0][1]).toBe(3);
    expect(m[1][0]).toBeCloseTo(1 / 3);
    expect(m[0][2]).toBeCloseTo(1 / 3);
    expect(m[2][0]).toBe(3);
  });

  it("matches hand-computed geometric-mean weights for 兴趣>时间, 兴趣>氛围", () => {
    // 行几何平均：兴趣 ∛9，时间 ∛(1/3)，氛围 ∛(1/3)
    const g = [Math.cbrt(9), Math.cbrt(1 / 3), Math.cbrt(1 / 3)];
    const s = g[0] + g[1] + g[2];
    const { weights } = ahpWeights([-1, -1, 0]);
    weights.forEach((w, i) => expect(w).toBeCloseTo(g[i] / s, 10));
  });

  it("detects a circular judgement (兴趣>时间>氛围>兴趣) as inconsistent", () => {
    expect(ahpWeights([-1, 1, -1]).consistent).toBe(false);
  });

  it("the ranking really depends on the weights", () => {
    const top = (choices: (-1 | 0 | 1)[]) => rankClubs(ahpWeights(choices).weights, q3.clubs)[0].name;
    expect(top([-1, -1, 0])).toBe("摄影社"); // 兴趣最重要
    expect(top([1, 0, -1])).toBe("读书会"); // 时间最重要
    expect(top([0, 1, 1])).toBe("羽毛球社"); // 氛围最重要
    expect(top([0, 0, 0])).toBe("羽毛球社");
  });
});
