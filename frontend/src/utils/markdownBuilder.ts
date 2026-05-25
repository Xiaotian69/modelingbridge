import type { ProviderId, StudentLevel, WorkbenchAnalysis } from "../types";
import type { StoredRecord } from "../pages/Records";

export interface WorkbenchMarkdownContext {
  problemText: string;
  attachmentNote: string;
  level: StudentLevel;
  provider: ProviderId;
  resultNotes: string;
}

export function buildWorkbenchSummary(
  d: WorkbenchAnalysis,
  ctx: { confirmedCount: number; stepCount: number; resultNotes: string }
): string {
  return [
    `题型：${d.problem_type}`,
    `主线：${d.modeling_mainline}`,
    `小问数：${d.subtasks.length}`,
    `数据字段数：${d.data_needs.length}`,
    `模型候选数：${d.models.length}`,
    `已确认节点：${ctx.confirmedCount}/${ctx.stepCount}`,
    "",
    "学习提示：",
    d.learning.recommended_next,
    "",
    "结果要点（自填）：",
    ctx.resultNotes || "（未填写）",
  ].join("\n");
}

export function buildWorkbenchUsageLog(
  d: WorkbenchAnalysis,
  ctx: WorkbenchMarkdownContext & { confirmed: boolean[]; stepTitles: string[] }
): string {
  const confirmedSteps = ctx.stepTitles.filter((_, i) => ctx.confirmed[i]);
  return [
    "AI 使用记录（试运行版）",
    `时间：${new Date().toLocaleString()}`,
    `工具：模桥 ModelingBridge AI 引导工作台`,
    `模式：${d.mode === "demo" ? "演示结构化输出" : "大模型接口输出"}`,
    `模型提供方：${d.provider || ctx.provider}`,
    `提示词版本：${d.prompt_version}`,
    `学生水平自评：${ctx.level}`,
    "",
    "输入摘要：",
    ctx.problemText.slice(0, 500),
    "",
    "附件说明：",
    ctx.attachmentNote || "无",
    "",
    "AI 输出摘要：",
    `题型：${d.problem_type}`,
    `建模主线：${d.modeling_mainline}`,
    `数据需求数量：${d.data_needs.length}`,
    `模型候选数量：${d.models.length}`,
    "",
    "人工确认节点：",
    confirmedSteps.length ? confirmedSteps.join("、") : "尚未确认",
    "",
    "人工补充/结果要点：",
    ctx.resultNotes || "暂无",
    "",
    "边界说明：本记录仅说明 AI 辅助拆解、解释和建议过程，不代表可直接提交的论文正文。",
  ].join("\n");
}

export function buildWorkbenchAnalysis(
  d: WorkbenchAnalysis,
  ctx: WorkbenchMarkdownContext
): string {
  return [
    "# AI 引导建模分析摘要",
    "",
    `生成时间：${new Date().toLocaleString()}`,
    `模型提供方：${d.provider || ctx.provider}`,
    `生成模式：${d.mode === "demo" ? "演示结构化输出" : "大模型接口输出"}`,
    `提示词版本：${d.prompt_version}`,
    `学生水平自评：${ctx.level}`,
    "",
    "## 题目摘要",
    ctx.problemText.slice(0, 800),
    "",
    "## 附件说明",
    ctx.attachmentNote || "无",
    "",
    "## 题型与建模主线",
    `- 题型：${d.problem_type}`,
    `- 混合题型可能：${d.mixed_types}`,
    `- 判断依据：${d.type_reason}`,
    `- 建模主线：${d.modeling_mainline}`,
    `- 需人工确认：${d.type_confirm_notes}`,
    "",
    "## 小问拆解",
    ...d.subtasks.map((s) => `- ${s.index}. ${s.direct_goal}；隐含目标：${s.implicit_goal}；输出：${s.outputs}`),
    "",
    "## 数据需求",
    ...d.data_needs.map((item) => `- ${item.field_name}：${item.data_role}；来源建议：${item.source_suggestion}；必须：${item.required}`),
    "",
    "## 模型候选",
    ...d.models.map((item) => `- ${item.name}（${item.tier}）：${item.reason}；局限：${item.cons}`),
    "",
    "## 行动清单",
    ...d.action_list.map((item) => `- ${item}`),
    "",
    "## 学习提示",
    d.learning.recommended_next,
    "",
    "## 人工补充",
    ctx.resultNotes || "暂无",
    "",
    "## 合规边界",
    "本摘要仅用于学习复盘和人工确认，不是可直接提交的论文正文；数据来源、模型假设、计算结果和最终表述仍需学生自行核验与完成。",
  ].join("\n");
}

export function recordToMarkdown(record: StoredRecord, index?: number): string {
  return [
    `## ${index === undefined ? "" : `${index + 1}. `}${record.title || "未命名题目"}`,
    "",
    `保存时间：${new Date(record.savedAt).toLocaleString()}`,
    "",
    "### 输出摘要",
    record.summary || "未填写",
    "",
    "### AI 使用记录",
    record.usageLog || "未保存",
    "",
  ].join("\n");
}

export function recordsToMarkdown(rows: StoredRecord[]): string {
  return [
    "# 学习记录导出",
    "",
    `导出时间：${new Date().toLocaleString()}`,
    `记录数量：${rows.length}`,
    "",
    ...rows.map((record, index) => recordToMarkdown(record, index)),
  ].join("\n");
}
