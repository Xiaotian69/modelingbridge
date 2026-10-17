/**
 * 第零课「认识数学建模」. Original teaching text written for ModelingBridge. Every number shown is
 * computed from data.ts with math.ts (itself checked against verify_intro.py), never typed in by hand.
 *
 * Teaching ideas (not text) were drawn from four 2004 articles in 《数模》 Vol.1 No.1; see the last
 * section and docs/content/intro-course-sources.md for what was kept, changed and left out.
 */
import type { Block } from "../content";
import type { BridgeBlock } from "../CourseBridge";
import { CLASS_MINUTE, COMMUTE_DAYS, RAIN_DAYS, UMBRELLA, WALK } from "./data";
import { clock, commuteCheck, latestSafeDeparture, mean, optimum, plan, total, walkMinutes } from "./math";
import { INTRO_SECTIONS } from "./sectionIds";

export type IntroBlock =
  | Block
  | BridgeBlock
  | { type: "intro-process" }
  | { type: "intro-commute" }
  | { type: "intro-team" }
  | { type: "intro-contest-flow" }
  | { type: "intro-map" }
  | { type: "intro-umbrella" }
  | { type: "intro-cycle" }
  | { type: "intro-tracks" };
export type IntroSection = { id: string; title: string; lead: string; blocks: IntroBlock[] };

const p = (text: string): IntroBlock => ({ type: "p", text });
const note = (text: string): IntroBlock => ({ type: "note", text });
const fmt = (x: number) => (Number.isInteger(x) ? String(x) : String(Math.round(x * 10) / 10));

// ---- Computed results used in the text ----
export const walk = {
  normal: walkMinutes(WALK.metres, WALK.speed),
  light: walkMinutes(WALK.metres, WALK.speed, WALK.lightWait),
  slow: walkMinutes(WALK.metres, WALK.slowSpeed),
};
export const commute = (() => {
  const average = mean(COMMUTE_DAYS);
  const byAverage = CLASS_MINUTE - average;
  const sunny = COMMUTE_DAYS.filter((_, i) => !RAIN_DAYS.includes(i + 1));
  const safe = latestSafeDeparture(COMMUTE_DAYS, CLASS_MINUTE);
  return {
    average,
    sum: COMMUTE_DAYS.reduce((s, x) => s + x, 0),
    longest: Math.max(...COMMUTE_DAYS),
    byAverage,
    lateByAverage: commuteCheck(COMMUTE_DAYS, byAverage, CLASS_MINUTE).late,
    safe,
    sunnySafe: latestSafeDeparture(sunny, CLASS_MINUTE),
    sunnyLongest: Math.max(...sunny),
  };
})();
export const umbrella = {
  total: total(UMBRELLA),
  now: plan(UMBRELLA, 0),
  best: optimum(UMBRELLA),
};
const days = COMMUTE_DAYS.join("、");
const lateDays = commute.lateByAverage.map((d) => COMMUTE_DAYS[d - 1]).join("、");

