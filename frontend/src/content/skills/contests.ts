import type { ContestId, ContestProfile, SourceRef } from "./types";

const CUMCM_FORMAT: SourceRef = {
  title: "全国大学生数学建模竞赛论文格式规范（2026 年修订稿）",
  url: "https://www.mcm.edu.cn/html_cn/node/4cd596519c9eb9fbd866398f6df0caa3.html",
};
const CUMCM_RULES: SourceRef = {
  title: "全国大学生数学建模竞赛参赛规则（2026 年修订稿）",
  url: "https://www.mcm.edu.cn/html_cn/node/9d8e511fe7a1447b35f53a82c908e2e0.html",
};
const CUMCM_NOTICE: SourceRef = {
  title: "2026 高教社杯全国大学生数学建模竞赛第一次通知",
  url: "https://www.mcm.edu.cn/html_cn/node/d6fd7a0ee8f3a3d525e30af1c365fcec.html",
};
const COMAP: SourceRef = {
  title: "COMAP MCM/ICM Contest Rules, Registration and Instructions（2027）",
  url: "https://www.contest.comap.com/undergraduate/contests/mcm/instructions.php",
};
const APMCM: SourceRef = {
  title: "2026 年 APMCM 亚太地区大学生数学建模竞赛报名通知（亚太赛[2026]04 号）",
  url: "https://www.apmcm.org/detail/2512",
};

