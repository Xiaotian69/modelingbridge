/**
 * 「找到你的建模起点 · 建模队伍分工探索」的全部内容：案例、三种分工的介绍、自评题、9 个微任务、
 * 每个分工的建议练习和课程入口。改题目、改文案只改这个文件；
 * 证据汇总和建议规则在 scoring.ts，页面在 RolesPage.tsx。
 *
 * 设计原则（改题时请保持）：
 * - 兴趣、已有经验、任务表现分开记录，互不换算；
 * - 只有微任务有参考答案，自评和偏好没有对错；
 * - 每个微任务都可以选“暂时判断不了”，记作跳过，不算答错；
 * - 题目考的是思路，不考专业名词或某种编程语言的语法，必要的名词在 tip 里解释。
 */

export type Role = "model" | "code" | "write";
export const ROLE_ORDER: Role[] = ["model", "code", "write"];

export const ROLES_STORAGE_KEY = "mb.roles.v1";

export type RoleLink = { label: string; to: string };
export type RoleInfo = {
  name: string;
  /** 一句话：这个分工在比赛里做什么 */
  does: string;
  /** 结果页“本次没有观察到”的部分：这几道题测不出来的东西 */
  unobserved: string;
  /** 结果页的“下一步小练习”：10–15 分钟能做完，做完能检验自己喜不喜欢 */
  practice: string;
  links: RoleLink[];
};

export const ROLES: Record<Role, RoleInfo> = {
  model: {
    name: "建模手",
    does: "把现实问题翻译成数学：定目标、找变量、写假设、选模型，并说清模型在什么情况下不适用。",
    unobserved: "数学推导和模型方法的储备、面对全新问题时的拆解速度、长时间讨论里的表现。",
    practice: "打开第零课的“共享雨伞”实验，在“改变需求再检验”那一步先写下你的猜测：需求变了，最优调配会怎么变？再动手验证。",
    links: [
      { label: "第零课：认识数学建模", to: "/learn/introduction" },
      { label: "线性规划精讲", to: "/learn/linear-programming" },
    ],
  },
  code: {
    name: "编程手",
    does: "把模型变成能跑出结果的计算：整理数据、实现算法、检查结果是否合理，并做验证和图表。",
    unobserved: "任何一门编程语言的实际编写、调试一个真实程序、处理大量数据。",
    practice: "在线性规划实验室里把一种产品的利润调高，先预测最优点会不会移动，再看实验室的计算结果和你想的是否一致。",
    links: [
      { label: "线性规划交互实验室", to: "/learn/linear-programming/lab" },
      { label: "回归分析精讲（用数据算一遍）", to: "/learn/regression" },
    ],
  },
  write: {
    name: "论文手",
    does: "把团队的思路和结果写成可信的论文：组织论证、解释图表、守住“证据说明多少就写多少”，并处理引用。",
    unobserved: "完整段落的写作、排版工具（Word / LaTeX）的熟练度、英文写作（美赛需要）。",
    practice: "在回归分析精讲里找到残差图，用两句话写下：这张图说明了什么，不能说明什么。",
    links: [
      { label: "回归分析精讲", to: "/learn/regression" },
      { label: "AHP 精讲（练习写评价理由）", to: "/learn/ahp" },
    ],
  },
};

/** 所有人都可以用的综合入口：七关里正好有同一个共享单车案例。 */
export const QUEST_LINK: RoleLink = { label: "七关实战：校园共享单车案例", to: "/quest?case=bike-demand-demo" };

/** 贯穿 9 个微任务的案例。 */
export const CASE = {
  title: "校园共享单车早高峰",
  story:
    "每天 7:30–8:10，东门、图书馆、三食堂三个停车点借车的人特别多，常有同学找不到车；其他时段很多车闲着。后勤想在早高峰前把车调到各个停车点。",
  question: "你的队伍要回答：早上 7:30 之前，每个停车点应该放多少辆车？",
};

// ---------------------------------------------------------------------------
// 第 1 步：已有经验（自评，三项各选一个）

export type Experience = "none" | "some" | "project" | "unsure";
export const EXPERIENCE_LEVELS: { id: Experience; label: string }[] = [
  { id: "none", label: "没接触过" },
  { id: "some", label: "学过一点" },
  { id: "project", label: "做过作业或项目" },
  { id: "unsure", label: "说不清" },
];
export const EXPERIENCE_AREAS: Record<Role, string> = {
  model: "用数学解决实际问题（如建模课、数模比赛、应用题）",
  code: "编程或数据处理（任何语言都算，Excel 公式也算）",
  write: "写报告、论文或做调研展示",
};

