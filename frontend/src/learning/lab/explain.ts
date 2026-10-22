/**
 * Plain-language explanations for the lab, computed from the solver result (never canned numbers).
 * The "why" part uses objective-coefficient ranging: keeping one profit fixed, the interval of
 * the other profit for which the current optimal corner stays optimal. For corner v it is the set
 * of c with c·v ≥ c·w for every other corner w and c·d ≤ 0 for every unbounded direction d.
 * At an endpoint that comes from such a condition, equality holds: v is still optimal but ties
 * with another corner (or with points along an unbounded direction), so the optimum is not
 * unique there. A lower end of 0 that only comes from "profits are non-negative" is not a tie.
 */
import { solveLab, usage, type LabResult, type Model, type Point } from "./lp2d";

/** hi may be Infinity. loTie / hiTie: v ties with another optimal plan exactly at that end. */
export type Range = { lo: number; hi: number; loTie: boolean; hiTie: boolean };

/** Interval of c[k] (other coefficient fixed) for which `v` stays optimal; null if never. */
export function stabilityRange(m: Model, result: Extract<LabResult, { status: "optimal" }>, v: Point, k: 0 | 1): Range | null {
  const other = k === 0 ? 1 : 0;
  let lo = 0;
  let hi = Infinity;
  let loTie = false;
  let hiTie = false;
  // Each condition reads  ck · coef ≥ rhs.
  const conditions: { coef: number; rhs: number }[] = [
    ...result.vertices.map((w) => ({ coef: v[k] - w[k], rhs: m.c[other] * (w[other] - v[other]) })),
    ...result.rays.map((d) => ({ coef: -d[k], rhs: m.c[other] * d[other] })),
  ];
  for (const { coef, rhs } of conditions) {
    if (Math.abs(coef) < 1e-12) {
      if (rhs > 1e-9) return null;
      continue;
    }
    const bound = rhs / coef;
    if (coef > 0) {
      if (bound > lo + 1e-9) [lo, loTie] = [bound, true];
      else if (Math.abs(bound - lo) <= 1e-9) loTie = true;
    } else if (bound < hi - 1e-9) [hi, hiTie] = [bound, true];
    else if (Math.abs(bound - hi) <= 1e-9) hiTie = true;
  }
  return lo <= hi + 1e-9 ? { lo, hi, loTie, hiTie } : null;
}

const n = (x: number) => (Math.abs(x - Math.round(x)) < 1e-9 ? String(Math.round(x)) : x.toFixed(2).replace(/0+$/, "").replace(/\.$/, ""));
export const fmtPoint = ([x, y]: Point) => `A ${n(x)} m²、B ${n(y)} m²`;
/** “在 25–100 元之间” / “不低于 40 元” / “不超过 40 元”, ready to follow the subject. */
const ties = (r: Range) => [r.loTie ? r.lo : null, r.hiTie ? r.hi : null].filter((x): x is number => x !== null);
const fmtRange = (r: Range, unit: string) =>
  r.hi === Infinity
    ? r.lo <= 0
      ? r.loTie
        ? `不低于 0 ${unit}`
        : `取任何值`
      : `不低于 ${n(r.lo)} ${unit}`
    : r.lo <= 0 && !r.loTie
      ? `不超过 ${n(r.hi)} ${unit}`
      : `在 ${n(r.lo)}–${n(r.hi)} ${unit}之间`;

export type Explanation = { tone: "ok" | "warn" | "bad"; headline: string; lines: string[] };

