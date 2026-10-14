/** Question banks and teaching metadata of every course (loaded by lesson / practice pages). */
import { ahpExerciseMeta } from "./ahp/exerciseMeta";
import { ahpQuestions } from "./ahp/questions";
import type { CourseQuestion } from "./courseQuestion";
import type { LessonId } from "./courses";
import { metaFor as lpMetaFor, type ExerciseMeta } from "./exerciseMeta";
import { publishedQuestions } from "./questions";

const banks: Record<LessonId, CourseQuestion[]> = {
  lp: publishedQuestions,
  ahp: ahpQuestions.filter((q) => q.review === "verified"),
};

export const questionsOf = (lesson: LessonId) => banks[lesson];
/** Everything except the inline checkpoints, as in V1. */
export const practiceBankOf = (lesson: LessonId) => banks[lesson].filter((q) => q.placement !== "inline");
export const findQuestion = (id: string) =>
  banks.lp.find((q) => q.id === id) ?? banks.ahp.find((q) => q.id === id) ?? null;

/** Metadata for any course's question; LP ids keep the original lookup and fallback. */
export const metaForQuestion = (id: string): ExerciseMeta =>
  id.startsWith("ahp-") ? (ahpExerciseMeta[id] ?? { sectionId: "decision", errors: [] }) : lpMetaFor(id);
