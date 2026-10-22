/**
 * 第 3 题的课程评分与推荐解释（纯函数，测试直接调用）。
 * 1. rateCourse：按 config.q3.rules 把原始数据换成 1–5 分，三门课同一套规则，没有手填分数；
 * 2. scoreCourses：简化综合评分 = Σ 权重 × 该项得分（满分 5 分）；
 * 3. explainRecommendation：只根据实际算出的权重和得分写推荐理由。
 */
import { q3 } from "./config";

export type Course = (typeof q3.courses)[number];

export function rateCourse(c: Course, rules = q3.rules): number[] {
  const grade = rules.grade.find((r) => c.avgScore >= r.min)!.score;
  const homework = rules.homework.find((r) => c.assignments <= r.max)!.score;
  const time = c.startHour < rules.time.earlyBefore ? rules.time.early : rules.time.notEarly;
  return [grade, homework, time];
}

export type ScoredCourse = { name: string; index: number; scores: number[]; parts: number[]; total: number };

/** parts_j = w_j × s_j；total = Σ parts（满分 5）。 */
export function scoreCourses(weights: number[], courses: readonly Course[] = q3.courses): ScoredCourse[] {
  return courses.map((c, index) => {
    const scores = rateCourse(c);
    const parts = scores.map((s, j) => weights[j] * s);
    return { name: c.name, index, scores, parts, total: parts.reduce((a, b) => a + b, 0) };
  });
}

/** 从高到低；综合分相差不到 1e-9 视为同分（避免浮点误差改变名次），同分按原顺序。 */
export const rank = (rows: ScoredCourse[]) =>
  [...rows].sort((a, b) => (Math.abs(b.total - a.total) > 1e-9 ? b.total - a.total : a.index - b.index));

const pct = (v: number) => `${Math.round(v * 100)}%`;
const pts = (v: number) => v.toFixed(2);
const TIE = 0.005;
const list = (names: string[]) => names.map((n) => `「${n}」`).join("和");

/**
 * 推荐理由：
 * - 先说你最看重哪项、这项上最好的是谁、它是不是最后的第一名；
 * - 再把第一名和第二名逐项比：谁在哪几项上领先、领先多少分（= 权重 × 得分差），说明取舍。
 */
export function explainRecommendation(names: string[], weights: number[], rows: ScoredCourse[]) {
  const order = rank(rows);
  const [first, second] = order;
  const tie = first.total - second.total < TIE;
  const sentences: string[] = [];

  const even = Math.max(...weights) - Math.min(...weights) < 0.01;
  if (even) {
    sentences.push("三项你看得一样重，就看谁三项加起来分高。");
  } else {
    const top = weights.indexOf(Math.max(...weights));
    const bestScore = Math.max(...rows.map((r) => r.scores[top]));
    const bests = rows.filter((r) => r.scores[top] === bestScore);
    const bestNames = bests.map((r) => r.name).join("和");
    const firstIsBest = bests.some((r) => r.index === first.index);
    sentences.push(
      `你最看重「${names[top]}」（权重 ${pct(weights[top])}），这一项${bests.length > 1 ? "并列" : ""}最好的是${bestNames}。` +
        (tie ? "" : firstIsBest ? "" : `但只看一项不够，另外两项把总分拉开了。`),
    );
  }

  const ahead: string[] = [];
  const behind: string[] = [];
  let gain = 0;
  let loss = 0;
  names.forEach((n, j) => {
    const d = first.parts[j] - second.parts[j];
    if (d > 1e-9) {
      ahead.push(n);
      gain += d;
    } else if (d < -1e-9) {
      behind.push(n);
      loss -= d;
    }
  });

  if (tie) {
    sentences.push(
      `${first.name}和${second.name}的综合分几乎一样（${pts(first.total)} 对 ${pts(second.total)}）：按你的权重分不出高下，真实建模里这时就该再加一条标准了。`,
    );
  } else if (behind.length === 0) {
    sentences.push(`${first.name}综合 ${pts(first.total)} 分，第二名${second.name} ${pts(second.total)} 分：它在${list(ahead)}上领先，其他项也不输。`);
  } else {
    sentences.push(
      `${first.name}综合 ${pts(first.total)} 分，第二名${second.name} ${pts(second.total)} 分。` +
        `${second.name}在${list(behind)}上多得 ${pts(loss)} 分，但${first.name}在${list(ahead)}上多得 ${pts(gain)} 分，所以总分更高。`,
    );
  }
  return { first, second, tie, ahead, behind, gain, loss, text: sentences.join("") };
}
