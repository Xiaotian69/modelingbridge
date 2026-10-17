/** App-facing learning state: one in-memory copy, persisted locally, observable from React. */
import { useSyncExternalStore } from "react";
import { courseById } from "../learning/courses";
import { LP_SECTION_IDS } from "../learning/sectionIds";
import { PRACTICE_KEY, READING_KEY } from "../learning/storage";
import { clearReturnTicket } from "./returnTicket";
import {
  LEARNING_BACKUP_KEY,
  LEARNING_KEY,
  defaultStorage,
  emptyState,
  loadLearningState,
  mergeStates,
  sanitizeState,
  writeState,
  writeV1Mirror,
  type Answer,
  type ExerciseRecord,
  type HelpLevel,
  type LessonKey,
  type LearningState,
  type LoadResult,
  type SubmitStatus,
} from "./learningStore";

type Snapshot = LoadResult;
let snapshot: Snapshot | null = null;
const listeners = new Set<() => void>();
let draftTimer: ReturnType<typeof setTimeout> | null = null;
let listening = false;

function ensure(): Snapshot {
  if (!snapshot) {
    snapshot = loadLearningState(defaultStorage(), LP_SECTION_IDS);
    listen();
  }
  return snapshot;
}

function emit() {
  listeners.forEach((l) => l());
}

function persist(mirror: boolean) {
  const s = ensure();
  const store = defaultStorage();
  if (!s.persistent || s.readOnly || !store) return;
  const ok = writeState(store, s.state);
  if (!ok) {
    snapshot = { ...s, persistent: false };
    emit();
    return;
  }
  if (mirror) writeV1Mirror(store, s.state);
}

function flushDraft() {
  if (draftTimer) {
    clearTimeout(draftTimer);
    draftTimer = null;
    persist(false);
  }
}

function listen() {
  if (listening || typeof window === "undefined") return;
  listening = true;
  window.addEventListener("pagehide", flushDraft);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) flushDraft();
  });
  // Another tab wrote: merge record by record (newer wins) instead of overwriting.
  window.addEventListener("storage", (event) => {
    if (event.key !== LEARNING_KEY || !snapshot || !event.newValue) return;
    try {
      const theirs = sanitizeState(JSON.parse(event.newValue));
      if (!theirs) return;
      snapshot = { ...snapshot, state: mergeStates(snapshot.state, theirs) };
      emit();
    } catch {
      /* ignore malformed writes */
    }
  });
}

function update(mutate: (s: LearningState) => LearningState, opts: { mirror?: boolean; debounce?: boolean } = {}) {
  const s = ensure();
  if (s.readOnly) return;
  snapshot = { ...s, state: mutate(s.state) };
  emit();
  if (opts.debounce) {
    if (draftTimer) clearTimeout(draftTimer);
    draftTimer = setTimeout(() => {
      draftTimer = null;
      persist(false);
    }, 300);
  } else {
    flushDraft();
    persist(!!opts.mirror);
  }
}

const now = () => new Date().toISOString();
const blank = (): ExerciseRecord => ({ attempts: 0, helpLevel: 0, updatedAt: now() });
const withExercise = (s: LearningState, id: string, patch: (e: ExerciseRecord) => ExerciseRecord): LearningState => ({
  ...s,
  exercises: { ...s.exercises, [id]: { ...patch(s.exercises[id] ?? blank()), updatedAt: now() } },
  lastActivity: { kind: "exercise", id, at: now() },
});

export const learning = {
  get: () => ensure(),
  /** Write a pending (debounced) draft now, e.g. before leaving for the lesson. */
  flush: () => flushDraft(),
  subscribe(listener: () => void) {
    ensure();
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  /** Reading position of one lesson; only linear programming is mirrored to the V1 key. */
  setReading(sectionId: string, lesson: LessonKey = "lp") {
    if (!courseById(lesson).sections.some((s) => s.id === sectionId)) return;
    update(
      (s) => {
        const prev = s.reading[lesson];
        if (prev?.lastSectionId === sectionId) return s;
        const visited = prev?.visited.includes(sectionId) ? prev.visited : [...(prev?.visited ?? []), sectionId];
        return {
          ...s,
          reading: { ...s.reading, [lesson]: { lastSectionId: sectionId, visited, updatedAt: now() } },
          lastActivity: { kind: "lesson", id: sectionId, at: now() },
        };
      },
      { mirror: true },
    );
  },
  recordCheckpoint(id: string, correct: boolean) {
    update((s) => ({
      ...s,
      checkpoints: { ...s.checkpoints, [id]: { tried: true, lastResult: correct ? "correct" : "incorrect", updatedAt: now() } },
    }));
  },
  /** Records a milestone once (e.g. the 第零课 umbrella case); later calls keep the first time. */
  markMilestone(id: string) {
    update((s) => (s.milestones?.[id] ? s : { ...s, milestones: { ...s.milestones, [id]: { at: now() } } }));
  },
  saveDraft(id: string, draft: Answer) {
    update((s) => withExercise(s, id, (e) => ({ ...e, draft })), { debounce: true });
  },
  recordSubmission(id: string, status: SubmitStatus) {
    update(
      (s) =>
        withExercise(s, id, (e) => ({
          ...e,
          attempts: e.attempts + 1,
          lastStatus: status,
          legacy: undefined,
          solvedAfterSolution: status === "correct" ? !!e.sawSolution : e.solvedAfterSolution,
        })),
      { mirror: true },
    );
  },
  openHelp(id: string, level: HelpLevel, solved: boolean) {
    update((s) =>
      withExercise(s, id, (e) => ({
        ...e,
        helpLevel: Math.max(e.helpLevel, level) as HelpLevel,
        sawSolution: e.sawSolution || (level === 3 && !solved),
      })),
    );
  },
  dismissNudge(id: string) {
    update((s) => withExercise(s, id, (e) => ({ ...e, nudgeDismissed: true })));
  },
  /** “清空重做”: forget the draft and help level, keep the attempt history. */
  restart(id: string) {
    update((s) => withExercise(s, id, (e) => ({ ...e, draft: undefined, helpLevel: 0 })));
  },
  /**
   * 学习记录 › 清空课程与练习进度: empties the V2 state and removes the V1 keys too
   * (otherwise the next load would migrate them back), plus the corrupt-data backup and
   * the return ticket. Quest drafts and reports have their own keys and are not touched.
   */
  clearAll() {
    const s = ensure();
    if (draftTimer) clearTimeout(draftTimer);
    draftTimer = null;
    const store = defaultStorage();
    if (store && s.persistent) {
      writeState(store, emptyState());
      for (const key of [PRACTICE_KEY, READING_KEY, LEARNING_BACKUP_KEY]) {
        try {
          store.removeItem(key);
        } catch {
          /* ignore */
        }
      }
    }
    clearReturnTicket();
    snapshot = { state: emptyState(), persistent: s.persistent, readOnly: false };
    emit();
  },
  /** Test helper: drop the in-memory copy so the next read reloads from storage. */
  resetForTests() {
    snapshot = null;
    if (draftTimer) clearTimeout(draftTimer);
    draftTimer = null;
    emit();
  },
};

export function useLearning(): Snapshot {
  return useSyncExternalStore(learning.subscribe, learning.get, () => ({
    state: emptyState(),
    persistent: false,
    readOnly: false,
  }));
}
