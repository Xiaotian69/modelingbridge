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

/**
 * 活动开关与联系方式。
 * - active：招新进行中。改成 false 后，“加入协会”变“关注协会”，/challenge 链接继续可用。
 * - lottery：摊位抽奖确认开展后才改成 true；为 false 时页面上不出现任何抽奖字样。
 */
export const event = {
  active: true,
  lottery: false,
  societyName: "财大数学建模协会",
  /** 结果页给的是招新群（不是协会大群）：先进招新群了解、报名，加入协会后再进协会群 */
  qqGroup: "566983524",
  groupName: "QQ 招新群",
  joinNote: "先进招新群，了解协会、报名加入。",
  /** 开始页顶部小字 */
  activeNote: "财大数学建模协会 · 招新进行中",
  lotteryNote: "财大数学建模协会 · 测完到摊位凭结果页抽奖",
  /** 结果页“截图保存”后面接的话（仅 lottery 为 true 时显示） */
  lotteryHint: "，到招新摊位出示就能抽奖",
  /** 活动结束后，结果页联系卡片的说明 */
  afterNote: "招新已结束，欢迎进群了解协会的后续活动。",
};

/** 扫码渠道：只认这几个值，其他一律记为 direct。 */
export const SOURCES = ["poster", "booth", "flyer", "group"] as const;

/**
 * 匿名统计（不用 Cookie、不收集个人信息）。
 * provider 为 "none" 时只在页面内派发 `mb:challenge` 事件，不发任何网络请求。
 * 接入 Umami 时：provider 改 "umami"，填 scriptSrc 和 websiteId，
 * 并在网站的隐私说明（如“关于”页）写清楚统计了什么；小游戏界面本身不放这类说明。
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
// 第 1 题：饭点排队要等多久（两步）
// ① 估一估：前面 24 人、窗口每分钟打 3 份，要等多久？答案 24 ÷ 3 = 8 分钟有明确依据；
//    这一步只用于进入状态和引出“关键变量”，不计分（算得对不对不该决定你是哪种人）。
// ② 追问“想让队伍变短，你先做什么”：四个选项都是同一层次的“第一步行动”，这一步计分。

export type Q1Guess = { id: string; label: string; kicker: string; reply: string };

export const q1 = {
  title: "饭点排队，你要等多久？",
  scene: { ahead: 24, perMinute: 3, arrivals: 4 },
  story: "你排在队尾，前面还有 24 个人。这个窗口平均每分钟打 3 份饭。",
  prompt: "猜猜你大概要等多久？",
  guesses: [
    { id: "w8", label: "大约 8 分钟", kicker: "猜对了！", reply: "24 个人，每分钟打走 3 个：24 ÷ 3 = 8 分钟。" },
    { id: "w24", label: "大约 24 分钟", kicker: "差一点", reply: "这是按“一人一分钟”算的。其实每分钟能打 3 份，所以是 24 ÷ 3 = 8 分钟。" },
    { id: "w72", label: "大约 72 分钟", kicker: "差一点", reply: "24 × 3 乘反啦。打得越快，等得越短：24 ÷ 3 = 8 分钟。" },
    { id: "unsure", label: "说不准，得看阿姨手速", kicker: "很实在的想法", reply: "确实会忽快忽慢。不过按平均每分钟 3 份，可以先估个大概：24 ÷ 3 ≈ 8 分钟。" },
  ] satisfies Q1Guess[],
  /** 揭晓后的道理（与 scene 的数字对应，测试会核对） */
  insight: "你要等多久，只看两个数：前面有几个人、窗口打得多快。排在你身后的人再多，也不影响你。",
  twist: "可饭点每分钟会来 4 个人，窗口只打 3 份——你身后的队伍每分钟长 1 人。来的比打得快，队伍就会越排越长。",
  takeaway: "从一堆现象里找出真正起作用的量，再把它们的关系写清楚，这就是建模的第一步。",
  note: "数字是题目设定的；真实食堂是不是这样，要实际数过才知道。",
  followPrompt: "想让这条队伍变短，你会先做什么？",
  follow: [
    { id: "relation", label: "先理清：每分钟来多少人、打多少份，差在哪", points: { M: 2 }, style: "abstract" },
    { id: "extra", label: "算一算：多开一个窗口，能少等几分钟", points: { M: 2 }, style: "optimize" },
    { id: "data", label: "蹲一个饭点，掐表记下来人和打饭的速度", points: { C: 2 }, style: "data" },
    { id: "voice", label: "问问排队的同学，最难受的到底是什么", points: { W: 2 }, style: "express" },
  ] satisfies ScoredOption[],
};

