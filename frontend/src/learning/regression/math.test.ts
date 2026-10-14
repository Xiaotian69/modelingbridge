import { describe, expect, it } from "vitest";
import fixture from "./regression-verified.json";
import { COLD_DAY, EVENT_DAY, HAND_X, HAND_Y, SALES, TEMPERATURE, TOMORROW, WEEKEND } from "./data";
import {
  mean,
  multipleRegression,
  predict,
  predictionInterval,
  simpleRegression,
  solve,
  sseOf,
  studentTCdf,
  tQuantile,
  twoSidedP,
} from "./math";

const close = (a: number[], b: number[], digits = 8) => {
  expect(a).toHaveLength(b.length);
  a.forEach((x, i) => expect(x).toBeCloseTo(b[i], digits));
};

describe("lesson inputs equal the Python script's inputs", () => {
  it("data, tomorrow, cold day, event day and the hand example", () => {
    expect(TEMPERATURE).toEqual(fixture.inputs.temperature);
    expect(WEEKEND).toEqual(fixture.inputs.weekend);
    expect(SALES).toEqual(fixture.inputs.sales);
    expect(TOMORROW).toEqual(fixture.inputs.tomorrow);
    expect(COLD_DAY).toBe(fixture.inputs.coldDay);
    expect(EVENT_DAY).toEqual(fixture.inputs.eventDay);
    expect(HAND_X).toEqual(fixture.inputs.handX);
    expect(HAND_Y).toEqual(fixture.inputs.handY);
  });
});

describe("lesson fits match scipy / statsmodels", () => {
  it("simple regression (scipy.stats.linregress)", () => {
    const s = simpleRegression(TEMPERATURE, SALES);
    expect(s.intercept).toBeCloseTo(fixture.simple.intercept, 9);
    expect(s.slope).toBeCloseTo(fixture.simple.slope, 9);
    expect(s.r).toBeCloseTo(fixture.simple.r, 10);
    expect(s.r2).toBeCloseTo(fixture.simple.r2, 10);
    expect(s.sse).toBeCloseTo(fixture.simple.sse, 7);
    expect(s.sst).toBeCloseTo(fixture.simple.sst, 7);
    close(s.residuals, fixture.simple.residuals);
    expect(mean(TEMPERATURE)).toBeCloseTo(fixture.means.temperature, 12);
    expect(mean(SALES)).toBeCloseTo(fixture.means.sales, 12);
  });

  it("the same line from the normal equations, with statsmodels' standard error and p-value", () => {
    const m = multipleRegression([TEMPERATURE], SALES);
    close(m.coefficients, fixture.simpleOls.coefficients, 9);
    expect(m.standardErrors[1]).toBeCloseTo(fixture.simple.slopeStdErr, 9);
    expect(twoSidedP(m.tStats[1], m.n - 2)).toBeCloseTo(fixture.simple.slopeP, 10);
  });

  it("multiple regression (statsmodels OLS)", () => {
    const m = multipleRegression([TEMPERATURE, WEEKEND], SALES);
    close(m.coefficients, fixture.multiple.coefficients, 9);
    close(m.standardErrors, fixture.multiple.standardErrors, 9);
    close(m.tStats, fixture.multiple.tStats, 8);
    m.tStats.forEach((t, j) => expect(twoSidedP(t, m.n - 3)).toBeCloseTo(fixture.multiple.pValues[j], 10));
    expect(m.r2).toBeCloseTo(fixture.multiple.r2, 10);
    expect(m.adjustedR2).toBeCloseTo(fixture.multiple.adjustedR2, 10);
    expect(m.sigma2).toBeCloseTo(fixture.multiple.sigma2, 8);
    close(m.residuals, fixture.multiple.residuals);
  });

  it("the event day, predictions and the 95 % prediction interval", () => {
    const e = simpleRegression([...TEMPERATURE, EVENT_DAY.temperature], [...SALES, EVENT_DAY.sales]);
    expect(e.slope).toBeCloseTo(fixture.withEvent.slope, 9);
    expect(e.r2).toBeCloseTo(fixture.withEvent.r2, 10);
    const m = multipleRegression([TEMPERATURE, WEEKEND], SALES);
    expect(predict(m.coefficients, [TOMORROW.temperature, TOMORROW.weekend])).toBeCloseTo(fixture.predictions.tomorrowMultiple, 8);
    expect(predict(m.coefficients, [COLD_DAY, 0])).toBeCloseTo(fixture.predictions.coldWeekday, 8);
    const pi = predictionInterval([TEMPERATURE, WEEKEND], SALES, [TOMORROW.temperature, TOMORROW.weekend]);
    expect(pi.lower).toBeCloseTo(fixture.tomorrowInterval[0], 6);
    expect(pi.upper).toBeCloseTo(fixture.tomorrowInterval[1], 6);
  });

  it("the hand example: b1 = 0.6, b0 = 2.2, R² = 0.6", () => {
    const h = simpleRegression(HAND_X, HAND_Y);
    expect(h.slope).toBeCloseTo(fixture.hand.slope, 12);
    expect(h.intercept).toBeCloseTo(fixture.hand.intercept, 12);
    expect(h.r2).toBeCloseTo(fixture.hand.r2, 12);
    expect(h.sse).toBeCloseTo(2.4, 12);
    expect(h.sst).toBeCloseTo(6, 12);
  });
});

