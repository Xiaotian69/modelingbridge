/**
 * Course registry (light): paths, section lists and checkpoint ids for every open course.
 * No lesson text or question banks here, so the home page and header can import it cheaply.
 */
import { AHP_CHECKPOINT_IDS, AHP_SECTIONS } from "./ahp/sectionIds";
import { LP_CHECKPOINT_IDS, LP_SECTIONS } from "./sectionIds";
import { GRAPH_CHECKPOINT_IDS, GRAPH_SECTIONS } from "./graph/sectionIds";
import { INTRO_CHECKPOINT_IDS, INTRO_SECTIONS } from "./intro/sectionIds";
import { REGRESSION_CHECKPOINT_IDS, REGRESSION_SECTIONS } from "./regression/sectionIds";
import { TOPSIS_CHECKPOINT_IDS, TOPSIS_SECTIONS } from "./topsis/sectionIds";

/** The five method courses (each with a practice bank and a method in 方法速查). */
export type CourseId = "lp" | "ahp" | "topsis" | "regression" | "graph";
/** Every lesson with a reading position: the method courses plus 第零课「认识数学建模」. */
export type LessonId = CourseId | "intro";

export type LessonInfo = {
  id: LessonId;
  title: string;
  lessonPath: string;
  sections: readonly { id: string; title: string }[];
  checkpointIds: string[];
  /** Question id prefix (“ahp-self-1”); the original LP bank has none. */
  questionPrefix: string;
  /** Method courses only. */
  methodSlug?: string;
  practicePath?: string;
};
export type CourseInfo = LessonInfo & {
  id: CourseId;
  /** Method slug in data/modelingContent.ts (方法速查). */
  methodSlug: string;
  practicePath: string;
};

/** 第零课: the general entry before any track. No practice bank, no method of its own. */
export const INTRO_LESSON: LessonInfo = {
  id: "intro",
  title: "认识数学建模",
  lessonPath: "/learn/introduction",
  sections: INTRO_SECTIONS,
  checkpointIds: INTRO_CHECKPOINT_IDS,
  questionPrefix: "intro-",
};

export const COURSES: CourseInfo[] = [
  {
    id: "lp",
    title: "线性规划",
    methodSlug: "linear-programming",
    lessonPath: "/learn/linear-programming",
    practicePath: "/practice/linear-programming",
    sections: LP_SECTIONS,
    checkpointIds: LP_CHECKPOINT_IDS,
    questionPrefix: "",
  },
  {
    id: "ahp",
    title: "层次分析法（AHP）",
    methodSlug: "ahp",
    lessonPath: "/learn/ahp",
    practicePath: "/practice/ahp",
    sections: AHP_SECTIONS,
    checkpointIds: AHP_CHECKPOINT_IDS,
    questionPrefix: "ahp-",
  },
  {
    id: "topsis",
    title: "TOPSIS 综合评价",
    methodSlug: "entropy-topsis",
    lessonPath: "/learn/topsis",
    practicePath: "/practice/topsis",
    sections: TOPSIS_SECTIONS,
    checkpointIds: TOPSIS_CHECKPOINT_IDS,
    questionPrefix: "topsis-",
  },
  {
    id: "regression",
    title: "回归分析",
    methodSlug: "regression-tree",
    lessonPath: "/learn/regression",
    practicePath: "/practice/regression",
    sections: REGRESSION_SECTIONS,
    checkpointIds: REGRESSION_CHECKPOINT_IDS,
    questionPrefix: "regression-",
  },
  {
    id: "graph",
    title: "图论与网络优化",
    methodSlug: "network-flow",
    lessonPath: "/learn/graph",
    practicePath: "/practice/graph",
    sections: GRAPH_SECTIONS,
    checkpointIds: GRAPH_CHECKPOINT_IDS,
    questionPrefix: "graph-",
  },
];

/** Every lesson in learning order: 第零课 first, then the method courses. */
export const LESSONS: LessonInfo[] = [INTRO_LESSON, ...COURSES];
export const LESSON_IDS = COURSES.map((c) => c.id);
export function courseById(id: CourseId): CourseInfo;
export function courseById(id: LessonId): LessonInfo;
export function courseById(id: LessonId): LessonInfo {
  return LESSONS.find((c) => c.id === id)!;
}
export const courseByMethod = (slug: string) => COURSES.find((c) => c.methodSlug === slug) ?? null;
/** Later lessons prefix their question ids; everything else belongs to the original LP bank. */
export const courseOfQuestion = (questionId: string): LessonInfo =>
  LESSONS.find((c) => c.questionPrefix && questionId.startsWith(c.questionPrefix)) ?? courseById("lp");
/** “ahp-self-1” → “self-1”: the per-course part of a question id. */
export const localQuestionId = (questionId: string) => questionId.slice(courseOfQuestion(questionId).questionPrefix.length);

export const sectionIndex = (course: LessonInfo, sectionId: string) => course.sections.findIndex((s) => s.id === sectionId);
export const sectionTitleIn = (course: LessonInfo, sectionId: string) =>
  course.sections.find((s) => s.id === sectionId)?.title ?? "";