/**
 * 线上第一版（2026-10-14 上线）第 1 题的计分表。已在线上答过题的人，本机存的 q1 是因素数组，
 * 回访时按当时的规则算出同一个结果，不会因为改版变卡片。
 */
export const LEGACY_Q1: ScoredOption[] = [
  { id: "arrive", label: "", points: { M: 1 }, style: "abstract" },
  { id: "window", label: "", points: { M: 1 }, style: "optimize" },
  { id: "card", label: "", points: { C: 1 }, style: "data" },
  { id: "camera", label: "", points: { C: 1 }, style: "data" },
  { id: "hot", label: "", points: { W: 1 }, style: "express" },
  { id: "wall", label: "", points: { W: 1 }, style: "express" },
];

// ---------------------------------------------------------------------------
// 第 2 题：20 块钱、25 分钟的串串（线性规划，最优解由 learning/solver.ts 计算）
// 题目明确说出优化目标：在钱和时间之内，让“题目设定的饱腹值”尽量高；不涉及口味。

export const q2 = {
  title: "今天特别饿！20 块、25 分钟，怎么搭配最顶饱？",
  story: "中午去吃串串。兜里 20 块，留给吃饭的时间只有 25 分钟。今天只有一个目标：尽量吃饱。",
  meat: { name: "荤菜", example: "丸子、鸡柳", price: 2, minutes: 1, full: 3 },
  veg: { name: "素菜", example: "青菜、金针菇", price: 1, minutes: 2, full: 2 },
  budget: 20,
  minutes: 25,
  /** 规则卡下的一句话：把优化目标说清楚 */
  goal: "目标：在不超钱、不超时的前提下，让饱腹值加起来最高。饱腹值是题目设定的分数，不管口味。",
  /** 反馈里的小字：承认情景是理想化的 */
  assumption: "为了好算，这里假设每串的价格和吃的时间都固定不变。真实建模也常这样先简化，算完再回头检查假设合不合理。",
  /** 反馈里的一句话：换个目标，答案就会变 */
  preference: "如果你更爱吃荤，或者更在意味道，最优方案就会不一样——数学建模的第一步，是先说清楚到底要优化什么。",
  methodPrompt: "你刚才是怎么找的？",
  methods: [
    { id: "calc", label: "先算钱和时间各够几串，再在中间找", points: { M: 2 }, style: "optimize" },
    { id: "try", label: "一格一格地试，盯着饱腹值变化", points: { C: 2 }, style: "data" },
    { id: "explain", label: "更想弄明白为什么是这个组合，讲给室友听", points: { W: 2 }, style: "express" },
  ] satisfies ScoredOption[],
  feedback:
    "这就是线性规划：钱和时间是约束，饱腹值是目标。在这个目标下，最优解刚好把钱和时间同时用完，落在可行区域的一个角上。",
};

// ---------------------------------------------------------------------------
// 第 3 题：选选修课（三次两难 → AHP 确定指标权重 → 简化综合评分，算法见 ahp.ts、courses.ts）
// 三项指标都看客观事实（往届均分、作业次数、是否早八），不用“兴趣”这类因人而异的项。
// 课程的 1–5 分不手填：由下面的原始数据按 rules 里的规则算出来（courses.ts）。

