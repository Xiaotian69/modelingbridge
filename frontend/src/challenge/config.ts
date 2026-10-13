/**
 * 招新挑战「3 分钟测出你是建模队里的哪种人」的全部内容配置。
 * 换群号、改文案、关活动只改这个文件；计分逻辑在 scoring.ts，页面在 ChallengePage.tsx。
 *
 * 说明：结果是“趣味倾向 + 学习建议”，不是能力测评；每个选项给三个维度
 * （建模 M / 编程 C / 写作 W）加分，并带一个思维风格标签。
 */

export type Dimension = "M" | "C" | "W";
export type Style = "abstract" | "optimize" | "data" | "express";
export type Points = Partial<Record<Dimension, number>>;

export type ScoredOption = {
  id: string;
  label: string;
  points: Points;
  style: Style;
};

export type ResultId = "abstract" | "optimize" | "data" | "express" | "allround";

export const CHALLENGE_STORAGE_KEY = "mb.challenge.v1";

/** 活动开关与联系方式。活动结束后把 active 改成 false：入口文案变“关注协会”，/challenge 链接继续可用。 */
export const event = {
  active: true,
  societyName: "数学建模协会",
  qqGroup: "566983524",
  /** 活动进行中显示在开始页的小字 */
  activeNote: "招新进行中 · 测完到摊位凭结果页抽奖",
  /** 活动结束后，结果页联系卡片的说明 */
  afterNote: "招新已结束，欢迎加群关注下一次活动和入门培训。",
};

/** 扫码渠道：只认这几个值，其他一律记为 direct。 */
export const SOURCES = ["poster", "booth", "flyer", "group"] as const;

/**
 * 匿名统计（不用 Cookie、不收集个人信息）。
 * provider 为 "none" 时只在页面内派发 `mb:challenge` 事件，不发任何网络请求。
 * 接入 Umami 时：provider 改 "umami"，填 scriptSrc 和 websiteId。
 */
export const analytics: {
  provider: "none" | "umami";
  scriptSrc: string;
  websiteId: string;
} = {
  provider: "none",
  scriptSrc: "",
  websiteId: "",
};

// ---------------------------------------------------------------------------
// 第 1 题：食堂排队（6 选 3）

export const q1 = {
  title: "食堂窗口为什么总在饭点排长队？",
  prompt: "下面 6 个因素，挑出你觉得最该先研究的 3 个。",
  pick: 3,
  options: [
    { id: "arrive", label: "下课铃一响，几百人同时涌进来", points: { M: 1 }, style: "abstract" },
    { id: "window", label: "窗口开得少，打一份菜又慢", points: { M: 1 }, style: "optimize" },
    { id: "card", label: "刷卡机有每分钟的消费记录，能拿来算", points: { C: 1 }, style: "data" },
    { id: "camera", label: "数一数每个时刻队伍里有多少人", points: { C: 1 }, style: "data" },
    { id: "hot", label: "大家都挤那一家“网红窗口”", points: { W: 1 }, style: "express" },
    { id: "wall", label: "表白墙上一堆吐槽排队的帖子", points: { W: 1 }, style: "express" },
  ] satisfies ScoredOption[],
  feedback:
    "你刚才在做建模的第一步：做假设、抓主要因素。排队问题最常用的三个量是“人来得多快、打菜多快、开几个窗口”；记录和计数是给模型喂数据，吐槽和观察能帮你发现真正的痛点——不同的人会从不同的地方下手。",
};

// ---------------------------------------------------------------------------
// 第 2 题：20 块钱、30 分钟的麻辣烫（线性规划，最优解由 learning/solver.ts 计算）

