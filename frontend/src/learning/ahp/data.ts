/**
 * The lesson's decision problem (original teaching example, not real company data):
 * a third-year student compares three summer internship offers.
 * Matrices are written as upper triangles (a12, a13, …, a23, …) and expanded with
 * fromUpperTriangle(). verify_ahp.py holds the same numbers; a test keeps them equal.
 */
import { fromUpperTriangle, type Matrix } from "./math";

export const ALTERNATIVES = [
  { id: "A", name: "互联网公司", short: "A 互联网公司" },
  { id: "B", name: "研究所", short: "B 研究所" },
  { id: "C", name: "本地制造企业", short: "C 本地企业" },
] as const;

export type Criterion = { id: string; name: string; note: string };

export const CRITERIA: Criterion[] = [
  { id: "C1", name: "薪资待遇", note: "实习工资与补贴" },
  { id: "C2", name: "成长空间", note: "能学到的建模与工程能力" },
  { id: "C3", name: "通勤生活", note: "通勤时间与生活成本" },
];

/** Optional fourth criterion, only used in the lab’s 4-criteria mode. */
export const EXTRA_CRITERION: Criterion = { id: "C4", name: "团队氛围", note: "导师投入与同伴交流" };

/** Criteria layer judgments (the student’s own): C1:C2 = 1/3, C1:C3 = 2, C2:C3 = 5. */
export const CRITERIA_UPPER = [1 / 3, 2, 5];
/** Same judgments plus C4: C1:C4 = 1, C2:C4 = 3, C3:C4 = 1/2. */
export const CRITERIA4_UPPER = [1 / 3, 2, 1, 5, 3, 1 / 2];

/** Alternatives compared under each criterion (A:B, A:C, B:C). */
export const LOCAL_UPPER: Record<string, number[]> = {
  C1: [4, 3, 1 / 2],
  C2: [1 / 2, 3, 4],
  C3: [1 / 2, 1 / 5, 1 / 3],
  C4: [1 / 2, 1 / 3, 1 / 2],
};

export const criteriaMatrix = (): Matrix => fromUpperTriangle(3, CRITERIA_UPPER);
export const localMatrix = (criterionId: string): Matrix => fromUpperTriangle(3, LOCAL_UPPER[criterionId]);

/** A fully consistent 3×3 example (a13 = a12 · a23) used in §4 and an exercise. */
export const CONSISTENT_UPPER = [2, 4, 2];
/** A deliberately circular set of judgments (C1 > C2 > C3 > C1) used by the lab preset. */
export const CIRCULAR_UPPER = [3, 1 / 3, 3];
