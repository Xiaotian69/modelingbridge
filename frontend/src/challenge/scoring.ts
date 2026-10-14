/**
 * 确定性计分：同一组答案永远得到同一结果。
 * 规则（写给审核者看）：
 * 1. 把每题所选选项的 M / C / W 分加起来；第 2 题找到最优解额外记 1 个“优化”风格分。
 *    第 1 题只算“怎么验证”这一问；选了哪 3 个因素不计分（选得准不准不该决定你是哪种人）。
 * 2. 三项最高分与最低分相差不超过 ALLROUND_GAP → 全能型。
 * 3. 否则取最高的一项；并列时按 建模 → 编程 → 写作 的顺序取。
 * 4. 建模手再看风格：“优化”风格分多于“抽象” → 优化派，否则抽象派。
 */
import type { Judgement } from "./ahp";
import { LEGACY_Q1, q1, q2, q3, q4, q5, type Dimension, type ResultId, type ScoredOption, type Style } from "./config";

export const ALLROUND_GAP = 1;

export type Answers = {
  /** factors：第 1 题选出的 3 个因素（教学用，不计分）；method：验证方法（计分）。旧存档是字符串数组。 */
  q1: { factors: string[]; method: string } | string[];
  q2: { meat: number; veg: number; optimal: boolean; method: string };
  q3: { choices: Judgement[]; use: string };
  q4: string;
  q5: string;
};

export type Tally = {
  totals: Record<Dimension, number>;
  styles: Record<Style, number>;
};

function find(options: readonly ScoredOption[], id: string) {
  const option = options.find((o) => o.id === id);
  if (!option) throw new Error(`未知选项：${id}`);
  return option;
}

export function tally(answers: Answers): Tally {
  const totals: Record<Dimension, number> = { M: 0, C: 0, W: 0 };
  const styles: Record<Style, number> = { abstract: 0, optimize: 0, data: 0, express: 0 };
  const add = (option: ScoredOption) => {
    for (const [dim, value] of Object.entries(option.points) as [Dimension, number][]) totals[dim] += value;
    styles[option.style] += 1;
  };
  if (Array.isArray(answers.q1)) {
    // 旧版存档：按旧版规则计分，回访时结果不变
    if (new Set(answers.q1).size !== q1.pick) throw new Error(`第 1 题需要选 ${q1.pick} 个不同的因素`);
    answers.q1.forEach((id) => add(find(LEGACY_Q1, id)));
  } else {
    const { factors, method } = answers.q1;
    if (new Set(factors).size !== q1.pick || factors.some((id) => !q1.options.some((o) => o.id === id)))
      throw new Error(`第 1 题需要选 ${q1.pick} 个不同的因素`);
    add(find(q1.verify, method));
  }
  add(find(q2.methods, answers.q2.method));
  if (answers.q2.optimal) styles.optimize += 1;
  add(find(q3.uses, answers.q3.use));
  add(find(q4.options, answers.q4));
  add(find(q5.options, answers.q5));
  return { totals, styles };
}

export function resultFor({ totals, styles }: Tally): ResultId {
  const values = [totals.M, totals.C, totals.W];
  if (Math.max(...values) - Math.min(...values) <= ALLROUND_GAP) return "allround";
  const top = (["M", "C", "W"] as Dimension[]).find((d) => totals[d] === Math.max(...values))!;
  if (top === "C") return "data";
  if (top === "W") return "express";
  return styles.optimize > styles.abstract ? "optimize" : "abstract";
}

export const computeResult = (answers: Answers) => {
  const t = tally(answers);
  return { id: resultFor(t), ...t };
};
