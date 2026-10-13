/**
 * 提示词库 (design doc §8.2 PromptTemplate, 03 §3).
 *
 * All templates are original ModelingBridge demo templates. None is copied from `资料/`,
 * `数学建模Prompt/` or any third-party collection. Copying a template only writes text to the
 * clipboard; nothing here sends a request to any AI service.
 *
 * Placeholders are written `{变量名}`; every placeholder must appear in `variables` and the
 * other way round (checked by prompts.test.ts).
 */
import type { QuestStageId } from "../../quest/stages";

export const PROMPT_TASK_TYPES = [
  "读题拆解",
  "假设与变量",
  "方法选择",
  "数据预处理",
  "代码调试",
  "图表",
  "论文自检",
  "AI使用说明",
] as const;
export type PromptTaskType = (typeof PROMPT_TASK_TYPES)[number];

export type PromptVariable = {
  key: string;
  label: string;
  required: boolean;
  example: string;
  multiline?: boolean;
  /** Filled from the current 七关 training problem when opened from a stage. */
  prefillFrom?: "quest.caseTitle" | "quest.problemText";
};

export type PromptTemplate = {
  id: string;
  title: string;
  summary: string;
  taskType: PromptTaskType;
  stage: QuestStageId[];
  templateText: string;
  variables: PromptVariable[];
  /** 使用前提: what the student should have done before using it. */
  before: string;
  limits: string;
  source: { author: string };
  licenseStatus: "original";
  version: string;
  updatedAt: string;
  /**
   * self-checked = 作者自查 + 自动检查通过，**尚未经负责人审核**（界面显示“待复核”）；
   * owner-reviewed = 负责人已逐条审核；draft = 不公开。
   */
  reviewStatus: "self-checked" | "owner-reviewed" | "draft";
  demo: true;
};

const AUTHOR = "模桥 ModelingBridge（原创）";
const COMMON_LIMITS =
  "AI 的输出只能作为思路参考，模型选择、数学结论、数据和引用都要自己核对；不得用于捏造数据、结果或参考文献，也不要让 AI 直接写可提交的论文正文。";

