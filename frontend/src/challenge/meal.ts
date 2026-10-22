/**
 * 第 2 题的适配层：把“麻辣烫”情景翻译成教学 LP 引擎（learning/solver.ts）的参数。
 * 只调用 solve()，不修改引擎。
 *
 * 荤菜 x 串、素菜 y 串：
 *   钱   2x +  y ≤ 20
 *   时间  x + 2y ≤ 25
 *   饱腹值 3x + 2y → 最大（只能整串买，所以用整数解）
 * 这正是引擎的标准形式 max ax+by, 2x+y≤b1, x+2y≤b2。
 */
import { solve, type Point } from "../learning/solver";
import { q2 } from "./config";

export const MEAL_PARAMS = {
  a: q2.meat.full,
  b: q2.veg.full,
  b1: q2.budget,
  b2: q2.minutes,
};

const result = solve(MEAL_PARAMS, true);

/** 整数最优解（引擎计算）。 */
export const MEAL_OPTIMUM: { point: Point; value: number } = {
  point: result.optima[0],
  value: result.value,
};

/** 连续可行域的顶点（画图用）。 */
export const MEAL_VERTICES: Point[] = solve(MEAL_PARAMS).vertices;

/** 滑块上限：只花钱/只花时间时最多能买几串。 */
export const MEAL_MAX = {
  meat: Math.floor(q2.budget / q2.meat.price),
  veg: Math.floor(q2.minutes / q2.veg.minutes),
};

export function evaluateMeal(meat: number, veg: number) {
  const cost = meat * q2.meat.price + veg * q2.veg.price;
  const minutes = meat * q2.meat.minutes + veg * q2.veg.minutes;
  const full = meat * q2.meat.full + veg * q2.veg.full;
  const overBudget = cost > q2.budget;
  const late = minutes > q2.minutes;
  const feasible = !overBudget && !late;
  return {
    cost,
    minutes,
    full,
    overBudget,
    late,
    feasible,
    optimal: feasible && full === MEAL_OPTIMUM.value,
  };
}
