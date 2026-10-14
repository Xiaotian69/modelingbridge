import { contestProfiles } from "./contests";
import { findSkill, skills } from "./skills";
import type { CodeLanguage, ContestProfile, SkillConfig, SkillDefinition, SkillMode } from "./types";

export const SKILL_VERSION = "2026.10";

export const MODE_LABEL: Record<SkillMode, string> = {
  fresh: "从头开始",
  continue: "接着上一步",
  review: "审阅已有成果",
};

const PAGE_BUDGET: Record<ContestProfile["id"], string> = {
  cumcm: "正文不超过 30 页，不含摘要页和附录",
  mcm: "全部内容 25 页以内，包括 Summary Sheet、目录、参考文献、附录和代码",
  apmcm: "按当届格式规范；未提供时先列出需要我们确认的篇幅要求",
  general: "按本届通知；未提供时先列出需要我们确认的篇幅要求",
};

const DEPTH_TEXT = {
  both: "。再给一个进阶方案：在稳妥方案基础上针对本题做改进，写清改什么、为什么改、怎么做、预期效果、怎么验证",
  stable: "。本次只需要稳妥方案，不必给进阶方案",
} as const;

const clean = (v?: string) => (v ?? "").trim();
/** 生成日期按使用者本地日历（toISOString 是 UTC，北京时间 0–8 点会变成前一天）。 */
const localDate = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const bullet = (items: string[]) => items.map((t) => `- ${t}`).join("\n");
const numbered = (items: string[]) => items.map((t, i) => `${i + 1}. ${t}`).join("\n");

function paperPartStep(config: SkillConfig, contest: ContestProfile) {
  const section = clean(config.sectionName);
  switch (config.paperPart ?? "outline") {
    case "abstract":
      return "撰写摘要：按第 4 节的摘要要求写一版完整的摘要和关键词，只使用我们提供的结果数值；随后列出摘要中每个数值对应的正文位置，方便核对。";
    case "section":
      return `撰写${section ? `「${section}」` : "我们在消息中指定的章节"}初稿：先列出本节要回答的问题和要用到的结果，再写正文；公式编号、图表编号与全文保持一致，缺少的结果写“待补：……”。`;
    default:
      return `制定全文提纲与篇幅预算：按第 4 节的结构列出各章节、每节要写的要点（注明用到哪个结果或图表）、图表位置和页数预算（${PAGE_BUDGET[contest.id]}），并给出写作顺序和三人分工建议。`;
  }
}

function languageRule(skill: SkillDefinition, contest: ContestProfile) {
  if (skill.id === "paper") {
    if (contest.paperLanguage === "en") return "论文正文用英文撰写；每一节后面用中文列出 3–5 条要点，方便全队核对逻辑。其余说明用中文。";
    if (contest.paperLanguage === "zh") return "全部用中文。";
    return "论文语言按本届通知；没有提供通知时用中文。其余说明用中文。";
  }
  return contest.paperLanguage === "en"
    ? "用中文回答；关键术语、变量名和模型名附上英文，方便后续写英文论文。"
    : "用中文回答。";
}

/** 完整代码最终怎样进入论文：与第 4 节的官方要求保持一致。 */
const CODE_IN_PAPER: Partial<Record<ContestProfile["id"], string>> = {
  cumcm: "这些代码最终要完整放进论文附录（国赛要求附录包含全部可运行的源程序）。",
  mcm: "完整代码供我们自己运行；写进论文时只放关键片段，因为附录和代码都计入 25 页。",
};

function codeRule(lang: CodeLanguage | undefined, skill: SkillDefinition, contest: ContestProfile) {
  if (!skill.extraOptions.includes("codeLanguage")) return null;
  if (lang === "none") return "本次不需要代码，只需要方法、步骤和公式；需要计算的地方写清计算方法。";
  return `代码使用 ${lang ?? "Python"}，给出完整可运行的版本（不是片段），注明依赖库和运行方式。${CODE_IN_PAPER[contest.id] ?? ""}`;
}

