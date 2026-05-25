import { useReducer } from "react";
import { createEmptyQuestStates, questStages, updateQuestStageState, type QuestStageId, type QuestStageState } from "../quest/stages";
import { clearQuestDraft, loadQuestDraft, saveQuestDraft, type QuestDraft } from "../quest/storage";

function initialChecks(): Record<QuestStageId, boolean[]> {
  return Object.fromEntries(questStages.map((stage) => [stage.id, stage.passConditions.map(() => false)])) as Record<QuestStageId, boolean[]>;
}

export interface QuestState {
  states: QuestStageState[];
  checks: Record<QuestStageId, boolean[]>;
  activeStageId: QuestStageId;
  coachMode: "hint" | "example" | "check";
  saveStatus: string;
  loadedSourceId: string;
}

export type QuestAction =
  | { type: "LOAD_DRAFT"; payload: { sourceId: string; draft: QuestDraft | null } }
  | { type: "SET_ANSWER"; payload: { stageId: QuestStageId; answer: string } }
  | { type: "SET_CONDITION"; payload: { stageId: QuestStageId; index: number; value: boolean } }
  | { type: "COMPLETE_STAGE"; payload: { stageId: QuestStageId; nextStageId: QuestStageId | null } }
  | { type: "SET_ACTIVE_STAGE"; payload: QuestStageId }
  | { type: "SET_COACH_MODE"; payload: "hint" | "example" | "check" }
  | { type: "SET_SAVE_STATUS"; payload: string }
  | { type: "RESET"; payload: { sourceId: string } };

function reducer(state: QuestState, action: QuestAction): QuestState {
  switch (action.type) {
    case "LOAD_DRAFT": {
      const { sourceId, draft } = action.payload;
      return {
        ...state,
        states: draft?.states ?? createEmptyQuestStates(),
        checks: draft?.checks ?? initialChecks(),
        activeStageId: draft?.activeStageId ?? "read_problem",
        saveStatus: draft ? "已恢复上次闯关草稿。" : "",
        loadedSourceId: sourceId,
      };
    }
    case "SET_ANSWER":
      return {
        ...state,
        states: updateQuestStageState(state.states, action.payload.stageId, { answer: action.payload.answer, completed: false }),
        saveStatus: "",
      };
    case "SET_CONDITION":
      return {
        ...state,
        checks: {
          ...state.checks,
          [action.payload.stageId]: state.checks[action.payload.stageId].map((item, i) =>
            i === action.payload.index ? action.payload.value : item
          ),
        },
      };
    case "COMPLETE_STAGE": {
      const nextStates = updateQuestStageState(state.states, action.payload.stageId, { completed: true });
      return {
        ...state,
        states: nextStates,
        activeStageId: action.payload.nextStageId ?? state.activeStageId,
      };
    }
    case "SET_ACTIVE_STAGE":
      return { ...state, activeStageId: action.payload };
    case "SET_COACH_MODE":
      return { ...state, coachMode: action.payload };
    case "SET_SAVE_STATUS":
      return { ...state, saveStatus: action.payload };
    case "RESET": {
      clearQuestDraft(action.payload.sourceId);
      return {
        ...state,
        states: createEmptyQuestStates(),
        checks: initialChecks(),
        activeStageId: "read_problem",
        saveStatus: "已重置本次闯关进度。",
        loadedSourceId: action.payload.sourceId,
      };
    }
    default:
      return state;
  }
}

export function useQuestState(sourceId: string) {
  const initialDraft = loadQuestDraft(sourceId);
  return useReducer(reducer, {
    states: initialDraft?.states ?? createEmptyQuestStates(),
    checks: initialDraft?.checks ?? initialChecks(),
    activeStageId: initialDraft?.activeStageId ?? "read_problem",
    coachMode: "hint",
    saveStatus: initialDraft ? "已恢复上次闯关草稿。" : "",
    loadedSourceId: sourceId,
  });
}

export { saveQuestDraft, type QuestDraft };
