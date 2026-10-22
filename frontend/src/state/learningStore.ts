/**
 * V2 local learning state (design doc §8.2, migration plan docs/design/v2-ux/02).
 *
 * - Lives in localStorage under `mb.v2.learning`; nothing is ever sent to a server.
 * - First load migrates the V1 keys (reading position, practice history) and keeps them.
 * - Every submission / reading change is also written back to the V1 keys ("dual write"),
 *   so rolling the site back to V1 never loses progress made in V2.
 * - If storage is unavailable, everything keeps working in memory and `persistent` is false.
 */
import { PRACTICE_KEY, READING_KEY } from "../learning/storage";

export const LEARNING_KEY = "mb.v2.learning";
export const LEARNING_BACKUP_KEY = "mb.v2.learning.corrupt";
export const META_KEY = "mb.v2.meta";
export const SCHEMA_VERSION = 2;
export const LP_LESSON = "lp";
/**
 * Lessons with a reading position (V2.1 adds AHP; V3.0 TOPSIS, regression, graph and 第零课 intro;
 * older data simply lacks them).
 */
export const LESSON_KEYS = ["lp", "ahp", "topsis", "regression", "graph", "intro"] as const;
export type LessonKey = (typeof LESSON_KEYS)[number];
/** Inline thinking question that lived in the V1 practice history; it is a checkpoint. */
const V1_CHECKPOINT_IDS = ["think-1"];
/** Ids of the original linear programming bank, the only one V1 knows. */
const V1_QUESTION_ID = /^(?:think|self|practice)-\d+$/;

export type Answer = string | string[];
export type SubmitStatus = "correct" | "incorrect" | "partial";
export type HelpLevel = 0 | 1 | 2 | 3;

export type ExerciseRecord = {
  attempts: number;
  lastStatus?: SubmitStatus;
  draft?: Answer;
  helpLevel: HelpLevel;
  /** Opened the full solution before answering correctly. */
  sawSolution?: boolean;
  solvedAfterSolution?: boolean;
  nudgeDismissed?: boolean;
  /** Migrated from V1: attempts and result are known, drafts and hints are not. */
  legacy?: boolean;
  updatedAt: string;
};
export type CheckpointRecord = { tried: true; lastResult: "correct" | "incorrect"; updatedAt: string };
export type ReadingRecord = { lastSectionId: string; visited: string[]; updatedAt: string };
/** Something finished once, e.g. every step of the 第零课 umbrella case. */
export type MilestoneRecord = { at: string };

export type LearningState = {
  schemaVersion: typeof SCHEMA_VERSION;
  reading: Partial<Record<LessonKey, ReadingRecord>>;
  checkpoints: Record<string, CheckpointRecord>;
  exercises: Record<string, ExerciseRecord>;
  /**
   * Optional (added in V3.0 with 第零课), so the schema version stays 2: older versions ignore it,
   * and state without it is still valid. Only present when something was recorded.
   */
  milestones?: Record<string, MilestoneRecord>;
  lastActivity?: { kind: "lesson" | "exercise"; id: string; at: string };
};

export type LoadResult = {
  state: LearningState;
  /** False when localStorage cannot be read or written (private mode, blocked site data). */
  persistent: boolean;
  /** Data written by a newer version: shown, never overwritten. */
  readOnly: boolean;
  notice?: "migrated" | "recovered" | "newer-version";
};

type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export const emptyState = (): LearningState => ({
  schemaVersion: SCHEMA_VERSION,
  reading: {},
  checkpoints: {},
  exercises: {},
});

const isObject = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === "object" && !Array.isArray(v);
const isAnswer = (v: unknown): v is Answer =>
  typeof v === "string" || (Array.isArray(v) && v.every((x) => typeof x === "string"));
const STATUSES: SubmitStatus[] = ["correct", "incorrect", "partial"];

function sanitizeExercise(v: unknown): ExerciseRecord | null {
  if (!isObject(v)) return null;
  if (!Number.isSafeInteger(v.attempts) || (v.attempts as number) < 0) return null;
  if (typeof v.updatedAt !== "string") return null;
  const help = [0, 1, 2, 3].includes(v.helpLevel as number) ? (v.helpLevel as HelpLevel) : 0;
  const out: ExerciseRecord = { attempts: v.attempts as number, helpLevel: help, updatedAt: v.updatedAt };
  if (STATUSES.includes(v.lastStatus as SubmitStatus)) out.lastStatus = v.lastStatus as SubmitStatus;
  if (isAnswer(v.draft)) out.draft = v.draft;
  for (const flag of ["sawSolution", "solvedAfterSolution", "nudgeDismissed", "legacy"] as const)
    if (v[flag] === true) out[flag] = true;
  return out;
}

