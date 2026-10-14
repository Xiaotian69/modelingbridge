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
// 第 1 题：食堂排队（两步）
// ① 6 选 3：找出最直接造成排队的因素。3 个是影响因素，3 个是调查方法或反馈。这一步只用于教学，不计分；
//    “选对几个”不影响人格结果，避免把对错算进性格里。
// ② 追问“要验证你的判断，先做什么”：这一步计分，和第 2、3 题的追问同一结构。

export type Q1Option = { id: string; label: string; kind: "cause" | "method"; tag: string };

export const q1 = {
  title: "为什么食堂一到饭点就排长队？",
  prompt: "下面有的是造成排队的原因，有的是调查方法或大家的反馈。找出最直接造成排队的 3 个。",
  pick: 3,
  options: [
    { id: "arrive", label: "一下课，大批人同时涌进食堂", kind: "cause", tag: "人来得多快" },
    { id: "window", label: "窗口太少，每分钟只能打几份", kind: "cause", tag: "窗口打得多快" },
    { id: "hot", label: "大家都挤同一个热门窗口", kind: "cause", tag: "人挤在哪" },
    { id: "card", label: "查刷卡记录，统计消费", kind: "method", tag: "数据" },
    { id: "watch", label: "观察不同时间的队伍长度", kind: "method", tag: "观察" },
    { id: "wall", label: "表白墙上一堆排队吐槽", kind: "method", tag: "反馈" },
  ] satisfies Q1Option[],
  causeLabel: "直接原因",
  methodLabel: "调查方法和反馈",
  methodNote: "它们不是排队的原因，却是下一步验证判断时离不开的工具。",
  explain:
    "来排队的人，比窗口能及时打完饭的人还多，队伍就会越排越长；热门窗口又让人挤在一处。",
  feedback:
    "你刚才做的是数学建模的重要一步：从一堆现象里找出关键因素。不过这还只是判断，你们食堂是不是这样，要收集数据才知道。",
  verifyPrompt: "要验证你的判断，你最想先做什么？",
  verify: [
    { id: "relation", label: "先写清楚：每分钟来几个人、能打几份饭", points: { M: 2 }, style: "abstract" },
    { id: "extra", label: "算一算：多开一个窗口，队伍能短多少", points: { M: 2 }, style: "optimize" },
    { id: "data", label: "查刷卡记录，再去现场数数队伍", points: { C: 2 }, style: "data" },
    { id: "voice", label: "整理表白墙的吐槽，听听大家怎么说", points: { W: 2 }, style: "express" },
  ] satisfies ScoredOption[],
};

/**
 * 旧版第 1 题（2026-10-14 上线的版本）的计分表。已经在线上答过题的人，本机存的 q1 是字符串数组，
 * 刷新或回访时仍按当时的规则算出同一个结果，不会因为改版变卡片。
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
// 第 2 题：20 块钱、30 分钟的麻辣烫（线性规划，最优解由 learning/solver.ts 计算）

export const q2 = {
  title: "只有 20 块钱和 30 分钟，怎么吃饱又不迟到？",
  story:
    "中午去吃串串麻辣烫，离上课还有 30 分钟，走到教学楼要 5 分钟，所以只剩 25 分钟吃饭；兜里还剩 20 块。",
  meat: { name: "荤菜", example: "丸子、鸡柳", price: 2, minutes: 1, full: 3, note: "一口一个，约 1 分钟一串" },
  veg: { name: "素菜", example: "青菜、金针菇", price: 1, minutes: 2, full: 2, note: "烫嘴要慢慢吃，约 2 分钟一串" },
  budget: 20,
  minutes: 25,
  /** 反馈里的小字：承认情景是理想化的 */
  assumption: "为了好算，这里假设每串的价格和吃的时间都固定不变。真实建模也常这样先简化，算完再回头检查假设合不合理。",
  methodPrompt: "你刚才是怎么找的？",
  methods: [
    { id: "calc", label: "先算钱和时间各够几串，再在中间找", points: { M: 2 }, style: "optimize" },
    { id: "try", label: "一格一格地试，盯着饱腹值变化", points: { C: 2 }, style: "data" },
    { id: "explain", label: "更想弄明白为什么是这个组合，讲给室友听", points: { W: 2 }, style: "express" },
  ] satisfies ScoredOption[],
  feedback:
    "这就是线性规划：钱和时间是约束，饱腹值是目标。最优解刚好把钱和时间同时用完，落在可行区域的一个角上。",
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
    "这叫费米估算：把不知道的数，拆成几个能估的数。比如假设 2 万人里每天十分之一买一杯，就是约 2000 杯——数字是假设，思路才是重点。",
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