/** 赛事规范：官方条目逐条带出处；经验条目不写成规则。核验日期 2026-10-13。 */
export const contestProfiles: Record<ContestId, ContestProfile> = {
  cumcm: {
    id: "cumcm",
    name: "高教社杯全国大学生数学建模竞赛（国赛）",
    short: "国赛",
    paperLanguage: "zh",
    official: [
      { text: "摘要专用页：摘要（含标题和关键词，无需英文）原则上不超过一页。", source: CUMCM_FORMAT },
      { text: "正文不要目录，不超过 30 页；正文之后是附录，页数不限。", source: CUMCM_FORMAT },
      { text: "附录须列出支撑材料文件清单，并包含建模用到的全部完整、可运行的源程序；程序不能运行或运行结果与论文不符，可能被取消评奖资格。", source: CUMCM_FORMAT },
      { text: "摘要页、正文和附录中任何地方都不能出现参赛者身份、所在学校及赛区信息。", source: CUMCM_FORMAT },
      { text: "引用他人或公开资料（含网上资料）必须按科技论文规范列出参考文献，并在正文引用处标注。", source: CUMCM_FORMAT },
      { text: "字号、字体、行距、颜色等不做统一要求（各赛区可另有要求）。", source: CUMCM_FORMAT },
      { text: "竞赛期间必须独立完成，不得与队外任何人（包括指导教师）交流与赛题有关的问题，也不得在任何平台浏览、发布或讨论赛题相关内容。", source: CUMCM_RULES },
      { text: "2026 年竞赛时间为 9 月 10 日 18 时至 9 月 13 日 20 时（北京时间）。", source: CUMCM_NOTICE },
    ],
    experience: [
      "摘要常见写法：首段说明问题和总体思路，随后按“针对问题一/二/三”逐问写方法、关键数值结果和结论，末尾写检验和特色。",
      "常把“问题分析”单独成章，每问再按“分析—建立—求解—检验”展开。",
      "常用三线表；公式连续编号；图表有编号和标题，并在正文中引用。",
      "合理安排时间：常见做法是第一天定方案并跑通基础模型，第二天完成求解和检验，第三天集中写作和核对。",
    ],
    structure: [
      "摘要专用页（标题、摘要、关键词）",
      "一、问题重述（背景与各问要求）",
      "二、问题分析（可按问分小节）",
      "三、模型假设（每条附理由）",
      "四、符号说明（符号、含义、单位）",
      "五、模型建立与求解（按问组织：分析、模型、求解、结果、检验）",
      "六、模型检验 / 灵敏度分析（也可放在各问内）",
      "七、模型评价、改进与推广",
      "参考文献",
      "附录：支撑材料文件清单、全部可运行源程序",
    ],
    abstractGuide: [
      "【官方】摘要专用页不超过一页，含标题和关键词，不出现身份信息。",
      "【经验】首段 2–3 句交代问题背景与整体思路，不写“本文研究了……”式空话。",
      "【经验】按问分段：每段写清方法、关键结果（具体数值、单位）和结论；数值必须与正文一致。",
      "【经验】最后一段写检验结论和模型特色；关键词 4–6 个，取自方法和问题对象。",
    ],
    checkedAt: "2026-10-13",
  },
  mcm: {
    id: "mcm",
    name: "美国大学生数学建模竞赛 MCM/ICM（美赛）",
    short: "美赛",
    paperLanguage: "en",
    official: [
      { text: "全部提交材料共 25 页以内，包括 Summary Sheet、正文、参考文献、目录、附录、代码和题目要求的附加内容。", source: COMAP },
      { text: "论文为英文、PDF 格式，字号不小于 12 磅。", source: COMAP },
      { text: "Summary Sheet 是论文第一页；官方说明评委很重视摘要，只复述题目或照搬引言的摘要通常较弱，建议最后再写。", source: COMAP },
      { text: "MCM 为 A、B、C 题，ICM 为 D、E、F 题，每队只提交一道题的解答。", source: COMAP },
      { text: "官方建议：目录、问题重述、变量与假设说明、模型设计、误差/灵敏度/稳定性等检验讨论、优缺点、明确的结论与参考资料。", source: COMAP },
      { text: "竞赛期间不得向队外任何人（含指导教师）寻求答案、思路或资料。", source: COMAP },
      { text: "2027 年竞赛时间为美东时间 1 月 28 日 17:00 至 2 月 1 日 20:00（北京时间 1 月 29 日 06:00 至 2 月 2 日 09:00）。", source: COMAP },
    ],
    experience: [
      "题目常有 memo、letter、one-page article 等附加要求，必须严格按题目原文完成，且计入 25 页。",
      "25 页包含代码和附录，通常只放关键代码片段，篇幅要从一开始就做预算。",
      "开放题较多，结论需要有清晰的立场和可操作的建议，并说明在什么条件下成立。",
      "英文写作建议用短句和主动语态，统一时态与术语；先写中文要点再写英文，容易保持逻辑一致。",
    ],
    structure: [
      "Summary Sheet（第一页）",
      "Contents",
      "1 Introduction（Background、Restatement、Our Work）",
      "2 Assumptions and Justifications",
      "3 Notations",
      "4–N Models for each task（formulation、solution、results）",
      "Sensitivity / Robustness Analysis",
      "Strengths and Weaknesses",
      "Conclusion",
      "题目要求的 memo / letter 等",
      "References",
      "Appendices（关键代码，计入 25 页）",
    ],
    abstractGuide: [
      "【官方】Summary Sheet 放在第一页，写清方法和最重要的结论；不要只是复述题目或照搬引言。",
      "【官方】建议最后写，并为它留出时间。",
      "【经验】常见结构：1 段背景与目标，按任务分段写模型和关键结果（带数值），最后 1 段写检验、优势与建议；Keywords 4–6 个。",
    ],
    checkedAt: "2026-10-13",
  },
  apmcm: {
    id: "apmcm",
    name: "APMCM 亚太地区大学生数学建模竞赛",
    short: "APMCM",
    paperLanguage: "en",
    official: [
      { text: "2026 年主赛：竞赛时间 11 月 26 日 06:00 至 11 月 30 日 09:00，报名截止 11 月 25 日。", source: APMCM },
      { text: "参赛队由 1–3 名在校大学生组成，分研究生组、本科组、专科组。", source: APMCM },
      { text: "题目共 A、B、C 三道；只提交电子版论文，所有参赛队必须提交英文版论文。", source: APMCM },
    ],
    experience: [
      "论文格式细则（页数、模板）以当届《论文格式规范与提交说明》为准，请把该文件一并附给 AI。",
      "6 月举办的中文赛项与 11 月主赛是两项独立安排，规则不要混用。",
      "结构可参考美赛写法：Summary、Introduction、Assumptions、Notations、Models、Sensitivity、Strengths and Weaknesses、Conclusion。",
    ],
    structure: [
      "Summary（摘要页）",
      "Introduction / Restatement",
      "Assumptions and Justifications",
      "Notations",
      "Models and Solutions（按问）",
      "Model Testing / Sensitivity Analysis",
      "Strengths and Weaknesses",
      "Conclusion",
      "References",
      "Appendices",
    ],
    abstractGuide: [
      "【经验】首段说明问题与总体思路，随后按问写方法和关键结果（带数值），最后写检验与结论。",
      "【待核实】页数和摘要格式以当届格式规范为准。",
    ],
    attachHint: "当届《论文格式规范与提交说明》",
    checkedAt: "2026-10-13",
  },
  general: {
    id: "general",
    name: "其他数学建模赛事（MathorCup、五一、电工杯、华中杯、数维杯等）",
    short: "其他赛事",
    paperLanguage: "by-notice",
    official: [],
    experience: [
      "各赛事的篇幅、摘要、模板和提交方式差别较大，请把本届通知和论文格式要求一并附给 AI，并以其为准。",
      "没有附上格式要求时，AI 按通用科技论文结构组织，并在开头列出需要你去核对的格式项。",
      "电工杯等行业赛常需要领域背景（如电力系统），赛题分析时把领域术语和工程约束单独列出。",
    ],
    structure: [
      "摘要（含关键词）",
      "问题重述",
      "问题分析",
      "模型假设",
      "符号说明",
      "模型建立与求解（按问）",
      "模型检验与灵敏度分析",
      "模型评价与推广",
      "参考文献",
      "附录（代码与支撑材料）",
    ],
    abstractGuide: [
      "【待核实】摘要篇幅与格式以本届通知为准。",
      "【经验】按问写方法、关键数值结果和结论，数值与正文一致。",
    ],
    attachHint: "本届竞赛通知和论文格式要求",
    checkedAt: "2026-10-13",
  },
};

export const CONTEST_ORDER: ContestId[] = ["cumcm", "mcm", "apmcm", "general"];
export const isContestId = (v: string | null): v is ContestId => !!v && (CONTEST_ORDER as string[]).includes(v);
