// Migration and fallback tests (docs/design/v2-ux/02, §6.1).
import { describe, expect, it } from "vitest";
import { PRACTICE_KEY, READING_KEY } from "../learning/storage";
import { LP_SECTION_IDS } from "../learning/sectionIds";
import {
  LEARNING_BACKUP_KEY,
  LEARNING_KEY,
  META_KEY,
  emptyState,
  loadLearningState,
  mergeStates,
  writeV1Mirror,
  type LearningState,
} from "./learningStore";

const NOW = "2026-10-12T10:00:00.000Z";
function memory(seed: Record<string, string> = {}) {
  const data = new Map(Object.entries(seed));
  return {
    data,
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => void data.set(k, v),
    removeItem: (k: string) => void data.delete(k),
  };
}
const v1 = {
  [READING_KEY]: JSON.stringify("derive"),
  [PRACTICE_KEY]: JSON.stringify({
    "think-1": { correct: true, attempts: 1, updated: "2026-10-01T00:00:00.000Z" },
    "self-1": { correct: true, attempts: 1, updated: "2026-10-01T00:00:00.000Z" },
    "practice-2": { correct: false, attempts: 2, updated: "2026-10-02T00:00:00.000Z" },
  }),
};
const load = (store: Parameters<typeof loadLearningState>[0]) => loadLearningState(store, LP_SECTION_IDS, NOW);

describe("first load", () => {
  it("M01: empty storage gives an empty state and writes nothing", () => {
    const store = memory();
    const r = load(store);
    expect(r).toMatchObject({ persistent: true, readOnly: false, state: emptyState() });
    expect(store.data.has(LEARNING_KEY)).toBe(false);
    expect(store.data.has(META_KEY)).toBe(false);
  });
  it("M02/M04: migrates reading and practice, moves think-1 to checkpoints, keeps V1 keys", () => {
    const store = memory(v1);
    const r = load(store);
    expect(r.notice).toBe("migrated");
    expect(r.state.reading.lp).toEqual({ lastSectionId: "derive", visited: ["derive"], updatedAt: NOW });
    expect(r.state.checkpoints["think-1"]).toMatchObject({ lastResult: "correct" });
    expect(r.state.exercises["think-1"]).toBeUndefined();
    expect(r.state.exercises["practice-2"]).toEqual({
      attempts: 2,
      lastStatus: "incorrect",
      helpLevel: 0,
      legacy: true,
      updatedAt: "2026-10-02T00:00:00.000Z",
    });
    expect(store.data.get(PRACTICE_KEY)).toBe(v1[PRACTICE_KEY]);
    expect(store.data.get(READING_KEY)).toBe(v1[READING_KEY]);
    expect(JSON.parse(store.data.get(META_KEY)!)).toMatchObject({ schemaVersion: 2, migratedAt: NOW });
  });
  it("M03/M05/M06: ignores unknown sections, invalid records and broken JSON", () => {
    const store = memory({
      [READING_KEY]: JSON.stringify("foo"),
      [PRACTICE_KEY]: JSON.stringify({
        "self-1": { correct: true, attempts: 0, updated: NOW },
        "self-2": { correct: "yes", attempts: 1, updated: NOW },
        "self-3": { correct: false, attempts: 1, updated: NOW },
      }),
    });
    const r = load(store);
    expect(r.state.reading.lp).toBeUndefined();
    expect(Object.keys(r.state.exercises)).toEqual(["self-3"]);
    expect(() => load(memory({ [PRACTICE_KEY]: "{bad" }))).not.toThrow();
  });
  it("M07: keeps records for question IDs that no longer exist", () => {
    const store = memory({ [PRACTICE_KEY]: JSON.stringify({ "practice-9": { correct: true, attempts: 1, updated: NOW } }) });
    expect(load(store).state.exercises["practice-9"]).toBeDefined();
  });
});

