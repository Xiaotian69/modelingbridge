/**
 * 第零课「认识数学建模」 sections (= DOM anchors at /learn/introduction#id). Kept apart from content.ts
 * so the home page, records page and search can use them without loading the lesson text.
 * content.test.ts checks this list against content.ts.
 */
export const INTRO_SECTIONS = [
  { id: "intro-what", title: "数学建模到底在做什么？" },
  { id: "intro-assume", title: "假设、数据，以及为什么答案会不一样" },
  { id: "intro-process", title: "一个现实问题，是怎样变成模型的" },
  { id: "intro-team", title: "一支建模队，怎样分工又合作" },
  { id: "intro-contest", title: "数学建模竞赛是什么样的" },
  { id: "intro-map", title: "要学些什么：先认识问题，再找方法" },
  { id: "intro-umbrella", title: "我的第一次建模：下雨了，伞够用吗？" },
  { id: "intro-review", title: "回头看：你刚才完成了一次建模" },
  { id: "intro-next", title: "学完这一课，下一步去哪儿" },
] as const;
export const INTRO_SECTION_IDS: string[] = INTRO_SECTIONS.map((s) => s.id);
/** Checkpoints inside the lesson (not graded, shown as “尝试过 x/6”). */
export const INTRO_CHECKPOINT_IDS = [
  "intro-think-1",
  "intro-think-2",
  "intro-think-3",
  "intro-think-4",
  "intro-think-5",
  "intro-self-1",
];
/** Local milestone stored when the learner finishes every step of the umbrella case. */
export const INTRO_LAB_MILESTONE = "intro-umbrella";
/** The lesson counts as finished once the umbrella case is done and the last section was reached. */
export const INTRO_LAST_SECTION = "intro-next";
