import { describe, expect, it } from "vitest";
import { CONTEST_ORDER, LEGACY_PROMPTS, QUEST_STAGE_SKILL, buildSkill, buildWorkflowPack, contestProfiles, legacyTarget, skills } from ".";
import { questStages } from "../../quest/stages";
import type { SkillMode } from "./types";

const DAY = new Date("2026-10-13T00:00:00Z");
const all = skills.flatMap((s) => CONTEST_ORDER.flatMap((c) => s.modes.map((m) => ({ s, c, m: m as SkillMode }))));

describe("每个技能 × 赛事 × 模式都能生成完整文本", () => {
  it.each(all.map(({ s, c, m }) => [`${s.id}/${c}/${m}`, s.id, c, m] as const))("%s", (_, skill, contest, mode) => {
    const { markdown } = buildSkill({ skill, contest, mode }, DAY);
    // 没有残留的模板标记或待填占位符
    expect(markdown).not.toMatch(/\{\{|\}\}|\{[^}\n]{1,20}\}|undefined|null/);
    // 没有无法兑现的承诺（“获奖概率”只允许出现在“不要猜测……”这类禁止句里）
    expect(markdown).not.toMatch(/国奖|万能|保证获奖|必然获奖|满分/);
    expect(markdown.replace(/没有猜测[^。]*获奖概率/g, "")).not.toContain("获奖概率");
    // 固定的章节都在
    for (const h of ["## 1. 任务", "## 2. 我会提供的材料", "## 3. 工作原则", "## 4. 赛事规范", "## 5.", "## 6. 输出格式", "## 7.", "## 8. 交接包"]) expect(markdown).toContain(h);
    expect(markdown).toContain("模桥网站不调用任何 AI");
    expect(markdown).toContain("不编造任何数据");
    expect(markdown.length).toBeGreaterThan(1800);
  });
});

describe("赛事适配来自官方规范，而不是改个名字", () => {
  it("国赛：摘要一页、不要目录、正文不超过 30 页、附录须含可运行代码", () => {
    const md = buildSkill({ skill: "paper", contest: "cumcm", mode: "fresh" }, DAY).markdown;
    expect(md).toMatch(/不要目录，不超过 30 页/);
    expect(md).toMatch(/可运行的源程序/);
    expect(md).toContain("mcm.edu.cn");
    expect(md).toContain("全部用中文");
    expect(md).not.toMatch(/25 页/);
  });
  it("美赛：25 页包含代码、英文 PDF、目录建议、北京时间换算", () => {
    const md = buildSkill({ skill: "paper", contest: "mcm", mode: "fresh" }, DAY).markdown;
    expect(md).toMatch(/25 页以内，包括 Summary Sheet/);
    expect(md).toMatch(/英文、PDF/);
    expect(md).toContain("Contents");
    expect(md).toContain("北京时间 1 月 29 日 06:00");
    expect(md).toMatch(/论文正文用英文撰写/);
  });
  it("APMCM 主赛要求英文论文，并提醒附上当届格式规范", () => {
    const md = buildSkill({ skill: "analysis", contest: "apmcm", mode: "fresh" }, DAY).markdown;
    expect(md).toMatch(/必须提交英文版论文/);
    expect(md).toContain("论文格式规范与提交说明");
  });
  it("其他赛事不虚构官方要求，要求用户附上通知", () => {
    const md = buildSkill({ skill: "paper", contest: "general", mode: "fresh" }, DAY).markdown;
    expect(md).not.toContain("官方要求（核验于");
    expect(md).toMatch(/以我们附上的本届竞赛通知和论文格式要求为准/);
  });
  it("官方条目和经验条目分开，官方条目都有出处", () => {
    for (const c of CONTEST_ORDER) contestProfiles[c].official.forEach((r) => expect(r.source?.url).toMatch(/^https?:/));
    const md = buildSkill({ skill: "analysis", contest: "cumcm", mode: "fresh" }, DAY).markdown;
    expect(md).toMatch(/经验做法（不是官方要求/);
    expect(md).toMatch(/来源：\n［1］/);
  });
});

