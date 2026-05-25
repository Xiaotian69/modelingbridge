import { useReducer } from "react";
import type { LlmProviderInfo, ProviderId, StudentLevel, WorkbenchAnalysis } from "../types";

const STEPS_COUNT = 8;

export interface WorkbenchState {
  problemText: string;
  attachmentNote: string;
  level: StudentLevel;
  provider: ProviderId;
  providers: LlmProviderInfo[];
  step: number;
  confirmed: boolean[];
  resultNotes: string;
  explainOpen: boolean;
  data: WorkbenchAnalysis | null;
  loading: boolean;
  error: string | null;
  copyStatus: string;
  promptMeta: { workbench_prompt: string; updated: string } | null;
}

export type WorkbenchAction =
  | { type: "SET_PROBLEM_TEXT"; payload: string }
  | { type: "SET_ATTACHMENT_NOTE"; payload: string }
  | { type: "SET_LEVEL"; payload: StudentLevel }
  | { type: "SET_PROVIDER"; payload: ProviderId }
  | { type: "SET_PROVIDERS"; payload: LlmProviderInfo[] }
  | { type: "SET_STEP"; payload: number }
  | { type: "MARK_CONFIRMED"; payload: { index: number; value: boolean } }
  | { type: "SET_RESULT_NOTES"; payload: string }
  | { type: "TOGGLE_EXPLAIN" }
  | { type: "CLOSE_EXPLAIN" }
  | { type: "SET_COPY_STATUS"; payload: string }
  | { type: "SET_PROMPT_META"; payload: WorkbenchState["promptMeta"] }
  | { type: "ANALYZE_START" }
  | { type: "ANALYZE_SUCCESS"; payload: WorkbenchAnalysis }
  | { type: "ANALYZE_ERROR"; payload: string }
  | { type: "CONFIRM_STEP"; payload: number };

function reducer(state: WorkbenchState, action: WorkbenchAction): WorkbenchState {
  switch (action.type) {
    case "SET_PROBLEM_TEXT":
      return { ...state, problemText: action.payload };
    case "SET_ATTACHMENT_NOTE":
      return { ...state, attachmentNote: action.payload };
    case "SET_LEVEL":
      return { ...state, level: action.payload };
    case "SET_PROVIDER":
      return { ...state, provider: action.payload };
    case "SET_PROVIDERS":
      return { ...state, providers: action.payload };
    case "SET_STEP":
      return { ...state, step: action.payload };
    case "MARK_CONFIRMED": {
      const next = [...state.confirmed];
      next[action.payload.index] = action.payload.value;
      return { ...state, confirmed: next };
    }
    case "SET_RESULT_NOTES":
      return { ...state, resultNotes: action.payload };
    case "TOGGLE_EXPLAIN":
      return { ...state, explainOpen: !state.explainOpen };
    case "CLOSE_EXPLAIN":
      return { ...state, explainOpen: false };
    case "SET_COPY_STATUS":
      return { ...state, copyStatus: action.payload };
    case "SET_PROMPT_META":
      return { ...state, promptMeta: action.payload };
    case "ANALYZE_START":
      return {
        ...state,
        loading: true,
        error: null,
        confirmed: Array(STEPS_COUNT).fill(false),
        step: 0,
        explainOpen: false,
        copyStatus: "",
      };
    case "ANALYZE_SUCCESS":
      return {
        ...state,
        loading: false,
        data: action.payload,
        confirmed: Array(STEPS_COUNT).fill(false),
      };
    case "ANALYZE_ERROR":
      return { ...state, loading: false, data: null, error: action.payload };
    case "CONFIRM_STEP": {
      const i = action.payload;
      const next = [...state.confirmed];
      next[i] = true;
      return { ...state, confirmed: next, explainOpen: false, step: i < STEPS_COUNT - 1 ? i + 1 : i };
    }
    default:
      return state;
  }
}

export function useWorkbenchState(initialProblemText: string, initialAttachmentNote: string) {
  return useReducer(reducer, {
    problemText: initialProblemText,
    attachmentNote: initialAttachmentNote,
    level: "beginner",
    provider: "deepseek",
    providers: [],
    step: 0,
    confirmed: Array(STEPS_COUNT).fill(false),
    resultNotes: "",
    explainOpen: false,
    data: null,
    loading: false,
    error: null,
    copyStatus: "",
    promptMeta: null,
  });
}
