/**
 * Reads what the learner left unfinished from the existing (V1) local keys.
 * Read-only: batch 1 does not migrate or rewrite any stored data.
 */
import { READING_KEY, readHistory } from "../../learning/storage";

const QUEST_PREFIX = "mb_quest_draft:";
const QUEST_TOTAL = 7;

export type ContinueItem =
  | { kind: "reading"; sectionId: string; href: string }
  | { kind: "practice"; attempted: number; wrong: number; href: string }
  | { kind: "quest"; completed: number; total: number; href: string; updatedAt: string };

function safeStorage(): Storage | null {
  try {
    return typeof localStorage === "undefined" ? null : localStorage;
  } catch {
    return null;
  }
}

export function readContinueItems(store: Storage | null = safeStorage()): ContinueItem[] {
  if (!store) return [];
  const items: ContinueItem[] = [];
  try {
    const section: unknown = JSON.parse(store.getItem(READING_KEY) || "null");
    if (typeof section === "string" && /^[a-z-]+$/.test(section))
      items.push({ kind: "reading", sectionId: section, href: `/learn/linear-programming#${section}` });
  } catch {
    /* Corrupt reading position: ignore. */
  }
  const history = readHistory();
  const practiced = Object.entries(history).filter(([id]) => id !== "think-1");
  if (practiced.length)
    items.push({
      kind: "practice",
      attempted: practiced.length,
      wrong: practiced.filter(([, a]) => !a.correct).length,
      href: "/practice/linear-programming",
    });
  let latestQuest: Extract<ContinueItem, { kind: "quest" }> | null = null;
  try {
    for (let i = 0; i < store.length; i++) {
      const key = store.key(i);
      if (!key?.startsWith(QUEST_PREFIX)) continue;
      const draft = JSON.parse(store.getItem(key) || "null") as {
        states?: { completed?: boolean; answer?: string }[];
        updatedAt?: string;
      } | null;
      if (!draft || !Array.isArray(draft.states)) continue;
      const started = draft.states.some((s) => s.completed || (s.answer ?? "").trim());
      if (!started) continue;
      const completed = draft.states.filter((s) => s.completed).length;
      const source = key.slice(QUEST_PREFIX.length);
      const href = source.startsWith("case:")
        ? `/quest?case=${encodeURIComponent(source.slice(5))}`
        : "/quest";
      const updatedAt = typeof draft.updatedAt === "string" ? draft.updatedAt : "";
      if (!latestQuest || updatedAt > latestQuest.updatedAt)
        latestQuest = { kind: "quest", completed, total: QUEST_TOTAL, href, updatedAt };
    }
  } catch {
    /* Storage enumeration failed: skip quests. */
  }
  if (latestQuest) items.push(latestQuest);
  return items;
}