export const promptTemplates: PromptTemplate[] = [
  {
    id: "pr.breakdown.base",
    title: "赛题拆解 · 基础版",
    summary: "先写下自己的理解，再请 AI 追问：目标、约束、对象和还不确定的信息。",
    taskType: "读题拆解",
    stage: ["read_problem", "breakdown"],
    templateText: `我正在练习数学建模比赛（{比赛名称}）的读题。请你扮演建模教练，不要直接给出模型或答案。

【题目】
{题目内容}

【我自己的初步理解】
{我的初步理解}

请按下面顺序帮助我：
1. 用一句话复述你认为的核心目标，并指出与我的理解不一致的地方；
2. 列出题目中的研究对象、决策或预测目标、明确约束，各自引用题目原句；
3. 指出我遗漏的 1–3 个关键条件或隐含要求；
4. 列出仍需我去确认的信息（数据来源、单位、时间范围等）。
不要推荐具体模型，不要替我写结论。`,
    variables: [
      { key: "比赛名称", label: "比赛名称", required: false, example: "全国大学生数学建模竞赛校内选拔" },
      { key: "题目内容", label: "题目内容（可粘贴题面）", required: true, example: "某市共享单车管理部门希望基于历史订单数据预测未来一周各区域需求量……", multiline: true, prefillFrom: "quest.problemText" },
      { key: "我的初步理解", label: "我的初步理解", required: true, example: "我认为核心是先预测各区域需求，再在车辆总数限制下安排调度。", multiline: true },
    ],
    before: "先自己完整读一遍题，写下初步理解后再使用。",
    limits: COMMON_LIMITS,
    source: { author: AUTHOR },
    licenseStatus: "original",
    version: "1.0",
    updatedAt: "2026-10-12",
    reviewStatus: "self-checked",
    demo: true,
  },
  {
    id: "pr.breakdown.io",
    title: "小问输入输出表",
    summary: "把自己拆出的小问整理成“输入 → 输出 → 评价标准”表格，请 AI 检查缺漏。",
    taskType: "读题拆解",
    stage: ["breakdown"],
    templateText: `下面是我对一道数学建模题的拆解。请帮我检查，而不是重新替我拆解。

【题目摘要】
{题目内容}

【我拆出的小问】
{我的小问列表}

请输出一张表，列为：小问 | 需要的输入 | 预期输出 | 如何判断做得好不好 | 你的疑问。
然后指出：哪些小问的输出不明确、哪些小问之间有先后依赖、是否漏掉了题目要求的小问。
请保留我的原始拆法，只在“你的疑问”一列提出修改建议。`,
    variables: [
      { key: "题目内容", label: "题目摘要", required: true, example: "在车辆总数约束下预测需求并给出调度方案，使缺车率与运营成本综合最优。", multiline: true, prefillFrom: "quest.problemText" },
      { key: "我的小问列表", label: "我拆出的小问", required: true, example: "1. 预测各区域未来一周每日需求\n2. 计算各区域缺车量\n3. 制定调度方案", multiline: true },
    ],
    before: "先自己拆出 2–4 个小问再使用。",
    limits: COMMON_LIMITS,
    source: { author: AUTHOR },
    licenseStatus: "original",
    version: "1.0",
    updatedAt: "2026-10-12",
    reviewStatus: "self-checked",
    demo: true,
  },
  {
    id: "pr.assumption.check",
    title: "假设与变量自检",
    summary: "列出自己的假设和变量，请 AI 找出不合理、无法检验或与题意冲突的地方。",
    taskType: "假设与变量",
    stage: ["model"],
    templateText: `我在为一道数学建模题建立模型，下面是我的假设和变量定义。请逐条审查。

【问题描述】
{问题描述}

【我的假设】
{我的假设}

【我的变量与符号】
{我的变量}

请对每条假设回答：是否必要？是否与题意冲突？如何在论文中说明其合理性或做敏感性检验？
对每个变量回答：含义和单位是否清楚？是否与其他变量重复？
最后指出还缺少哪些必要的假设或变量。不要替我选择模型。`,
    variables: [
      { key: "问题描述", label: "问题描述", required: true, example: "在两种资源限制下安排两种产品的产量，使总利润最大。", multiline: true },
      { key: "我的假设", label: "我的假设", required: true, example: "1. 单位利润在计划范围内不变\n2. 产量可以取非负小数", multiline: true },
      { key: "我的变量", label: "我的变量与符号", required: true, example: "x：产品 A 的产量（m²）\ny：产品 B 的产量（m²）", multiline: true },
    ],
    before: "先写出至少 2 条假设和全部变量定义。",
    limits: COMMON_LIMITS,
    source: { author: AUTHOR },
    licenseStatus: "original",
    version: "1.0",
    updatedAt: "2026-10-12",
    reviewStatus: "self-checked",
    demo: true,
  },
  {
    id: "pr.method.compare",
    title: "模型选择对比",
    summary: "给出小问目标、数据情况和候选方法，请 AI 对比适用条件与风险，最终由自己决定。",
    taskType: "方法选择",
    stage: ["model"],
    templateText: `我需要为一个建模小问选择方法，请帮我比较，但最终选择由我决定。

【小问目标】
{小问目标}

【数据情况】
{数据情况}

【我考虑的候选方法】
{候选方法}

请用表格比较每个候选方法：适用条件 | 需要的数据 | 输出是否回答了小问 | 主要风险 | 如何检验结果。
再列出 1 个我没想到、但可能更简单的基线方法。
不要给出“最佳方法”的结论，也不要编造文献或数据。`,
    variables: [
      { key: "小问目标", label: "小问目标", required: true, example: "预测未来 7 天每个区域的单车需求量" },
      { key: "数据情况", label: "数据情况", required: true, example: "过去 90 天按小时统计的订单数，含天气字段，约 5% 缺失", multiline: true },
      { key: "候选方法", label: "我考虑的候选方法", required: true, example: "时间序列（ARIMA）、随机森林回归" },
    ],
    before: "先查过方法速查卡，写出自己倾向的 1–2 个候选方法。",
    limits: COMMON_LIMITS,
    source: { author: AUTHOR },
    licenseStatus: "original",
    version: "1.0",
    updatedAt: "2026-10-12",
    reviewStatus: "self-checked",
    demo: true,
  },
  {
    id: "pr.data.plan",
    title: "数据清洗计划审查",
    summary: "描述字段和已发现的问题，请 AI 审查清洗步骤是否会引入偏差。",
    taskType: "数据预处理",
    stage: ["data"],
    templateText: `请审查我的数据预处理计划。只针对我提供的字段说明讨论，不要假设或编造任何数据值。

【字段说明】
{数据字段说明}

【我已发现的问题】
{已发现的问题}

【我打算的处理方式】
{处理计划}

请指出：
1. 每一步处理可能带来的偏差或信息损失；
2. 哪些处理需要在论文中说明理由；
3. 训练集与测试集是否存在信息泄漏风险；
4. 还应检查的数据质量问题（单位、重复、异常值、时间对齐等）。`,
    variables: [
      { key: "数据字段说明", label: "字段说明", required: true, example: "date（日期）、region（区域编号）、orders（订单数）、temp（气温，℃）", multiline: true },
      { key: "已发现的问题", label: "已发现的问题", required: true, example: "约 5% 的 temp 缺失；有 3 天订单数为 0", multiline: true },
      { key: "处理计划", label: "我打算的处理方式", required: true, example: "temp 用前后两天均值填补；订单为 0 的天直接删除", multiline: true },
    ],
    before: "先自己浏览数据，记录字段含义和发现的问题。",
    limits: COMMON_LIMITS,
    source: { author: AUTHOR },
    licenseStatus: "original",
    version: "1.0",
    updatedAt: "2026-10-12",
    reviewStatus: "self-checked",
    demo: true,
  },
  {
    id: "pr.code.debug",
    title: "代码报错排查",
    summary: "附上代码片段、完整报错和已尝试的办法，请 AI 解释原因并给出最小修改。",
    taskType: "代码调试",
    stage: ["code"],
    templateText: `我的 {编程语言} 代码报错了，请帮我定位原因。

【代码片段】
{代码片段}

【完整报错信息】
{报错信息}

【我已经尝试过】
{我已尝试}

请先用两三句话解释报错的直接原因，再给出最小的修改建议，并说明为什么这样改。
如果信息不够判断，请告诉我还需要提供什么（例如数据的前几行、变量的形状）。
不要重写整个程序。`,
    variables: [
      { key: "编程语言", label: "编程语言", required: true, example: "Python 3.11（pandas 2.x）" },
      { key: "代码片段", label: "代码片段（只放相关部分）", required: true, example: "df['date'] = pd.to_datetime(df['日期'])", multiline: true },
      { key: "报错信息", label: "完整报错信息", required: true, example: "KeyError: '日期'", multiline: true },
      { key: "我已尝试", label: "我已经尝试过", required: false, example: "检查了文件路径，确认文件能读入", multiline: true },
    ],
    before: "先读一遍报错的最后一行，并确认能稳定复现。不要粘贴密钥或个人信息。",
    limits: COMMON_LIMITS,
    source: { author: AUTHOR },
    licenseStatus: "original",
    version: "1.0",
    updatedAt: "2026-10-12",
    reviewStatus: "self-checked",
    demo: true,
  },
  {
    id: "pr.chart.plan",
    title: "图表方案评审",
    summary: "列出想表达的结论和手头数据，请 AI 评审每张图是否真正服务一个结论。",
    taskType: "图表",
    stage: ["charts"],
    templateText: `我在规划建模论文中的图表，请评审我的方案。

【我想表达的结论】
{结论列表}

【现有数据与结果】
{现有数据}

【我计划画的图】
{图表计划}

请对每张图回答：它支撑哪条结论？图型是否合适（如趋势用折线、比较用柱状）？坐标轴和单位要怎样标注？是否与其他图重复？
最后指出哪条结论还缺少图表或数据支撑。不要编造任何数值。`,
    variables: [
      { key: "结论列表", label: "我想表达的结论", required: true, example: "1. 工作日早晚高峰需求明显高于周末\n2. 调度后缺车率下降", multiline: true },
      { key: "现有数据", label: "现有数据与结果", required: true, example: "各区域逐小时需求预测值；调度前后的缺车率", multiline: true },
      { key: "图表计划", label: "我计划画的图", required: true, example: "图 1 逐小时需求折线；图 2 调度前后缺车率柱状图", multiline: true },
    ],
    before: "先写出 2–4 条想表达的结论。",
    limits: COMMON_LIMITS,
    source: { author: AUTHOR },
    licenseStatus: "original",
    version: "1.0",
    updatedAt: "2026-10-12",
    reviewStatus: "self-checked",
    demo: true,
  },
  {
    id: "pr.paper.selfcheck",
    title: "论文自检清单",
    summary: "粘贴自己写好的摘要，请 AI 按清单逐项检查，只提问题不代写。",
    taskType: "论文自检",
    stage: ["paper"],
    templateText: `下面是我为数学建模比赛（{比赛名称}）写的论文摘要。请按清单逐项检查，只指出问题，不要改写成新的摘要。

【我的摘要】
{论文摘要}

检查清单：
1. 是否说清了每个小问用的方法和得到的主要结果（含关键数值）？
2. 每个结果是否写明了对应的小问和所用模型，方便我回到正文逐条核对？
3. 是否提到了模型检验或敏感性分析？
4. 是否有空泛表述（如“效果很好”）需要换成具体结论？
5. 篇幅和结构是否符合常见要求？（具体字数、页数以当届官方规则为准）
请对每一项给出“通过 / 需修改”和一句理由。`,
    variables: [
      { key: "比赛名称", label: "比赛名称", required: false, example: "MCM/ICM" },
      { key: "论文摘要", label: "我的摘要", required: true, example: "针对问题一，我们建立了……", multiline: true },
    ],
    before: "先完成自己的摘要初稿。",
    limits: COMMON_LIMITS,
    source: { author: AUTHOR },
    licenseStatus: "original",
    version: "1.1",
    updatedAt: "2026-10-13",
    reviewStatus: "self-checked",
    demo: true,
  },
  {
    id: "pr.ai.usage",
    title: "AI 使用记录整理",
    summary: "把自己用过 AI 的场景整理成如实、可核对的使用说明，便于按比赛规则披露。",
    taskType: "AI使用说明",
    stage: ["paper"],
    templateText: `请帮我把下面的 AI 使用记录整理成一份如实的使用说明。只能整理我提供的信息，不要补充我没有做过的使用，也不要淡化 AI 的作用。

【使用过的工具和版本】
{使用过的工具}

【使用场景记录（时间、问了什么、怎样采用或修改）】
{使用场景记录}

请输出：
1. 一张表：时间 | 工具 | 用途 | AI 输出的处理方式（直接采用 / 修改后采用 / 未采用）| 人工核验方式；
2. 一段简短的总体说明，写明哪些工作由队员独立完成。
提醒：是否允许使用 AI、如何披露、格式要求，以当届比赛官方规则为准。`,
    variables: [
      { key: "使用过的工具", label: "使用过的工具和版本", required: true, example: "某对话式 AI 工具（网页版，2026 年 10 月）" },
      { key: "使用场景记录", label: "使用场景记录", required: true, example: "10/12 晚：请 AI 检查小问拆解表，采纳了“补充评价标准”的建议，其余未采用。", multiline: true },
    ],
    before: "比赛过程中随手记录每次使用 AI 的时间、问题和处理方式。",
    limits: COMMON_LIMITS,
    source: { author: AUTHOR },
    licenseStatus: "original",
    version: "1.0",
    updatedAt: "2026-10-12",
    reviewStatus: "self-checked",
    demo: true,
  },
];

