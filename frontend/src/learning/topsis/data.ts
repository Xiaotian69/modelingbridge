/**
 * The lesson's evaluation problem (original teaching example, not real listings):
 * after choosing the research institute in the AHP lesson, 小林 compares five rooms near it.
 * verify_topsis.py holds the same numbers; a test keeps them equal.
 */
import type { Direction, Matrix } from "./math";

export type Criterion = { id: string; name: string; unit: string; direction: Direction; note: string };

export const CRITERIA: Criterion[] = [
  { id: "rent", name: "月租", unit: "元/月", direction: "cost", note: "越低越好" },
  { id: "commute", name: "通勤", unit: "分钟", direction: "cost", note: "单程到研究所，越短越好" },
  { id: "area", name: "面积", unit: "m²", direction: "benefit", note: "越大越好" },
  { id: "amenities", name: "配套", unit: "处", direction: "benefit", note: "步行 10 分钟内的生活设施，越多越好" },
];
export const DIRECTIONS: Direction[] = CRITERIA.map((c) => c.direction);

export const ROOMS = [
  { id: "jia", name: "甲" },
  { id: "yi", name: "乙" },
  { id: "bing", name: "丙" },
  { id: "ding", name: "丁" },
  { id: "wu", name: "戊" },
] as const;

/** Rows = rooms 甲…戊, columns = 月租, 通勤, 面积, 配套. */
export const DATA: Matrix = [
  [1800, 45, 22, 6],
  [2400, 20, 18, 9],
  [1500, 60, 25, 4],
  [2100, 30, 30, 7],
  [2800, 15, 35, 10],
];

/** A sixth listing that appears later (§8, lab): never the winner, yet it changes the winner. */
export const EXTRA_ROOM = { id: "ji", name: "己" } as const;
export const EXTRA_ROW = [2800, 10, 35, 1];

/**
 * 小林's AHP judgments on the four criteria, upper triangle (a12, a13, a14, a23, a24, a34):
 * 月租 is 2× 通勤, 3× 面积, 4× 配套; 通勤 is 2× 面积 and 2× 配套; 面积 ≈ 配套.
 */
export const AHP_UPPER = [2, 3, 4, 2, 2, 1];

/** Small hand-calculation example (§3): one column whose norm is exactly 13. */
export const HAND_COLUMN = [3, 4, 12];