function contextLines(config: SkillConfig, skill: SkillDefinition) {
  const lines: string[] = [];
  const label = clean(config.problemLabel);
  if (label && skill.id !== "choose") lines.push(`我们选做：${label}。`);
  const hours = clean(config.hoursLeft);
  if (hours) lines.push(`距离提交截止大约还有 ${hours} 小时，请据此控制范围：优先保证每一问都有可交付的结果，再考虑改进。`);
  const question = clean(config.question);
  if (question && skill.extraOptions.includes("question")) lines.push(`本次只处理：${question}。其他小问不用展开，但要说明与它的衔接。`);
  const team = clean(config.teamProfile);
  if (team && skill.extraOptions.includes("teamProfile")) lines.push(`队伍情况：${team}`);
  return lines;
}

function principles(skill: SkillDefinition, contest: ContestProfile, config: SkillConfig) {
  const items = [
    "区分信息来源：题目或附件明确给出的标 [题给]，并注明位置；由题目推理得到的标 [推断]，并写出推理；为建模而设定的标 [假设]，并写出理由和影响。",
    "不编造任何数据、运行结果、文献或比赛规则。你实际运行过代码才能报告结果数值；不能运行时给出代码和结果格式，标注“待运行”，等我们运行后把结果贴回。",
    "不确定的地方直接说明，列入“待确认问题”，不要用模糊表述掩盖。",
    "选方法时说明它为什么适合本题的数据和目标；不为了显得高级而选用不必要的复杂方法。",
    "公式用 LaTeX 并编号，变量第一次出现时说明含义和单位。",
    languageRule(skill, contest),
  ];
  const code = codeRule(config.codeLanguage, skill, contest);
  if (code) items.push(code);
  items.push("比赛规则（包括是否以及如何使用 AI）以当届官方文件为准；第 4 节与官方最新文件冲突时，以官方为准。");
  return items;
}

function contestSection(skill: SkillDefinition, contest: ContestProfile, full = skill.id === "paper") {
  const parts = [`## 4. 赛事规范：${contest.name}`];
  if (contest.official.length) {
    const sources = [...new Map(contest.official.flatMap((r) => (r.source ? [[r.source.url, r.source] as const] : []))).values()];
    const ref = (url?: string) => (url ? `［${sources.findIndex((s) => s.url === url) + 1}］` : "");
    parts.push(
      `官方要求（核验于 ${contest.checkedAt}）：\n` +
        bullet(contest.official.map((r) => `${r.text}${ref(r.source?.url)}`)) +
        `\n\n来源：\n${sources.map((s, i) => `［${i + 1}］${s.title}：${s.url}`).join("\n")}`,
    );
  } else {
    parts.push(`本赛事的格式要求差异较大，请以我们附上的${contest.attachHint ?? "本届通知"}为准；没有附上时，先列出需要我们确认的格式项。`);
  }
  if (contest.official.length && contest.attachHint) parts.push(`如果我们附上了${contest.attachHint}，以它为准。`);
  parts.push(`经验做法（不是官方要求，可以根据题目调整）：\n${bullet(contest.experience)}`);
  if (full) {
    parts.push(`常见论文结构：\n${numbered(contest.structure)}`);
    parts.push(`摘要要求：\n${bullet(contest.abstractGuide)}`);
  }
  return parts.join("\n\n");
}

function reviewBlocks(skill: SkillDefinition, config: SkillConfig) {
  const target = clean(config.reviewTarget) || `我们已完成的${skill.title}成果`;
  const method = [
    `## 5. 审阅方法`,
    `审阅对象：${target}。`,
    `重点检查：\n${bullet(skill.reviewFocus)}`,
    "同时逐条核对第 4 节中与本成果有关的官方要求，标注“符合 / 不符合 / 无法判断”。",
    "问题分级：\n- P0：错误或违反规范，会让结果不成立或可能被取消评奖资格；\n- P1：明显削弱说服力，或遗漏了题目要求；\n- P2：表达、格式、可读性问题。",
    "原则：只指出和修改有问题的部分，保留我们正确的内容；不因个人风格偏好判错。涉及模型重构或结果变化的问题，给出修改方案和需要重新运行的内容，不直接给出新的结果数值。不打分，不预测奖项。",
  ].join("\n\n");
  const outputs = [
    "## 6. 输出格式（按顺序输出，表格用 Markdown）",
    numbered([
      "总体判断：3–5 句，说明最主要的问题和优先修改顺序",
      "问题清单：编号 | 等级 | 位置 | 问题 | 依据（题目原文、官方规范或数学/统计原理）| 修改建议",
      "修改示例：对每个 P0 和 P1 给出“原文 → 修改后”",
      "官方要求核对表（适用时）",
      "需要我们确认的问题",
      "更新后的交接包",
    ]),
  ].join("\n\n");
  const checks = [
    "## 7. 交付前自检",
    bullet([
      "每个问题都写明了位置和依据。",
      "没有把正确内容因风格偏好判为错误。",
      "修改示例没有引入新的、未经计算的数值。",
    ]),
  ].join("\n\n");
  return [method, outputs, checks];
}

