/**
 * What the learner left unfinished: lesson position and practice from the V2 learning
 * store (which migrates the V1 keys on first load), quest drafts from their own keys.
 */
import { learning } from "../../state/learning";

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
  const { state } = learning.get();
  const section = state.reading.lp?.lastSectionId;
  if (section) items.push({ kind: "reading", sectionId: section, href: `/learn/linear-programming#${section}` });
  const practiced = Object.values(state.exercises).filter((e) => e.attempts > 0);
  if (practiced.length)
    items.push({
      kind: "practice",
      attempted: practiced.length,
      wrong: practiced.filter((e) => e.lastStatus && e.lastStatus !== "correct").length,
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