export const q2 = {
  title: "只有 20 块钱和 30 分钟，怎么吃饱又不迟到？",
  story:
    "中午去吃串串麻辣烫，离上课还有 30 分钟，走到教学楼要 5 分钟，所以只剩 25 分钟吃饭；兜里还剩 20 块。",
  meat: { name: "荤菜", example: "丸子、鸡柳", price: 2, minutes: 1, full: 3, note: "一口一个，约 1 分钟一串" },
  veg: { name: "素菜", example: "青菜、金针菇", price: 1, minutes: 2, full: 2, note: "烫嘴要慢慢吃，约 2 分钟一串" },
  budget: 20,
  minutes: 25,
  methodPrompt: "你刚才是怎么找的？",
  methods: [
    { id: "calc", label: "先算钱和时间各够几串，再在中间找", points: { M: 2 }, style: "optimize" },
    { id: "try", label: "一格一格地试，盯着饱腹值变化", points: { C: 2 }, style: "data" },
    { id: "explain", label: "更想弄明白为什么是这个组合，讲给室友听", points: { W: 2 }, style: "express" },
  ] satisfies ScoredOption[],
  feedback:
    "这就是线性规划：钱和时间是两条约束，饱腹值是目标。最优解恰好把 20 块钱和 25 分钟同时用完——它总是落在可行区域的某个角上。",
};

// ---------------------------------------------------------------------------
// 第 3 题：选社团（两两比较 → AHP 权重）

export const q3 = {
  title: "三个社团都想去，只能选一个",
  prompt: "两两比较：选社团时，哪一项对你更重要？",
  criteria: [
    { id: "interest", name: "兴趣" },
    { id: "time", name: "时间" },
    { id: "vibe", name: "氛围" },
  ],
  /** 每个社团在三项上的印象分（1–5），顺序同 criteria。只是情景设定。 */
  clubs: [
    { name: "摄影社", scores: [5, 2, 3], note: "最想玩，但每周两次外拍" },
    { name: "羽毛球社", scores: [3, 3, 5], note: "一般喜欢，学长学姐很热情" },
    { name: "读书会", scores: [2, 5, 3], note: "兴趣一般，时间最自由" },
  ],
  usePrompt: "算出来的排名，你会怎么用？",
  uses: [
    { id: "follow", label: "照着权重选，判断过程清楚就行", points: { M: 2 }, style: "abstract" },
    { id: "check", label: "先去三个社团群里翻翻活动记录，再验证一下", points: { C: 2 }, style: "data" },
    { id: "write", label: "把理由写下来，讲给室友听再决定", points: { W: 2 }, style: "express" },
  ] satisfies ScoredOption[],
  feedback:
    "你刚才做的两两比较，就是层次分析法（AHP）的判断矩阵：把“哪个更重要”变成权重，再给每个选项打分加权。比赛里评价类题目最常用它。",
};

// ---------------------------------------------------------------------------
// 第 4 题：图书馆占座（示意数据，不是真实统计）

export const q4 = {
  title: "图书馆早上几点去最容易占到座？",
  prompt: "下面是某天早上座位占用率的示意曲线。猜猜 8:30 会怎样？",
  /** 示意数据：时间标签与占用率（%）。 */
  observed: [
    { t: "6:30", v: 4 },
    { t: "7:00", v: 16 },
    { t: "7:30", v: 44 },
    { t: "8:00", v: 78 },
  ],
  nextLabel: "8:30",
  options: [
    { id: "extend", label: "照这个速度继续往上冲", guess: 100, points: { C: 2 }, style: "data" },
    { id: "saturate", label: "涨得越来越慢，快到座位上限了", guess: 92, points: { M: 2 }, style: "abstract" },
    { id: "context", label: "先问问：今天是不是考试周？", guess: null, points: { W: 1, M: 1 }, style: "express" },
  ] satisfies (ScoredOption & { guess: number | null })[],
  actual: 92,
  feedback:
    "座位有上限，曲线不会一直直线上升，而是越来越平——这就是数据预测里的“饱和”（logistic 增长）。照这条示意曲线，想稳稳占到座，最好 7:30 前到。问清楚“今天是不是考试周”也很重要：预测之前先确认条件没变。",
};

// ---------------------------------------------------------------------------
// 第 5 题：费米估算

