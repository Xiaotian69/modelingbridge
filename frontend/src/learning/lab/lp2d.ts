/**
 * Two-variable LP for the interactive lab (linear programming lesson).
 *
 *   max  c1·x + c2·y   s.t.  aᵢ·x + bᵢ·y (≤ | ≥) rhsᵢ,   x ≥ 0, y ≥ 0
 *
 * Separate from the verified teaching solver (solver.ts), which only covers the fixed
 * workshop model and therefore can never be infeasible or unbounded. Method:
 * - Vertices: every intersection of two boundary lines (constraints and axes) that satisfies
 *   all constraints. The region lies in the first quadrant, so it contains no line; a
 *   non-empty region of that kind always has a vertex. No feasible vertex ⇒ infeasible.
 * - Directions of unboundedness (recession cone): d ≥ 0 with aᵢ·d ≤ 0 (≤ rows) / ≥ 0 (≥ rows).
 *   In 2-D its extreme rays lie on the axes or on a constraint boundary, so checking those
 *   candidate directions is complete. The objective is unbounded iff some ray has c·d > 0.
 * - Otherwise the maximum is attained at a vertex; every vertex with that value is optimal,
 *   and a ray with c·d = 0 makes the optimal set unbounded (a ray / strip of optima).
 * Verified against SciPy HiGHS in lp2d-verified.json (verify_lp2d.py) and against solver.ts.
 */
export type Point = [number, number];
export type Sense = "<=" | ">=";
export type Constraint = { id: string; label: string; a: number; b: number; rhs: number; sense: Sense };
export type Model = { c: Point; constraints: Constraint[] };

export type LabResult =
  | { status: "infeasible"; vertices: []; rays: [] }
  | { status: "unbounded"; vertices: Point[]; rays: Point[]; direction: Point }
  | {
      status: "optimal";
      vertices: Point[];
      rays: Point[];
      value: number;
      /** Optimal vertices (one = unique corner, two = a whole edge is optimal, …). */
      optima: Point[];
      /** A direction along which the optimal set extends forever (c·d = 0), if any. */
      optimalRay: Point | null;
      /** True when every point of the optimum set coincides (exactly one optimal point). */
      unique: boolean;
    };

const EPS = 1e-9;
const tol = (scale: number) => EPS * (1 + Math.abs(scale));

type Row = { a: number; b: number; rhs: number; sense: Sense };
const rowsOf = (m: Model): Row[] => [
  ...m.constraints,
  { a: 1, b: 0, rhs: 0, sense: ">=" },
  { a: 0, b: 1, rhs: 0, sense: ">=" },
];

const satisfies = (r: Row, [x, y]: Point) => {
  const lhs = r.a * x + r.b * y;
  return r.sense === "<=" ? lhs <= r.rhs + tol(r.rhs) : lhs >= r.rhs - tol(r.rhs);
};
export const isFeasible = (m: Model, p: Point) => rowsOf(m).every((r) => satisfies(r, p));

const same = (p: Point, q: Point) => Math.abs(p[0] - q[0]) <= 1e-7 * (1 + Math.abs(p[0])) && Math.abs(p[1] - q[1]) <= 1e-7 * (1 + Math.abs(p[1]));
const unique = (points: Point[]) => points.filter((p, i) => points.findIndex((q) => same(p, q)) === i);

/** Corners of the feasible region, in counter-clockwise order. */
export function vertices(m: Model): Point[] {
  const rows = rowsOf(m);
  const found: Point[] = [];
  for (let i = 0; i < rows.length; i++)
    for (let j = i + 1; j < rows.length; j++) {
      const r = rows[i];
      const s = rows[j];
      const det = r.a * s.b - s.a * r.b;
      if (Math.abs(det) < 1e-12) continue;
      const x = (r.rhs * s.b - s.rhs * r.b) / det;
      const y = (r.a * s.rhs - s.a * r.rhs) / det;
      const p: Point = [Math.abs(x) < 1e-12 ? 0 : x, Math.abs(y) < 1e-12 ? 0 : y];
      if (rows.every((row) => satisfies(row, p))) found.push(p);
    }
  return sortAround(unique(found));
}

function sortAround(points: Point[]): Point[] {
  if (points.length < 3) return points;
  const cx = points.reduce((s, p) => s + p[0], 0) / points.length;
  const cy = points.reduce((s, p) => s + p[1], 0) / points.length;
  return [...points].sort((u, v) => Math.atan2(u[1] - cy, u[0] - cx) - Math.atan2(v[1] - cy, v[0] - cx));
}

/** Extreme rays of the recession cone (unit vectors, each with x, y ≥ 0). */
export function recessionRays(m: Model): Point[] {
  const candidates: Point[] = [
    [1, 0],
    [0, 1],
  ];
  for (const r of m.constraints) {
    if (r.a === 0 && r.b === 0) continue;
    for (const d of [
      [r.b, -r.a],
      [-r.b, r.a],
    ] as Point[])
      if (d[0] >= -1e-12 && d[1] >= -1e-12) {
        const n = Math.hypot(d[0], d[1]);
        candidates.push([Math.max(0, d[0] / n), Math.max(0, d[1] / n)]);
      }
  }
  const inCone = (d: Point) =>
    m.constraints.every((r) => {
      const v = r.a * d[0] + r.b * d[1];
      return r.sense === "<=" ? v <= 1e-12 : v >= -1e-12;
    });
  return unique(candidates.filter(inCone));
}

export function solveLab(m: Model): LabResult {
  const vs = vertices(m);
  if (!vs.length) return { status: "infeasible", vertices: [], rays: [] };
  const rays = recessionRays(m);
  const dot = (p: Point) => m.c[0] * p[0] + m.c[1] * p[1];
  const growing = rays.find((d) => dot(d) > 1e-12);
  if (growing) return { status: "unbounded", vertices: vs, rays, direction: growing };
  const value = Math.max(...vs.map(dot));
  const optima = vs.filter((v) => Math.abs(dot(v) - value) <= tol(value));
  const flat = rays.find((d) => Math.abs(dot(d)) <= 1e-12) ?? null;
  return {
    status: "optimal",
    vertices: vs,
    rays,
    value: Math.abs(value) < 1e-12 ? 0 : value,
    optima,
    optimalRay: flat,
    unique: optima.length === 1 && !flat,
  };
}

/** Value of each constraint at a point: used amount, and what is left (slack / surplus). */
export function usage(m: Model, p: Point) {
  return m.constraints.map((r) => {
    const used = r.a * p[0] + r.b * p[1];
    const left = r.sense === "<=" ? r.rhs - used : used - r.rhs;
    return { id: r.id, used, left: Math.abs(left) < 1e-9 ? 0 : left, binding: Math.abs(left) <= tol(r.rhs) };
  });
}

/** Region ∩ [0, w] × [0, h], for drawing (closed polygon even when the region is unbounded). */
export function clippedRegion(m: Model, w: number, h: number): Point[] {
  return vertices({
    ...m,
    constraints: [
      ...m.constraints,
      { id: "box-x", label: "", a: 1, b: 0, rhs: w, sense: "<=" },
      { id: "box-y", label: "", a: 0, b: 1, rhs: h, sense: "<=" },
    ],
  });
}