function workBlocks(skill: SkillDefinition, config: SkillConfig, contest: ContestProfile) {
  const depth = config.depth ?? "both";
  const steps = skill.steps.map((s) => s.replace("{{depth}}", DEPTH_TEXT[depth]).replace("{{paperPart}}", paperPartStep(config, contest)));
  const outputs =
    depth === "stable"
      ? skill.outputs.map((o) => o.replace(" | 进阶方案", "").replace(" | 进阶路线", "")).filter((o) => !o.startsWith("进阶方案"))
      : skill.outputs;
  return [
    `## 5. 工作步骤\n\n${numbered(steps)}`,
    `## 6. 输出格式（按顺序输出，不要省略表格，表格用 Markdown）\n\n${numbered(outputs)}`,
    `## 7. 交付前自检（逐条确认；没有通过的写明原因）\n\n${bullet(skill.checks)}`,
  ];
}

function handoffBlock(skill: SkillDefinition) {
  const rows = skill.handoff.map((f) => `| ${f} | |`).join("\n");
  return `## 8. 交接包\n\n在回答的最后，按下面的格式输出交接包。每项用一两句话写清，下一步会直接使用它：\n\n### 交接包｜${skill.title}\n\n| 项目 | 内容 |\n|---|---|\n${rows}`;
}

function materialsBlock(skill: SkillDefinition, config: SkillConfig, contest: ContestProfile) {
  const mode = config.mode;
  const items = [...skill.inputs[mode]];
  if (contest.attachHint) items.push(`${contest.attachHint}（如有）`);
  const lines = [`## 2. 我会提供的材料\n\n${bullet(items)}`];
  if (config.caseText) lines.push("赛题就是文末附的模桥训练题，没有附件数据。");
  else lines.push("赛题和附件会以文件形式和本条消息一起发送。请先完整阅读全部材料再开始。");
  if (mode === "continue") lines.push(clean(config.handoffText) ? "上一步的交接包附在本文末尾。" : "上一步的交接包我会附在这条消息之后。");
  lines.push(
    skill.id === "choose" || skill.id === "analysis"
      ? "如果没有收到赛题，或文件无法读取，请直接告诉我缺什么，不要凭空分析。"
      : "如果缺少完成任务必需的材料，先列出缺什么，再完成能做的部分，并标明哪些结论因材料不足而待定。",
  );
  return lines.join("\n\n");
}

export type BuiltSkill = { title: string; markdown: string; fileName: string };

export function buildSkill(config: SkillConfig, today = new Date()): BuiltSkill {
  const skill = findSkill(config.skill);
  if (!skill) throw new Error(`unknown skill ${config.skill}`);
  const contest = contestProfiles[config.contest];
  const mode: SkillMode = skill.modes.includes(config.mode) ? config.mode : "fresh";
  const cfg = { ...config, mode };
  const date = localDate(today);
  const title = `数学建模技能｜${skill.title}（${contest.short}）`;

  const task = [
    `## 1. 任务`,
    `你是一位有数学建模竞赛经验的教练兼建模者，正在协助一支参加${contest.name}的队伍完成「${skill.title}」。`,
    `目标：${skill.purpose}`,
    `本次模式：${MODE_LABEL[mode]}。${
      mode === "continue" ? "严格以上一步交接包中的结论为基础继续，除非发现明确错误；若要改动，先说明原因。" : mode === "review" ? "你的任务是审阅我们的成果并给出修改意见，而不是从头重做。" : ""
    }`,
    ...contextLines(cfg, skill),
  ].join("\n\n");

  const blocks = [
    `# ${title}`,
    `> 由模桥 ModelingBridge 生成（技能版本 ${SKILL_VERSION}，${date}）。模桥网站不调用任何 AI：请把本文连同第 2 节列出的材料一起发送给你使用的 AI 工具。`,
    task,
    materialsBlock(skill, cfg, contest),
    `## 3. 工作原则（全程遵守）\n\n${numbered(principles(skill, contest, cfg))}`,
    contestSection(skill, contest),
    ...(mode === "review" ? reviewBlocks(skill, cfg) : workBlocks(skill, cfg, contest)),
    handoffBlock(skill),
  ];
  if (mode === "continue" && clean(config.handoffText)) blocks.push(`## 附：上一步交接包\n\n${clean(config.handoffText)}`);
  if (config.caseText)
    blocks.push(
      `## 附：赛题（模桥训练题「${clean(config.caseTitle) || "训练题"}」）\n\n${clean(config.caseText)}\n\n这是一道简化的训练题，没有附件数据；涉及数据时，请说明需要哪些数据、可以从哪里获取或如何模拟，并把这些内容标为 [假设]。`,
    );

  return { title, markdown: `${blocks.join("\n\n")}\n`, fileName: `模桥技能-${skill.order}-${skill.title}-${contest.short}.md` };
}

