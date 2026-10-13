import { describe, expect, it } from "vitest";
import { defaults, solve } from "../solver";
import fixture from "./lp2d-verified.json";
import { clippedRegion, isFeasible, solveLab, usage, vertices, type Model } from "./lp2d";

type Sample = (typeof fixture)[number];
const asModel = (s: Sample) => s.model as unknown as Model;
const workshop = (a: number, b: number, b1: number, b2: number): Model => ({
  c: [a, b],
  constraints: [
    { id: "cut", label: "切割", a: 2, b: 1, rhs: b1, sense: "<=" },
    { id: "assemble", label: "装配", a: 1, b: 2, rhs: b2, sense: "<=" },
  ],
});
const sameSet = (p: number[][], q: number[][]) =>
  p.length === q.length && p.every((u) => q.some((v) => Math.abs(u[0] - v[0]) < 1e-7 && Math.abs(u[1] - v[1]) < 1e-7));

describe("lab LP against SciPy HiGHS (lp2d-verified.json)", () => {
  it.each(fixture.map((s, i) => [i, s] as const))("model #%i: status, value and uniqueness", (_, s) => {
    const r = solveLab(asModel(s));
    expect(r.status).toBe(s.status);
    if (r.status === "optimal") {
      expect(r.value).toBeCloseTo((s as { value: number }).value, 6);
      expect(r.unique).toBe((s as { unique: boolean }).unique);
      for (const p of r.optima) expect(isFeasible(asModel(s), p)).toBe(true);
    }
    for (const v of r.vertices) expect(isFeasible(asModel(s), v)).toBe(true);
  });
});

describe("agrees with the verified teaching solver on its whole domain", () => {
  const grid = [0, 15, 40, 50, 80];
  const caps = [0, 9, 40, 80, 100, 120];
  const cases = grid.flatMap((a) => grid.flatMap((b) => caps.flatMap((b1) => caps.map((b2) => [a, b, b1, b2] as const))));
  it.each(cases)("a=%d b=%d b1=%d b2=%d", (a, b, b1, b2) => {
    const verified = solve({ a, b, b1, b2 });
    const lab = solveLab(workshop(a, b, b1, b2));
    expect(lab.status).toBe("optimal");
    if (lab.status !== "optimal") return;
    expect(lab.value).toBeCloseTo(verified.value, 9);
    expect(sameSet(lab.optima, verified.optima)).toBe(true);
    expect(sameSet(lab.vertices, verified.vertices)).toBe(true);
  });
});

describe("the four situations the lab explains", () => {
  it("textbook case: unique optimum (40, 20), both resources used up", () => {
    const m = workshop(defaults.a, defaults.b, defaults.b1, defaults.b2);
    const r = solveLab(m);
    expect(r).toMatchObject({ status: "optimal", value: 2600, optima: [[40, 20]], unique: true, optimalRay: null });
    expect(usage(m, [40, 20]).map((u) => u.binding)).toEqual([true, true]);
  });

  it("objective parallel to an edge: two optimal corners, every point between them optimal", () => {
    const r = solveLab(workshop(25, 50, 100, 80));
    expect(r.status).toBe("optimal");
    if (r.status !== "optimal") return;
    expect(r.unique).toBe(false);
    expect(sameSet(r.optima, [[40, 20], [0, 40]])).toBe(true);
    expect(r.value).toBe(2000);
  });

  it("order larger than the resources allow: infeasible, never a made-up point", () => {
    const m = workshop(40, 50, 100, 80);
    m.constraints.push({ id: "order", label: "订单", a: 1, b: 1, rhs: 70, sense: ">=" });
    expect(solveLab(m)).toEqual({ status: "infeasible", vertices: [], rays: [] });
    m.constraints[2].rhs = 60; // exactly the largest total output: only (40, 20)
    const r = solveLab(m);
    expect(r).toMatchObject({ status: "optimal", optima: [[40, 20]], unique: true });
  });

  it("product B uses no resource: unbounded upward; with zero B profit, a ray of optima instead", () => {
    const m: Model = {
      c: [40, 50],
      constraints: [
        { id: "cut", label: "切割", a: 2, b: 0, rhs: 100, sense: "<=" },
        { id: "assemble", label: "装配", a: 1, b: 0, rhs: 80, sense: "<=" },
      ],
    };
    const r = solveLab(m);
    expect(r.status).toBe("unbounded");
    if (r.status === "unbounded") expect(r.direction).toEqual([0, 1]);
    const flat = solveLab({ ...m, c: [40, 0] });
    expect(flat).toMatchObject({ status: "optimal", value: 2000, unique: false, optimalRay: [0, 1] });
    // Drawing stays a closed polygon inside the plot box.
    expect(clippedRegion(m, 150, 150).length).toBeGreaterThanOrEqual(4);
  });

  it("zero profits: every feasible point is optimal (value 0), a single point region is unique", () => {
    expect(solveLab(workshop(0, 0, 100, 80))).toMatchObject({ status: "optimal", value: 0, unique: false });
    expect(solveLab(workshop(0, 0, 0, 0))).toMatchObject({ status: "optimal", value: 0, unique: true, optima: [[0, 0]] });
    expect(vertices(workshop(0, 0, 0, 0))).toEqual([[0, 0]]);
  });
});
