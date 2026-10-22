/**
 * Teaching metadata layered on top of the verified question bank (questions.ts is unchanged).
 *
 * - `sectionId`: the lesson section that teaches this knowledge point (回看知识点 target).
 * - `clue`: second hint level for questions that ship with a single hint. Every clue only
 *   restates facts already proven in content.ts / questions.ts explanations.
 * - `errors`: deterministic mistake patterns. Only listed answers get a specific diagnosis;
 *   anything else gets an honest “cannot tell why” message (design doc §5.3).
 *   Numeric values are re-derived from the solver in exerciseMeta.test.ts.
 */
export type ErrorPattern =
  | { option: string; tag: string; message: string }
  | { value: number; tag: string; message: string };

export type ExerciseMeta = {
  sectionId: string;
  clue?: string;
  errors: ErrorPattern[];
};

export const exerciseMeta: Record<string, ExerciseMeta> = {
  "think-1": {
    sectionId: "problem",
    clue: "算一算：只生产 B 最多 40 m²（装配 80 ÷ 2），利润 2000 元；再看 A 40 m²、B 20 m² 这个计划用了多少资源、利润是多少。",
    errors: [
      {
        option: "yes",
        tag: "只比较了单位利润",
        message: "只生产 B 时装配先用完，最多 40 m²、利润 2000 元，切割还剩 60 小时没用上。要比较整个生产计划，而不是单位利润。",
      },
    ],
  },
  "self-1": {
    sectionId: "variables",
    clue: "切割一栏：A 每 m² 用 2 小时，B 每 m² 用 1 小时。先写出切割总用时，再想“最多 100 小时”对应哪个符号。",
    errors: [
      {
        option: "b",
        tag: "系数对应错了",
        message: "x + 2y 是装配工时的写法（A 1 小时、B 2 小时）。切割中 A 和 B 每 m² 各用多少小时？",
      },
      {
        option: "c",
        tag: "把上限写成了必须用完",
        message: "“=” 要求切割恰好用满 100 小时，但题目只给了上限，资源允许有剩余。",
      },
    ],
  },
  "self-2": {
    sectionId: "variables",
    clue: "“必须用完全部资源”是在说建模前的假设，还是在描述某个解的样子？想想把装配上限调得很大时，装配还会被用完吗？",
    errors: [
      {
        option: "always",
        tag: "把解的特征当成了假设",
        message: "“用完全部资源”是某个最优解可能出现的结果，不是建模前的假设；线性规划允许资源有剩余。",
      },
    ],
  },
  "self-3": {
    sectionId: "sensitivity",
    clue: "“每小时 20 元”只在最优点仍由切割、装配两条约束共同决定时成立。装配一直增加，交点会沿切割线移动到哪里？到那以后还成立吗？",
    errors: [
      {
        option: "true",
        tag: "把局部斜率当成处处成立",
        message: "影子价格描述的是当前最优结构附近的变化。装配一直增加时，切割会不会先成为瓶颈？",
      },
    ],
  },
  "practice-1": {
    sectionId: "derive",
    errors: [
      { value: 1600, tag: "只算了一种产品", message: "这是 A 的贡献（40 × 40）。B 的贡献还没有加上。" },
      { value: 1000, tag: "只算了一种产品", message: "这是 B 的贡献（50 × 20）。A 的贡献还没有加上。" },
      { value: 2800, tag: "产量与单位利润对应反了", message: "看起来把 A 的产量配给了 B 的单位利润。A 是 40 元/m² × 40 m²，B 是 50 元/m² × 20 m²。" },
    ],
  },
  "practice-2": {
    sectionId: "sensitivity",
    errors: [
      { value: 2600, tag: "参数没有更新", message: "这是装配 80 小时时的最优利润。装配改成 100 小时后，两条约束的交点会移动。" },
      { value: 2500, tag: "只检查了一个顶点", message: "这是只生产 B 的顶点 (0, 50) 的利润。还要和其他顶点比较。" },
      { value: 2000, tag: "只检查了一个顶点", message: "这是只生产 A 的顶点 (50, 0) 的利润。还要和其他顶点比较。" },
    ],
  },
  "practice-3": {
    sectionId: "integer",
    errors: [
      { value: 250, tag: "忽略了整数要求", message: "这是连续最优 (10/3, 7/3) 的利润，产量不是整数，不符合整块生产的要求。" },
      { value: 220, tag: "直接四舍五入", message: "这是把连续解四舍五入到 (3, 2) 的利润。四舍五入得到的整数点不一定最优，需要检查所有可行整数点。" },
      { value: 200, tag: "只检查了一个整数点", message: "这是 (0, 4) 的利润。x 还可以取 1、2、3、4，逐一比较。" },
    ],
  },
};

/** Section for questions without explicit metadata (keeps unknown future IDs safe). */
export const metaFor = (id: string): ExerciseMeta =>
  exerciseMeta[id] ?? { sectionId: "problem", errors: [] };