export const q3 = {
  title: "三门选修课，只能选一门",
  prompt: "三门课各有各的好。回答三个“两难”，让数学帮你选。",
  simulatedNote: "模拟选课情境，课程与数据仅用于数学建模演示。",
  criteria: [
    { id: "grade", name: "给分高" },
    { id: "homework", name: "作业少" },
    { id: "time", name: "避开早八" },
  ],
  /** 原始数据（虚构情景）。 */
  courses: [
    { name: "心理学与生活", avgScore: 91, assignments: 12, homeworkText: "每学期 12 次小作业", slot: "周二 10:00", startHour: 10 },
    { name: "电影鉴赏", avgScore: 85, assignments: 4, homeworkText: "每学期 4 篇观影报告", slot: "周四 14:00", startHour: 14 },
    { name: "传统文化概论", avgScore: 82, assignments: 0, homeworkText: "无平时作业，期末开卷", slot: "周一 8:00", startHour: 8 },
  ],
  /**
   * 原始数据 → 1–5 分的规则，三门课用同一套规则。
   * grade：往届均分 ≥ min 取对应分；homework：每学期作业次数 ≤ max 取对应分；time：开课早于 earlyBefore 点算早八。
   */
  rules: {
    grade: [
      { min: 90, score: 5 },
      { min: 85, score: 4 },
      { min: 80, score: 3 },
      { min: 75, score: 2 },
      { min: 0, score: 1 },
    ],
    homework: [
      { max: 0, score: 5 },
      { max: 4, score: 4 },
      { max: 8, score: 3 },
      { max: 12, score: 2 },
      { max: Infinity, score: 1 },
    ],
    time: { earlyBefore: 9, early: 1, notEarly: 5 },
  },
  ruleText: [
    "给分高：往届均分 90 以上 5 分，85–89 记 4 分，80–84 记 3 分，75–79 记 2 分，更低 1 分。",
    "作业少：每学期 0 次 5 分，1–4 次 4 分，5–8 次 3 分，9–12 次 2 分，更多 1 分。",
    "避开早八：只看是不是早八（9 点前开课）。不是早八 5 分，是早八 1 分；10 点和 14 点都不是早八，所以同分。",
  ],
  /** 三个两难，顺序与 ahp.ts 的 PAIRS 一致：给分-作业、给分-时间、作业-时间 */
  dilemmas: ["多拿几分，还是少写点作业？", "绩点好看，还是避开早八？", "作业少，还是避开早八？"],
  usePrompt: "推荐出来了，你会怎么用它？",
  uses: [
    { id: "follow", label: "就按它选，判断过程清楚就行", points: { M: 2 }, style: "abstract" },
    { id: "check", label: "先问问上过这门课的学长学姐，再验证一下", points: { C: 2 }, style: "data" },
    { id: "write", label: "把理由写下来，讲给室友听再决定", points: { W: 2 }, style: "express" },
  ] satisfies ScoredOption[],
  feedback: "你刚才用的是层次分析法（AHP）的核心一步：两两比较，算出各指标的权重；再按权重给每门课算综合分。比赛里的评价类题目常这样做。",
  /** 方法说明（放在“看看是怎么算的”里） */
  method: "AHP 确定指标权重 + 简化综合评分：权重来自判断矩阵（标准 AHP），课程得分按上面的规则打分后加权求和；没有再对课程两两比较构造方案层判断矩阵，所以不是完整的 AHP 层次总排序。",
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
    "座位有上限，曲线会越涨越慢，不会一直往上冲——这叫“饱和”。照这条示意曲线，想稳稳有座，7:30 前到。先问清“是不是考试周”也很对：条件变了，曲线就不一样。",
};

// ---------------------------------------------------------------------------
// 第 5 题：费米估算。四个选项都是“用什么路线估算”，没有唯一正确答案。
// 每条路线的数字都是标明“假设”的示例（不是真实数据），结果由 fermi.ts 按算式计算。

export type FermiStep = { label: string; value: number; show: string; op?: "×" | "÷" };
export type FermiRoute = ScoredOption & { title: string; steps: FermiStep[]; strength: string; limit: string; miss: string };

export const q5 = {
  title: "全校一天大约卖出多少杯奶茶？",
  prompt: "没人知道准确数字，但可以靠合理假设估个大概。你会走哪条路线？",
  options: [
    {
      id: "demand",
      title: "从人数估",
      label: "从人数估：全校多少人 × 多少人会买 × 每人几杯",
      points: { M: 2 },
      style: "abstract",
      steps: [
        { label: "全校学生", value: 20000, show: "20000 人" },
        { label: "每天买奶茶的人", value: 0.1, show: "十分之一", op: "×" },
        { label: "每人买几杯", value: 1, show: "1 杯", op: "×" },
      ],
      strength: "拆得清楚，每个数都能单独去查、去问。",
      limit: "“多少人会买”最难估，这个比例差一倍，结果就差一倍。",
      miss: "老师和校外的人、一人帮室友带好几杯。",
    },
    {
      id: "supply",
      title: "从店的产能估",
      label: "从店估：几家店 × 每小时最多做几杯 × 营业几小时",
      points: { M: 2 },
      style: "optimize",
      steps: [
        { label: "校内奶茶店", value: 5, show: "5 家" },
        { label: "每家每小时最多做", value: 60, show: "60 杯", op: "×" },
        { label: "营业时间", value: 10, show: "10 小时", op: "×" },
        { label: "平均有多忙（不可能一直满负荷）", value: 1 / 3, show: "三分之一", op: "×" },
      ],
      strength: "算的是“最多能卖多少”，有个上限，不会估得离谱。",
      limit: "店有多忙很难猜，午后和深夜差很多。",
      miss: "校外店铺、外卖送进学校的奶茶。",
    },
    {
      id: "sample",
      title: "抽样数一数",
      label: "去数一数：在一家店门口数一小时，再放大到全校",
      points: { C: 2 },
      style: "data",
      steps: [
        { label: "午饭后在一家店门口数 1 小时", value: 80, show: "80 杯" },
        { label: "一天的生意，大约相当于几个这样的小时", value: 4, show: "4 个", op: "×" },
        { label: "校内奶茶店", value: 5, show: "5 家", op: "×" },
      ],
      strength: "看到的是真实发生的事，最接近事实。",
      limit: "一小时、一家店不一定代表全天全校，换个时段可能差很多。",
      miss: "各家店生意不一样、周末和工作日不一样。",
    },
    {
      id: "data",
      title: "用外卖数据倒推",
      label: "看数据：外卖平台的销量，再推到全部销量",
      points: { C: 2 },
      style: "data",
      steps: [
        { label: "平台上校内几家店的月销量合计", value: 15000, show: "15000 杯" },
        { label: "一个月", value: 30, show: "30 天", op: "÷" },
        { label: "外卖只占全部销量的三分之一，所以再乘", value: 3, show: "3", op: "×" },
      ],
      strength: "有现成的数字，不用从零开始猜。",
      limit: "平台销量不等于全部销量：堂食、自提都不在里面，“外卖占多少”还得再估。",
      miss: "校外顾客的订单、一单点好几杯。",
    },
  ] satisfies FermiRoute[],
  /** 揭晓后的总结（compare 里的范围由 fermi.ts 算） */
  feedback: "这叫费米估算：把一个没法直接知道的数，拆成几个能估的小数。",
  compare: "不同路线差一些很正常。几条路线互相对照，就知道哪个假设最该去核实。",
  note: "所有数字都是举例用的假设，不是真实数据。",
};

