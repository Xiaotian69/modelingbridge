import type { Point } from './solver';

/** Intersect ax+by=value with the plot square, deduplicating shared corners. */
export function objectiveSegment(a: number, b: number, value: number): Point[] {
  const points: Point[] = [];
  if (b > 0) for (const x of [0,120]) {
    const y = (value-a*x)/b;
    if(y>=0&&y<=120) points.push([x,y]);
  }
  if (a > 0) for (const y of [0,120]) {
    const x = (value-b*y)/a;
    if(x>=0&&x<=120) points.push([x,y]);
  }
  return points.filter((p,i)=>points.findIndex(q=>Math.abs(p[0]-q[0])<1e-8&&Math.abs(p[1]-q[1])<1e-8)===i);
}
