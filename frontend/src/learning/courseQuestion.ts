/**
 * A question from any course. The verified LP bank (questions.ts) types `model` as the single
 * literal "linear-programming"; other courses reuse the same shape with their own model id.
 * Distributive so the single / multiple / numeric union stays discriminated.
 */
import type { Question } from "./questions";

export type ModelId = Question["model"] | "ahp" | "topsis";
export type CourseQuestion = Question extends infer Q
  ? Q extends unknown
    ? Omit<Q, "model"> & { model: ModelId }
    : never
  : never;

/**
 * grading.ts (unchanged, verified) is typed on the LP Question but reads only
 * type / answer / options / tolerance, which every CourseQuestion has with the same meaning.
 */
export const asGradable = (q: CourseQuestion) => q as unknown as Question;