describe("150 random problems match statsmodels and scipy", () => {
  it.each(fixture.random.map((s, k) => [k, s] as const))("problem %i", (_, s) => {
    const m = multipleRegression(s.columns, s.y);
    close(m.coefficients, s.multiple.coefficients, 7);
    close(m.standardErrors, s.multiple.standardErrors, 7);
    expect(m.r2).toBeCloseTo(s.multiple.r2, 9);
    expect(m.adjustedR2).toBeCloseTo(s.multiple.adjustedR2, 9);
    const one = simpleRegression(s.columns[0], s.y);
    expect(one.slope).toBeCloseTo(s.simple.slope, 8);
    expect(one.intercept).toBeCloseTo(s.simple.intercept, 7);
    expect(one.r).toBeCloseTo(s.simple.r, 10);
  });
});

describe("Student t distribution matches scipy.stats.t", () => {
  it.each(fixture.tDistribution.map((s, k) => [k, s] as const))("spot check %i", (_, s) => {
    expect(studentTCdf(s.t, s.df)).toBeCloseTo(s.cdf, 10);
    expect(tQuantile(0.975, s.df)).toBeCloseTo(s.q975, 8);
    expect(tQuantile(s.p, s.df)).toBeCloseTo(s.q, 8);
  });
});

describe("properties the lesson states", () => {
  const s = simpleRegression(TEMPERATURE, SALES);
  it("the least squares line passes through (x̄, ȳ) and residuals sum to 0", () => {
    expect(s.intercept + s.slope * s.xBar).toBeCloseTo(s.yBar, 10);
    expect(s.residuals.reduce((a, b) => a + b, 0)).toBeCloseTo(0, 9);
  });

  it("SST = SSR + SSE and R² = r² in simple regression", () => {
    expect(s.ssr + s.sse).toBeCloseTo(s.sst, 9);
    expect(s.r2).toBeCloseTo(s.r * s.r, 12);
  });

  it("no other line has a smaller sum of squared residuals", () => {
    for (const db0 of [-5, -0.5, 0.5, 5])
      for (const db1 of [-0.2, -0.01, 0.01, 0.2]) expect(sseOf(TEMPERATURE, SALES, s.intercept + db0, s.slope + db1)).toBeGreaterThan(s.sse);
  });

  it("adding a predictor never lowers R², but adjusted R² can fall", () => {
    const noise = TEMPERATURE.map((_, i) => ((i * 7) % 5) - 2);
    const base = multipleRegression([TEMPERATURE, WEEKEND], SALES);
    const more = multipleRegression([TEMPERATURE, WEEKEND, noise], SALES);
    expect(more.r2).toBeGreaterThanOrEqual(base.r2 - 1e-12);
    expect(more.adjustedR2).toBeLessThan(base.adjustedR2);
  });

  it("rejects data it cannot fit", () => {
    expect(() => simpleRegression([1, 1, 1], [1, 2, 3])).toThrow(RangeError);
    expect(() => simpleRegression([1, 2], [1, 2])).toThrow(RangeError);
    expect(() => multipleRegression([TEMPERATURE, TEMPERATURE.map((t) => 2 * t)], SALES)).toThrow(RangeError);
    expect(() => multipleRegression([[1, 2]], [1, 2])).toThrow(RangeError);
    expect(() => solve([[0, 0], [0, 0]], [1, 1])).toThrow(RangeError);
    expect(() => tQuantile(1, 5)).toThrow(RangeError);
  });
});
