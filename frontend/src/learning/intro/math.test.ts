// 第零课 calculations against the scipy reference (intro-verified.json, written by verify_intro.py).
import { describe, expect, it } from "vitest";
import verified from "./intro-verified.json";
import { CLASS_MINUTE, COMMUTE_DAYS, RAIN_DAYS, SCENARIOS, UMBRELLA, WALK, type UmbrellaCase } from "./data";
import {
  clock,
  commuteCheck,
  latestSafeDeparture,
  mean,
  minShortageClosedForm,
  optimum,
  plan,
  transferProblem,
  transferRange,
  walkMinutes,
} from "./math";

const withDemand = (a: number, b: number): UmbrellaCase => ({ stock: UMBRELLA.stock, demand: { a, b } });

describe("the fixture uses the lesson's own inputs", () => {
  it("matches data.ts", () => {
    expect(verified.inputs.walk).toEqual(WALK);
    expect(verified.inputs.commuteDays).toEqual(COMMUTE_DAYS);
    expect(verified.inputs.rainDays).toEqual(RAIN_DAYS);
    expect(verified.inputs.classMinute).toBe(CLASS_MINUTE);
    expect(verified.inputs.stock).toEqual(UMBRELLA.stock);
    expect(verified.inputs.demand).toEqual(UMBRELLA.demand);
    expect(verified.inputs.scenarios).toEqual(SCENARIOS.map((s) => [s.demand.a, s.demand.b]));
  });
});

describe("§1 walking time", () => {
  it("equals the reference for the three assumptions", () => {
    expect(walkMinutes(WALK.metres, WALK.speed)).toBeCloseTo(verified.walk.normal, 12);
    expect(walkMinutes(WALK.metres, WALK.speed, WALK.lightWait)).toBeCloseTo(verified.walk.light, 12);
    expect(walkMinutes(WALK.metres, WALK.slowSpeed)).toBeCloseTo(verified.walk.slow, 12);
  });
});

describe("§3 commute", () => {
  it("mean, maximum and the sunny-day maximum", () => {
    expect(mean(COMMUTE_DAYS)).toBe(verified.commute.mean);
    expect(COMMUTE_DAYS.reduce((s, x) => s + x, 0)).toBe(verified.commute.sum);
    expect(latestSafeDeparture(COMMUTE_DAYS, CLASS_MINUTE)).toBe(CLASS_MINUTE - verified.commute.max);
    const sunny = COMMUTE_DAYS.filter((_, i) => !RAIN_DAYS.includes(i + 1));
    expect(latestSafeDeparture(sunny, CLASS_MINUTE)).toBe(CLASS_MINUTE - verified.commute.sunnyMax);
  });

  it("counts on-time days for every departure on the slider", () => {
    for (const d of verified.commute.departures) {
      const r = commuteCheck(COMMUTE_DAYS, d.depart, CLASS_MINUTE);
      expect(r.onTime).toBe(d.onTime);
      expect(r.late).toEqual(d.late);
    }
  });

  it("formats clock times", () => {
    expect(clock(48)).toBe("7:48");
    expect(clock(60)).toBe("8:00");
    expect(clock(45)).toBe("7:45");
    expect(clock(63)).toBe("8:03");
  });
});

describe("§7 umbrellas", () => {
  it("starts from 20 people without an umbrella and is solved by moving 20 from B to A", () => {
    const now = plan(UMBRELLA, 0);
    expect(now).toMatchObject({ a: 20, b: 40, shortA: 20, shortB: 0, shortage: 20, servedA: 20, servedB: 20 });
    expect(plan(UMBRELLA, 20)).toMatchObject({ a: 40, b: 20, shortage: 0, servedA: 40, servedB: 20 });
    // Equal split: 30 / 30 still leaves 10 people at A without an umbrella.
    expect(plan(UMBRELLA, 10)).toMatchObject({ a: 30, b: 30, shortA: 10, shortB: 0, shortage: 10 });
  });

  it("the whole shortage curve equals the reference", () => {
    expect(optimum(UMBRELLA).curve).toEqual(verified.umbrella.curve);
  });

  it("the default optimum is unique", () => {
    expect(optimum(UMBRELLA)).toMatchObject({ shortage: 0, low: 20, high: 20, fewestMoves: 20 });
  });

  it("every scenario and every grid point agrees with scipy's linear program", () => {
    for (const ref of [...verified.umbrella.scenarios, ...verified.umbrella.grid]) {
      const c = withDemand(ref.demand[0], ref.demand[1]);
      const o = optimum(c);
      expect([o.shortage, o.low, o.high]).toEqual([ref.minShortage, ref.low, ref.high]);
      expect(o.shortage).toBe(minShortageClosedForm(c));
      expect(o.low <= o.fewestMoves && o.fewestMoves <= o.high).toBe(true);
    }
    expect(verified.umbrella.grid.length).toBe(15 * 15);
  });

  it("chooses the plan that moves the fewest umbrellas when several are optimal", () => {
    expect(optimum(withDemand(50, 20))).toMatchObject({ shortage: 10, low: 20, high: 30, fewestMoves: 20 });
    expect(optimum(withDemand(30, 15))).toMatchObject({ shortage: 0, low: 10, high: 25, fewestMoves: 10 });
    // Not moving anything is best when the stock already covers both points.
    expect(optimum(withDemand(10, 30))).toMatchObject({ shortage: 0, fewestMoves: 0 });
    // A to B (negative transfer) when B needs more.
    expect(optimum(withDemand(5, 50))).toMatchObject({ shortage: 0, low: -15, high: -10, fewestMoves: -10 });
  });

  it("only allows transfers of umbrellas that exist, one at a time", () => {
    expect(transferRange(UMBRELLA)).toEqual({ min: -20, max: 40 });
    expect(transferProblem(UMBRELLA, 20)).toBeNull();
    expect(transferProblem(UMBRELLA, 40)).toBeNull();
    expect(transferProblem(UMBRELLA, -20)).toBeNull();
    expect(transferProblem(UMBRELLA, 41)).toMatch(/最多只能调 40 把到 A 点/);
    expect(transferProblem(UMBRELLA, -21)).toMatch(/最多只能调 20 把到 B 点/);
    expect(transferProblem(UMBRELLA, 2.5)).toMatch(/整数/);
    expect(transferProblem(UMBRELLA, Number.NaN)).toMatch(/数字/);
  });
});