// ---------------------------------------------------------------------------
// 第 2 步：兴趣（开放偏好，最多选 3 项）。顺序交错，避免同一分工的选项挨在一起。

export type InterestOption = { id: string; role: Role; label: string };
export const INTEREST_MAX = 3;
export const INTERESTS: InterestOption[] = [
  { id: "i-model-split", role: "model", label: "把一个模糊的问题拆成几个能算的小问题" },
  { id: "i-code-clean", role: "code", label: "把一堆数据整理干净，让程序跑出结果" },
  { id: "i-write-explain", role: "write", label: "把团队的思路写成别人一读就懂的文字" },
  { id: "i-model-ignore", role: "model", label: "想清楚哪些因素可以忽略、为什么可以忽略" },
  { id: "i-code-debug", role: "code", label: "结果不对时，一步步找出是哪里出了错" },
  { id: "i-write-chart", role: "write", label: "设计一张图，让读者一眼看出结论" },
];

// ---------------------------------------------------------------------------
// 第 3–11 步：9 个微任务（每个分工 3 个，交错出现），都有参考答案。

export type TaskOption = { id: string; label: string; why: string };
export type TaskTable = { caption: string; head: string[]; rows: (string | number)[][] };
export type TaskChart = {
  caption: string;
  categories: string[];
  series: { name: string; values: number[] }[];
};
export type Task = {
  id: string;
  role: Role;
  /** 结果页里用的短名，说明这道题观察的是什么 */
  skill: string;
  prompt: string;
  /** 零基础背景说明：解释题目里可能陌生的词，不给答案 */
  tip?: string;
  /** 题目给出的材料 */
  evidence?: string;
  table?: TaskTable;
  chart?: TaskChart;
  /** single：单选；multi：必须恰好选中全部正确项才算对 */
  kind: "single" | "multi";
  options: TaskOption[];
  answer: string[];
  /** 确认后显示的讲解 */
  explain: string;
};

