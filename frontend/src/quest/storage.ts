import type { QuestStageId, QuestStageState } from "./stages";

const STORAGE_PREFIX = "mb_quest_draft:";

export type QuestDraft = {
  activeStageId: QuestStageId;
  states: QuestStageState[];
  checks: Record<QuestStageId, boolean[]>;
  updatedAt: string;
};

export function getQuestDraftKey(sourceId: string): string {
  return `${STORAGE_PREFIX}${sourceId || "default"}`;
}

export function loadQuestDraft(sourceId: string): QuestDraft | null {
  try {
    const raw = localStorage.getItem(getQuestDraftKey(sourceId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as QuestDraft;
    if (!parsed || !Array.isArray(parsed.states) || !parsed.checks || !parsed.activeStageId) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveQuestDraft(sourceId: string, draft: QuestDraft) {
  localStorage.setItem(getQuestDraftKey(sourceId), JSON.stringify(draft));
}

export function clearQuestDraft(sourceId: string) {
  localStorage.removeItem(getQuestDraftKey(sourceId));
}
