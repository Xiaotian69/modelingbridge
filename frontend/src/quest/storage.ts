import { questStages, type QuestStageId, type QuestStageState } from "./stages";

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

function normalizeDraft(draft: QuestDraft): QuestDraft {
  const now = new Date().toISOString();
  const states: QuestStageState[] = questStages.map((stage) => {
    const existing = draft.states.find((s) => s.stageId === stage.id);
    return existing ?? { stageId: stage.id, answer: "", completed: false, updatedAt: now };
  });
  const checks = Object.fromEntries(
    questStages.map((stage) => {
      const existing = draft.checks[stage.id as QuestStageId];
      return [stage.id, stage.passConditions.map((_, i) => existing?.[i] ?? false)];
    }),
  ) as Record<QuestStageId, boolean[]>;
  return { ...draft, states, checks };
}

export function loadQuestDraft(sourceId: string): QuestDraft | null {
  try {
    const raw = localStorage.getItem(getQuestDraftKey(sourceId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as QuestDraft;
    if (!parsed || !Array.isArray(parsed.states) || !parsed.checks || !parsed.activeStageId) return null;
    return normalizeDraft(parsed);
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
