import { describe, expect, it } from "vitest";
import fixture from "./ahp-verified.json";
import {
  ALTERNATIVES,
  CIRCULAR_UPPER,
  CONSISTENT_UPPER,
  CRITERIA4_UPPER,
  CRITERIA_UPPER,
  LOCAL_UPPER,
} from "./data";
import {
  RANDOM_INDEX,
  analyse,
  columnNormalisedWeights,
  consistency,
  formatJudgment,
  fromUpperTriangle,
  geometricMeanWeights,
  isReciprocal,
  mostInconsistentPair,
  nearestScaleValue,
  positionToValue,
  principalEigen,
  synthesise,
  valueToPosition,
  overallCR,
} from "./math";

const close = (a: number[], b: number[], digits = 9) => a.forEach((v, i) => expect(v).toBeCloseTo(b[i], digits));
const lesson = fixture.lesson as Record<string, (typeof fixture.random)[number]>;

describe("AHP scale", () => {
  it("maps slider positions to the 1–9 scale and back", () => {
    expect(positionToValue(0)).toBe(1);
    expect(positionToValue(2)).toBe(3);
    expect(positionToValue(8)).toBe(9);
    expect(positionToValue(-2)).toBeCloseTo(1 / 3, 12);
    expect(positionToValue(-8)).toBeCloseTo(1 / 9, 12);
    for (let p = -8; p <= 8; p++) expect(valueToPosition(positionToValue(p))).toBe(p);
    expect(() => positionToValue(9)).toThrow();
    expect(formatJudgment(1 / 3)).toBe("1/3");
    expect(formatJudgment(5)).toBe("5");
    expect(nearestScaleValue(2.9)).toBe(3);
    expect(nearestScaleValue(0.21)).toBeCloseTo(1 / 5, 12);
  });

  it("builds positive reciprocal matrices only", () => {
    const a = fromUpperTriangle(3, CRITERIA_UPPER);
    expect(isReciprocal(a)).toBe(true);
    expect(a[1][0]).toBeCloseTo(3, 12);
    expect(() => fromUpperTriangle(3, [1, 2])).toThrow();
    expect(() => fromUpperTriangle(3, [1, -2, 3])).toThrow();
    expect(() => analyse([[1, 2], [3, 1]])).toThrow();
  });
});

describe("independent verification against numpy.linalg.eig (ahp-verified.json)", () => {
  it("uses exactly the matrices of data.ts", () => {
    expect(lesson.criteria.upper).toEqual(CRITERIA_UPPER);
    expect(lesson.criteria4.upper).toEqual(CRITERIA4_UPPER);
    for (const c of ["C1", "C2", "C3", "C4"]) expect(lesson[c].upper).toEqual(LOCAL_UPPER[c]);
    expect(lesson.consistent.upper).toEqual(CONSISTENT_UPPER);
    expect(lesson.circular.upper).toEqual(CIRCULAR_UPPER);
  });

  it.each(Object.entries(lesson))("lesson matrix %s: weights, λmax, CI, CR, hand methods", (_, ref) => {
    const r = analyse(fromUpperTriangle(ref.n, ref.upper));
    close(r.weights, ref.weights, 9);
    expect(r.lambdaMax).toBeCloseTo(ref.lambdaMax, 9);
    expect(r.ci).toBeCloseTo(ref.ci, 9);
    if (ref.cr === null) expect(r.cr).toBeNull();
    else expect(r.cr!).toBeCloseTo(ref.cr, 9);
    close(r.geometric, ref.geometric, 12);
    close(r.columnNormalised, ref.columnNormalised, 12);
  });

  it.each(fixture.random.map((s, i) => [i, s] as const))("random reciprocal matrix #%i", (_, ref) => {
    const a = fromUpperTriangle(ref.n, ref.upper);
    const eigen = principalEigen(a);
    expect(eigen.converged).toBe(true);
    close(eigen.weights, ref.weights, 8);
    expect(eigen.lambdaMax).toBeCloseTo(ref.lambdaMax, 8);
    const c = consistency(a, eigen.lambdaMax);
    expect(c.ci).toBeCloseTo(ref.ci, 8);
    expect(c.cr!).toBeCloseTo(ref.cr!, 8);
    // Eigen-pair residual and λmax ≥ n (Perron–Frobenius, reciprocal matrices).
    const aw = a.map((row) => row.reduce((s, v, j) => s + v * eigen.weights[j], 0));
    aw.forEach((v, i) => expect(Math.abs(v - eigen.lambdaMax * eigen.weights[i])).toBeLessThan(1e-9));
    expect(eigen.lambdaMax).toBeGreaterThanOrEqual(ref.n - 1e-9);
  });

  it("synthesises the global ranking and the overall CR", () => {
    const crit = analyse(fromUpperTriangle(3, CRITERIA_UPPER));
    const layer = ["C1", "C2", "C3"].map((c) => analyse(fromUpperTriangle(3, LOCAL_UPPER[c])));
    const global = synthesise(crit.weights, layer.map((l) => l.weights));
    close(global, fixture.global3, 9);
    expect(overallCR(crit.weights, layer)!).toBeCloseTo(fixture.overallCR3, 9);
    // The lesson's conclusion: B (研究所) first, even though A pays best.
    const order = [...global.keys()].sort((x, y) => global[y] - global[x]).map((i) => ALTERNATIVES[i].id);
    expect(order).toEqual(["B", "A", "C"]);

    const crit4 = analyse(fromUpperTriangle(4, CRITERIA4_UPPER));
    const layer4 = ["C1", "C2", "C3", "C4"].map((c) => analyse(fromUpperTriangle(3, LOCAL_UPPER[c])).weights);
    close(synthesise(crit4.weights, layer4), fixture.global4, 9);
  });
});

