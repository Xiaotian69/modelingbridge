/** 建模技能包：给学生自己的 AI 工具用的完整任务说明书（网站本身不调用 AI）。 */

export type ContestId = "cumcm" | "mcm" | "apmcm" | "general";
export type SkillId = "choose" | "analysis" | "data" | "model" | "validate" | "paper";
export type SkillMode = "fresh" | "continue" | "review";
export type Depth = "both" | "stable";
export type CodeLanguage = "Python" | "MATLAB" | "R" | "none";
export type PaperPart = "outline" | "abstract" | "section";

export type SourceRef = { title: string; url: string };
/** 官方要求必须带出处；经验与待核实的条目明确标注，不混写。 */
export type RuleItem = { text: string; source?: SourceRef };

export type ContestProfile = {
  id: ContestId;
  name: string;
  short: string;
  /** 论文正文语言；“by-notice” 表示按当届通知。 */
  paperLanguage: "zh" | "en" | "by-notice";
  official: RuleItem[];
  experience: string[];
  /** 论文常见结构（经验做法，官方未规定的部分不写成要求）。 */
  structure: string[];
  abstractGuide: string[];
  /** 未覆盖时提醒用户附上的材料。 */
  attachHint?: string;
  checkedAt: string;
};

export type SkillDefinition = {
  id: SkillId;
  order: number;
  title: string;
  /** 卡片上的一句话产出。 */
  yields: string;
  purpose: string;
  modes: SkillMode[];
  /** 不同模式下需要附给 AI 的材料。 */
  inputs: Record<SkillMode, string[]>;
  steps: string[];
  outputs: string[];
  checks: string[];
  handoff: string[];
  reviewFocus: string[];
  /** 本步骤特有的高级选项。 */
  extraOptions: ("question" | "codeLanguage" | "paperPart" | "teamProfile")[];
};

export type SkillConfig = {
  skill: SkillId;
  contest: ContestId;
  mode: SkillMode;
  depth?: Depth;
  codeLanguage?: CodeLanguage;
  problemLabel?: string;
  hoursLeft?: string;
  question?: string;
  teamProfile?: string;
  paperPart?: PaperPart;
  sectionName?: string;
  reviewTarget?: string;
  handoffText?: string;
  /** 七关训练题：网站公开的题面会附在文末。 */
  caseTitle?: string;
  caseText?: string;
};
