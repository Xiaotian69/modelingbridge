import type { QuestStageId } from "../../quest/stages";
import { existingTemplates } from "./existing";
import { additionalTemplates } from "./additional";
import type { PromptTemplate } from "./types";
export * from "./types";
export * from "./generate";

export const promptTemplates: PromptTemplate[] = [...existingTemplates, ...additionalTemplates];
export const publishedPrompts = promptTemplates.filter((p) => p.reviewStatus !== "draft");
export const REVIEW_LABEL: Record<Exclude<PromptTemplate["reviewStatus"], "draft">, { short: string; long: string }> = {
  "self-checked": { short: "待复核", long: "作者已自查，尚未经负责人审核" },
  "owner-reviewed": { short: "已审核", long: "负责人已审核" },
};
export const findPrompt = (id: string) => publishedPrompts.find((p) => p.id === id) ?? null;
export const promptsForStage = (stage: QuestStageId) => publishedPrompts.filter((p) => p.stage.includes(stage));
