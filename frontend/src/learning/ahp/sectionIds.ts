/**
 * AHP lesson sections (= DOM anchors at /learn/ahp#id). Kept apart from content.ts so the
 * home page, records page and search can use them without loading the lesson text.
 * sections.test.ts checks this list against content.ts.
 */
export const AHP_SECTIONS = [
  { id: "decision", title: "三份实习，怎么选？" },
  { id: "hierarchy", title: "把决策画成层次" },
  { id: "scale", title: "两两比较：1–9 标度" },
  { id: "weights", title: "从判断矩阵到权重" },
  { id: "consistency", title: "判断前后矛盾吗？一致性检验" },
  { id: "synthesis", title: "合成：得到最终排序" },
  { id: "python", title: "用 Python 复现全部计算" },
  { id: "limits", title: "AHP 的边界与常见错误" },
  { id: "ahp-self-test", title: "合上课本，检查自己" },
  { id: "ahp-transfer", title: "把 AHP 带进竞赛评价题" },
] as const;
export const AHP_SECTION_IDS: string[] = AHP_SECTIONS.map((s) => s.id);
/** Checkpoints inside the lesson (not graded, shown as “尝试过 x/5”). */
export const AHP_CHECKPOINT_IDS = ["ahp-think-1", "ahp-think-2", "ahp-self-1", "ahp-self-2", "ahp-self-3"];
