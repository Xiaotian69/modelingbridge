/**
 * 分工探索的本机存档：独立的键 mb.roles.v1，不读写小游戏（mb.challenge.v1）和学习记录。
 * 每答完一步就保存；浏览器不允许本地存储时照常可用，只是关掉页面后不能继续。
 */
import { EXPERIENCE_LEVELS, INTEREST_MAX, INTERESTS, PREFERENCE_MAX, PREFERENCE_UNSURE, PREFERENCES, ROLE_ORDER, ROLES_STORAGE_KEY, TASKS } from "./content";
import type { Answers } from "./scoring";

/** 步骤：0 已有经验，1 兴趣，2–10 九个微任务，11 做完后的偏好。 */
export const STEP_COUNT = TASKS.length + 3;
export type Step = number | "result";

export type RolesState = { v: 1; step: Step; answers: Answers };

export const emptyAnswers = (): Answers => ({ experience: {}, interests: [], tasks: {}, preference: [] });
export const freshState = (): RolesState => ({ v: 1, step: 0, answers: emptyAnswers() });

const isStep = (s: unknown): s is Step => s === "result" || (Number.isInteger(s) && (s as number) >= 0 && (s as number) < STEP_COUNT);
const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value);
const isSelection = (value: unknown, allowed: string[], max: number): value is string[] =>
  Array.isArray(value) && value.length <= max && new Set(value).size === value.length && value.every((id) => typeof id === "string" && allowed.includes(id));

function validAnswers(value: unknown): value is Answers {
  if (!isRecord(value)) return false;
  if (!isRecord(value.experience) || !Object.entries(value.experience).every(([role, level]) =>
    ROLE_ORDER.some((r) => r === role) && EXPERIENCE_LEVELS.some((l) => l.id === level))) return false;
  if (!isSelection(value.interests, INTERESTS.map((o) => o.id), INTEREST_MAX)) return false;
  if (!isSelection(value.preference, PREFERENCES.map((o) => o.id), PREFERENCE_MAX)) return false;
  if (value.preference.includes(PREFERENCE_UNSURE) && value.preference.length !== 1) return false;
  if (!isRecord(value.tasks)) return false;
  return Object.entries(value.tasks).every(([id, answer]) => {
    const task = TASKS.find((t) => t.id === id);
    if (!task || !isRecord(answer)) return false;
    if ("skipped" in answer) return answer.skipped === true && !("choice" in answer);
    return isSelection(answer.choice, task.options.map((o) => o.id), task.answer.length) && answer.choice.length === task.answer.length;
  });
}

export function loadState(): RolesState | null {
  try {
    const raw = localStorage.getItem(ROLES_STORAGE_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw);
    if (s?.v !== 1 || !isStep(s.step) || !validAnswers(s.answers)) return null;
    return { v: 1, step: s.step, answers: s.answers };
  } catch {
    return null;
  }
}

export function saveState(state: RolesState) {
  try {
    localStorage.setItem(ROLES_STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch {
    /* 隐私模式等不能存：本次照常进行 */
    return false;
  }
}

export function clearState() {
  try {
    localStorage.removeItem(ROLES_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
