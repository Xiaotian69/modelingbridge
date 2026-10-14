/** Question banks and teaching metadata of every course (loaded by lesson / practice pages). */
import { ahpExerciseMeta } from "./ahp/exerciseMeta";
import { ahpQuestions } from "./ahp/questions";
import type { CourseQuestion } from "./courseQuestion";
import { courseOfQuestion, type LessonId } from "./courses";
import { metaFor as lpMetaFor, type ExerciseMeta } from "./exerciseMeta";
import { publishedQuestions } from "./questions";
import { topsisExerciseMeta } from "./topsis/exerciseMeta";
import { topsisQuestions } from "./topsis/questions";

const banks: Record<LessonId, CourseQuestion[]> = {
  lp: publishedQuestions,
  ahp: ahpQuestions.filter((q) => q.review === "verified"),
  topsis: topsisQuestions.filter((q) => q.review === "verified"),
};
/** Metadata of the prefixed courses; LP keeps its original lookup and fallback. */
const metas: Partial<Record<LessonId, Record<string, ExerciseMeta>>> = {
  ahp: ahpExerciseMeta,
  topsis: topsisExerciseMeta,
};

export const questionsOf = (lesson: LessonId) => banks[lesson];
/** Everything except the inline checkpoints, as in V1. */
export const practiceBankOf = (lesson: LessonId) => banks[lesson].filter((q) => q.placement !== "inline");
export const findQuestion = (id: string) => banks[courseOfQuestion(id).id].find((q) => q.id === id) ?? null;

/** Metadata for any course's question; LP ids keep the original lookup and fallback. */
export const metaForQuestion = (id: string): ExerciseMeta => {
  const course = courseOfQuestion(id);
  if (course.id === "lp") return lpMetaFor(id);
  return metas[course.id]?.[id] ?? { sectionId: course.sections[0].id, errors: [] };
};
