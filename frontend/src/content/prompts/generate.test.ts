import { describe, expect, it } from "vitest";
import { findPrompt, generatePrompt, publishedPrompts, RULE_NOTICE } from ".";

describe("complete prompt generation", () => {
  it.each(publishedPrompts.map(p => [p.id, p] as const))("%s keeps all required boundaries in the copied output", (_, prompt) => {
    const values = Object.fromEntries(prompt.variables.map(v => [v.key, v.example]));
    const full = generatePrompt(prompt, values);
    expect(full.output).toContain(prompt.before);
    expect(full.output).toContain(prompt.limits);
    expect(full.output).toContain(RULE_NOTICE);
    expect(full.missing).toEqual([]);
    expect(full.parts.map(p => p.text).join("")).toBe(full.output);
  });
  it("counts missing required variables without parsing user code as placeholders", () => {
    const result = generatePrompt(findPrompt("pr.code.debug")!, { 代码片段: 'd = {"foo": "{编程语言}"}' });
    expect(result.missing).toEqual(["编程语言", "报错信息"]);
    expect(result.output).toContain('d = {"foo": "{编程语言}"}');
    expect(result.output).toContain("未提供（可选信息）");
  });
});
