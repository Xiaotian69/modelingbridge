export type StudentLevel = "beginner" | "intermediate" | "advanced";
export type ProviderId = "default" | "deepseek" | "mimo";

export interface SubtaskRow {
  id: string;
  index: number;
  direct_goal: string;
  implicit_goal: string;
  inputs: string;
  outputs: string;
  constraints: string;
  metrics: string;
}

export interface DataNeedRow {
  field_name: string;
  data_role: string;
  source_suggestion: string;
  required: "必须" | "可选";
  fallback_if_missing: string;
  needs_manual_confirm: boolean;
}

export interface ModelRow {
  name: string;
  tier: "基础模型" | "进阶模型";
  model_type: string;
  reason: string;
  inputs: string;
  outputs: string;
  pros: string;
  cons: string;
  validation: string;
}

export interface LearningExplain {
  why_important: string;
  common_mistakes: string;
  done_criteria: string;
  student_must_confirm: string;
  recommended_next: string;
}

export interface WorkbenchAnalysis {
  problem_type: string;
  type_reason: string;
  mixed_types: string;
  modeling_mainline: string;
  type_confirm_notes: string;
  subtasks: SubtaskRow[];
  data_needs: DataNeedRow[];
  models: ModelRow[];
  learning: LearningExplain;
  action_list: string[];
  prompt_version: string;
  mode: "llm" | "demo";
  provider: string;
}

export interface LlmProviderInfo {
  id: ProviderId;
  name: string;
  model: string;
  enabled: boolean;
  note: string;
}

export interface ContestPlanInput {
  student_level: StudentLevel;
  weekly_hours: number;
  goal: string;
  team_status: string;
  strengths: string;
  weaknesses: string;
  selected_contests: Record<string, unknown>[];
  provider: ProviderId;
}

export interface ContestPlanOutput {
  mode: "llm" | "demo";
  provider: string;
  summary: string;
  recommended_path: string[];
  monthly_plan: Array<{
    month: string;
    focus: string;
    tasks: string[];
    deliverable: string;
  }>;
  weekly_rhythm: string[];
  risk_notes: string[];
  next_actions: string[];
}

export interface ResourceFile {
  id: string;
  name: string;
  title: string;
  kind: string;
  group: string;
  year: string;
  extension: string;
  size: number;
  relative_path: string;
  download_url: string;
}

export interface ResourceListResponse {
  summary: {
    total: number;
    groups: Array<{
      key: string;
      title: string;
      kind: string;
      exists: boolean;
      path: string;
    }>;
  };
  items: ResourceFile[];
}

export interface CaseSummary {
  slug: string;
  title: string;
  difficulty: string;
  coverage: string[];
  audience: string;
  data_status: string;
  summary: string;
}

export interface CaseDetail extends CaseSummary {
  sections: Record<string, string>;
}
