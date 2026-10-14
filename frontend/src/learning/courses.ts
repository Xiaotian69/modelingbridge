/**
 * Course registry (light): paths, section lists and checkpoint ids for every open course.
 * No lesson text or question banks here, so the home page and header can import it cheaply.
 */
import { AHP_CHECKPOINT_IDS, AHP_SECTIONS } from "./ahp/sectionIds";
import { LP_CHECKPOINT_IDS, LP_SECTIONS } from "./sectionIds";
import { REGRESSION_CHECKPOINT_IDS, REGRESSION_SECTIONS } from "./regression/sectionIds";
import { TOPSIS_CHECKPOINT_IDS, TOPSIS_SECTIONS } from "./topsis/sectionIds";

export type LessonId = "lp" | "ahp" | "topsis" | "regression";

export type CourseInfo = {
  id: LessonId;
  title: string;
  /** Method slug in data/modelingContent.ts (方法速查). */
  methodSlug: string;
  lessonPath: string;
  practicePath: string;
  sections: readonly { id: string; title: string }[];
  checkpointIds: string[];
  /** Question id prefix (“ahp-self-1”); the original LP bank has none. */
  questionPrefix: string;
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
];

export const LESSON_IDS = COURSES.map((c) => c.id);
export const courseById = (id: LessonId) => COURSES.find((c) => c.id === id)!;
export const courseByMethod = (slug: string) => COURSES.find((c) => c.methodSlug === slug) ?? null;
/** Later courses prefix their question ids; everything else belongs to the original LP bank. */
export const courseOfQuestion = (questionId: string) =>
  COURSES.find((c) => c.questionPrefix && questionId.startsWith(c.questionPrefix)) ?? courseById("lp");
/** “ahp-self-1” → “self-1”: the per-course part of a question id. */
export const localQuestionId = (questionId: string) => questionId.slice(courseOfQuestion(questionId).questionPrefix.length);

export const sectionIndex = (course: CourseInfo, sectionId: string) => course.sections.findIndex((s) => s.id === sectionId);
export const sectionTitleIn = (course: CourseInfo, sectionId: string) =>
  course.sections.find((s) => s.id === sectionId)?.title ?? "";