export const TASKS: Task[] = [
  {
    id: "t-model-variable",
    role: "model",
    skill: "找出决策变量",
    prompt: "要回答“7:30 前每个停车点放多少辆车”，下面哪一个是需要由你来决定的量？",
    tip: "模型里由我们来选择取值的量叫“决策变量”；只能测量、不能改变的量叫参数或数据。",
    kind: "single",
    options: [
      { id: "a", label: "每个停车点 7:30 前投放的车辆数", why: "这正是后勤能调整、题目要求回答的量。" },
      { id: "b", label: "全校学生总人数", why: "它影响需求，但我们改变不了它，是参数。" },
      { id: "c", label: "早高峰每个停车点的借车需求", why: "需求要靠数据估计，不由我们决定，是模型的输入。" },
      { id: "d", label: "单车的品牌和颜色", why: "与“放多少辆”无关。" },
    ],
    answer: ["a"],
    explain: "先分清“我们能决定什么”和“只能测量什么”，模型的骨架就出来了：决策变量是投放数，需求是要估计的参数。",
  },
  {
    id: "t-code-steps",
    role: "code",
    skill: "判断计算步骤",
    prompt: "后勤想知道“三个点一共缺多少辆车”（多出来的车先不挪动）。哪种计算步骤是对的？",
    tip: "不需要会写代码，只需要判断步骤是否合理。",
    table: {
      caption: "三个停车点早高峰的需求和现有车辆",
      head: ["停车点", "需求（辆）", "现有（辆）"],
      rows: [
        ["东门", 50, 30],
        ["图书馆", 20, 35],
        ["三食堂", 40, 25],
      ],
    },
    kind: "single",
    options: [
      { id: "a", label: "逐个点算“需求 − 现有”，小于 0 的记为 0，再把三个点加起来：20 + 0 + 15 = 35", why: "缺口是每个点自己的事：先逐点截断到 0 再求和，图书馆多出的车不会抵掉别处的缺口。" },
      { id: "b", label: "总需求 110 减去总车辆 90，得 20", why: "图书馆多出的 15 辆抵掉了别处的缺口，但这些车并没有被挪过去，缺口被算少了。" },
      { id: "c", label: "逐个点算“需求 − 现有”后直接相加：20 + (−15) + 15 = 20", why: "负数表示多车，和缺车直接相加会互相抵消，结果和总量相减一样被算少。" },
      { id: "d", label: "只算缺口最大的东门：20", why: "漏掉了三食堂的缺口。" },
    ],
    answer: ["a"],
    explain: "这类逻辑错误程序不会报错，却会让结果悄悄变小。动手写代码之前想清楚每一步的含义，比记住语法更重要。",
  },
  {
    id: "t-write-claim",
    role: "write",
    skill: "判断结论是否有证据支持",
    evidence: "试行调度方案的 3 个工作日里，东门早高峰平均找车时间从 6 分钟降到 4 分钟。",
    prompt: "哪一句结论最符合这条证据？",
    kind: "single",
    options: [
      { id: "a", label: "调度方案让全校同学的找车时间减少了 33%", why: "数据只来自东门，不能推到全校。" },
      { id: "b", label: "试行的 3 天里，东门早高峰平均找车时间减少约 2 分钟；天数较少，还需要更多数据确认", why: "范围（东门、3 天）、幅度（约 2 分钟）和局限都写清楚了。" },
      { id: "c", label: "调度方案彻底解决了早高峰找车难的问题", why: "4 分钟仍不是 0，“彻底解决”言过其实。" },
      { id: "d", label: "找车时间减少，说明同学们更喜欢骑车了", why: "证据说的是找车时间，和“喜欢骑车”无关。" },
    ],
    answer: ["b"],
    explain: "论文手要守住“证据说明多少，就写多少”：写清范围、幅度和局限。",
  },
  {
    id: "t-model-data",
    role: "model",
    skill: "判断需要什么数据",
    prompt: "要估计每个停车点早高峰会缺多少辆车，最需要哪两类数据？（选 2 项）",
    kind: "multi",
    options: [
      { id: "a", label: "最近几周各点每 10 分钟的借车、还车记录", why: "用来估计早高峰的需求。" },
      { id: "b", label: "各点早上 7:30 时已经停着的车辆数", why: "缺多少要从现有车辆算起。" },
      { id: "c", label: "单车公司去年的总营收", why: "与某个点缺多少辆车无关。" },
      { id: "d", label: "同学们最喜欢的单车颜色", why: "与缺车数量无关。" },
    ],
    answer: ["a", "b"],
    explain: "缺车数 ≈ 需求 − 现有车辆：借还记录用来估需求，现有车辆是起点。先想清楚模型要什么，再去找数据。",
  },
  {
    id: "t-code-data",
    role: "code",
    skill: "发现数据问题",
    prompt: "这是三食堂导出的一段借车记录。哪一行最需要先检查？",
    table: {
      caption: "三食堂早高峰借车记录",
      head: ["行", "时段", "借出（辆）"],
      rows: [
        ["第 1 行", "7:30–7:40", 12],
        ["第 2 行", "7:40–7:50", 21],
        ["第 3 行", "7:50–8:00", -4],
        ["第 4 行", "8:00–8:10", 16],
      ],
    },
    kind: "single",
    options: [
      { id: "r1", label: "第 1 行", why: "数值在合理范围内。" },
      { id: "r2", label: "第 2 行", why: "比上一时段多，但早高峰逐渐上升说得通。" },
      { id: "r3", label: "第 3 行", why: "借出的车辆数不可能是负数，可能是还车被记成借车，或导出时出错。" },
      { id: "r4", label: "第 4 行", why: "数值在合理范围内。" },
      { id: "none", label: "看不出问题", why: "第 3 行的负数不合常理。" },
    ],
    answer: ["r3"],
    explain: "拿到数据先做合理性检查：负数、超过容量、重复行、时间格式不一致。脏数据会让后面所有计算都错。",
  },
  {
    id: "t-write-chart",
    role: "write",
    skill: "解释图表",
    prompt: "下图是两个停车点早高峰每 10 分钟的借车量。哪句描述最准确？",
    chart: {
      caption: "每 10 分钟借车量（辆）",
      categories: ["7:30–7:40", "7:40–7:50", "7:50–8:00", "8:00–8:10"],
      series: [
        { name: "东门", values: [18, 30, 42, 25] },
        { name: "图书馆", values: [6, 10, 14, 28] },
      ],
    },
    kind: "single",
    options: [
      { id: "a", label: "两个点的借车高峰在同一时段", why: "东门的高峰在 7:50–8:00，图书馆在 8:00–8:10，并不相同。" },
      { id: "b", label: "东门在 7:50–8:00 借车最多（42 辆）；图书馆的高峰更晚，在 8:00–8:10（28 辆）", why: "高峰时段和数值都与图一致。" },
      { id: "c", label: "这 40 分钟里图书馆的借车总量比东门多", why: "东门合计 115 辆，图书馆合计 58 辆。" },
      { id: "d", label: "东门的借车量一直在增加", why: "8:00–8:10 降到了 25 辆。" },
    ],
    answer: ["b"],
    explain: "描述图表时说清“哪里、何时、多少”，并且只说图能支持的内容。这句话可以直接写进论文，也提示调度要分点、分时段。",
  },
  {
    id: "t-model-limit",
    role: "model",
    skill: "判断模型的局限",
    prompt: "队友提议：直接用“昨天同一时段的借车量”作为今天的需求。下面哪种情况下，这个方法最可能明显失灵？",
    tip: "每个模型都建立在假设上；这里的假设是“今天和昨天差不多”。",
    kind: "single",
    options: [
      { id: "a", label: "昨天是周日，今天是周一、早八满课", why: "周末和工作日的出行规律差别很大，“今天和昨天差不多”不成立。" },
      { id: "b", label: "昨天是周二，今天是周三，两天课表相近", why: "相邻的相似工作日规律接近，这时方法通常还能用。" },
      { id: "c", label: "今天有一位同学换了一辆车骑", why: "个人换车不影响总需求。" },
      { id: "d", label: "两天的记录都用北京时间", why: "时间口径一致，不是问题。" },
    ],
    answer: ["a"],
    explain: "更稳妥的做法是用最近几周“同一星期几”的数据估计需求，并留意下雨、考试周这类特殊日子。说清模型何时会失灵，是建模手的重要工作。",
  },
  {
    id: "t-code-verify",
    role: "code",
    skill: "安排验证",
    prompt: "程序建议“7:30 前在东门停车点放 380 辆车”，而这个停车点最多只能停 60 辆车。你最先做什么？",
    kind: "single",
    options: [
      { id: "a", label: "先检查输入和计算：是不是把一周的数据当成了一天，或同一条记录被重复累加", why: "结果明显超出常识时，先怀疑数据范围、单位和重复计算。" },
      { id: "b", label: "结果是程序算的，直接写进论文", why: "程序只会忠实执行错误的步骤，结果不合常识必须先查。" },
      { id: "c", label: "把结果改成 60，看起来更合理", why: "手动改结果会掩盖真正的错误。" },
      { id: "d", label: "换一种编程语言重写一遍", why: "逻辑或数据错了，换语言也一样错。" },
    ],
    answer: ["a"],
    explain: "把结果和常识、容量、手算的小例子对比，是最便宜也最有效的验证。这个习惯比会多少种语言更能说明一个编程手靠不靠谱。",
  },
  {
    id: "t-write-cite",
    role: "write",
    skill: "发现引用问题",
    evidence: "论文里有这样一句：“据统计，大学生平均每天骑共享单车 3.7 次。”",
    prompt: "这句话最大的问题是什么？",
    kind: "single",
    options: [
      { id: "a", label: "数字应该写成整数 4", why: "精度不是主要问题。" },
      { id: "b", label: "没有说明数据从哪里来，读者无法核实；应注明出处，或写明是本队调查或假设", why: "“据统计”却没有来源，读者无法判断数字是否可信。" },
      { id: "c", label: "句子太短，应该写得更长", why: "长短不是问题。" },
      { id: "d", label: "论文里不应该出现具体数字", why: "论文需要数字，但每个关键数字都要有来源。" },
    ],
    answer: ["b"],
    explain: "每个关键数字都应能追溯：文献、官方数据、本队调查（写清样本和时间），或者明确标为假设。",
  },
];

// ---------------------------------------------------------------------------
// 第 12 步：做完任务后的偏好（开放，最多选 2 项，或“还说不清”）

export const PREFERENCE_MAX = 2;
export const PREFERENCE_UNSURE = "unsure";
export const PREFERENCES: { id: Role | typeof PREFERENCE_UNSURE; label: string }[] = [
  { id: "model", label: "建模类：找变量、想需要的数据、判断局限" },
  { id: "code", label: "编程类：理清计算步骤、检查数据、验证结果" },
  { id: "write", label: "论文类：判断结论、解释图表、检查引用" },
  { id: PREFERENCE_UNSURE, label: "还说不清" },
];

/** 结果页的总说明：这次能说明什么、不能说明什么。 */
export const LIMITS =
  "这次只有 9 个短任务和几道自评题，题目由模桥编写，还没有经过真实用户的检验。结果只描述你这一次的作答，不是能力鉴定，也不是人格结论；三种分工本来就有交叉，很多同学会同时适合几种。";