/** Validates record by record; returns null when the top level is unusable. */
export function sanitizeState(raw: unknown): LearningState | null {
  if (!isObject(raw) || raw.schemaVersion !== SCHEMA_VERSION) return null;
  const state = emptyState();
  if (isObject(raw.reading))
    for (const lesson of LESSON_KEYS) {
      const r = raw.reading[lesson];
      if (isObject(r) && typeof r.lastSectionId === "string" && typeof r.updatedAt === "string")
        state.reading[lesson] = {
          lastSectionId: r.lastSectionId,
          visited: Array.isArray(r.visited) ? r.visited.filter((x): x is string => typeof x === "string") : [],
          updatedAt: r.updatedAt,
        };
    }
  if (isObject(raw.checkpoints))
    for (const [id, c] of Object.entries(raw.checkpoints))
      if (isObject(c) && (c.lastResult === "correct" || c.lastResult === "incorrect") && typeof c.updatedAt === "string")
        state.checkpoints[id] = { tried: true, lastResult: c.lastResult, updatedAt: c.updatedAt };
  if (isObject(raw.exercises))
    for (const [id, e] of Object.entries(raw.exercises)) {
      const clean = sanitizeExercise(e);
      if (clean) state.exercises[id] = clean;
    }
  if (isObject(raw.milestones)) {
    const milestones = Object.entries(raw.milestones).filter(([, m]) => isObject(m) && typeof m.at === "string");
    if (milestones.length)
      state.milestones = Object.fromEntries(milestones.map(([id, m]) => [id, { at: (m as MilestoneRecord).at }]));
  }
  if (isObject(raw.lastActivity)) {
    const a = raw.lastActivity;
    if ((a.kind === "lesson" || a.kind === "exercise") && typeof a.id === "string" && typeof a.at === "string")
      state.lastActivity = { kind: a.kind, id: a.id, at: a.at };
  }
  return state;
}

type V1Attempt = { correct: boolean; attempts: number; updated: string };
function readV1Practice(store: StorageLike): Record<string, V1Attempt> {
  try {
    const raw: unknown = JSON.parse(store.getItem(PRACTICE_KEY) || "{}");
    if (!isObject(raw)) return {};
    return Object.fromEntries(
      Object.entries(raw).filter(
        ([, v]) =>
          isObject(v) &&
          typeof v.correct === "boolean" &&
          Number.isSafeInteger(v.attempts) &&
          (v.attempts as number) > 0 &&
          typeof v.updated === "string",
      ),
    ) as Record<string, V1Attempt>;
  } catch {
    return {};
  }
}
function readV1Reading(store: StorageLike, sectionIds: string[]): string | null {
  try {
    const v: unknown = JSON.parse(store.getItem(READING_KEY) || "null");
    return typeof v === "string" && sectionIds.includes(v) ? v : null;
  } catch {
    return null;
  }
}

/** V1 → V2 (migration plan §3.2). Pure: reads, never writes. */
export function migrateFromV1(store: StorageLike, sectionIds: string[], now: string): LearningState | null {
  const practice = readV1Practice(store);
  const reading = readV1Reading(store, sectionIds);
  if (!reading && !Object.keys(practice).length) return null;
  const state = emptyState();
  if (reading) state.reading.lp = { lastSectionId: reading, visited: [reading], updatedAt: now };
  for (const [id, a] of Object.entries(practice)) {
    if (V1_CHECKPOINT_IDS.includes(id))
      state.checkpoints[id] = { tried: true, lastResult: a.correct ? "correct" : "incorrect", updatedAt: a.updated };
    else
      state.exercises[id] = {
        attempts: a.attempts,
        lastStatus: a.correct ? "correct" : "incorrect",
        helpLevel: 0,
        legacy: true,
        updatedAt: a.updated,
      };
  }
  return state;
}

/**
 * Rollback-then-upgrade (plan §3.3): if V1 recorded a newer attempt than V2 knows,
 * take V1's attempts/result and keep V2-only details (draft, help level).
 */
export function mergeNewerV1(state: LearningState, store: StorageLike): LearningState {
  const practice = readV1Practice(store);
  let changed = false;
  const exercises = { ...state.exercises };
  for (const [id, a] of Object.entries(practice)) {
    if (V1_CHECKPOINT_IDS.includes(id)) continue;
    const current = exercises[id];
    if (current && !(a.updated > current.updatedAt)) continue;
    if (current && a.attempts === current.attempts) continue;
    exercises[id] = {
      ...(current ?? { helpLevel: 0, legacy: true }),
      attempts: a.attempts,
      lastStatus: a.correct ? "correct" : "incorrect",
      updatedAt: a.updated,
    } as ExerciseRecord;
    changed = true;
  }
  return changed ? { ...state, exercises } : state;
}

