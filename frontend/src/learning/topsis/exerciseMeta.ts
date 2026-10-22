/**
 * Teaching metadata for TOPSIS questions (same shape as the LP / AHP exerciseMeta):
 * the section that teaches each point, a second-level clue, and deterministic mistake patterns.
 * Numeric mistake values are re-derived in content.test.ts.
 */
import type { ExerciseMeta } from "../exerciseMeta";

const rents = [1800, 2400, 1500, 2100, 2800];
const rentNorm = Math.sqrt(rents.reduce((s, x) => s + x * x, 0));
const rentSum = rents.reduce((s, x) => s + x, 0);

export const topsisExerciseMeta: Record<string, ExerciseMeta> = {
  "topsis-think-1": {
    sectionId: "rooms",
    errors: [
      { option: "arithmetic", tag: "误判了问题所在", message: "加法本身没有算错。问题是不同单位、不同方向的数不能直接相加。" },
      { option: "largest", tag: "忽略了指标方向", message: "改成选最大的也不行：月租、通勤越小越好，面积、配套越大越好，方向混在一起，总和没有意义。" },
      { option: "rounding", tag: "没有处理量纲", message: "四舍五入不改变“月租的数值远大于其他指标”这一事实，总和仍然几乎只由月租决定。" },
    ],
  },
  "topsis-think-2": {
    sectionId: "direction",
    errors: [
      { option: "benefit", tag: "方向写反", message: "PM2.5 是污染物浓度，浓度越高空气越差。评价空气质量时，它越小越好。" },
      { option: "middle", tag: "误判为适中型", message: "适中型指标在某个中间值最好（如室温）。PM2.5 浓度没有“适中最好”，越低越好。" },
    ],
  },
  "topsis-think-3": {
    sectionId: "ideal",
    errors: [
      { option: "top", tag: "把理想解当成第一名", message: "排名第一的丁并不在每一项上都最好。正理想解是逐列取最好值拼出来的参照点。" },
      { option: "average", tag: "把理想解当成平均值", message: "平均值只是“中等水平”。正理想解在每一列取的是最好的值。" },
    ],
  },
  "topsis-self-1": {
    sectionId: "ideal",
    errors: [
      { option: "max", tag: "方向写反", message: "最大值是效益型指标的“最好”。通勤是成本型，越短越好，最大值是它的负理想解。" },
      { option: "mean", tag: "把理想解当成平均值", message: "正理想解是“每一项都最好”，不是平均水平。" },
      { option: "zero", tag: "参照点超出了数据", message: "0 分钟通勤不是任何方案实际达到的值。TOPSIS 的理想解取自数据本身：该列的最小值。" },
    ],
  },
  "topsis-self-2": {
    sectionId: "closeness",
    clue: "C = 1 ⇔ D⁻ / (D⁺ + D⁻) = 1 ⇔ D⁺ = 0。距离为 0 意味着每一列的差都是 0。",
    errors: [
      { option: "false", tag: "没有从定义推导", message: "C = 1 只能是 D⁺ = 0，即每一列都与正理想解相同；权重都为正时，这就是每一项都最好。" },
    ],
  },
  "topsis-self-3": {
    sectionId: "normalise",
    clue: "r = x / √Σx²。把 x 全部乘以 0.001，分子和分母各乘了多少？",
    errors: [
      { option: "normalised", tag: "没想到单位会约掉", message: "分子、分母同时缩小 1000 倍，标准化后的数不变。这正是向量标准化去掉单位的方式。" },
      { option: "closeness", tag: "没想到单位会约掉", message: "贴近度只依赖标准化后的矩阵，而标准化后的矩阵没有变，所以 C 也不变。" },
      { option: "rank", tag: "没想到单位会约掉", message: "排名由贴近度决定，贴近度没有变，排名也不会变。" },
    ],
  },
  "topsis-practice-1": {
    sectionId: "direction",
    errors: [
      { option: "dishes", tag: "方向写反", message: "菜品种类越多，选择越丰富，是效益型。" },
      { option: "rating", tag: "方向写反", message: "满意度评分越高越好，是效益型。" },
    ],
  },
  "topsis-practice-2": {
    sectionId: "normalise",
    errors: [
      { value: 4 / 19, tag: "用了求和归一化", message: "这是 4 除以三个数之和 19。向量标准化要除以平方和再开方：√(3² + 4² + 12²)。" },
      { value: 4 / 12, tag: "除以了最大值", message: "这是 4 除以该列最大值 12。向量标准化的分母是整列的长度，不是最大值。" },
      { value: 4 / 169, tag: "忘了开方", message: "169 是平方和，还要开平方得到列长度 13。" },
      { value: 4, tag: "没有标准化", message: "4 是原始值。标准化要除以整列的长度。" },
    ],
  },
  "topsis-practice-3": {
    sectionId: "closeness",
    errors: [
      { value: 0.12 / 0.2, tag: "分子用了 D⁺", message: "0.6 是 D⁺ / (D⁺ + D⁻)。分子应是到负理想解的距离 D⁻：离最差越远越好。" },
      { value: 0.08 / 0.12, tag: "分母少了一项", message: "这是 D⁻ / D⁺。贴近度的分母是两个距离之和 D⁺ + D⁻。" },
      { value: 0.2, tag: "只算了分母", message: "0.2 是 D⁺ + D⁻。还要用 D⁻ 除以它。" },
    ],
  },
  "topsis-practice-4": {
    sectionId: "closeness",
    errors: [
      { option: "percent", tag: "把贴近度当成百分制", message: "C 不是百分制分数，0.60 也不代表“60 分”。它只用于同一次评价中的排序。" },
      { option: "double", tag: "把贴近度当成比例尺度", message: "C 的比值没有“好几倍”的含义；两个 C 只能比较大小。" },
      { option: "probability", tag: "把贴近度当成概率", message: "TOPSIS 是确定性计算，C 不是概率。" },
    ],
  },
  "topsis-practice-5": {
    sectionId: "normalise",
    errors: [
      { value: 2800 / rentSum, tag: "用了求和归一化", message: "这是 2800 除以五个月租之和。向量标准化要除以平方和再开方。" },
      { value: 1, tag: "除以了最大值", message: "2800 是这一列的最大值，除以它得 1。向量标准化的分母是整列的长度。" },
      { value: rentNorm, tag: "只算了列长度", message: "这是列长度 √Σx²。还要用 2800 除以它。" },
    ],
  },
  "topsis-practice-6": {
    sectionId: "entropy",
    errors: [
      { value: 0.7 / 2.4, tag: "用熵代替了差异系数", message: "这是直接把 e 归一化。熵越大信息越少，要先算差异系数 d = 1 − e，再归一化。" },
      { value: 0.3, tag: "忘了归一化", message: "0.3 是第 3 个指标的差异系数 d₃。还要除以 d 的总和 0.6。" },
      { value: 0.7, tag: "把熵当成权重", message: "0.70 是第 3 个指标的信息熵，不是权重。" },
    ],
  },
  "topsis-practice-7": {
    sectionId: "closeness",
    errors: [
      { value: Math.hypot(0.2, 0.05) / (Math.hypot(0.2, 0.05) + 0.1), tag: "分子用了 D⁺", message: "这是 D⁺ / (D⁺ + D⁻)。贴近度的分子是 D⁻。" },
      { value: Math.hypot(0.2, 0.05), tag: "只算了 D⁺", message: "这是 R 到正理想解的距离 D⁺。还要算 D⁻，再求 C = D⁻ / (D⁺ + D⁻)。" },
      { value: 0.1 / (0.25 + 0.1), tag: "距离没有开平方合成", message: "看起来把各列的差直接相加（0.20 + 0.05）当成了 D⁺。距离要平方、相加、再开方。" },
    ],
  },
  "topsis-practice-8": {
    sectionId: "limits",
    errors: [
      { option: "error", tag: "不了解逆序现象", message: "计算没有错。TOPSIS 的参照点由全体方案决定，加入新方案可能改变原有顺序。" },
      { option: "weights", tag: "混淆了权重与参照点", message: "AHP 权重来自小林对准则的判断，与有几套房无关，加入己后没有改变。" },
      { option: "random", tag: "误以为结果有随机性", message: "TOPSIS 是确定性计算，同样的输入永远得到同样的结果。" },
    ],
  },
  "topsis-practice-9": {
    sectionId: "weights",
    errors: [
      { option: "reverse", tag: "分工颠倒", message: "TOPSIS 本身不产生权重，需要外部给定；AHP 才是把两两比较变成权重的方法。" },
      { option: "both", tag: "分工不清", message: "组合使用时两种方法是前后衔接，不是各算一次再平均。" },
      { option: "check", tag: "分工不清", message: "AHP 在这里的作用是确定权重，其自身的一致性由 CR 检验。" },
    ],
  },
};
