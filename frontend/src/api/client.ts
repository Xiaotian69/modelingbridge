import type {
  CaseDetail,
  CaseSummary,
  ContestPlanInput,
  ContestPlanOutput,
  LlmProviderInfo,
  ProviderId,
  ResourceListResponse,
  StudentLevel,
  WorkbenchAnalysis,
} from "../types";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/$/, "");

function apiUrl(path: string): string {
  return `${API_BASE_URL}${path}`;
}

export async function analyzeProblem(input: {
  problem_text: string;
  attachment_note: string;
  student_level: StudentLevel;
  provider: ProviderId;
}): Promise<WorkbenchAnalysis> {
  const r = await fetch(apiUrl("/api/analyze-problem"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!r.ok) {
    const t = await r.text();
    throw new Error(t || `请求失败：${r.status}`);
  }
  return r.json();
}

export async function listCases(): Promise<CaseSummary[]> {
  const r = await fetch(apiUrl("/api/cases"));
  if (!r.ok) throw new Error("案例列表加载失败");
  return r.json();
}

export async function getCase(slug: string): Promise<CaseDetail> {
  const r = await fetch(apiUrl(`/api/cases/${encodeURIComponent(slug)}`));
  if (!r.ok) throw new Error("案例不存在或加载失败");
  return r.json();
}

export async function getPromptVersion(): Promise<{ workbench_prompt: string; updated: string }> {
  const r = await fetch(apiUrl("/api/prompts/version"));
  if (!r.ok) throw new Error("版本信息加载失败");
  return r.json();
}

export async function listLlmProviders(): Promise<LlmProviderInfo[]> {
  const r = await fetch(apiUrl("/api/llm-providers"));
  if (!r.ok) throw new Error("模型列表加载失败");
  return r.json();
}

export async function generateContestPlan(input: ContestPlanInput): Promise<ContestPlanOutput> {
  const r = await fetch(apiUrl("/api/contest-plan"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!r.ok) {
    const t = await r.text();
    throw new Error(t || `规划生成失败：${r.status}`);
  }
  return r.json();
}

export async function listResources(input: { q?: string; kind?: string; limit?: number } = {}): Promise<ResourceListResponse> {
  const params = new URLSearchParams();
  if (input.q) params.set("q", input.q);
  if (input.kind) params.set("kind", input.kind);
  if (input.limit) params.set("limit", String(input.limit));
  const query = params.toString();
  const r = await fetch(apiUrl(`/api/resources${query ? `?${query}` : ""}`));
  if (!r.ok) throw new Error("资源列表加载失败");
  return r.json();
}
