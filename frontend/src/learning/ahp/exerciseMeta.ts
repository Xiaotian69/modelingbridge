/**
 * Teaching metadata for AHP questions (same shape as the LP exerciseMeta):
 * the section that teaches each point, a second-level clue, and deterministic mistake patterns.
 * Numeric mistake values are re-derived in questions.test.ts.
 */
import type { ExerciseMeta } from "../exerciseMeta";

export const ahpExerciseMeta: Record<string, ExerciseMeta> = {
  "ahp-think-1": {
    sectionId: "decision",
    errors: [
      { option: "never", tag: "排除了重要准则", message: "工资是小林真实在意的因素，应该参与决策；问题是不能只看它。" },
      { option: "math", tag: "误判了问题所在", message: "A 的工资确实最高，比较没有算错。问题在于只用了一个准则。" },
    ],
  },
  "ahp-think-2": {
    sectionId: "hierarchy",
    errors: [
      { option: "goal", tag: "把目标当成准则", message: "“选出最适合的实习”是整个决策要达成的目标，位于最上层。" },
      { option: "alternative", tag: "把方案当成准则", message: "“研究所”是被比较的候选方案，位于最下层。" },
    ],
  },
  "ahp-self-1": {
    sectionId: "scale",
    errors: [
      { option: "three", tag: "忘了互反", message: "反过来比较时要取倒数：成长是薪资的 3 倍重要，薪资就只有成长的 1/3。" },
      { option: "minus", tag: "把倒数当成相反数", message: "判断值是“几倍重要”的比值，反过来取倒数而不是取负号，且始终为正数。" },
      { option: "zero", tag: "判断值不能为 0", message: "判断值都是正数；0 表示“完全不重要”，不在 1–9 标度里。" },
    ],
  },
  "ahp-self-2": {
    sectionId: "consistency",
    errors: [
      { option: "false", tag: "混淆了一致与不一致", message: "一致矩阵满足 aᵢⱼ = wᵢ / wⱼ，代入 A·w 正好得到 n·w；只有不一致时 λmax 才大于 n。" },
    ],
  },
  "ahp-self-3": {
    sectionId: "scale",
    clue: "判断矩阵记录的是“比值”，归一化后的向量才是权重。",
    errors: [
      { option: "rowsum", tag: "把权重的性质当成矩阵的性质", message: "“和为 1”是归一化后权重向量的要求；判断矩阵的行和一般大于 1。" },
    ],
  },
  "ahp-practice-1": {
    sectionId: "weights",
    errors: [
      { value: 1 / 3, tag: "直接平均分配", message: "1/3 是三个准则同等重要时的权重，没有用到判断矩阵里的信息。" },
      { value: 4, tag: "把判断值当成权重", message: "4 是准则 1 与准则 3 的比值，不是归一化后的权重。权重之和应为 1。" },
      { value: 2, tag: "把判断值当成权重", message: "2 是准则 1 与准则 2 的比值，不是权重。请把一列归一化。" },
      { value: 1 / 7, tag: "把行当成列归一化", message: "把第 1 行 (1, 2, 4) 归一化得到的是 1/7。一致矩阵中与权重成比例的是列：第 j 列等于权重除以 wⱼ。" },
    ],
  },
  "ahp-practice-2": {
    sectionId: "consistency",
    errors: [
      { value: 0.07, tag: "只算到 CI", message: "0.07 是一致性指标 CI，还需要除以 RI 才得到 CR。" },
      { value: 0.21 / 4 / 0.9, tag: "分母用了 n", message: "CI 的分母是 n − 1 = 3，不是 n = 4。" },
      { value: 0.07 / 0.58, tag: "RI 取错了阶数", message: "0.58 是 3 阶的 RI；这里是 4 阶矩阵，RI = 0.90。" },
    ],
  },
  "ahp-practice-3": {
    sectionId: "synthesis",
    errors: [
      { value: (0.14 + 0.56 + 0.23) / 3, tag: "没有按准则加权", message: "这是三个局部权重的简单平均，相当于假设三个准则同样重要。" },
      { value: 0.65 * 0.56, tag: "只算了一个准则", message: "0.364 只包含成长空间一项；还要加上薪资和通勤两项。" },
    ],
  },
  "ahp-practice-4": {
    sectionId: "consistency",
    errors: [
      { option: "bigger", tag: "把 CR 理解反了", message: "CR 衡量的是判断之间的矛盾程度，越小越好；≥ 0.1 时一般认为不可接受。" },
      { option: "ignore", tag: "忽略了一致性检验", message: "CR ≥ 0.1 时权重建立在相互矛盾的判断上，直接使用会让结论不可信。" },
      { option: "ones", tag: "为了数字而改判断", message: "全部改成 1 确实让 CR = 0，但也抹掉了真实的偏好，得到的是“所有准则同样重要”。" },
    ],
  },
  "ahp-practice-5": {
    sectionId: "weights",
    errors: [
      { value: 2.466, tag: "忘了归一化", message: "2.466 是第 2 行的几何平均数，还要除以三行几何平均数之和。" },
      { value: 15, tag: "忘了开方", message: "15 是第 2 行的连乘积，需要先开 3 次方，再归一化。" },
      { value: 1 / 3, tag: "直接平均分配", message: "1/3 没有用到判断矩阵的信息。" },
      { value: 9 / (1 / 3 + 3 + 9 + 1.7), tag: "用了行和归一化", message: "这是把每行的和归一化（和法）的近似结果。题目要求方根法：每行先连乘，再开 3 次方，最后归一化。" },
    ],
  },
};