/** 全流程技能包：放进 AI 的“项目指令 / 知识库”长期使用。共用部分只写一次。 */
export function buildWorkflowPack(contestId: SkillConfig["contest"], today = new Date()): BuiltSkill {
  const contest = contestProfiles[contestId];
  const date = localDate(today);
  const paper = findSkill("paper")!;
  const head = [
    `# 数学建模全流程技能包（${contest.short}）`,
    `> 由模桥 ModelingBridge 生成（技能版本 ${SKILL_VERSION}，${date}）。模桥网站不调用任何 AI。`,
    "## 使用方式\n\n" +
      numbered([
        "把本文件放进 AI 工具的“项目指令”“自定义指令”或知识库（例如 Claude Projects、ChatGPT 的 GPTs 或项目、Kimi 等），也可以在对话开头整份发送。",
        "比赛时上传赛题和附件，然后说“执行第 N 步：步骤名”，例如“执行第 2 步：赛题分析”。",
        "每一步结束时 AI 会输出交接包；进入下一步时说“接着上一步”。",
        "想检查已有成果时说“审阅模式：第 N 步”，并附上成果。",
      ]),
    `## 通用工作原则\n\n${numbered([
      ...principles(findSkill("data")!, contest, { skill: "data", contest: contestId, mode: "fresh", codeLanguage: "Python" }),
      `写论文时：${languageRule(paper, contest)}`,
    ])}`,
    contestSection(paper, contest, true).replace("## 4. 赛事规范", "## 赛事规范"),
  ];
  const steps = skills.map((s) => {
    const cfg: SkillConfig = { skill: s.id, contest: contestId, mode: "fresh", depth: "both", paperPart: "outline" };
    const steps = s.steps.map((t) => t.replace("{{depth}}", DEPTH_TEXT.both).replace("{{paperPart}}", paperPartStep(cfg, contest)));
    return [
      `## 第 ${s.order} 步：${s.title}`,
      `目标：${s.purpose}`,
      `需要的材料：${s.inputs.fresh.join("；")}${s.modes.includes("continue") ? "；接着上一步时还需要上一步的交接包" : ""}。`,
      `### 步骤\n\n${numbered(steps)}`,
      `### 输出\n\n${numbered(s.outputs)}`,
      `### 自检\n\n${bullet(s.checks)}`,
      `### 交接包字段\n\n${s.handoff.join("；")}`,
      s.reviewFocus.length ? `### 审阅模式重点\n\n${bullet(s.reviewFocus)}` : "",
    ]
      .filter(Boolean)
      .join("\n\n");
  });
  const review =
    "## 审阅模式（任一步骤通用）\n\n" +
    bullet([
      "问题分级：P0 错误或违规（结果不成立或可能被取消评奖资格）；P1 明显削弱说服力或遗漏要求；P2 表达与格式。",
      "输出：总体判断 → 问题清单（编号 | 等级 | 位置 | 问题 | 依据 | 修改建议）→ P0/P1 修改示例（原文 → 修改后）→ 需要我们确认的问题 → 更新后的交接包。",
      "只改有问题的部分；涉及结果变化时给方案，不直接给新数值；不打分，不预测奖项。",
    ]);
  return {
    title: `数学建模全流程技能包（${contest.short}）`,
    markdown: `${[...head, ...steps, review].join("\n\n")}\n`,
    fileName: `模桥技能-全流程-${contest.short}.md`,
  };
}
