/**
 * Course registry (light): paths, section lists and checkpoint ids for every open course.
 * No lesson text or question banks here, so the home page and header can import it cheaply.
 */
import { AHP_CHECKPOINT_IDS, AHP_SECTIONS } from "./ahp/sectionIds";
import { LP_CHECKPOINT_IDS, LP_SECTIONS } from "./sectionIds";

export type LessonId = "lp" | "ahp";

export type CourseInfo = {
  id: LessonId;
  title: string;
  /** Method slug in data/modelingContent.ts (方法速查). */
  methodSlug: string;
  lessonPath: string;
  practicePath: string;
  sections: readonly { id: string; title: string }[];
  checkpointIds: string[];
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
  },
  {
    id: "ahp",
    title: "层次分析法（AHP）",
    methodSlug: "ahp",
    lessonPath: "/learn/ahp",
    practicePath: "/practice/ahp",
    sections: AHP_SECTIONS,
    checkpointIds: AHP_CHECKPOINT_IDS,
  },
];

export const LESSON_IDS = COURSES.map((c) => c.id);
export const courseById = (id: LessonId) => COURSES.find((c) => c.id === id)!;
export const courseByMethod = (slug: string) => COURSES.find((c) => c.methodSlug === slug) ?? null;
/** AHP question ids are prefixed; everything else belongs to the original LP bank. */
export const courseOfQuestion = (questionId: string) => courseById(questionId.startsWith("ahp-") ? "ahp" : "lp");

export const sectionIndex = (course: CourseInfo, sectionId: string) => course.sections.findIndex((s) => s.id === sectionId);
export const sectionTitleIn = (course: CourseInfo, sectionId: string) =>
  course.sections.find((s) => s.id === sectionId)?.title ?? "";
