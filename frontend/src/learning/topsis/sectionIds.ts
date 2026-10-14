/**
 * TOPSIS lesson sections (= DOM anchors at /learn/topsis#id). Kept apart from content.ts so the
 * home page, records page and search can use them without loading the lesson text.
 * content.test.ts checks this list against content.ts.
 */
export const TOPSIS_SECTIONS = [
  { id: "rooms", title: "五套房子，怎么排？" },
  { id: "direction", title: "越大越好，还是越小越好？" },
  { id: "normalise", title: "向量标准化：让不同单位可以比较" },
  { id: "weights", title: "权重从哪里来：接上 AHP" },
  { id: "ideal", title: "最好与最差：正、负理想解" },
  { id: "closeness", title: "距离与贴近度：得到排名" },
  { id: "entropy", title: "没有主观判断时：熵权法" },
  { id: "python", title: "用 Python 复现全部计算" },
  { id: "limits", title: "结论稳不稳？边界与常见错误" },
  { id: "topsis-self-test", title: "合上课本，检查自己" },
  { id: "topsis-transfer", title: "把 AHP + TOPSIS 带进竞赛评价题" },
] as const;
export const TOPSIS_SECTION_IDS: string[] = TOPSIS_SECTIONS.map((s) => s.id);
/** Checkpoints inside the lesson (not graded, shown as “尝试过 x/6”). */
export const TOPSIS_CHECKPOINT_IDS = [
  "topsis-think-1",
  "topsis-think-2",
  "topsis-think-3",
  "topsis-self-1",
  "topsis-self-2",
  "topsis-self-3",
];
