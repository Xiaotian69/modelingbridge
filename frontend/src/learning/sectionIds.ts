/**
 * Stable section IDs of the linear-programming lesson (= DOM anchors, = V1 reading values).
 * Kept apart from content.ts so small chunks (home, store) need not load the lesson text.
 * `sectionIds.test.ts` checks this list against content.ts.
 */
export const LP_SECTIONS = [
  { id: "problem", title: "一周的资源，应该怎样分配？" },
  { id: "variables", title: "把生产计划翻译成数学" },
  { id: "geometry", title: "看见所有允许的计划" },
  { id: "derive", title: "不用软件，完整求出最优解" },
  { id: "python", title: "让 Python 重现你的推导" },
  { id: "sensitivity", title: "再多一小时，究竟值多少钱？" },
  { id: "integer", title: "必须整块生产时，答案会变吗？" },
  { id: "check", title: "算对了，还要问模型是否可信" },
  { id: "self-test", title: "合上推导，检查自己是否理解" },
  { id: "transfer", title: "把这套思路带到新的问题" },
] as const;
export const LP_SECTION_IDS: string[] = LP_SECTIONS.map((s) => s.id);
export const sectionNumber = (id: string) => LP_SECTION_IDS.indexOf(id) + 1;
export const sectionTitle = (id: string) => LP_SECTIONS.find((s) => s.id === id)?.title ?? "";
/** Lesson checkpoints (question blocks in content.ts); not graded, shown as “尝试过 x/4” (Q8). */
export const LP_CHECKPOINT_IDS = ["think-1", "self-1", "self-2", "self-3"];