describe("later loads and recovery", () => {
  it("M08: V2 wins over V1 when both exist (no double migration)", () => {
    const store = memory(v1);
    load(store);
    const before = store.data.get(LEARNING_KEY);
    load(store);
    expect(store.data.get(LEARNING_KEY)).toBe(before);
  });
  it("M09: corrupt V2 is backed up and rebuilt from the V1 keys", () => {
    const store = memory({ ...v1, [LEARNING_KEY]: "{not json" });
    const r = load(store);
    expect(r.notice).toBe("recovered");
    expect(store.data.get(LEARNING_BACKUP_KEY)).toBe("{not json");
    expect(r.state.exercises["practice-2"].attempts).toBe(2);
  });
  it("M10: rollback then upgrade takes newer V1 attempts and keeps the V2 draft", () => {
    const state: LearningState = {
      ...emptyState(),
      exercises: {
        "practice-2": { attempts: 2, lastStatus: "incorrect", helpLevel: 2, draft: "2500", updatedAt: "2026-10-03T00:00:00.000Z" },
      },
    };
    const store = memory({
      [LEARNING_KEY]: JSON.stringify(state),
      [PRACTICE_KEY]: JSON.stringify({ "practice-2": { correct: true, attempts: 3, updated: "2026-10-05T00:00:00.000Z" } }),
    });
    const e = load(store).state.exercises["practice-2"];
    expect(e).toMatchObject({ attempts: 3, lastStatus: "correct", helpLevel: 2, draft: "2500" });
  });
  it("M11: data from a newer schema is never overwritten", () => {
    const raw = JSON.stringify({ schemaVersion: 3, anything: true });
    const store = memory({ [LEARNING_KEY]: raw });
    const r = load(store);
    expect(r.readOnly).toBe(true);
    expect(store.data.get(LEARNING_KEY)).toBe(raw);
  });
  it("M13: storage that throws puts the app in memory mode", () => {
    const throwing = {
      getItem: () => {
        throw new DOMException("denied", "SecurityError");
      },
      setItem: () => {
        throw new DOMException("denied", "SecurityError");
      },
      removeItem: () => {},
    };
    expect(load(throwing)).toMatchObject({ persistent: false, readOnly: false });
    expect(load(null)).toMatchObject({ persistent: false });
  });
  it("drops individual invalid records instead of the whole state", () => {
    const store = memory({
      [LEARNING_KEY]: JSON.stringify({
        schemaVersion: 2,
        reading: {},
        checkpoints: { "think-1": { tried: true, lastResult: "maybe", updatedAt: NOW } },
        exercises: { good: { attempts: 1, helpLevel: 9, updatedAt: NOW }, bad: { attempts: -1, updatedAt: NOW } },
      }),
    });
    const r = load(store);
    expect(r.state.checkpoints).toEqual({});
    expect(r.state.exercises).toEqual({ good: { attempts: 1, helpLevel: 0, updatedAt: NOW } });
  });
});

describe("dual write and multi-tab merge", () => {
  it("M19: mirrors submissions and reading position to the V1 keys", () => {
    const store = memory();
    const state: LearningState = {
      ...emptyState(),
      reading: { lp: { lastSectionId: "integer", visited: ["integer"], updatedAt: NOW } },
      exercises: {
        "practice-3": { attempts: 1, lastStatus: "correct", helpLevel: 0, updatedAt: NOW },
        "practice-1": { attempts: 0, helpLevel: 0, draft: "26", updatedAt: NOW },
      },
    };
    writeV1Mirror(store, state);
    expect(JSON.parse(store.data.get(PRACTICE_KEY)!)).toEqual({
      "practice-3": { correct: true, attempts: 1, updated: NOW },
    });
    expect(JSON.parse(store.data.get(READING_KEY)!)).toBe("integer");
  });
  it("M20: a failing mirror write does not throw", () => {
    const failing = { ...memory(), setItem: () => { throw new Error("quota"); } };
    expect(() => writeV1Mirror(failing, emptyState())).not.toThrow();
  });
  it("M21: merges another tab's write record by record, newer wins", () => {
    const mine: LearningState = {
      ...emptyState(),
      exercises: { a: { attempts: 1, helpLevel: 0, updatedAt: "2026-10-12T01:00:00Z" }, b: { attempts: 5, helpLevel: 0, updatedAt: "2026-10-12T05:00:00Z" } },
    };
    const theirs: LearningState = {
      ...emptyState(),
      exercises: { a: { attempts: 2, helpLevel: 1, updatedAt: "2026-10-12T02:00:00Z" }, b: { attempts: 4, helpLevel: 0, updatedAt: "2026-10-12T03:00:00Z" } },
    };
    const merged = mergeStates(mine, theirs);
    expect(merged.exercises.a.attempts).toBe(2);
    expect(merged.exercises.b.attempts).toBe(5);
  });
});
