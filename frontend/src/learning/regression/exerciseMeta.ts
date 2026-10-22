/**
 * Teaching metadata for regression questions (same shape as the LP / AHP / TOPSIS exerciseMeta):
 * the section that teaches each point, a second-level clue, and deterministic mistake patterns.
 * Numeric mistake values are re-derived in content.test.ts.
 */
import type { ExerciseMeta } from "../exerciseMeta";

export const regressionExerciseMeta: Record<string, ExerciseMeta> = {
  "regression-think-1": {
    sectionId: "shop",
    errors: [
      { option: "fine", tag: "忽略了可用的信息", message: "平均数对每一天都给出同一个数，没有用到气温和是否周末，销量高低不同的日子都会出偏差。" },
      { option: "always-short", tag: "误解了平均数", message: "平均数在一半左右的日子偏高、在另一些日子偏低，不会每天都断货。" },
    ],
  },
  "regression-think-2": {
    sectionId: "scatter",
    errors: [
      { option: "pos", tag: "把符号当成强弱", message: "r 的符号表示方向，强弱看绝对值 |r|。|−0.9| = 0.9 比 0.5 大。" },
      { option: "same", tag: "把符号当成强弱", message: "方向不同也可以比较强弱：看 |r|。" },
    ],
  },
  "regression-think-3": {
    sectionId: "fit",
    errors: [
      { option: "wrong", tag: "误解了残差", message: "除非所有点恰好在一条直线上，残差不可能全为 0。问题在于周末的残差总是同号。" },
      { option: "good", tag: "把残差的符号当成准确度", message: "残差为正表示低估了销量。同一类日子的残差总是为正，说明模型有系统性偏差。" },
    ],
  },
  "regression-self-1": {
    sectionId: "least-squares",
    errors: [
      { option: "sum", tag: "正负会抵消", message: "残差之和在最小二乘直线上恰好为 0，但很多离谱的直线残差之和也是 0，不能作为标准。" },
      { option: "max", tag: "混淆了准则", message: "让最大残差最小是另一种准则（切比雪夫拟合），不是最小二乘。" },
      { option: "count", tag: "混淆了准则", message: "真实数据几乎不会恰好落在直线上，最小二乘看的是残差的平方和。" },
    ],
  },
  "regression-self-2": {
    sectionId: "multiple",
    clue: "加入新变量后，如果让它的系数等于 0，SSE 会怎样？最小二乘会不会找到比这更差的解？",
    errors: [
      { option: "false", tag: "误解了 R² 的性质", message: "新变量的系数可以取 0，SSE 不会比原来大，所以 R² 不会下降。这正是要看调整 R² 的原因。" },
    ],
  },
  "regression-self-3": {
    sectionId: "fit",
    clue: "R² 是用这 14 天数据算出的“解释比例”。它说得了数据范围外的事吗？说得了因果吗？",
    errors: [
      { option: "anywhere", tag: "把 R² 当成外推保证", message: "R² 只描述数据范围内的拟合程度，0 ℃、45 ℃ 都在数据范围之外。" },
      { option: "cause", tag: "把 R² 当成因果证据", message: "R² 高只说明一起变化的规律很明显，不能证明因果。" },
    ],
  },
  "regression-practice-1": {
    sectionId: "least-squares",
    errors: [
      { option: "per-cup", tag: "把因果方向倒过来了", message: "斜率是 y 对 x 的变化率：气温（x）变化 1 ℃，销量（y）变化多少。" },
      { option: "at-zero", tag: "把斜率当成截距", message: "x = 0 时的值是截距 81.29，而且 0 ℃ 远在数据范围之外。" },
      { option: "percent", tag: "单位理解错了", message: "斜率的单位是 杯/℃，表示增加的杯数，不是百分比。" },
    ],
  },
  "regression-practice-2": {
    sectionId: "least-squares",
    errors: [
      { value: 10 / 6, tag: "分子分母颠倒", message: "b₁ = Sxy / Sxx = 6 / 10，不是 Sxx / Sxy。" },
      { value: 6, tag: "忘了除以 Sxx", message: "6 是 Sxy，还要除以 Sxx = 10。" },
      { value: 4 / 3, tag: "直接用了平均数之比", message: "ȳ / x̄ 是过原点直线的斜率，不是最小二乘斜率。要用离差：Sxy / Sxx。" },
      { value: 0.7746, tag: "算成了相关系数", message: "0.775 是相关系数 r。斜率是 Sxy / Sxx，单位与 y / x 相同。" },
    ],
  },
  "regression-practice-3": {
    sectionId: "least-squares",
    errors: [
      { value: 5.8, tag: "符号用反了", message: "b₀ = ȳ − b₁x̄ = 4 − 1.8，不是 4 + 1.8。" },
      { value: 4, tag: "截距不是 ȳ", message: "直线经过 (x̄, ȳ) 而不是 (0, ȳ)。b₀ = ȳ − b₁x̄。" },
      { value: 3.4, tag: "x̄ 与 ȳ 用反了", message: "看起来算成了 x̄ − b₁ȳ = 3 − 0.6 × 4。应为 ȳ − b₁x̄。" },
    ],
  },
  "regression-practice-4": {
    sectionId: "fit",
    errors: [
      { value: 0.4, tag: "只算了 SSE / SST", message: "0.4 是没被解释的比例，R² = 1 − 0.4。" },
      { value: 2.5, tag: "分子分母颠倒", message: "SST / SSE = 2.5，不是 R²。R² 在 0 到 1 之间。" },
    ],
  },
  "regression-practice-5": {
    sectionId: "predict",
    errors: [
      { value: 3.5 * 20, tag: "漏了截距", message: "70 只是 3.5 × 20，还要加上截距 12。" },
      { value: (12 + 3.5) * 20, tag: "运算顺序错了", message: "先算 3.5 × 20，再加 12：ŷ = 12 + 3.5 × 20。" },
    ],
  },
  "regression-practice-6": {
    sectionId: "multiple",
    errors: [
      { option: "weekend-total", tag: "把系数当成总量", message: "32.85 是周末与工作日的差，不是周末的总销量。" },
      { option: "times", tag: "把加法当成乘法", message: "虚拟变量的系数是“多出多少杯”，模型里是加法，不是倍数。" },
      { option: "any", tag: "忽略了“平均”", message: "回归给出的是平均差异，具体某一天还会受到其他因素影响。" },
    ],
  },
  "regression-practice-7": {
    sectionId: "fit",
    errors: [
      { value: 0.8, tag: "R² 不是 r", message: "R² 等于 r 的平方，不是 r 本身。" },
      { value: Math.sqrt(0.8), tag: "开方而不是平方", message: "R² = r²，要平方：0.8² = 0.64。" },
      { value: 1.6, tag: "乘以 2 而不是平方", message: "r² 是 r × r = 0.64，不是 2r。" },
    ],
  },
  "regression-practice-8": {
    sectionId: "predict",
    errors: [
      { option: "negative", tag: "把外推结果当真", message: "负的销量本身就不可能，这是模型在数据范围外失效的信号。" },
      { option: "wrong-model", tag: "混淆了计算与适用范围", message: "计算没有错，问题是 0 ℃ 不在数据范围内。" },
      { option: "fine", tag: "把外推结果当真", message: "模型没有见过冬天的数据，不能据此做冬天的决定。" },
    ],
  },
  "regression-practice-9": {
    sectionId: "limits",
    errors: [
      { option: "weak", tag: "以为数据多就能证明因果", message: "数据再多，相关也不等于因果；共同原因（气温）不会因此消失。" },
      { option: "negative", tag: "误判了方向", message: "两者确实是正相关，问题不在方向，而在因果解释。" },
      { option: "nothing", tag: "把相关当成因果", message: "高度相关可能来自共同原因（气温）。限制冷饮不会减少游泳人数。" },
    ],
  },
  "regression-practice-10": {
    sectionId: "multiple",
    errors: [
      { option: "random", tag: "误以为结果有随机性", message: "最小二乘是确定性的计算，同样的数据永远得到同样的系数。" },
      { option: "more-data", tag: "混淆了样本量与变量", message: "加入变量不改变样本量，仍然是 14 天。" },
      { option: "always", tag: "过度推广", message: "加入变量后原系数可能变大、变小或几乎不变，取决于新变量与原变量的关系。" },
    ],
  },
  "regression-practice-11": {
    sectionId: "multiple",
    errors: [
      { value: 0.9, tag: "没有调整", message: "0.90 是 R²，调整 R² 还要按自由度修正：1 − (1 − R²)(n − 1) / (n − p − 1)。" },
      { value: 1 - (0.1 * 14) / 11, tag: "分子用了 n", message: "分子应是 n − 1 = 13，不是 14。" },
      { value: 1 - (0.1 * 13) / 12, tag: "分母少减了 1", message: "分母是 n − p − 1 = 11，截距也要占一个自由度。" },
    ],
  },
  "regression-practice-12": {
    sectionId: "limits",
    errors: [
      { option: "delete", tag: "隐瞒了数据处理", message: "悄悄删除会让读者无法判断结论是否可靠。删除前要查明原因，并在论文中说明。" },
      { option: "keep", tag: "误以为最小二乘抗干扰", message: "最小二乘把残差平方，离群点的影响反而被放大。" },
      { option: "more", tag: "篡改数据", message: "为了让结果好看而添加数据是不可接受的。" },
    ],
  },
};
