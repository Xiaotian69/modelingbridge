import { describe, expect, it } from "vitest";
import { ahp, JUDGEMENTS, type Judgement } from "./ahp";
import { q3 } from "./config";
import { explainRecommendation, rank, rateCourse, scoreCourses } from "./courses";
import verified from "./q3-verified.json";

const names = q3.criteria.map((c) => c.name);
const all: Judgement[][] = JUDGEMENTS.flatMap((a) => JUDGEMENTS.flatMap((b) => JUDGEMENTS.map((c) => [a, b, c] as Judgement[])));
const fixture = (c: Judgement[]) => verified.cases.find((x) => x.choices.join() === c.join())!;

describe("第 3 题：课程评分规则", () => {
  it("scores come from the written rules, and match the independent Python fixture", () => {
    expect(q3.courses.map((c) => rateCourse(c))).toEqual(verified.scores);
    expect(verified.scores).toEqual([
      [5, 2, 5], // 心理学与生活：均分 91 → 5；12 次作业 → 2；周二 10:00 不是早八 → 5
      [4, 4, 5], // 电影鉴赏：均分 85 → 4；4 次 → 4；周四 14:00 不是早八 → 5
      [3, 5, 1], // 传统文化概论：均分 82 → 3；0 次 → 5；周一 8:00 早八 → 1
    ]);
  });

  it("no course carries hand-entered scores; changing raw data changes the score", () => {
    for (const c of q3.courses) expect(c).not.toHaveProperty("scores");
    const base = q3.courses[0];
    expect(rateCourse({ ...base, avgScore: 89 })[0]).toBe(4);
    expect(rateCourse({ ...base, avgScore: 90 })[0]).toBe(5);
    expect(rateCourse({ ...base, avgScore: 74 })[0]).toBe(1);
    expect(rateCourse({ ...base, assignments: 0 })[1]).toBe(5);
    expect(rateCourse({ ...base, assignments: 5 })[1]).toBe(3);
    expect(rateCourse({ ...base, assignments: 13 })[1]).toBe(1);
  });

  it("避开早八 only asks whether the class starts before 9: 10:00 and 14:00 score the same", () => {
    const base = q3.courses[0];
    expect(rateCourse({ ...base, startHour: 10 })[2]).toBe(rateCourse({ ...base, startHour: 14 })[2]);
    expect(rateCourse({ ...base, startHour: 8 })[2]).toBeLessThan(rateCourse({ ...base, startHour: 9 })[2]);
  });

  it("the rule text shown to players states the same thresholds the code uses", () => {
    const text = q3.ruleText.join("");
    for (const r of q3.rules.grade.slice(0, 4)) expect(text).toContain(String(r.min));
    for (const r of q3.rules.homework.slice(1, 4)) expect(text).toContain(`${r.max} 次`);
    expect(text).toContain(`${q3.rules.time.earlyBefore} 点前`);
  });
});

describe("第 3 题：综合评分与推荐（对照 numpy 独立结果）", () => {
  it("weights, λmax, CR, totals and ranking match the fixture for all 125 inputs", () => {
    expect(verified.cases).toHaveLength(125);
    for (const c of all) {
      const f = fixture(c);
      const r = ahp(c);
      r.weights.forEach((w, i) => expect(w).toBeCloseTo(f.weights[i], 8));
      expect(r.lambdaMax).toBeCloseTo(f.lambdaMax, 8);
      expect(r.cr).toBeCloseTo(f.cr, 8);
      const rows = scoreCourses(r.weights);
      rows.forEach((row, i) => expect(row.total).toBeCloseTo(f.totals[i], 8));
      expect(rank(rows).map((x) => x.index)).toEqual(f.order);
    }
  });

  it.each([
    // [判断, 权重(%), 推荐, 说明]
    [[-2, -2, 0], [71, 14, 14], "心理学与生活", "最看重给分：给分最高的心理学胜出（4.57 对 4.14）"],
    [[1, 0, -1], [20, 60, 20], "电影鉴赏", "最看重作业少，但作业最少的传统文化是早八，电影鉴赏 4.20 胜过 3.80"],
    [[0, 2, 2], [14, 14, 71], "电影鉴赏", "最看重避开早八：心理学和电影都不早八，电影另两项更均衡"],
    [[0, -2, -1], [48, 41, 11], "电影鉴赏", "最看重给分，但电影的作业优势抵消了心理学的给分优势"],
  ] as [Judgement[], number[], string, string][])("%j → %s", (choices, weights, winner) => {
    const r = ahp(choices);
    expect(r.weights.map((w) => Math.round(w * 100))).toEqual(weights);
    expect(rank(scoreCourses(r.weights))[0].name).toBe(winner);
  });

  it("the course best on the most important criterion is not always the recommendation", () => {
    let counter = 0;
    for (const c of all) {
      const f = fixture(c);
      if (f.cr > 0.1) continue;
      const top = f.weights.indexOf(Math.max(...f.weights));
      const best = Math.max(...verified.scores.map((s) => s[top]));
      if (verified.scores[f.order[0]][top] !== best) counter += 1;
    }
    expect(counter).toBeGreaterThan(0);
  });

  it("an exact tie is reported as a tie, not as a win", () => {
    // 作业少 71%：电影 = 传统 = 4.143
    const r = ahp([2, 0, -2]);
    const rows = scoreCourses(r.weights);
    expect(rows[1].total).toBeCloseTo(rows[2].total, 12);
    const why = explainRecommendation(names, r.weights, rows);
    expect(why.tie).toBe(true);
    expect(why.text).toContain("几乎一样");
  });
});

describe("第 3 题：推荐理由与计算一致", () => {
  it("for every input, the reason names the real winner, the real totals and the real trade-off", () => {
    for (const c of all) {
      const f = fixture(c);
      const w = ahp(c).weights;
      const why = explainRecommendation(names, w, scoreCourses(w));
      const [i1, i2] = f.order;
      expect(why.first.index).toBe(i1);
      expect(why.second.index).toBe(i2);
      // 领先分 − 落后分 = 两门课的总分差（独立结果）
      expect(why.gain - why.loss).toBeCloseTo(f.totals[i1] - f.totals[i2], 8);
      // “领先的项”确实是第一名得分更高的项
      for (const n of why.ahead) expect(verified.scores[i1][names.indexOf(n)]).toBeGreaterThan(verified.scores[i2][names.indexOf(n)]);
      for (const n of why.behind) expect(verified.scores[i1][names.indexOf(n)]).toBeLessThan(verified.scores[i2][names.indexOf(n)]);
      if (!why.tie) {
        expect(why.text).toContain(`${q3.courses[i1].name}综合 ${f.totals[i1].toFixed(2)} 分`);
        expect(why.text).toContain(`第二名${q3.courses[i2].name} ${f.totals[i2].toFixed(2)} 分`);
      }
      expect(why.text).not.toMatch(/所以一定|一定选/);
    }
  });

  it("explains the trade-off when the top criterion's best course loses", () => {
    const w = ahp([1, 0, -1]).weights; // 给分 20%、作业少 60%、避开早八 20%
    const text = explainRecommendation(names, w, scoreCourses(w)).text;
    expect(text).toContain("你最看重「作业少」（权重 60%），这一项最好的是传统文化概论。但只看一项不够");
    expect(text).toContain("电影鉴赏综合 4.20 分，第二名传统文化概论 3.80 分");
    expect(text).toContain("传统文化概论在「作业少」上多得 0.60 分，但电影鉴赏在「给分高」和「避开早八」上多得 1.00 分");
  });
});
