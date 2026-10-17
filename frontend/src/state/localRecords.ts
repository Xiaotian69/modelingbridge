/**
 * 学习记录 data that lives outside `mb.v2.learning` (design doc §8.3):
 * - 实战报告 in `mb_records` (unchanged format, 20 newest);
 * - 七关草稿 in `mb_quest_draft:<sourceId>` (unchanged format).
 * Every access is guarded: blocked storage simply reads as empty.
 */
export const REPORTS_KEY = "mb_records";
export const QUEST_DRAFT_PREFIX = "mb_quest_draft:";

export type StoredRecord = {
  id: string;
  savedAt: string;
  title: string;
  summary: string;
  fullReport?: string;
  usageLog?: string;
};

function store(): Storage | null {
  try {
    return typeof localStorage === "undefined" ? null : localStorage;
  } catch {
    return null;
  }
}

export function loadRecords(): StoredRecord[] {
  try {
    const raw = store()?.getItem(REPORTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as StoredRecord[];
    return Array.isArray(parsed) ? parsed.filter((r) => r && typeof r.id === "string") : [];
  } catch {
    return [];
  }
}

export function saveWorkbenchRecord(payload: { title: string; summary: string; fullReport?: string; usageLog?: string }) {
  const list = loadRecords();
  list.unshift({
    id: `${Date.now()}`,
    savedAt: new Date().toISOString(),
    title: payload.title.slice(0, 80),
    summary: payload.summary.slice(0, 2000),
    fullReport: payload.fullReport,
    usageLog: payload.usageLog?.slice(0, 5000),
  });
  try {
    store()?.setItem(REPORTS_KEY, JSON.stringify(list.slice(0, 20)));
  } catch {
    /* storage full or blocked: the report is still on screen */
  }
}

export function clearRecords() {
  try {
    store()?.removeItem(REPORTS_KEY);
  } catch {
    /* ignore */
  }
}

export type QuestDraftSummary = {
  key: string;
  sourceId: string;
  caseSlug: string | null;
  completed: number;
  started: boolean;
  updatedAt: string;
  raw: unknown;
};

export function listQuestDrafts(): QuestDraftSummary[] {
  const s = store();
  if (!s) return [];
  const out: QuestDraftSummary[] = [];
  try {
    for (let i = 0; i < s.length; i++) {
      const key = s.key(i);
      if (!key?.startsWith(QUEST_DRAFT_PREFIX)) continue;
      let raw: unknown = null;
      try {
        raw = JSON.parse(s.getItem(key) || "null");
      } catch {
        raw = null;
      }
      const draft = raw as { states?: { completed?: boolean; answer?: string }[]; updatedAt?: string } | null;
      if (!draft || !Array.isArray(draft.states)) continue;
      const sourceId = key.slice(QUEST_DRAFT_PREFIX.length);
      out.push({
        key,
        sourceId,
        caseSlug: sourceId.startsWith("case:") ? sourceId.slice(5) : null,
        completed: draft.states.filter((x) => x?.completed).length,
        started: draft.states.some((x) => x?.completed || (x?.answer ?? "").trim()),
        updatedAt: typeof draft.updatedAt === "string" ? draft.updatedAt : "",
        raw,
      });
    }
  } catch {
    return out;
  }
  return out.sort((a, b) => (a.updatedAt > b.updatedAt ? -1 : 1));
}

export function clearQuestDrafts() {
  for (const draft of listQuestDrafts()) {
    try {
      store()?.removeItem(draft.key);
    } catch {
      /* ignore */
    }
  }
}

export const questHref = (sourceId: string) =>
  sourceId.startsWith("case:") ? `/quest?case=${encodeURIComponent(sourceId.slice(5))}` : "/quest";

/** Rough size of the stored text in this browser (UTF-16, 2 bytes per char). */
export function estimateBytes(keys: string[]): number {
  const s = store();
  if (!s) return 0;
  return keys.reduce((sum, key) => {
    try {
      return sum + ((s.getItem(key)?.length ?? 0) + key.length) * 2;
    } catch {
      return sum;
    }
  }, 0);
}
