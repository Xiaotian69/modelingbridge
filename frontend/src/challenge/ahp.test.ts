import { describe, expect, it } from "vitest";
import { ahp, explainConsistency, hasContradiction, JUDGEMENTS, judgementMatrix, ranking, synthesize, type Judgement } from "./ahp";
import { q3 } from "./config";

const names = q3.criteria.map((c) => c.name);
const all: Judgement[][] = JUDGEMENTS.flatMap((a) => JUDGEMENTS.flatMap((b) => JUDGEMENTS.map((c) => [a, b, c] as Judgement[])));

/** 独立复核：幂迭代求主特征向量和 λmax，不用几何平均。 */
function powerIteration(m: number[][]) {
  let w = [1, 1, 1];
  for (let n = 0; n < 200; n++) {
    const next = m.map((row) => row.reduce((s, v, j) => s + v * w[j], 0));
    const sum = next.reduce((s, v) => s + v, 0);
    w = next.map((v) => v / sum);
  }
  const aw = m.map((row) => row.reduce((s, v, j) => s + v * w[j], 0));
  return { w, lambda: aw[0] / w[0] };
}

describe("第 3 题：AHP", () => {
  it("reproduces Saaty's textbook matrix [1,3,5; 1/3,1,3; 1/5,1/3,1]", () => {
    const r = ahp([-1, -2, -1]);
    expect(r.matrix[0]).toEqual([1, 3, 5]);
    [0.637, 0.2583, 0.1047].forEach((w, i) => expect(r.weights[i]).toBeCloseTo(w, 3));
    expect(r.cr).toBeCloseTo(0.0332, 3);
    expect(r.consistency).toBe("ok");
  });

  it("geometric-mean weights equal the principal eigenvector for every possible input", () => {
    for (const c of all) {
      const r = ahp(c);
      const p = powerIteration(judgementMatrix(c));
      r.weights.forEach((w, i) => expect(w).toBeCloseTo(p.w[i], 9));
      expect(r.lambdaMax).toBeCloseTo(p.lambda, 9);
    }
  });

  it("builds a reciprocal matrix", () => {
    for (const c of all) {
      const m = judgementMatrix(c);
      for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) expect(m[i][j] * m[j][i]).toBeCloseTo(1, 12);
    }
  });

  it("the 14% / 28% / 58% case is reproducible and is NOT reported as a contradiction", () => {
    // 作业少比给分高稍重要、不早八比给分高稍重要、不早八比作业少稍重要
    const r = ahp([1, 1, 1]);
    expect(r.weights.map((w) => Math.round(w * 100))).toEqual([14, 28, 58]);
    expect(hasContradiction([1, 1, 1])).toBe(false);
    expect(r.consistency).toBe("magnitude"); // CR≈0.12：方向一致，只是轻重对不上
    expect(explainConsistency(names, [1, 1, 1]).text).toContain("方向上没矛盾");
    expect(explainConsistency(names, [1, 1, 1]).text).toContain("不早八比给分高按理应该更明显地重要");
  });

  it("detects contradictions only when no ordering satisfies all three sentences", () => {
    expect(hasContradiction([-1, 1, -1])).toBe(true); // A>B，C>A，B>C
    expect(hasContradiction([-1, 0, 0])).toBe(true); // A>B，A=C，B=C
    expect(hasContradiction([0, 0, 0])).toBe(false);
    expect(hasContradiction([-2, -2, 0])).toBe(false);
    // 恰好 13 种先后顺序（含并列）没有矛盾，其余 125−13 种组合里有矛盾的必须报 contradiction
    const consistentOrders = all.filter((c) => !hasContradiction(c.map((x) => Math.sign(x)) as Judgement[]));
    expect(new Set(consistentOrders.map((c) => c.map(Math.sign).join())).size).toBe(13);
  });

  it("the contradiction message repeats exactly what the player said", () => {
    const text = explainConsistency(names, [-1, 2, -1]).text;
    expect(text).toContain("给分高比作业少稍微重要");
    expect(text).toContain("不早八比给分高明显更重要");
    expect(text).toContain("作业少比不早八稍微重要");
  });

  it("perfectly consistent judgements pass with CR = 0", () => {
    // 给分:作业 = 1:1，给分:时间 = 3，作业:时间 = 3 → 完全一致
    expect(ahp([0, -1, -1]).cr).toBeCloseTo(0, 10);
    expect(ahp([0, -1, -1]).consistency).toBe("ok");
  });

  it("synthesis: parts add up to each club's index and all indices add up to 1", () => {
    for (const c of all) {
      const rows = synthesize(ahp(c).weights, q3.courses);
      expect(rows.reduce((s, r) => s + r.total, 0)).toBeCloseTo(1, 12);
      rows.forEach((r) => expect(r.parts.reduce((s, v) => s + v, 0)).toBeCloseTo(r.total, 12));
    }
  });

  it("hand-checked synthesis for equal weights", () => {
    // 列和：给分 10、作业 9、时间 10；心理学与生活 = (5/10 + 2/9 + 3/10)/3
    const rows = synthesize([1 / 3, 1 / 3, 1 / 3], q3.courses);
    expect(rows[0].total).toBeCloseTo((0.5 + 2 / 9 + 0.3) / 3, 12);
  });

  it("the recommendation really follows the player's weights, and every club can win", () => {
    const top = (c: Judgement[]) => ranking(synthesize(ahp(c).weights, q3.courses))[0].name;
    expect(top([-2, -2, 0])).toBe("心理学与生活"); // 给分最重要
    expect(top([2, 0, -2])).toBe("传统文化概论"); // 作业少最重要
    expect(top([0, 2, 2])).toBe("电影鉴赏"); // 不早八最重要
    expect(new Set(all.map(top))).toEqual(new Set(q3.courses.map((c) => c.name)));
  });

  it("whenever one criterion clearly leads, the course that is best on it is recommended", () => {
    // 这是改版的核心：你最看重哪一项，就推荐在这一项上最好的那门课，不会出现“看重 A 却推荐 B”
    const best = q3.criteria.map((_, j) => q3.courses.reduce((b, c, i) => (c.scores[j] > q3.courses[b].scores[j] ? i : b), 0));
    let checked = 0;
    for (const c of all) {
      const w = ahp(c).weights;
      const sorted = [...w].sort((a, b) => b - a);
      if (sorted[0] - sorted[1] < 0.05) continue;
      checked += 1;
      expect(ranking(synthesize(w, q3.courses))[0].index).toBe(best[w.indexOf(sorted[0])]);
    }
    expect(checked).toBeGreaterThan(100);
  });

  it("each course is the best on exactly one criterion", () => {
    const best = q3.criteria.map((_, j) => q3.courses.reduce((b, c, i) => (c.scores[j] > q3.courses[b].scores[j] ? i : b), 0));
    expect(new Set(best).size).toBe(3);
  });
});
