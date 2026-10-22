export type Point = [number, number];
export type Parameters = { a: number; b: number; b1: number; b2: number };
export const defaults: Parameters = { a: 40, b: 50, b1: 100, b2: 80 };
const EPS = 1e-8;

// Deliberately bounded teaching model: max ax+by, 2x+y<=b1, x+2y<=b2, x,y>=0.
// Nonnegative capacities ensure feasibility; positive resource coefficients bound it.
export function solve(p: Parameters, integer = false) {
  if (
    Object.values(p).some((v) => !Number.isFinite(v) || v < 0) ||
    p.a > 80 ||
    p.b > 80 ||
    p.b1 > 120 ||
    p.b2 > 120
  ) {
    throw new Error("教学参数范围：利润 0–80，资源 0–120。");
  }
  const feasible = ([x, y]: Point) =>
    x >= -EPS &&
    y >= -EPS &&
    2 * x + y <= p.b1 + EPS &&
    x + 2 * y <= p.b2 + EPS;
  const candidates: Point[] = [
    [0, 0],
    [p.b1 / 2, 0],
    [p.b2, 0],
    [0, p.b1],
    [0, p.b2 / 2],
    [(2 * p.b1 - p.b2) / 3, (2 * p.b2 - p.b1) / 3],
  ];
  const vertices = candidates
    .filter(feasible)
    .filter(
      (v, i, arr) =>
        arr.findIndex(
          (w) => Math.abs(v[0] - w[0]) < EPS && Math.abs(v[1] - w[1]) < EPS,
        ) === i,
    );
  const cx = vertices.reduce((s, v) => s + v[0], 0) / vertices.length;
  const cy = vertices.reduce((s, v) => s + v[1], 0) / vertices.length;
  vertices.sort(
    (u, v) =>
      Math.atan2(u[1] - cy, u[0] - cx) - Math.atan2(v[1] - cy, v[0] - cx),
  );
  let points = vertices;
  if (integer) {
    points = [];
    for (let x = 0; x <= Math.floor(Math.min(p.b1 / 2, p.b2)); x++) {
      for (
        let y = 0;
        y <= Math.floor(Math.min(p.b1 - 2 * x, (p.b2 - x) / 2) + EPS);
        y++
      )
        points.push([x, y]);
    }
  }
  const value = Math.max(...points.map(([x, y]) => p.a * x + p.b * y));
  return {
    vertices,
    value,
    optima: points.filter(
      ([x, y]) => Math.abs(p.a * x + p.b * y - value) <= EPS,
    ),
  };
}
