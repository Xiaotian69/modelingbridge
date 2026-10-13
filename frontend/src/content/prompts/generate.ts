import { RULE_NOTICE, type PromptTemplate } from "./types";

const PLACEHOLDER = /\{([^{}\n]+)\}/g;
export function placeholdersOf(text: string): string[] {
  return [...new Set(Array.from(text.matchAll(PLACEHOLDER), (m) => m[1]))];
}
export type FilledPart = { text: string; kind: "text" | "filled" | "missing" };

/** Replaces only template placeholders, never braces inside the student's code or text. */
export function fillTemplate(text: string, values: Record<string, string>) {
  const parts: FilledPart[] = [];
  const missing: string[] = [];
  let last = 0;
  for (const match of text.matchAll(PLACEHOLDER)) {
    const start = match.index ?? 0;
    if (start > last) parts.push({ text: text.slice(last, start), kind: "text" });
    const raw = Object.hasOwn(values, match[1]) ? values[match[1]] : "";
    const value = typeof raw === "string" ? raw.trim() : "";
    if (value) parts.push({ text: value, kind: "filled" });
    else {
      parts.push({ text: match[0], kind: "missing" });
      if (!missing.includes(match[1])) missing.push(match[1]);
    }
    last = start + match[0].length;
  }
  if (last < text.length) parts.push({ text: text.slice(last), kind: "text" });
  return { parts, output: parts.map((p) => p.text).join(""), missing };
}

/** Preview and both copy entry points share exactly the same complete text. */
export function generatePrompt(prompt: PromptTemplate, values: Record<string, string>, raw = false) {
  const normalized = Object.fromEntries(prompt.variables.map((v) => [v.key,
    typeof values[v.key] === "string" && values[v.key].trim()
      ? values[v.key] : !v.required && !raw ? "未提供（可选信息）" : "",
  ]));
  const body = fillTemplate(prompt.templateText, normalized);
  const prefix = `【用途】${prompt.title}\n${prompt.summary}\n【使用前提】${prompt.before}\n\n`;
  const suffix = `\n\n【使用限制与核验边界】\n${prompt.limits}\n${RULE_NOTICE}`;
  return {
    missing: body.missing,
    parts: [{ text: prefix, kind: "text" } as FilledPart, ...body.parts, { text: suffix, kind: "text" } as FilledPart],
    output: prefix + body.output + suffix,
  };
}
