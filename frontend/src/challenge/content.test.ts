/** 题干、选项、反馈里的数字必须和题目设定一致；第 5 题的估算用独立的算术再核一遍。 */
import { describe, expect, it } from "vitest";
import { q1, q2, q5 } from "./config";
import { analyze, optimize, predict, verify, workedStep } from "./q1";
import { estimate, formula, spread } from "./fermi";
import { MEAL_OPTIMUM } from "./meal";

describe("第 1 题：四种思路", () => {
  const { ahead, arrive, serve, horizon } = q1.scene;

  it("the story states the scene's numbers, and the queue really grows", () => {
    expect(q1.story).toContain(`${ahead} 人`);
    expect(q1.story).toContain(`每分钟大约来 ${arrive} 个人`);
    expect(q1.story).toContain(`每分钟只能打 ${serve} 份`);
    expect(arrive).toBeGreaterThan(serve);
  });

  it("all four options answer the same question: which approach to start with", () => {
    expect(q1.options.map((o) => o.name)).toEqual(["预测", "优化", "验证", "拆解"]);
    expect(q1.options.find((o) => o.id === "analyze")!.label).toBe("点单、盛菜、刷卡，哪一步最拖慢？");
    for (const o of q1.options) {
      expect(o.label.length).toBeGreaterThan(5);
      expect(o.lead && o.limit).toBeTruthy();
    }
    // 没有哪个选项让玩家重新去“弄清”题目已经给出的数字，除了明确是“核对”的验证
    for (const o of q1.options.filter((x) => x.id !== "verify")) expect(o.label).not.toMatch(/每分钟来多少|打多少份/);
  });

  it("predict: arithmetic checked by hand", () => {
    expect(predict()).toEqual({ growth: 1, later: 54, wait: 18 }); // 24 + 1×30 = 54；54 ÷ 3 = 18
    expect(workedStep("predict")).toContain(`${ahead} + 1 × ${horizon} = 54 人`);
    expect(workedStep("predict")).toContain("54 ÷ 3 = 18 分钟");
  });

  it("optimize: a second window turns growth into shrinkage", () => {
    expect(optimize()).toEqual({ served: 6, shrink: 2, clear: 12 }); // 6 − 4 = 2；24 ÷ 2 = 12
    expect(workedStep("optimize")).toContain("24 ÷ 2 = 12 分钟");
  });

  it("verify: the example count is close to the stated rates, and is marked as an example", () => {
    const v = verify();
    expect(v.came).toBeCloseTo(3.7, 10);
    expect(v.served).toBeCloseTo(3.1, 10);
    expect(Math.abs(v.came - arrive)).toBeLessThan(0.5);
    expect(Math.abs(v.served - serve)).toBeLessThan(0.5);
    expect(workedStep("verify")).toMatch(/^比如/);
  });

  it("analyze: 3 servings a minute is 20 seconds each; the payment share is a hypothetical", () => {
    expect(analyze()).toEqual({ perServing: 20, pay: 8, rest: 12 });
    expect(workedStep("analyze")).toContain("60 ÷ 3 = 20 秒");
    expect(workedStep("analyze")).toContain("假如");
  });

  it("each approach gets its own worked step, never the same text", () => {
    const steps = q1.options.map((o) => workedStep(o.id));
    expect(new Set(steps).size).toBe(4);
    for (const t of steps) expect(t.length).toBeGreaterThan(20);
  });

  it("does not claim the scenario is the real canteen", () => {
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
