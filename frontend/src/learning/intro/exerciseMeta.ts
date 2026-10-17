/**
 * Teaching metadata for 第零课 checkpoints (same shape as the other courses' exerciseMeta):
 * the section that teaches each idea and one diagnosis for every wrong option, naming the
 * misunderstanding instead of only saying “wrong”.
 */
import type { ExerciseMeta } from "../exerciseMeta";

export const introExerciseMeta: Record<string, ExerciseMeta> = {
  "intro-think-1": {
    sectionId: "intro-what",
    errors: [
      { option: "problem", tag: "这是现实问题", message: "它说出了想知道什么，但还没有给出任何可以计算的关系。模型是为回答它而写出的简化描述。" },
      { option: "data", tag: "这是一条数据", message: "这是一次观测得到的数据。模型可以用数据来估计速度或检验结果，但单独一条数据不是模型。" },
      { option: "goal", tag: "这是目标", message: "它告诉我们要往哪个方向改善，却没有说怎样由出门时刻算出到达时刻。" },
    ],
  },
  "intro-think-2": {
    sectionId: "intro-assume",
    errors: [
      { option: "timed", tag: "这是观测数据", message: "用手机计时得到的时间，是已经发生、测量出来的数据。" },
      { option: "light", tag: "这是观测数据", message: "红绿灯有几个，走一趟就能数出来，是可以核实的事实。" },
      { option: "rain", tag: "这是观测数据", message: "下雨和那天的用时都是实际记录下来的。把“下雨天都要 15 分钟”当成规律才是假设，而且只凭一天的记录还不够。" },
    ],
  },
  "intro-think-3": {
    sectionId: "intro-process",
    errors: [
      { option: "recompute", tag: "把目标问题当成计算错误", message: "平均值没有算错：120 ÷ 10 = 12。问题不在计算，而在这个量回答不了“每天准时”。" },
      { option: "drop", tag: "删改了不合心意的数据", message: "删掉不合心意的数据等于改写事实。怀疑某天是特殊情况（比如下雨），应该保留它，单独分析。" },
      { option: "luck", tag: "跳过了检验", message: "检验就是为了发现方案和目标不符的地方。10 天里 3 天迟到，说明方案不满足目标，应该修改模型，而不是怪运气。" },
    ],
  },
  "intro-think-4": {
    sectionId: "intro-team",
    errors: [
      { option: "coder", tag: "把分工当成互不相干", message: "写论文的人要读懂结果，才能写出可信的解释。一个明显离谱的数，全队都应该能发现。" },
      { option: "formula", tag: "只看公式不看结果", message: "公式对、数字错，结论依然是错的。模型、计算、表达是一条链，任何一环出错都会影响结论。" },
      { option: "nobody", tag: "忽视了结果的可信度", message: "论文的价值在于结论可信。“走 900 米要两小时”，认真的读者一眼就能看出不合理。" },
    ],
  },
  "intro-think-5": {
    sectionId: "intro-map",
    errors: [
      { option: "optimize", tag: "先后顺序反了", message: "“准备多大场地”可以是之后的决策，但首先要回答“会来多少人”：用已有数据估计未知数量，这是预测。" },
      { option: "evaluate", tag: "没有要比较的方案", message: "评价问题要在多个方案、多个标准之间比较或排序，这里还没有方案可比。" },
      { option: "network", tag: "没有连接与路线", message: "问题不涉及地点之间怎样连接、怎样走。" },
    ],
  },
  "intro-self-1": {
    sectionId: "intro-umbrella",
    errors: [
      { option: "constraint", tag: "这是约束", message: "“一共只有 10 名”限制了能做的选择，是约束条件，不是要让它变好的量。" },
      { option: "decision", tag: "这是决策变量", message: "“每个食堂分几名”是我们要做的决定。目标是用来比较不同决定好坏的那个量。" },
      { option: "data", tag: "这是数据", message: "各食堂的学生人数是模型的输入，我们改变不了它，只能用它来计算等待时间。" },
    ],
  },
};
