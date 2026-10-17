/**
 * Regression lesson sections (= DOM anchors at /learn/regression#id). Kept apart from content.ts so
 * the home page, records page and search can use them without loading the lesson text.
 * content.test.ts checks this list against content.ts.
 */
export const REGRESSION_SECTIONS = [
  { id: "shop", title: "明天该备多少杯？" },
  { id: "scatter", title: "先画散点图：看见关系" },
  { id: "model", title: "用一条直线描述关系" },
  { id: "least-squares", title: "最小二乘法：哪条直线最好？" },
  { id: "fit", title: "拟合得好不好：R² 与残差" },
  { id: "multiple", title: "不止一个因素：多元回归" },
  { id: "predict", title: "做预测，也知道哪里不能预测" },
  { id: "python", title: "用 Python 复现全部计算" },
  { id: "limits", title: "相关不是因果：边界与常见错误" },
  { id: "regression-self-test", title: "合上课本，检查自己" },
  { id: "regression-transfer", title: "把回归带进竞赛预测题" },
] as const;
export const REGRESSION_SECTION_IDS: string[] = REGRESSION_SECTIONS.map((s) => s.id);
/** Checkpoints inside the lesson (not graded, shown as “尝试过 x/6”). */
export const REGRESSION_CHECKPOINT_IDS = [
  "regression-think-1",
  "regression-think-2",
  "regression-think-3",
  "regression-self-1",
  "regression-self-2",
  "regression-self-3",
];