/** Templates that may be shown publicly (drafts never are). */
export const publishedPrompts = promptTemplates.filter((p) => p.reviewStatus !== "draft");

/** Public wording of the review state; nothing self-checked is ever called “已审核”. */
export const REVIEW_LABEL: Record<Exclude<PromptTemplate["reviewStatus"], "draft">, { short: string; long: string }> = {
  "self-checked": { short: "待复核", long: "作者已自查，尚未经负责人审核" },
  "owner-reviewed": { short: "已审核", long: "负责人已审核" },
};

export const findPrompt = (id: string) => publishedPrompts.find((p) => p.id === id) ?? null;

export const promptsForStage = (stage: QuestStageId) => publishedPrompts.filter((p) => p.stage.includes(stage));

const PLACEHOLDER = /\{([^{}\n]+)\}/g;

/** Placeholder names in template order (each once). */
export function placeholdersOf(text: string): string[] {
  const seen: string[] = [];
  for (const match of text.matchAll(PLACEHOLDER)) if (!seen.includes(match[1])) seen.push(match[1]);
  return seen;
}

export type FilledPart = { text: string; kind: "text" | "filled" | "missing" };

/** Split the template into literal text, filled values and still-missing placeholders. */
export function fillTemplate(text: string, values: Record<string, string>): { parts: FilledPart[]; output: string; missing: string[] } {
  const parts: FilledPart[] = [];
  const missing: string[] = [];
  let last = 0;
  for (const match of text.matchAll(PLACEHOLDER)) {
    const start = match.index ?? 0;
    if (start > last) parts.push({ text: text.slice(last, start), kind: "text" });
    const value = (values[match[1]] ?? "").trim();
    if (value) parts.push({ text: value, kind: "filled" });
    else {
      parts.push({ text: match[0], kind: "missing" });
      if (!missing.includes(match[1])) missing.push(match[1]);
    }
    last = start + match[0].length;
  }
  if (last < text.length) parts.push({ text: text.slice(last), kind: "text" });
  return { parts, output: parts.map((p) => p.text).join(""), missing };
}
