// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { ROLES_STORAGE_KEY, TASKS } from "./content";
import { freshState, loadState, saveState } from "./storage";

afterEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

describe("roles storage recovery", () => {
  it.each([7, { choice: {} }, { skipped: false }, { choice: ["not-an-option"] }])("ignores invalid persisted task answers (%j)", (answer) => {
    const state = freshState();
    localStorage.setItem(ROLES_STORAGE_KEY, JSON.stringify({ ...state, step: "result", answers: { ...state.answers, tasks: { [TASKS[0].id]: answer } } }));
    expect(loadState()).toBeNull();
  });

  it("keeps valid partial progress", () => {
    const state = freshState();
    state.step = 2;
    state.answers.experience = { model: "none", code: "some", write: "unsure" };
    state.answers.interests = ["i-code-debug"];
    state.answers.tasks[TASKS[0].id] = { choice: [...TASKS[0].answer] };
    expect(saveState(state)).toBe(true);
    expect(loadState()).toEqual(state);
  });

  it("reports an unavailable or full browser store", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new DOMException("quota", "QuotaExceededError"); });
    expect(saveState(freshState())).toBe(false);
  });
});