describe("teaching facts used in the lesson", () => {
  it("a consistent matrix has λmax = n, CI = 0 and all three methods agree", () => {
    const r = analyse(fromUpperTriangle(3, CONSISTENT_UPPER));
    expect(r.lambdaMax).toBeCloseTo(3, 12);
    expect(r.ci).toBeCloseTo(0, 12);
    close(r.weights, [4 / 7, 2 / 7, 1 / 7], 12);
    close(r.geometric, r.weights, 12);
    close(r.columnNormalised, r.weights, 12);
  });

  it("for n = 3 the geometric mean equals the eigenvector; for n = 4 it need not", () => {
    for (const ref of fixture.random.filter((s) => s.n === 3)) {
      const a = fromUpperTriangle(3, ref.upper);
      close(geometricMeanWeights(a), principalEigen(a).weights, 9);
    }
    const four = analyse(fromUpperTriangle(4, CRITERIA4_UPPER));
    expect(Math.abs(four.geometric[0] - four.weights[0])).toBeGreaterThan(1e-5);
  });

  it("circular judgments fail the check and the conflicting pair is found", () => {
    const a = fromUpperTriangle(3, CIRCULAR_UPPER);
    const r = analyse(a);
    expect(r.cr!).toBeGreaterThan(1);
    expect(r.acceptable).toBe(false);
    const course = analyse(fromUpperTriangle(3, CRITERIA_UPPER));
    expect(course.acceptable).toBe(true);
    // Course matrix: C2:C3 = 5 while C1/C3 · C2/C1 implies 6 → that pair is flagged.
    const pair = mostInconsistentPair(fromUpperTriangle(3, CRITERIA_UPPER), course.weights);
    expect([pair.i, pair.j]).not.toEqual([0, 0]);
    expect(columnNormalisedWeights(a).reduce((s, v) => s + v, 0)).toBeCloseTo(1, 12);
  });

  it("for 3 × 3 matrices every pair deviates equally, so no single pair is “most” inconsistent", () => {
    for (const upper of [CIRCULAR_UPPER, CRITERIA_UPPER, [9, 2, 5], [1 / 7, 3, 1 / 2]]) {
      const a = fromUpperTriangle(3, upper);
      const w = analyse(a).weights;
      const devs = [[0, 1], [0, 2], [1, 2]].map(([i, j]) => Math.abs(Math.log((a[i][j] * w[j]) / w[i])));
      const closed = Math.abs(Math.log(upper[0]) - Math.log(upper[1]) + Math.log(upper[2])) / 3;
      for (const d of devs) expect(d).toBeCloseTo(closed, 9);
    }
  });

  it("uses Saaty's RI table and treats n ≤ 2 as always consistent", () => {
    expect(RANDOM_INDEX[3]).toBe(0.58);
    expect(RANDOM_INDEX[4]).toBe(0.9);
    const two = consistency(fromUpperTriangle(2, [7]));
    expect(two.cr).toBeNull();
    expect(two.acceptable).toBe(true);
  });
});
