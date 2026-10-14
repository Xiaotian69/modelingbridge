/** 题干、选项、反馈里的数字必须和题目设定一致；第 5 题的估算用独立的算术再核一遍。 */
import { describe, expect, it } from "vitest";
import { q1, q2, q5 } from "./config";
import { estimate, formula, spread } from "./fermi";
import { MEAL_OPTIMUM } from "./meal";

describe("第 1 题：排队估算", () => {
  const { ahead, perMinute, arrivals } = q1.scene;

  it("the story states the same numbers the scene uses", () => {
    expect(q1.story).toContain(`${ahead} 个人`);
    expect(q1.story).toContain(`每分钟打 ${perMinute} 份`);
  });

  it("exactly one guess equals ahead ÷ per-minute, and every reply shows that division", () => {
    const answer = ahead / perMinute;
    expect(answer).toBe(8);
    const minutes = q1.guesses.map((g) => Number(/大约 (\d+) 分钟/.exec(g.label)?.[1] ?? NaN));
    expect(minutes.filter((m) => m === answer)).toHaveLength(1);
    for (const g of q1.guesses) expect(g.reply).toMatch(new RegExp(`${ahead} ÷ ${perMinute} [=≈] ${answer} 分钟`));
    // 错误选项各自对应一种常见算法：一人一分钟、乘反了
    expect(minutes).toContain(ahead);
    expect(minutes).toContain(ahead * perMinute);
  });

  it("the twist matches the scene: arrivals minus service is how fast the line grows", () => {
    expect(q1.twist).toContain(`每分钟会来 ${arrivals} 个人`);
    expect(q1.twist).toContain(`只打 ${perMinute} 份`);
    expect(q1.twist).toContain(`每分钟长 ${arrivals - perMinute} 人`);
    expect(arrivals).toBeGreaterThan(perMinute);
  });

  it("does not claim the scenario is the real cause in the real canteen", () => {
    expect(q1.note).toMatch(/题目设定/);
    expect(q1.note).toMatch(/实际数过才知道/);
  });
});

describe("第 2 题：目标说清楚", () => {
  it("title, story and rule card agree with the LP parameters", () => {
    expect(q2.title).toContain(`${q2.budget} 块`);
    expect(q2.title).toContain(`${q2.minutes} 分钟`);
    expect(q2.story).toContain(`${q2.budget} 块`);
    expect(q2.story).toContain(`${q2.minutes} 分钟`);
  });

  it("states the objective and that taste is not modelled", () => {
    expect(q2.goal).toMatch(/饱腹值加起来最高/);
    expect(q2.goal).toMatch(/不管口味/);
    expect(q2.preference).toMatch(/最优方案就会不一样/);
  });

  it("the optimum is still the engine's (5, 10) = 35", () => {
    expect(MEAL_OPTIMUM).toEqual({ point: [5, 10], value: 35 });
  });
});

describe("第 5 题：费米估算路线", () => {
  const byId = (id: string) => q5.options.find((o) => o.id === id)!;

  it("each route's estimate matches hand arithmetic", () => {
    expect(estimate(byId("demand"))).toBe(20000 / 10); // 2 万人 × 十分之一 × 1 杯
    expect(estimate(byId("supply"))).toBe((5 * 60 * 10) / 3); // 5 家 × 60 杯/时 × 10 小时 × 三分之一
    expect(estimate(byId("sample"))).toBe(80 * 4 * 5); // 一小时 80 杯 × 4 × 5 家
    expect(estimate(byId("data"))).toBe((15000 / 30) * 3); // 月销 15000 ÷ 30 天 × 3
  });

  it("the shown values match the values used in the arithmetic", () => {
    const number = (show: string) => {
      const map: Record<string, number> = { 十分之一: 0.1, 三分之一: 1 / 3 };
      return map[show] ?? Number(/[\d.]+/.exec(show)?.[0]);
    };
    for (const route of q5.options) for (const step of route.steps) expect(number(step.show)).toBeCloseTo(step.value, 12);
  });

  it("formulas read left to right and end with the estimate", () => {
    expect(formula(byId("demand"))).toBe("20000 人 × 十分之一 × 1 杯 ≈ 2000 杯");
    expect(formula(byId("data"))).toBe("15000 杯 ÷ 30 天 × 3 ≈ 1500 杯");
  });

  it("all four answer the same question: they are estimation routes, each with a strength, a limit and something it misses", () => {
    expect(q5.options).toHaveLength(4);
    for (const r of q5.options) {
      expect(r.label).toMatch(/^从|^去|^看/);
      expect(r.strength && r.limit && r.miss).toBeTruthy();
    }
    expect(spread()).toEqual({ min: 1000, max: 2000 });
  });

  it("the delivery route never treats platform sales as total sales", () => {
    expect(byId("data").limit).toMatch(/平台销量不等于全部销量/);
    expect(byId("data").steps.some((s) => s.op === "×" && /外卖只占/.test(s.label))).toBe(true);
  });

  it("labels every number as an assumption, not real data", () => {
    expect(q5.note).toMatch(/假设，不是真实数据/);
  });
});
