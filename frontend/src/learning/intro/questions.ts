/**
 * 第零课 checkpoints. Each one asks about one idea, its options are the same kind of thing
 * (four sentences about the same problem, four ways to react to the same result …), and every
 * wrong option has its own explanation in exerciseMeta.ts. Numbers come from data.ts and are
 * re-checked in content.test.ts. Graded by the shared, unchanged grading.ts.
 */
import type { CourseQuestion } from "../courseQuestion";

const common = {
  model: "intro",
  source: { kind: "original", author: "模桥原创教学案例" },
  review: "verified",
} as const;

export const introQuestions: CourseQuestion[] = [
  {
    ...common,
    id: "intro-think-1",
    placement: "inline",
    difficulty: "基础",
    knowledge: "现实问题与模型",
    type: "single",
    prompt: "关于“早八几点出门”，下面四句话中，哪一句是一个模型？",
    options: [
      { id: "problem", label: "明天 8 点有课，几点出门才不会迟到？" },
      { id: "model", label: "到达时刻 = 出门时刻 + 900 米 ÷ 步行速度" },
      { id: "data", label: "昨天从宿舍走到教学楼用了 13 分钟" },
      { id: "goal", label: "希望尽量不迟到，又不想起得太早" },
    ],
    answer: "model",
    answerLabel: "到达时刻 = 出门时刻 + 900 米 ÷ 步行速度",
    hints: ["模型要能回答“如果……会怎样”：给它一个出门时刻，它能不能算出到达时刻？"],
    explanation:
      "这句话把现实问题写成了可以计算、可以检验的关系：给出出门时刻，就能算出到达时刻，再和真实记录比较。它也做了简化（只看路程和速度，没算红绿灯），所以有局限。另外三句分别是要解决的问题、一条观测数据和目标，它们都是建模要用到的材料，但本身还不是模型。",
    verification: "第 1 节对“模型”的定义；四个选项依次是问题、模型、数据、目标",
  },
  {
    ...common,
    id: "intro-think-2",
    placement: "inline",
    difficulty: "基础",
    knowledge: "假设与数据",
    type: "single",
    prompt: "在通勤问题里，下面哪一句是“假设”，而不是观测得到的数据？",
    options: [
      { id: "timed", label: "这周一从宿舍走到教学楼用了 11 分钟" },
      { id: "assume", label: "下周每天路上的情况和这周差不多" },
      { id: "light", label: "宿舍到教学楼之间有 1 个红绿灯" },
      { id: "rain", label: "有一天下了雨，那天走了 15 分钟" },
    ],
    answer: "assume",
    answerLabel: "下周每天路上的情况和这周差不多",
    hints: ["哪一句是现在就能用手机计时、实地查看确认的？哪一句只能等到下周才知道对不对？"],
    explanation:
      "“下周和这周差不多”无法事先测量，是为了用这周的记录推断下周而做出的判断。它可能不成立（考试周、道路施工都会改变路况），所以要写明它，必要时用新数据检验。另外三句都是实际测量或查看得到的观测数据。",
    verification: "第 2 节表 3 对观测数据与假设的区分",
  },
  {
    ...common,
    id: "intro-think-3",
    placement: "inline",
    difficulty: "基础",
    knowledge: "检验与修改",
    type: "single",
    prompt: "小周用平均用时 12 分钟算出 7:48 出门，检验时发现 10 天里有 3 天会迟到。下面哪种做法最合理？",
    options: [
      { id: "recompute", label: "重算一遍平均值，一定是哪里算错了" },
      { id: "goal", label: "回到目标：“每天准时”要看最慢的情况，平均值回答不了它，应换一个量重新计算" },
      { id: "drop", label: "把最慢的几天当成意外删掉，这样 7:48 就够了" },
      { id: "luck", label: "模型已经给出答案，迟到的那几天只是运气不好" },
    ],
    answer: "goal",
    answerLabel: "回到目标，换一个能回答“每天准时”的量重新计算",
    hints: ["平均值没有算错。问题是：平均值回答的是什么问题？小周的目标又是什么？"],
    explanation:
      "平均值回答“一般要走多久”，而目标是“每天都准时”，两者不是同一个问题。检验发现结果不满足目标时，要回头修改：用 10 天里最长的 15 分钟，7:45 出门，记录中的 10 天都能准时。这仍然只是对已有记录成立，所以还要继续收集数据。",
    verification: "第 3 节出门时刻计算器；intro-verified.json: commute.departures",
  },
  {
    ...common,
    id: "intro-think-4",
    placement: "inline",
    difficulty: "基础",
    knowledge: "团队分工与合作",
    type: "single",
    prompt: "负责编程的同学算出“平均用时 120 分钟”，直接交给了写论文的同学。下面哪种说法最准确？",
    options: [
      { id: "everyone", label: "写论文的同学也应该发现这个数不合常理，和队友一起核对" },
      { id: "coder", label: "这只是编程同学的责任，其他人照着写就行" },
      { id: "formula", label: "只要模型公式写对了，具体数字错了不影响论文" },
      { id: "nobody", label: "读者不会一个个核对数字，不必在意" },
    ],
    answer: "everyone",
    answerLabel: "写论文的同学也应该发现问题，和队友一起核对",
    hints: ["走 900 米要两个小时，合理吗？谁应该有能力看出来？"],
    explanation:
      "120 是 10 天用时的总和，忘了除以 10，正确的平均值是 12 分钟。三类工作是一条链：写论文的人要读懂结果才能解释它，负责模型的人要知道数字的合理范围。分工是为了效率，不是为了只对自己那一块负责。",
    verification: "第 4 节；intro-verified.json: commute.sum = 120, commute.mean = 12",
  },
  {
    ...common,
    id: "intro-think-5",
    placement: "inline",
    difficulty: "基础",
    knowledge: "按问题选思路",
    type: "single",
    prompt: "协会想根据过去五年每年招新时来的人数，估计今年大概会来多少人，以便准备场地。这首先是哪一类问题？",
    options: [
      { id: "predict", label: "预测问题" },
      { id: "optimize", label: "最优化问题" },
      { id: "evaluate", label: "评价与决策问题" },
      { id: "network", label: "网络与路径问题" },
    ],
    answer: "predict",
    answerLabel: "预测问题",
    hints: ["这道题首先要回答的是一个未知的数量，还是在几个方案里挑一个？"],
    explanation:
      "首先要根据已有数据估计一个未知的数量，这是预测。估计出人数之后，“准备多大的场地、安排几个人”可以再作为决策问题。先预测、再决策，是真实问题里很常见的组合；只有五年的数据，预测结果要格外谨慎。",
    verification: "第 6 节问题类型地图",
  },
  {
    ...common,
    id: "intro-self-1",
    placement: "self",
    difficulty: "进阶",
    knowledge: "识别优化目标",
    type: "single",
    prompt:
      "学校要把 10 名志愿者分到 3 个食堂，希望午餐高峰时学生排队等待的总时间尽量短。下面哪一项是这个问题的优化目标？",
    options: [
      { id: "objective", label: "所有学生排队等待的总时间（越短越好）" },
      { id: "constraint", label: "志愿者一共只有 10 名" },
      { id: "decision", label: "每个食堂分到几名志愿者" },
      { id: "data", label: "每个食堂午餐高峰有多少学生" },
    ],
    answer: "objective",
    answerLabel: "所有学生排队等待的总时间（越短越好）",
    hints: ["目标是“要让它尽量变好”的那个量。四个选项里，哪个带着“越……越好”？"],
    explanation:
      "目标是用来比较方案好坏的量，这里是等待总时间，越短越好。“一共 10 名”是约束（限制条件），“每个食堂分几名”是要做的决定（决策变量），“各食堂有多少学生”是输入的数据。和雨伞问题一样：目标、变量、约束、数据，是写出一个优化模型的四样东西。",
    verification: "第 7 节雨伞案例的目标、变量、条件与数据",
  },
];