describe("选项真正改变输出", () => {
  it("只要稳妥方案时去掉进阶列", () => {
    const both = buildSkill({ skill: "analysis", contest: "cumcm", mode: "fresh" }, DAY).markdown;
    const stable = buildSkill({ skill: "analysis", contest: "cumcm", mode: "fresh", depth: "stable" }, DAY).markdown;
    expect(both).toContain("| 稳妥方案 | 进阶方案 |");
    expect(stable).not.toContain("进阶方案 |");
    expect(stable).toContain("本次只需要稳妥方案");
  });
  it("题号、剩余时间、小问、语言出现在任务里；不需要代码时不要求代码", () => {
    const md = buildSkill(
      { skill: "model", contest: "mcm", mode: "fresh", problemLabel: "C 题", hoursLeft: "30", question: "问题二", codeLanguage: "MATLAB" },
      DAY,
    ).markdown;
    expect(md).toContain("我们选做：C 题。");
    expect(md).toContain("还有 30 小时");
    expect(md).toContain("本次只处理：问题二");
    expect(md).toContain("代码使用 MATLAB");
    const noCode = buildSkill({ skill: "model", contest: "cumcm", mode: "fresh", codeLanguage: "none" }, DAY).markdown;
    expect(noCode).toContain("本次不需要代码");
  });
  it("与本步骤无关的选项不会出现", () => {
    const md = buildSkill({ skill: "analysis", contest: "cumcm", mode: "fresh", question: "问题二", teamProfile: "数学强", codeLanguage: "R" }, DAY).markdown;
    expect(md).not.toContain("本次只处理");
    expect(md).not.toContain("队伍情况");
    expect(md).not.toContain("代码使用 R");
  });
  it("接着上一步：附上粘贴的交接包；没粘贴时说明会随后附上", () => {
    const withPack = buildSkill({ skill: "model", contest: "cumcm", mode: "continue", handoffText: "### 交接包｜赛题分析\n| 题号 | B |" }, DAY).markdown;
    expect(withPack).toContain("## 附：上一步交接包");
    expect(withPack).toContain("| 题号 | B |");
    const later = buildSkill({ skill: "model", contest: "cumcm", mode: "continue" }, DAY).markdown;
    expect(later).toContain("上一步的交接包我会附在这条消息之后");
  });
  it("审阅模式：分级、依据、不打分", () => {
    const md = buildSkill({ skill: "paper", contest: "cumcm", mode: "review", reviewTarget: "论文全文初稿" }, DAY).markdown;
    expect(md).toContain("审阅对象：论文全文初稿。");
    expect(md).toMatch(/P0：.*P1：.*P2：/s);
    expect(md).toContain("不打分，不预测奖项");
    expect(md).not.toContain("## 5. 工作步骤");
  });
  it("论文部分选项：摘要 / 指定章节", () => {
    expect(buildSkill({ skill: "paper", contest: "cumcm", mode: "fresh", paperPart: "abstract" }, DAY).markdown).toContain("撰写摘要");
    expect(buildSkill({ skill: "paper", contest: "cumcm", mode: "fresh", paperPart: "section", sectionName: "5.2 问题二模型" }, DAY).markdown).toContain("「5.2 问题二模型」");
  });
  it("选题评估不提供接力和审阅模式，请求时回到从头开始", () => {
    expect(skills.find((s) => s.id === "choose")!.modes).toEqual(["fresh"]);
    expect(buildSkill({ skill: "choose", contest: "cumcm", mode: "review" }, DAY).markdown).toContain("本次模式：从头开始");
  });
  it("七关训练题：附上题面并说明没有附件", () => {
    const md = buildSkill({ skill: "analysis", contest: "cumcm", mode: "fresh", caseTitle: "共享单车", caseText: "某市共享单车……" }, DAY).markdown;
    expect(md).toContain("## 附：赛题（模桥训练题「共享单车」）");
    expect(md).toContain("赛题就是文末附的模桥训练题");
  });
});

describe("全流程技能包与兼容", () => {
  it("全流程包包含 6 步，共用部分只写一次", () => {
    const md = buildWorkflowPack("cumcm", DAY).markdown;
    for (const s of skills) expect(md).toContain(`## 第 ${s.order} 步：${s.title}`);
    expect(md.match(/## 通用工作原则/g)).toHaveLength(1);
    expect(md).not.toMatch(/\{\{|国奖|万能/);
  });
  it("旧的 15 个提示词 ID 都有去处", () => {
    expect(Object.keys(LEGACY_PROMPTS)).toHaveLength(15);
    for (const id of Object.keys(LEGACY_PROMPTS)) expect(legacyTarget(id)).toMatch(/^\/library\/skills\/(choose|analysis|data|model|validate|paper)/);
    expect(legacyTarget("pr.code.debug")).toBe("/library/skills/model?mode=review");
    expect(legacyTarget("pr.paper.abstract")).toBe("/library/skills/paper?part=abstract");
    expect(legacyTarget("pr.unknown")).toBe("/library/skills");
    // 两条旧 AI 模板：落到“论文写作 · 指定章节”，章节预设为 AI 工具使用说明，并带上提示标记
    for (const id of ["pr.ai.usage", "pr.ai.rules"]) {
      const q = new URLSearchParams(legacyTarget(id).split("?")[1]);
      expect(legacyTarget(id).startsWith("/library/skills/paper?")).toBe(true);
      expect(q.get("part")).toBe("section");
      expect(q.get("section")).toBe("AI 工具使用说明");
      expect(q.get("from")).toBe("legacy-ai");
    }
  });
  it("七关每一关都对应一个技能", () => {
    questStages.forEach((s) => expect(skills.map((k) => k.id)).toContain(QUEST_STAGE_SKILL[s.id]));
  });
});
