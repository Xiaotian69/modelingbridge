type Common = {
  id: string;
  model: "linear-programming";
  placement: "inline" | "self" | "practice";
  difficulty: "基础" | "进阶" | "挑战";
  knowledge: string;
  prompt: string;
  hints: string[];
  explanation: string;
  answerLabel: string;
  source: { kind: "original"; author: string };
  review: "verified" | "pending";
  verification: string;
};
export type Question = Common &
  (
    | {
        type: "single" | "judgment";
        options: { id: string; label: string }[];
        answer: string;
      }
    | {
        type: "multiple";
        options: { id: string; label: string }[];
        answer: string[];
      }
    | { type: "numeric"; answer: number; tolerance: number; unit: string }
  );
const common = {
  model: "linear-programming",
  source: { kind: "original", author: "模桥原创教学案例" },
  review: "verified",
} as const;
export const questions: Question[] = [
  {
    ...common,
    id: "think-1",
    placement: "inline",
    difficulty: "基础",
    knowledge: "资源稀缺",
    type: "single",
    prompt: "B 每平方米利润更高，是否应该把全部资源都用于 B？",
    options: [
      { id: "yes", label: "是，单位利润最高就是总利润最高" },
      { id: "no", label: "不一定，还要看两种资源的消耗与剩余" },
    ],
    answer: "no",
    answerLabel: "不一定，还要看资源约束",
    hints: ["只生产 B 时，装配先用完，切割还有剩余。"],
    explanation:
      "只生产 B 可做 40 m²，利润 2000 元；改为 A 40 m²、B 20 m²，两种资源都恰好用完，利润 2600 元。单位利润不能代替整个计划的比较。",
    verification: "手算两个可行方案；solver 默认测试",
  },
  {
    ...common,
    id: "self-1",
    placement: "self",
    difficulty: "基础",
    knowledge: "约束建模",
    type: "single",
    prompt: "切割工时上限为 100 小时，正确约束是哪一个？",
    options: [
      { id: "a", label: "2x + y ≤ 100" },
      { id: "b", label: "x + 2y ≤ 100" },
      { id: "c", label: "2x + y = 100" },
    ],
    answer: "a",
    answerLabel: "2x + y ≤ 100",
    hints: ["把“每平方米工时 × 平方米数”相加。"],
    explanation:
      "A 用 2x 小时，B 用 y 小时，总用量不能超过可用量。允许闲置，因此一般写 ≤；最优点恰好取等号是计算结果，不能预先强加。",
    verification: "单位和资源表逐项对照",
  },
  {
    ...common,
    id: "self-2",
    placement: "self",
    difficulty: "基础",
    knowledge: "线性假设",
    type: "multiple",
    prompt: "哪些属于本章连续线性模型的假设？（多选）",
    options: [
      { id: "constant", label: "单位利润和单位资源消耗在计划范围内不变" },
      { id: "divisible", label: "产量允许取非负小数" },
      { id: "always", label: "所有线性规划都必须用完全部资源" },
    ],
    answer: ["constant", "divisible"],
    answerLabel: "单位系数不变；产量可分割",
    hints: ["区分建模前的假设和某个最优解的特征。"],
    explanation:
      "线性关系要求比例性与可加性，连续 LP 允许小数。资源可能有剩余，例如把装配上限升到远高于需求后，切割会成为唯一瓶颈。",
    verification: "线性模型定义及反例",
  },
  {
    ...common,
    id: "self-3",
    placement: "self",
    difficulty: "进阶",
    knowledge: "灵敏度适用范围",
    type: "judgment",
    prompt: "“装配每增加 1 小时利润增加 20 元”，可以用于预测任意大的扩产幅度。",
    options: [
      { id: "true", label: "正确" },
      { id: "false", label: "错误" },
    ],
    answer: "false",
    answerLabel: "错误",
    hints: ["影子价格在最优顶点结构变化后还会相同吗？"],
    explanation:
      "固定切割 100 小时，装配在 50 到 200 小时之间时，交点方案保持可行且最优，价值斜率为 20。超过 200 后切割限制了产量，增加装配不再提高收益。边界处须分方向讨论。",
    verification: "分段最优函数与边界代入",
  },
  {
    ...common,
    id: "practice-1",
    placement: "practice",
    difficulty: "基础",
    knowledge: "目标函数与检验",
    type: "numeric",
    unit: "元",
    prompt:
      "默认案例：A 的利润为 40 元/m²，B 为 50 元/m²。计划 A 40 m²、B 20 m²，总利润是多少？",
    answer: 2600,
    tolerance: 0.01,
    answerLabel: "2600 元",
    hints: ["分别计算两种产品的利润后相加。", "40 × 40 + 50 × 20。"],
    explanation:
      "A 贡献 1600 元，B 贡献 1000 元，合计 2600 元。切割 2×40+20=100 小时，装配 40+2×20=80 小时，均未超限。",
    verification: "Python/SciPy 默认案例与手算",
  },
  {
    ...common,
    id: "practice-2",
    placement: "practice",
    difficulty: "进阶",
    knowledge: "参数变化",
    type: "numeric",
    unit: "元",
    prompt:
      "保持利润 A 40、B 50 元/m²，切割 100 小时，把装配增加到 100 小时。允许小数产量时，最大利润是多少？",
    answer: 3000,
    tolerance: 0.02,
    answerLabel: "3000 元",
    hints: [
      "先求 2x+y=100 与 x+2y=100 的交点。",
      "交点 x=y=100/3，还要和两个轴上的顶点比较。",
    ],
    explanation:
      "顶点为 (0,0)、(50,0)、(100/3,100/3)、(0,50)，利润依次为 0、2000、3000、2500 元。故最优利润 3000 元，较默认增加 400 元，也等于 20 小时×20 元/小时。",
    verification: "Python/SciPy 扩容案例与四顶点比较",
  },
  {
    ...common,
    id: "practice-3",
    placement: "practice",
    difficulty: "挑战",
    knowledge: "整数规划",
    type: "numeric",
    unit: "元",
    prompt:
      "改为按整块 1 m² 生产，x、y 必须为整数。切割 9 小时、装配 8 小时，利润仍为 40x+50y。最大利润是多少？",
    answer: 230,
    tolerance: 0.01,
    answerLabel: "230 元；x=2，y=3",
    hints: [
      "x 只能取 0、1、2、3、4。",
      "对每个 x，y 的上限是 min(9−2x, (8−x)/2) 的向下取整。",
    ],
    explanation:
      "x=0,1,2,3,4 时，最好的 y 分别为 4,3,3,2,1，利润为 200,190,230,220,210 元。故 (2,3) 最优。连续最优 (10/3,7/3) 利润 250 元，四舍五入到 (3,2) 只有 220 元，直接取整不能保证最优。",
    verification: "Python 整数穷举与 TS 有界枚举对照",
  },
];
export const publishedQuestions = questions.filter(
  (q) => q.review === "verified",
);