function probe(store: StorageLike | null): boolean {
  if (!store) return false;
  try {
    store.setItem("mb.v2.probe", "1");
    store.removeItem("mb.v2.probe");
    return true;
  } catch {
    return false;
  }
}

export function defaultStorage(): StorageLike | null {
  try {
    return typeof localStorage === "undefined" ? null : localStorage;
  } catch {
    return null;
  }
}

/** Startup flow (plan §3.1). */
export function loadLearningState(
  store: StorageLike | null,
  sectionIds: string[],
  now = new Date().toISOString(),
): LoadResult {
  if (!probe(store)) return { state: emptyState(), persistent: false, readOnly: false };
  const s = store!;
  let raw: string | null = null;
  try {
    raw = s.getItem(LEARNING_KEY);
  } catch {
    return { state: emptyState(), persistent: false, readOnly: false };
  }
  if (raw === null) {
    const migrated = migrateFromV1(s, sectionIds, now);
    if (!migrated) return { state: emptyState(), persistent: true, readOnly: false };
    writeState(s, migrated);
    try {
      s.setItem(META_KEY, JSON.stringify({ schemaVersion: SCHEMA_VERSION, migratedAt: now, migratedFrom: [READING_KEY, PRACTICE_KEY] }));
    } catch {
      /* meta is informational only */
    }
    return { state: migrated, persistent: true, readOnly: false, notice: "migrated" };
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    parsed = undefined;
  }
  if (isObject(parsed) && typeof parsed.schemaVersion === "number" && parsed.schemaVersion > SCHEMA_VERSION) {
    return { state: emptyState(), persistent: true, readOnly: true, notice: "newer-version" };
  }
  const state = sanitizeState(parsed);
  if (!state) {
    // Keep the damaged text, then rebuild from the V1 keys (which are never deleted).
    try {
      s.setItem(LEARNING_BACKUP_KEY, raw);
    } catch {
      /* ignore */
    }
    const migrated = migrateFromV1(s, sectionIds, now) ?? emptyState();
    writeState(s, migrated);
    return { state: migrated, persistent: true, readOnly: false, notice: "recovered" };
  }
  const merged = mergeNewerV1(state, s);
  if (merged !== state) writeState(s, merged);
  return { state: merged, persistent: true, readOnly: false };
}

export function writeState(store: StorageLike, state: LearningState): boolean {
  try {
    store.setItem(LEARNING_KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

/** Dual write to the V1 keys for a safe rollback (plan §3.4). Failures are ignored. */
export function writeV1Mirror(store: StorageLike, state: LearningState) {
  try {
    const practice = readV1Practice(store);
    for (const [id, e] of Object.entries(state.exercises)) {
      // V1 only ever had linear programming; later courses (ahp-*, topsis-*, …) are not mirrored.
      if (!V1_QUESTION_ID.test(id) || !e.attempts || !e.lastStatus) continue;
      practice[id] = { correct: e.lastStatus === "correct", attempts: e.attempts, updated: e.updatedAt };
    }
    store.setItem(PRACTICE_KEY, JSON.stringify(practice));
    if (state.reading.lp) store.setItem(READING_KEY, JSON.stringify(state.reading.lp.lastSectionId));
  } catch {
    /* V2 stays authoritative */
  }
}

/** Per-record merge for another tab's write (plan §3.5): newer `updatedAt` wins. */
export function mergeStates(mine: LearningState, theirs: LearningState): LearningState {
  const pick = <T extends { updatedAt: string }>(a?: T, b?: T) =>
    !a ? b : !b ? a : b.updatedAt > a.updatedAt ? b : a;
  const ids = (a: object, b: object) => new Set([...Object.keys(a), ...Object.keys(b)]);
  const out = emptyState();
  for (const lesson of LESSON_KEYS) {
    const r = pick(mine.reading[lesson], theirs.reading[lesson]);
    if (r) out.reading[lesson] = r;
  }
  for (const id of ids(mine.exercises, theirs.exercises)) out.exercises[id] = pick(mine.exercises[id], theirs.exercises[id])!;
  for (const id of ids(mine.checkpoints, theirs.checkpoints))
    out.checkpoints[id] = pick(mine.checkpoints[id], theirs.checkpoints[id])!;
  // A milestone, once reached, stays reached: keep the union, earliest time first.
  const milestones = { ...(theirs.milestones ?? {}), ...(mine.milestones ?? {}) };
  for (const [id, m] of Object.entries(theirs.milestones ?? {}))
    if (milestones[id].at > m.at) milestones[id] = m;
  if (Object.keys(milestones).length) out.milestones = milestones;
  const acts = [mine.lastActivity, theirs.lastActivity].filter(Boolean) as NonNullable<LearningState["lastActivity"]>[];
  if (acts.length) out.lastActivity = acts.sort((a, b) => (a.at > b.at ? -1 : 1))[0];
  return out;
}