export const q5 = {
  title: "全校一天大约卖出多少杯奶茶？",
  prompt: "不用算出准确数字。你会从哪里下手？",
  options: [
    { id: "demand", label: "从人出发：全校人数 × 喝奶茶的比例 × 每人几杯", points: { M: 2 }, style: "abstract" },
    { id: "supply", label: "从店出发：几家店 × 每小时能做几杯 × 营业几小时", points: { M: 2 }, style: "optimize" },
    { id: "data", label: "找数据：翻外卖平台各家店的月销量", points: { C: 2 }, style: "data" },
    { id: "assume", label: "先把每个假设写清楚，方便别人挑错", points: { W: 2 }, style: "express" },
  ] satisfies ScoredOption[],
  feedback:
    "这叫费米估算：把一个“没法直接知道”的数拆成几个能估的数。比如假设全校 2 万人、每天约十分之一的人买一杯，就是约 2000 杯——数字是假设，重要的是每一步都写得清楚、能被检查。",
};

// ---------------------------------------------------------------------------
// 结果

export type ResultCopy = {
  id: ResultId;
  role: string;
  tag: string;
  line: string;
  detail: string;
  partner: string;
  /** 推荐的第一课：只链到线上已有的页面，带 ?from=challenge 方便统计 */
  course: { label: string; hint: string; to: string };
};

export const results: Record<ResultId, ResultCopy> = {
  abstract: {
    id: "abstract",
    role: "建模手",
    tag: "抽象派",
    line: "擅长抓住问题本质、做合理假设。",
    detail: "别人还在纠结细节，你已经在想“这件事最关键的是哪几个量”。比赛里，这决定了整支队伍往哪个方向走。",
    partner: "编程手",
    course: {
      label: "线性规划精讲",
      hint: "从一个生产计划问题开始，完整走一遍“假设 → 建模 → 求解”",
      to: "/learn/linear-programming?from=challenge",
    },
  },
  optimize: {
    id: "optimize",
    role: "建模手",
    tag: "优化派",
    line: "天生会算“怎样最划算”。",
    detail: "有限的钱、有限的时间，你本能地想找最优组合。线性规划、整数规划这些优化模型，是你最顺手的武器。",
    partner: "论文手",
    course: {
      label: "线性规划精讲 · 可行域",
      hint: "看第 3 节“看见所有允许的计划”：最优解为什么总在角上",
      to: "/learn/linear-programming?from=challenge",
    },
  },
  data: {
    id: "data",
    role: "编程手",
    tag: "数据派",
    line: "看到数据就想画图找规律。",
    detail: "你相信“试一试就知道”，也愿意把数据翻个底朝天。队里把模型变成能跑的代码和图表，靠的就是你。",
    partner: "建模手",
    course: {
      label: "线性规划精讲 · Python",
      hint: "看第 5 节“让 Python 重现你的推导”：几行代码解出最优解",
      to: "/learn/linear-programming?from=challenge",
    },
  },
  express: {
    id: "express",
    role: "论文手",
    tag: "表达派",
    line: "能把复杂思路讲清楚。",
    detail: "你在意“为什么”，也在意别人能不能看懂。比赛最后交的是一篇论文，评委读到的每一句话都要经过你。",
    partner: "建模手",
    course: {
      label: "七关实战",
      hint: "跟着一道真实赛题走到第 7 关“论文框架”",
      to: "/quest?from=challenge",
    },
  },
  allround: {
    id: "allround",
    role: "全能型",
    tag: "均衡派",
    line: "三项比较均衡。",
    detail: "建模、编程、写作你都能搭把手，是队里最好的“粘合剂”——哪个位置缺人，你都能顶上。",
    partner: "任何人",
    course: {
      label: "线性规划精讲",
      hint: "从第一课开始，把建模的完整流程走一遍",
      to: "/learn/linear-programming?from=challenge",
    },
  },
};

/** 结果页底部固定说明 */
export const DISCLAIMER = "这是趣味倾向，不是能力测评。真正的建模能力，练出来的。";
export const PRIVACY_NOTE = "我们只统计匿名访问次数，不收集个人信息。";