export const introSections: IntroSection[] = [
  {
    id: "intro-what",
    title: INTRO_SECTIONS[0].title,
    lead: "先从一道你一定做过的应用题说起",
    blocks: [
      p(
        `先看一道应用题：从宿舍到教学楼 ${WALK.metres} 米，步行速度每秒 ${WALK.speed} 米，走过去要多久？${WALK.metres} ÷ ${WALK.speed} = ${WALK.metres / WALK.speed} 秒，也就是 ${fmt(walk.normal)} 分钟。条件都给了，答案只有一个，算对就结束。`,
      ),
      p(
        "现在换成一个真实的问题：明天早上 8 点有课，我几点出门？这一次没人替你列好条件。你会自然地追问：路上有没有红绿灯？下不下雨？还有一个更关键的问题：你想要的是“一般要走多久”，还是“几乎不会迟到”？目的不同，需要的答案也不同。",
      ),
      {
        type: "table",
        caption: "表 1 · 同一段路，不同的假设（数字为教学设定）",
        headers: ["题目没说清的事", "如果假设……", "算出来的时间"],
        rows: [
          ["路上会不会停", `一路畅通，每秒走 ${WALK.speed} 米`, `${fmt(walk.normal)} 分钟`],
          ["红绿灯", `有一个路口，平均要等 ${WALK.lightWait} 分钟`, `${fmt(walk.light)} 分钟`],
          ["走路速度", `背着书包、边走边看手机，每秒 ${WALK.slowSpeed} 米`, `${fmt(walk.slow)} 分钟`],
          ["你到底想要什么", "要保证几乎每天都不迟到", "要看最慢的那几天，不能只看平均"],
        ],
      },
      p(
        "上表前三行各是一个小模型，它们都没算错，也没有哪个是“标准答案”，只看在什么假设下合适；第四行则提醒我们，先要问清楚目的。这正是数学建模要做的事：为了理解、预测或改善现实中的一件事，先弄清目的，抓住起主要作用的因素，用数学语言写出一个简化的描述，再用数据或逻辑检验它有没有用。",
      ),
      p(
        "模型是对现实的简化描述，不是现实本身。地铁线路图就是一个好模型：它不按真实比例，弯弯曲曲的轨道被画成直线，可是“在哪站换乘、要坐几站”一清二楚。它丢掉了与乘车无关的细节，所以才好用。数学模型也是这样，它可以是一个公式、一张表、一张图，或一段程序，关键是保留了决定答案的结构。",
      ),
      p(
        "简化是必要的，但也有代价。线路图帮不了你估计步行时间；一个忽略了下雨的通勤模型，在雨天可能让你迟到。所以说一个模型的结论时，更准确的说法是“在这些假设下，模型给出……”，而不是“模型证明了……”。",
      ),
      {
        type: "table",
        caption: "表 2 · 课本习题和建模任务，有什么不同",
        headers: ["", "课本习题", "建模任务"],
        rows: [
          ["条件", "题目全部给出", "要自己弄清、查找，或者提出假设"],
          ["目标", "问什么就答什么", "先想清楚到底想改善什么"],
          ["数据", "准确、刚好够用", "要自己收集，常常不完整、有误差"],
          ["答案", "通常唯一", "取决于目标和假设，可能有几种合理方案"],
          ["过程", "一次算完", "常常要回头修改假设和模型"],
          ["好坏标准", "对或错", "是否有用、是否可信、局限在哪里"],
        ],
      },
      note(
        "常有人说“数学建模就是套公式”，这是最常见的误解。公式只是模型的一种写法；更难、也更重要的，是决定哪些因素放进模型、怎样检验它，以及怎样说明它在什么条件下成立。",
      ),
      { type: "question", id: "intro-think-1" },
    ],
  },
  {
    id: "intro-assume",
    title: INTRO_SECTIONS[1].title,
    lead: "把说不清的现实，变成说得清的条件",
    blocks: [
      p(
        `表 1 里有 ${fmt(walk.normal)}、${fmt(walk.light)}、${fmt(walk.slow)} 分钟三个不同的时间，差别全部来自假设。假设是为了让问题能算下去而暂时接受的条件，例如“步行速度不变”“只有一个红绿灯”。现实里能影响通勤的因素几乎数不完，不做取舍，问题就无从下手。`,
      ),
      p(
        "写假设不是偷懒，而是把思考摊开给别人看。好的假设有三个特点：有理由（为什么可以这样简化），写清楚（别人知道你忽略了什么），能检验（以后能用数据看看它成不成立）。",
      ),
      p("初学者最容易把下面三种“条件”混在一起。它们的来源不同，写进论文时的交代方式也不同："),
      {
        type: "table",
        caption: "表 3 · 三种条件，来源不同",
        headers: ["类型", "例子", "怎么得来", "要交代什么"],
        rows: [
          ["观测数据", "这周一走了 11 分钟", "测量、调查、公开数据库", "来源、时间、测量方法"],
          ["假设", "下周的路况和这周差不多", "建模者的判断", "理由，以及不成立时会怎样"],
          ["设定的数据", "本课里所有通勤和雨伞的数字", "为教学或分析而给定", "说明它不是真实观测"],
        ],
      },
      p(
        "为什么两个同样认真的人，会得出不同的结论？往往是因为假设不同。一人假设“下雨天和晴天一样”，另一人假设“下雨天要慢几分钟”，他们建议的出门时间自然不同。这时争论谁“算对了”没有意义，该比较的是：哪个假设更接近实际？能不能用数据检验？",
      ),
      note(
        "结论随假设改变，不是模型的缺点，恰恰是建模诚实的地方。竞赛论文里通常专门有一节“模型假设”，就是为了让读者知道结论在什么条件下成立。",
      ),
      { type: "question", id: "intro-think-2" },
    ],
  },
  {
    id: "intro-process",
    title: INTRO_SECTIONS[2].title,
    lead: "跟着“早八几点出门”走一遍完整流程",
    blocks: [
      p(
        "现在把“几点出门”认真做一遍。小周这学期的早八已经迟到了三次，决定花两周时间解决这件事。下面九个步骤是建模中常见的工作。名字不用背，重要的是看清每一步为什么要做、交出了什么结果、下一步怎样用它。点选任意一步查看。",
      ),
      { type: "intro-process" },
      p(
        `第 7 步和第 8 步之间发生了一件重要的事：用平均用时 ${commute.average} 分钟算出 ${clock(commute.byAverage)} 出门，检验时发现 10 天里有 ${commute.lateByAverage.length} 天会迟到。小周没有硬着头皮交差，而是回到第 2 步重新看目标，再回到第 6 步换一个能回答这个目标的量。建模很少一条直线走到底；发现结果不合理时，回头修改目标、假设、数据或模型，是正常的工作方式。`,
      ),
      p("下面是小周的 10 天记录。拖动出门时刻，看看每一天能不能准时："),
      { type: "intro-commute" },
      p(
        "每提前一分钟出门，就多一分把握，也少睡一分钟。“几点出门”最终取决于你愿意承担多大的迟到风险。这一点数学不能替你决定，它是目标的一部分；数学能做的，是把每种选择的后果算清楚。",
      ),
      { type: "question", id: "intro-think-3" },
    ],
  },
  {
    id: "intro-team",
    title: INTRO_SECTIONS[3].title,
    lead: "分工是为了效率，不是各干各的",
    blocks: [
      p(
        "真实的建模问题和建模比赛，大多由小组合作完成（每队人数由各赛事规定）。组里的工作大致可以分成三类，下表也写出了每类工作常被误解成什么：",
      ),
      {
        type: "table",
        caption: "表 4 · 三类常见工作",
        headers: ["工作", "主要做什么", "不只是……"],
        rows: [
          ["模型分析", "理解问题、提出假设、找出关键变量、选择方法、解释结果", "不只是写几行公式"],
          ["计算与编程", "整理数据、实现算法、做模拟、画图表、检查计算是否正确", "不只是把数据丢进现成软件"],
          ["论文与表达", "记录分析过程、解释模型、呈现图表、讨论结果和局限、组织全文", "不只是最后把文字排版好"],
        ],
      },
      p(
        `三类工作环环相扣。负责编程的同学如果算出“平均用时 ${commute.sum} 分钟”（忘了除以 10），负责模型的同学应该立刻觉得不对：走 ${WALK.metres} 米怎么会要两个小时？写论文的同学也要读懂结果，才能写出可信的解释。每个人可以有主要分工，但不能完全不懂队友在做什么。`,
      ),
      p("试一试：下面是通勤问题里的五项具体工作。为每一项选一个“主要负责”的人，看看还需要谁参与。这里没有唯一正确的分配。"),
      { type: "intro-team" },
      p(
        "还有两件事和分工同样重要。一是分歧怎么处理：意见不同很正常，把各自的理由摆出来，能用数据或小实验检验的就检验，而不是比谁的声音大；实在要取舍，先选一个方案往前推进，把另一个思路记下来作为对比。二是时间怎么安排：提前约好几个检查点（比如“第一天结束前定下模型框架”），给检查和修改论文留出时间，也要保证睡眠。连续熬夜往往让人犯更多低级错误。",
      ),
      { type: "question", id: "intro-think-4" },
    ],
  },
  {
    id: "intro-contest",
    title: INTRO_SECTIONS[4].title,
    lead: "一次比赛，大致会经历什么",
    blocks: [
      p(
        "数学建模竞赛把前面的过程压缩在几天之内完成。赛题通常来自真实问题，没有唯一的标准答案；参赛队要在规定时间内读题、建模、计算，最后提交一篇论文，有的比赛还要求提交代码或支撑材料。好的论文要让读者看懂：你怎样分析问题、为什么选这个方法、结果是否可靠、有哪些局限。下面是一次比赛常见的过程：",
      ),
      { type: "intro-contest-flow" },
      p(
        "国内参与面最广的是高教社杯全国大学生数学建模竞赛（常称“国赛”），国际上常见的有美国大学生数学建模竞赛 MCM/ICM（常称“美赛”），此外还有许多地区性、行业性和校级比赛。各赛事在报名方式、比赛时长、每队人数、论文格式和页数、能否使用 AI 工具、提交平台和参赛资格等方面各有规定，而且会逐年调整。具体以当届主办方发布的通知和规则为准。",
      ),
      {
        type: "course-bridge",
        to: "/library/calendar",
        kicker: "模桥 · 赛事日历",
        title: "各赛事的时间与官方来源",
        text: "日历整理了常见建模赛事的报名和比赛时间，每条都附官方来源，并标出哪些信息还待核实。",
      },
      p(
        "比赛的价值不只是获奖。为一道陌生的题查资料、讨论、写代码、反复修改论文，几天下来，你会练到自主学习、团队协作、数学应用、编程实践、资料检索和科学写作，这些能力在比赛之外同样用得上。第一次参赛，把目标定为“完整、诚实地做完一道题”就很好。",
      ),
      note(
        "学术诚信是底线：不编造数据，不虚构实验或计算结果，不伪造结论，不抄袭他人成果（引用要注明出处），比赛期间遵守关于交流讨论的规定。AI 工具能不能用、能用到什么程度、怎样在论文里说明，都以当届赛事的规则为准，并如实说明用法。做不出来的部分如实写出来，远比一个编造的“漂亮结果”有价值。",
      ),
    ],
  },
  {
    id: "intro-map",
    title: INTRO_SECTIONS[5].title,
    lead: "不必一开始就会所有方法",
    blocks: [
      p(
        "看到竞赛题，新手常问：“我得先学会多少种模型？”其实不需要一开始全部掌握。更好的顺序是：先认清问题属于哪一类、要回答什么，再有针对性地学习方法。下面是一张入门用的地图：",
      ),
      { type: "intro-map" },
      p(
        "这张地图只是粗略的分类。真实赛题常常同时包含几类问题，比如先预测需求，再按预测安排资源；同一类问题也有很多种方法，每种方法都有适用条件，没有哪一种能解决一类问题的全部情况。你马上会在雨伞问题里看到：调配雨伞是一个很小的最优化问题，而“每个点需要多少把”本身又是一个预测问题。",
      ),
      p(
        "早年间的竞赛经验文章常会列出“必须掌握的几类算法”，那反映的是当时的赛题和工具。今天的方法更多，常用的工具也变了（Python、MATLAB、R 等都很常见），但道理没有变：没有万能的算法，要根据问题选方法，并说清楚为什么这样选。",
      ),
      { type: "question", id: "intro-think-5" },
    ],
  },
  {
    id: "intro-umbrella",
    title: INTRO_SECTIONS[6].title,
    lead: "自己动手，从问题走到方案",
    blocks: [
      p(
        `轮到你了。学校在两处设了共享雨伞点：A 点在教学楼门口，B 点在宿舍区，一共 ${umbrella.total} 把伞。天气预报说下午有雨，学校还来得及在下雨前派人调配一次。问题是：怎样调配，才能尽量减少学生借不到伞的情况？`,
      ),
      note("本题所有数字都是为教学设定的，不是任何学校的真实调查。"),
      p("下面的练习一次只走一小步。每一步的结果都由页面实时计算，你可以随时退回上一步或重新开始。"),
      { type: "intro-umbrella" },
      { type: "question", id: "intro-self-1" },
    ],
  },
  {
    id: "intro-review",
    title: INTRO_SECTIONS[7].title,
    lead: "从问题到方案，再到“它在什么条件下成立”",
    blocks: [
      p("把雨伞案例里做过的事排成一行，就是第 3 节那条流程："),
      { type: "intro-cycle" },
      p(
        `最后一步最容易被忽略。调 ${umbrella.best.low} 把的方案，只在“需求预测准确”等假设下是最好的。你改动需求时，原方案的缺口变了，最好的调法也变了；当来借伞的总人数超过 ${umbrella.total} 把伞，怎样调都满足不了所有人，而且最好的调法往往不止一种。这时该考虑增加雨伞、从别处借伞，或者事先说明分配规则，这些已经超出了“调配”这个模型能回答的范围。`,
      ),
      p(
        "所以，模型给出的不是“现实中必然发生的结果”，而是“在这些条件下最好的安排”，以及条件变化时该怎样重新计算。真实的赛题会复杂得多：需求要从历史数据中预测，可能有更多的点、搬运成本、借还时间……但骨架你已经走过一遍了：目标、变量、假设、数据、关系、求解、检验、解释与改进。",
      ),
    ],
  },
  {
    id: "intro-next",
    title: INTRO_SECTIONS[8].title,
    lead: "挑一条你最感兴趣的路线",
    blocks: [
      p(
        "第零课到这里就结束了。接下来的五门精讲都从零讲起，每门围绕一个完整的例题展开，配有交互实验和专项练习。按你最好奇的问题选一条路线：",
      ),
      { type: "intro-tracks" },
      p(
        "还没想好？对“怎样安排最好”感兴趣，可以从线性规划开始；想用数据说话，从回归分析开始；常常纠结怎么选，从层次分析法开始。也可以先去七关实战，看看一道完整的赛题长什么样。",
      ),
      note(
        "参考资料：本课的教学思路参考了《数模》2004 年第 1 卷第 1 期（中国数学建模网 SHUMO.COM 编）中的四篇经验文章：向为《数学建模竞赛新手教程》、王瑛《数模之路》、董乘宇《数学建模竞赛中应当掌握的十类算法》和《参加数学建模竞赛的十大秘诀》。本课借鉴了其中“先问清条件再动手”“分工也要互相理解”“诚信最重要”“不同问题需要不同方法”等思想；文中的竞赛日期、组织流程、软件推荐、作息方式和个人观点反映的是作者当年的经历，本课没有沿用。课程中的案例、文字与题目均为模桥原创，未转载原文，也未在网站上提供原文件。",
      ),
    ],
  },
];

/** Numbers the lesson relies on, for content.test.ts and the components. */
export const introNumbers = { walk, commute, umbrella, days, lateDays };
