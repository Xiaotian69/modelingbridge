import { describe, expect, it } from "vitest";
import { q2 } from "./config";
import { MEAL_MAX, MEAL_OPTIMUM, MEAL_PARAMS, MEAL_VERTICES, evaluateMeal } from "./meal";

/** 独立复核：不经过 LP 引擎，直接枚举所有整数组合。 */
function bruteForce() {
  let best = -1;
  const optima: [number, number][] = [];
  for (let x = 0; x <= 50; x++)
    for (let y = 0; y <= 50; y++) {
      if (x * q2.meat.price + y * q2.veg.price > q2.budget) continue;
      if (x * q2.meat.minutes + y * q2.veg.minutes > q2.minutes) continue;
      const v = x * q2.meat.full + y * q2.veg.full;
      if (v > best) {
        best = v;
        optima.length = 0;
      }
      if (v === best) optima.push([x, y]);
    }
  return { best, optima };
}

describe("第 2 题：麻辣烫 LP", () => {
  it("scenario matches the engine's standard form max ax+by, 2x+y≤b1, x+2y≤b2", () => {
    // 引擎固定系数：钱 2:1、时间 1:2；情景数字必须与之一致
    expect(q2.meat.price / q2.veg.price).toBe(2);
    expect(q2.veg.minutes / q2.meat.minutes).toBe(2);
    expect(q2.meat.price).toBe(2);
    expect(q2.meat.minutes).toBe(1);
    expect(MEAL_PARAMS).toEqual({ a: 3, b: 2, b1: 20, b2: 25 });
  });

  it("the engine's integer optimum equals an independent brute-force check, and is unique", () => {
    const check = bruteForce();
    expect(MEAL_OPTIMUM.value).toBe(check.best);
    expect(check.optima).toEqual([MEAL_OPTIMUM.point]);
    expect(MEAL_OPTIMUM.point).toEqual([5, 10]);
    expect(MEAL_OPTIMUM.value).toBe(35);
  });

  it("the optimum uses up both the 20 元 and the 25 分钟 exactly", () => {
    const [x, y] = MEAL_OPTIMUM.point;
    expect(evaluateMeal(x, y)).toMatchObject({ cost: 20, minutes: 25, full: 35, feasible: true, optimal: true });
  });

  it("the continuous feasible region has the corner (5,10)", () => {
    expect(MEAL_VERTICES.some(([x, y]) => Math.abs(x - 5) < 1e-9 && Math.abs(y - 10) < 1e-9)).toBe(true);
  });

  it("flags over-budget and late combinations, and never calls them optimal", () => {
    expect(evaluateMeal(10, 1)).toMatchObject({ overBudget: true, feasible: false, optimal: false });
    expect(evaluateMeal(0, 13)).toMatchObject({ late: true, feasible: false });
    expect(evaluateMeal(6, 8)).toMatchObject({ feasible: true, optimal: false, full: 34 });
  });

  it("slider ranges cover every feasible combination", () => {
    expect(MEAL_MAX).toEqual({ meat: 10, veg: 12 });
  });
});
