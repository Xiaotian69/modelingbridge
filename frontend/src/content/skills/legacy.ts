import type { QuestStageId } from "../../quest/stages";
import type { PaperPart, SkillId, SkillMode } from "./types";

type Target = { skill: SkillId; mode: SkillMode; paperPart?: PaperPart; section?: string; from?: "legacy-ai" };

/**
 * 旧的两条 AI 模板不新建规则模块：落到“论文写作 · 指定章节”，章节预设为论文中的 AI 使用说明，
 * 页面另行提示“以当届官方规则为准”。
 */
const AI_SECTION: Target = { skill: "paper", mode: "fresh", paperPart: "section", section: "AI 工具使用说明", from: "legacy-ai" };

/** V2.0/V2.1 提示词库的 15 个 ID → 新技能（旧书签、旧搜索结果不失效）。 */
export const LEGACY_PROMPTS: Record<string, Target> = {
  "pr.breakdown.base": { skill: "analysis", mode: "fresh" },
  "pr.breakdown.io": { skill: "analysis", mode: "fresh" },
  "pr.assumption.check": { skill: "analysis", mode: "review" },
  "pr.method.compare": { skill: "model", mode: "fresh" },
  "pr.data.plan": { skill: "data", mode: "review" },
  "pr.data.outliers": { skill: "data", mode: "fresh" },
  "pr.code.debug": { skill: "model", mode: "review" },
  "pr.chart.plan": { skill: "validate", mode: "fresh" },
  "pr.validation.sensitivity": { skill: "validate", mode: "fresh" },
  "pr.validation.results": { skill: "validate", mode: "review" },
  "pr.paper.abstract": { skill: "paper", mode: "fresh", paperPart: "abstract" },
  "pr.paper.logic": { skill: "paper", mode: "review" },
  "pr.paper.selfcheck": { skill: "paper", mode: "review" },
  "pr.ai.usage": AI_SECTION,
  "pr.ai.rules": AI_SECTION,
};

export function legacyTarget(promptId: string | undefined) {
  const t = promptId ? LEGACY_PROMPTS[promptId] : undefined;
  if (!t) return "/library/skills";
  const q = new URLSearchParams();
  if (t.mode !== "fresh") q.set("mode", t.mode);
  if (t.paperPart) q.set("part", t.paperPart);
  if (t.section) q.set("section", t.section);
  if (t.from) q.set("from", t.from);
  const s = q.toString();
  return `/library/skills/${t.skill}${s ? `?${s}` : ""}`;
}

/** 七关每一关对应的技能。 */
export const QUEST_STAGE_SKILL: Record<QuestStageId, SkillId> = {
  read_problem: "analysis",
  breakdown: "analysis",
  data: "data",
  model: "model",
  code: "model",
  charts: "validate",
  paper: "paper",
};
