/** 第 5 题：按每条路线的算式算出估计值（纯函数，测试直接核对）。 */
import { q5, type FermiRoute } from "./config";

/** 依次做乘除，四舍五入到整杯。 */
export function estimate(route: FermiRoute) {
  const exact = route.steps.reduce((acc, s, i) => (i === 0 ? s.value : s.op === "÷" ? acc / s.value : acc * s.value), 0);
  return Math.round(exact);
}

/** “20000 人 × 十分之一 × 1 杯 ≈ 2000 杯” */
export function formula(route: FermiRoute) {
  const body = route.steps.map((s, i) => (i === 0 ? s.show : `${s.op} ${s.show}`)).join(" ");
  return `${body} ≈ ${estimate(route)} 杯`;
}

/** 四条路线估出来的范围 */
export function spread(routes: readonly FermiRoute[] = q5.options) {
  const values = routes.map(estimate);
  return { min: Math.min(...values), max: Math.max(...values) };
}
