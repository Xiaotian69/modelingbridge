import { describe, expect, it } from "vitest";
import { INTERESTS, PREFERENCES, QUEST_LINK, ROLE_ORDER, ROLES, TASKS } from "./content";
import { STEP_COUNT } from "./storage";

describe("team-roles content", () => {
  it("has three tasks per role, interleaved, with unique ids", () => {
    expect(TASKS).toHaveLength(9);
    for (const role of ROLE_ORDER) expect(TASKS.filter((t) => t.role === role)).toHaveLength(3);
    expect(new Set(TASKS.map((t) => t.id)).size).toBe(TASKS.length);
    // 相邻两题不属于同一分工
    TASKS.slice(1).forEach((t, i) => expect(t.role).not.toBe(TASKS[i].role));
    expect(STEP_COUNT).toBe(12);
  });

  it("gives every task a reference answer that exists among its options, and a reason for every option", () => {
    for (const t of TASKS) {
      const ids = t.options.map((o) => o.id);
      expect(new Set(ids).size).toBe(ids.length);
      expect(t.answer.length).toBeGreaterThan(0);
      expect(t.answer.every((a) => ids.includes(a))).toBe(true);
      if (t.kind === "single") expect(t.answer).toHaveLength(1);
      else expect(t.prompt).toContain(`选 ${t.answer.length} 项`);
      for (const o of t.options) expect(o.why.length).toBeGreaterThan(4);
      expect(t.explain.length).toBeGreaterThan(10);
    }
  });

  it("keeps the numbers in the tasks consistent with their own materials", () => {
    const steps = TASKS.find((t) => t.id === "t-code-steps")!;
    const shortage = steps.table!.rows.reduce((sum, [, need, have]) => sum + Math.max(Number(need) - Number(have), 0), 0);
    const net = steps.table!.rows.reduce((sum, [, need, have]) => sum + Number(need) - Number(have), 0);
    expect(shortage).toBe(35);
    expect(net).toBe(20);
    expect(steps.options.find((o) => o.id === "a")!.label).toContain("= 35");
    expect(steps.options.find((o) => o.id === "b")!.label).toContain("20");

    const chart = TASKS.find((t) => t.id === "t-write-chart")!.chart!;
    const [east, lib] = chart.series;
    const peak = (v: number[]) => chart.categories[v.indexOf(Math.max(...v))];
    expect(peak(east.values)).toBe("7:50–8:00");
    expect(peak(lib.values)).toBe("8:00–8:10");
    const total = (v: number[]) => v.reduce((a, b) => a + b, 0);
    expect([total(east.values), total(lib.values)]).toEqual([115, 58]);

    const claim = TASKS.find((t) => t.id === "t-write-claim")!;
    expect(claim.evidence).toContain("6 分钟降到 4 分钟");
    expect(Math.round(((6 - 4) / 6) * 100)).toBe(33);

    const data = TASKS.find((t) => t.id === "t-code-data")!;
    const negative = data.table!.rows.findIndex((r) => Number(r[2]) < 0);
    expect(data.answer).toEqual([`r${negative + 1}`]);
  });

  it("offers two interest items and one preference per role, without scoring them as right or wrong", () => {
    for (const role of ROLE_ORDER) {
      expect(INTERESTS.filter((o) => o.role === role)).toHaveLength(2);
      expect(PREFERENCES.some((p) => p.id === role)).toBe(true);
    }
    expect(PREFERENCES.some((p) => p.id === "unsure")).toBe(true);
  });

  it("points every role at a short practice and existing lessons", () => {
    const known = ["/learn/introduction", "/learn/linear-programming", "/learn/linear-programming/lab", "/learn/regression", "/learn/ahp"];
    for (const role of ROLE_ORDER) {
      expect(ROLES[role].practice.length).toBeGreaterThan(20);
      expect(ROLES[role].unobserved.length).toBeGreaterThan(10);
      for (const l of ROLES[role].links) expect(known).toContain(l.to);
    }
    expect(QUEST_LINK.to).toBe("/quest?case=bike-demand-demo");
  });
});
