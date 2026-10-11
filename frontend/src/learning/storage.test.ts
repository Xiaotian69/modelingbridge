// @vitest-environment jsdom
import { afterEach, expect, it, vi } from "vitest";
import {
  PRACTICE_KEY,
  READING_KEY,
  readHistory,
  readPosition,
  save,
} from "./storage";
afterEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
});
it("ignores damaged local records and unknown reading anchors", () => {
  localStorage.setItem(PRACTICE_KEY, "{bad json");
  expect(readHistory()).toEqual({});
  localStorage.setItem(
    PRACTICE_KEY,
    JSON.stringify({
      bad: { correct: "yes" },
      good: { correct: false, attempts: 2, updated: "today" },
    }),
  );
  expect(Object.keys(readHistory())).toEqual(["good"]);
  save(READING_KEY, "old-section");
  expect(readPosition(["problem"])).toBeNull();
  save(READING_KEY, "problem");
  expect(readPosition(["problem"])).toBe("problem");
});
it("reports blocked storage without crashing learning", () => {
  vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
    throw new Error("quota");
  });
  expect(save(READING_KEY, "problem")).toBe(false);
});