export function explain(m: Model, r: LabResult): Explanation {
  const label = (id: string) => m.constraints.find((c) => c.id === id)?.label ?? id;
  if (r.status === "infeasible") {
    const order = m.constraints.find((c) => c.id === "order");
    const lines: string[] = [];
    if (order) {
      const without = solveLab({ c: [1, 1], constraints: m.constraints.filter((c) => c.id !== "order") });
      if (without.status === "optimal")
        lines.push(
          `现有资源最多只能生产 ${n(without.value)} m²（A 与 B 合计），订单却要求至少 ${n(order.rhs)} m²，没有任何计划能同时满足所有约束。`,
        );
    }
    lines.push("可行域是空的：图上没有阴影区域，也就谈不上最优点。降低订单要求或增加资源，可行域会重新出现。");
    return { tone: "bad", headline: "无可行解", lines };
  }
  if (r.status === "unbounded") {
    const [dx, dy] = r.direction;
    const what = dx === 0 ? "B" : dy === 0 ? "A" : null;
    return {
      tone: "bad",
      headline: "无界：利润可以无限增大",
      lines: [
        what
          ? `沿着只增加 ${what} 的方向，产量可以无限增加而不违反任何约束——${what} 不消耗任何受限资源（它在两条资源约束中的系数都是 0）。`
          : `沿着方向（A ${n(dx)}、B ${n(dy)}）同时增加产量不会违反任何约束，利润随之无限增加。`,
        "现实中资源、市场和人力都是有限的。模型无界通常说明漏掉了约束，需要回到问题里补上，而不是去“求”一个无穷大的答案。",
      ],
    };
  }
  const lines: string[] = [];
  const best = r.optima[0];
  if (m.c[0] === 0 && m.c[1] === 0) {
    return {
      tone: "warn",
      headline: "所有可行计划利润都是 0",
      lines: ["两种产品的利润都设为 0：任何可行计划的利润都一样，最优解不唯一，也没有比较的意义。"],
    };
  }
  if (!r.unique) {
    if (r.optima.length >= 2) {
      const shared = m.constraints.find((c) => r.optima.every((p) => usage(m, p).find((u) => u.id === c.id)!.binding));
      const edge = shared ? `「${shared.label}」` : r.optima.every((p) => p[0] === 0) ? "纵轴（只生产 B）" : "横轴（只生产 A）";
      lines.push(
        `目标函数的等值线与${edge}边界平行：从 ${fmtPoint(r.optima[0])} 到 ${fmtPoint(r.optima[1])}，这条边上每一个计划的利润都是 ${n(r.value)} 元。`,
      );
    }
    if (r.optimalRay) {
      const what = r.optimalRay[0] === 0 ? "B" : "A";
      lines.push(`${what} 的产量可以无限增加而不违反约束，但它的利润系数是 0，利润不变：最优解有无穷多个，而且没有尽头。`);
    }
    lines.push("多重最优解说明模型无法替你在这些计划之间做选择，可以再加一个次要目标（如少占用资源）来决定。");
    return { tone: "warn", headline: `多重最优解：最大利润 ${n(r.value)} 元`, lines };
  }
  const use = usage(m, best);
  const binding = use.filter((u) => u.binding).map((u) => `「${label(u.id)}」`);
  lines.push(binding.length ? `最优点处用完的约束：${binding.join("、")}。` : "最优点处没有任何资源约束被用完。");
  for (const u of use)
    if (!u.binding && m.constraints.find((c) => c.id === u.id)!.sense === "<=")
      lines.push(`「${label(u.id)}」还剩 ${n(u.left)}，再增加这种资源，利润不会提高。`);
  const ra = stabilityRange(m, r, best, 0);
  const rb = stabilityRange(m, r, best, 1);
  if (ra && rb) {
    lines.push(
      `为什么是这个点？目标函数等值线的倾斜程度由 A、B 利润之比决定。保持 B 的利润 ${n(m.c[1])} 元不变，A 的利润${fmtRange(ra, "元")}时，${fmtPoint(best)} 都是最优计划；保持 A 的利润 ${n(m.c[0])} 元不变，B 的利润${fmtRange(rb, "元")}时也一样。超出这个范围，等值线会先碰到另一个角点，最优点随之改变。`,
    );
    const ends = [
      ...ties(ra).map((x) => `A 的利润等于 ${n(x)} 元`),
      ...ties(rb).map((x) => `B 的利润等于 ${n(x)} 元`),
    ];
    if (ends.length)
      lines.push(
        `注意端点：${ends.join("、")}时，等值线正好与一条边界平行，这个计划仍然最优，但与相邻的计划并列最优，最优解不再唯一；只有严格落在区间内部，它才是唯一最优解。`,
      );
  }
  return { tone: "ok", headline: `最优计划：${fmtPoint(best)}，利润 ${n(r.value)} 元`, lines };
}
