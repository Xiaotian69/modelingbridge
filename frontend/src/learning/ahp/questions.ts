/**
 * AHP question bank. Numeric answers are taken from numpy (ahp-verified.json, see
 * questions.test.ts); conceptual answers follow directly from the definitions in the lesson.
 * Graded by the shared, unchanged grading.ts.
 */
import type { CourseQuestion } from "../courseQuestion";

const common = {
  model: "ahp",
  source: { kind: "original", author: "模桥原创教学案例" },
  review: "verified",
} as const;

export const ahpQuestions: CourseQuestion[] = [
  {
    ...common,
    id: "ahp-think-1",
    placement: "inline",
    difficulty: "基础",
    knowledge: "多准则决策",
    type: "single",
    prompt: "A 的工资最高。朋友建议小林“直接选工资最高的”。这个建议的主要问题是什么？",
    options: [
      { id: "math", label: "工资的高低比较算错了" },
      { id: "single", label: "只看了一个准则，忽略了小林同样在意的成长和通勤" },
      { id: "never", label: "工资不应该参与实习决策" },
    ],
    answer: "single",
    answerLabel: "只看了一个准则",
    hints: ["小林在意的不止一件事。"],
    explanation:
      "工资比较本身没有错，也应该参与决策。问题在于小林同时在意成长空间和通勤生活，只按一个准则排序，相当于把其他准则的权重都当成 0。",
    verification: "概念题，依据第 1 节的问题设定",
  },
  {
    ...common,
    id: "ahp-think-2",
    placement: "inline",
    difficulty: "基础",
    knowledge: "层次结构",
    type: "single",
    prompt: "在“选择暑期实习”的层次结构中，下面哪一项属于准则层？",
    options: [
      { id: "goal", label: "选出最适合自己的实习" },
      { id: "criterion", label: "成长空间" },
      { id: "alternative", label: "研究所" },
    ],
    answer: "criterion",
    answerLabel: "成长空间",
    hints: ["准则是“用什么标准评价”，方案是“在什么之间选择”。"],
    explanation: "“选出最适合的实习”是目标层；“研究所”是方案层；“成长空间”是用来比较方案的标准，属于准则层。",
    verification: "概念题，依据第 2 节的层次图",
  },
  {
    ...common,
    id: "ahp-self-1",
    placement: "self",
    difficulty: "基础",
    knowledge: "互反判断",
    type: "single",
    prompt: "小林认为成长空间比薪资待遇“稍微重要”，即 a(成长, 薪资) = 3。那么 a(薪资, 成长) 应填多少？",
    options: [
      { id: "third", label: "1/3" },
      { id: "three", label: "3" },
      { id: "minus", label: "−3" },
      { id: "zero", label: "0" },
    ],
    answer: "third",
    answerLabel: "1/3",
    hints: ["判断矩阵是互反矩阵：a_ji 与 a_ij 相乘等于 1。"],
    explanation: "互反性要求 a_ji = 1 / a_ij。成长是薪资的 3 倍重要，薪资就是成长的 1/3 倍重要。判断值都是正数，不会出现负数或 0。",
    verification: "互反定义",
  },
  {
    ...common,
    id: "ahp-self-2",
    placement: "self",
    difficulty: "基础",
    knowledge: "一致性",
    type: "judgment",
    prompt: "如果判断矩阵完全一致（对任意 i、j、k 都有 a_ik = a_ij · a_jk），那么它的最大特征值 λmax 恰好等于阶数 n。",
    options: [
      { id: "true", label: "正确" },
      { id: "false", label: "错误" },
    ],
    answer: "true",
    answerLabel: "正确",
    hints: ["一致矩阵可以写成 a_ij = w_i / w_j，算一算 A·w。"],
    explanation:
      "一致矩阵满足 a_ij = w_i / w_j，于是 (A·w)_i = Σ_j (w_i / w_j)·w_j = n·w_i，所以 λmax = n、CI = 0。判断不一致时 λmax > n，偏离越大越不一致。",
    verification: "代数推导；numpy 验证示例矩阵 λmax = 3",
  },
  {
    ...common,
    id: "ahp-self-3",
    placement: "self",
    difficulty: "进阶",
    knowledge: "判断矩阵",
    type: "multiple",
    prompt: "下列哪些是 AHP 判断矩阵本身必须满足的性质？（多选）",
    options: [
      { id: "positive", label: "所有元素都是正数" },
      { id: "diagonal", label: "主对角线元素都等于 1" },
      { id: "reciprocal", label: "a_ji = 1 / a_ij" },
      { id: "rowsum", label: "每一行元素之和等于 1" },
    ],
    answer: ["positive", "diagonal", "reciprocal"],
    answerLabel: "正数、对角线为 1、互反",
    hints: ["想一想：自己和自己比是多少？反过来比是多少？", "“和为 1”是哪个向量的性质？"],
    explanation:
      "判断矩阵记录的是比值：都为正，自己和自己比为 1，反过来比取倒数。“和为 1”是归一化后的权重向量的性质，判断矩阵的行和通常远大于 1。",
    verification: "定义；numpy 验证示例矩阵",
  },
  {
    ...common,
    id: "ahp-practice-1",
    placement: "practice",
    difficulty: "基础",
    knowledge: "权重计算",
    type: "numeric",
    unit: "",
    prompt:
      "判断矩阵 A = [[1, 2, 4], [1/2, 1, 2], [1/4, 1/2, 1]] 是完全一致的。求准则 1 的权重 w₁（保留 3 位小数）。",
    answer: 4 / 7,
    tolerance: 0.001,
    answerLabel: "w₁ = 4/7 ≈ 0.571",
    hints: ["一致矩阵的每一列都与权重成比例。", "取第 1 列 (1, 1/2, 1/4)，除以它的和 1.75。"],
    explanation:
      "一致矩阵满足 a_ij = w_i / w_j，任取一列归一化即为权重。第 1 列 (1, 0.5, 0.25) 的和为 1.75，所以 w = (4/7, 2/7, 1/7) ≈ (0.571, 0.286, 0.143)。特征向量法、方根法、和积法在这里给出相同结果。",
    verification: "numpy.linalg.eig（ahp-verified.json: lesson.consistent）",
  },
  {
    ...common,
    id: "ahp-practice-2",
    placement: "practice",
    difficulty: "进阶",
    knowledge: "一致性检验",
    type: "numeric",
    unit: "",
    prompt: "某 4 阶判断矩阵的最大特征值 λmax = 4.21，随机一致性指标 RI(4) = 0.90。求一致性比率 CR（保留 3 位小数）。",
    answer: 0.07 / 0.9,
    tolerance: 0.001,
    answerLabel: "CR = 0.07 / 0.90 ≈ 0.078",
    hints: ["先算 CI = (λmax − n) / (n − 1)。", "CI = 0.21 / 3 = 0.07，再除以 RI。"],
    explanation: "CI = (4.21 − 4) / (4 − 1) = 0.07，CR = CI / RI = 0.07 / 0.90 ≈ 0.078 < 0.1，可以接受。",
    verification: "公式计算（ahp-verified.json: exercises）",
  },
  {
    ...common,
    id: "ahp-practice-3",
    placement: "practice",
    difficulty: "进阶",
    knowledge: "层次总排序",
    type: "numeric",
    unit: "",
    prompt:
      "准则权重为 薪资 0.23、成长 0.65、通勤 0.12。研究所 B 在三个准则下的局部权重分别为 0.14、0.56、0.23。求 B 的总得分（保留 3 位小数）。",
    answer: 0.23 * 0.14 + 0.65 * 0.56 + 0.12 * 0.23,
    tolerance: 0.002,
    answerLabel: "约 0.424",
    hints: ["总得分 = Σ 准则权重 × 该准则下的局部权重。", "0.23×0.14 + 0.65×0.56 + 0.12×0.23。"],
    explanation:
      "0.23×0.14 + 0.65×0.56 + 0.12×0.23 = 0.0322 + 0.3640 + 0.0276 ≈ 0.424。这与课程用精确权重算出的 0.421 只差舍入误差，B 仍然排第一。",
    verification: "加权求和（ahp-verified.json: exercises）；精确值见 global3",
  },
  {
    ...common,
    id: "ahp-practice-4",
    placement: "practice",
    difficulty: "进阶",
    knowledge: "结果解释",
    type: "single",
    prompt: "某同学的准则判断矩阵算得 CR = 0.15。他接下来最合理的做法是？",
    options: [
      { id: "bigger", label: "CR 越大说明区分度越高，可以直接使用" },
      { id: "ignore", label: "CR 只是参考，直接使用权重" },
      { id: "revise", label: "找出与其他判断最矛盾的比较，重新判断，直到 CR < 0.1" },
      { id: "ones", label: "把所有判断都改成 1，让 CR 变成 0" },
    ],
    answer: "revise",
    answerLabel: "重新检查最矛盾的判断",
    hints: ["CR ≥ 0.1 说明判断前后矛盾较多。", "修改判断要有理由，不是为了凑出好看的数字。"],
    explanation:
      "CR ≥ 0.1 表示判断之间存在较明显的矛盾，权重不可靠。应回到原始判断，找出与其余判断推算结果偏差最大的那一对重新思考，而不是机械地把判断改成 1（那会抹掉真实的偏好）。",
    verification: "依据第 5 节一致性检验规则",
  },
  {
    ...common,
    id: "ahp-practice-5",
    placement: "practice",
    difficulty: "挑战",
    knowledge: "权重计算",
    type: "numeric",
    unit: "",
    prompt:
      "用方根法计算课程中准则判断矩阵 [[1, 1/3, 2], [3, 1, 5], [1/2, 1/5, 1]] 的权重，成长空间（第 2 行）的权重是多少？（保留 3 位小数，可用计算器）",
    answer: 0.6483,
    tolerance: 0.002,
    answerLabel: "约 0.648",
    hints: ["每一行连乘后开 3 次方。", "三行分别约为 0.874、2.466、0.464，再归一化。"],
    explanation:
      "行积开 3 次方：(2/3)^(1/3) ≈ 0.874，15^(1/3) ≈ 2.466，0.1^(1/3) ≈ 0.464，总和 ≈ 3.804，所以 w₂ ≈ 2.466 / 3.804 ≈ 0.648。对 3 阶矩阵，方根法的结果与特征向量完全相同。",
    verification: "numpy.linalg.eig 与方根法（ahp-verified.json: lesson.criteria）",
  },
];

export const findAhpQuestion = (id: string) => ahpQuestions.find((q) => q.id === id) ?? null;
/** Practice bank: everything except the inline checkpoints (same rule as linear programming). */
export const ahpPracticeBank = ahpQuestions.filter((q) => q.placement !== "inline");
