import { findPrompt, type PromptTemplate } from "../../content/prompts";

export type PromptValues = { values: Record<string, string>; examples: string[]; prefilled: string[] };
const keyFor = (id: string) => `mb.v2.promptVars.${id}`;
// Only used when the browser refuses writes. Never persisted outside this tab.
const unsaved = new Map<string, PromptValues>();
const empty = (): PromptValues => ({ values: {}, examples: [], prefilled: [] });

export function readPromptVars(id: string): PromptValues {
  if (unsaved.has(id)) return structuredClone(unsaved.get(id)!);
  try {
    const parsed: unknown = JSON.parse(sessionStorage.getItem(keyFor(id)) ?? "null");
    if (!parsed || typeof parsed !== "object") return empty();
    const record = parsed as Record<string, unknown>;
    if (!record.values || typeof record.values !== "object" || Array.isArray(record.values)) return empty();
    const keys = new Set(findPrompt(id)?.variables.map((v) => v.key) ?? []);
    const values = Object.fromEntries(Object.entries(record.values).filter(([k, v]) => keys.has(k) && typeof v === "string")) as Record<string, string>;
    const flags = (raw: unknown) => Array.isArray(raw)
      ? [...new Set(raw.filter((v): v is string => typeof v === "string" && keys.has(v) && !!values[v]?.trim()))] : [];
    const examples = flags(record.examples);
    return { values, examples, prefilled: flags(record.prefilled).filter((k) => !examples.includes(k)) };
  } catch {
    return empty();
  }
}

export function writePromptVars(id: string, stored: PromptValues) {
  try {
    sessionStorage.setItem(keyFor(id), JSON.stringify(stored));
    unsaved.delete(id);
  } catch {
    unsaved.set(id, structuredClone(stored));
  }
}

/** Refresh only automatic/example text. A user edit removes its provenance flag. */
export function prefillPromptVars(prompt: PromptTemplate, source: { problemText: string }) {
  if (!source.problemText.trim()) return;
  const stored = readPromptVars(prompt.id);
  let changed = false;
  for (const v of prompt.variables) {
    if (v.prefillFrom !== "quest.problemText") continue;
    if (!stored.values[v.key]?.trim() || stored.prefilled.includes(v.key) || stored.examples.includes(v.key)) {
      stored.values[v.key] = source.problemText;
      stored.examples = stored.examples.filter((k) => k !== v.key);
      stored.prefilled = [...new Set([...stored.prefilled, v.key])];
      changed = true;
    }
  }
  if (changed) writePromptVars(prompt.id, stored);
}