/** 线上第一版第 5 题里已经删掉的选项，只用于给旧存档计分。 */
export const LEGACY_Q5: ScoredOption[] = [{ id: "assume", label: "", points: { W: 2 }, style: "express" }];

// ---------------------------------------------------------------------------
// 结果

export type ResultCopy = {
  id: ResultId;
  role: string;
  tag: string;
  line: string;
  detail: string;
  partner: string;
  /** 结果页“加入协会”里的一句话，把人格结果和协会连起来 */
  societyHook: string;
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
    societyHook: "协会里有一起啃题的人：你负责想清楚问题，也能遇到把模型写成代码的编程手。",
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
    societyHook: "优化题是比赛常客。来协会找能把你的方案写成代码、写进论文的队友。",
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
    societyHook: "会写代码的人在建模队里很抢手。来协会交流 Python、MATLAB，也找找需要你的建模手。",
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
    societyHook: "好论文是练出来的。来协会和大家一起读优秀论文、互相改稿，也找找你的建模搭档。",
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
    societyHook: "哪个位置都能顶上的人，最适合当队伍的粘合剂。来协会认识更多队友吧。",
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

// ---------------------------------------------------------------------------
// 结果页“在协会能做什么”：按确定程度分三组，未确认的事只放“计划中”，不写成承诺。

export type SocietyStatus = "now" | "together" | "planned";

export const society: {
  title: string;
  lead: string;
  groups: { status: SocietyStatus; label: string; note: string; items: { icon: string; title: string; text: string; roles?: ResultId[] }[] }[];
  footnote: string;
} = {
  title: "在协会能做什么？",
  lead: "不只是进一个群——是找到一群一起学建模、组队比赛的人。",
  groups: [
    {
      status: "now",
      label: "加入就有",
      note: "已经在运行",
      items: [
        { icon: "📚", title: "模桥学习平台", text: "线性规划精讲、刷题和七关实战，随时可以自学。", roles: ["abstract", "optimize", "allround"] },
        { icon: "💬", title: "协会群", text: "加入协会后进协会群，比赛动态、学习问题都在群里交流。" },
      ],
    },
    {
      status: "together",
      label: "可以一起做",
      note: "看大家参与",
      items: [
        { icon: "🤝", title: "找队友", text: "建模比赛三人一队，在这里认识志同道合的人。", roles: ["allround", "abstract"] },
        { icon: "🎓", title: "问学长学姐", text: "选题、分工、熬夜赶论文的经验，过来人最清楚。" },
        { icon: "💻", title: "编程交流", text: "Python、MATLAB 卡住了，一起看看。", roles: ["data"] },
        { icon: "✍️", title: "论文与表达", text: "论文怎么写、思路怎么讲清楚，可以和同学、学长学姐一起讨论。", roles: ["express"] },
      ],
    },
    {
      status: "planned",
      label: "计划开展",
      note: "以群通知为准",
      items: [
        { icon: "🧭", title: "建模方法分享", text: "优化、评价、预测等方法的专题分享。", roles: ["optimize", "abstract"] },
        { icon: "🏁", title: "趣味活动与练习赛", text: "像今天这样的小挑战，以及赛前练手。" },
      ],
    },
  ],
  footnote: "具体活动和时间以协会群通知为准。",
};
