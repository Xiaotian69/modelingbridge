export const READING_KEY = "mb_learning_reading_v1";
export const PRACTICE_KEY = "mb_learning_practice_v1";
export type Attempt = { correct: boolean; attempts: number; updated: string };
export type History = Record<string, Attempt>;
export function readHistory(): History {
  try {
    const raw: unknown = JSON.parse(localStorage.getItem(PRACTICE_KEY) || "{}");
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
    return Object.fromEntries(
      Object.entries(raw).filter(
        ([, v]) =>
          v &&
          typeof v.correct === "boolean" &&
          Number.isSafeInteger(v.attempts) &&
          v.attempts > 0 &&
          typeof v.updated === "string",
      ),
    );
  } catch {
    return {};
  }
}
export function save(key: string, value: unknown): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}
export function readPosition(ids: string[]): string | null {
  try {
    const value = JSON.parse(localStorage.getItem(READING_KEY) || "null");
    return typeof value === "string" && ids.includes(value) ? value : null;
  } catch {
    return null;
  }
}
