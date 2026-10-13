// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { findPrompt } from "../../content/prompts";
import { prefillPromptVars, readPromptVars } from "./PromptDetail";

afterEach(() => { sessionStorage.clear(); vi.restoreAllMocks(); });
const prompt = findPrompt("pr.breakdown.base")!;
const key = `mb.v2.promptVars.${prompt.id}`;

describe("prompt session compatibility", () => {
  it("sanitizes corrupt field values and provenance without losing valid old text", () => {
    sessionStorage.setItem(key, JSON.stringify({ values: { 题目内容: 42, 我的初步理解: "我的理解", ghost: {} }, examples: "bad", prefilled: [null, 5] }));
    expect(readPromptVars(prompt.id)).toEqual({ values: { 我的初步理解: "我的理解" }, examples: [], prefilled: [] });
  });
  it.each(["{broken", "null", '{"values":[]}'])("ignores malformed storage: %s", (raw) => {
    sessionStorage.setItem(key, raw);
    expect(readPromptVars(prompt.id)).toEqual({ values: {}, examples: [], prefilled: [] });
  });
  it("updates an untouched automatic prefill when the training case changes", () => {
    prefillPromptVars(prompt, { problemText: "A 题公开题面" });
    prefillPromptVars(prompt, { problemText: "B 题公开题面" });
    expect(readPromptVars(prompt.id).values["题目内容"]).toBe("B 题公开题面");
  });
  it("preserves manual input when moving to another case", () => {
    sessionStorage.setItem(key, JSON.stringify({ values: { 题目内容: "手工整理", 我的初步理解: "学生作答" }, examples: [], prefilled: [] }));
    prefillPromptVars(prompt, { problemText: "B 题公开题面" });
    expect(readPromptVars(prompt.id).values).toEqual({ 题目内容: "手工整理", 我的初步理解: "学生作答" });
  });
  it("uses public problem text instead of an example and removes the example label", () => {
    sessionStorage.setItem(key, JSON.stringify({ values: { 题目内容: "示例" }, examples: ["题目内容"], prefilled: [] }));
    prefillPromptVars(prompt, { problemText: "真实教学题面" });
    expect(readPromptVars(prompt.id)).toEqual({ values: { 题目内容: "真实教学题面" }, examples: [], prefilled: ["题目内容"] });
  });
  it("keeps an in-memory prefill when session storage is unavailable", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("blocked"); });
    prefillPromptVars(prompt, { problemText: "存储受限时的公开题面" });
    expect(readPromptVars(prompt.id).values["题目内容"]).toBe("存储受限时的公开题面");
  });
});
