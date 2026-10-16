import { CourseBridge } from "../learning/CourseBridge";
import { LessonReader, type LessonDefinition } from "../learning/LessonReader";
import { regressionSections, type RegressionBlock } from "../learning/regression/content";
import { RegressionFigure } from "../learning/regression/Figures";
import { RegressionLab } from "../learning/regression/RegressionLab";
import "../learning/regression/regression.css";

/** 回归分析精讲: prediction from data, on the shared reader. */
const regression: LessonDefinition<RegressionBlock> = {
  lesson: "regression",
  name: "回归分析",
  sections: regressionSections,
  renderExtra: (block) =>
    block.type === "regression-figure" ? (
      <RegressionFigure view={block.view} />
    ) : block.type === "regression-lab" ? (
      <RegressionLab />
    ) : block.type === "course-bridge" ? (
      <CourseBridge to={block.to} kicker={block.kicker} title={block.title} text={block.text} />
    ) : undefined,
  codeLabel: "Python · NumPy · statsmodels · 可在本机运行",
  cover: {
    kicker: "精讲 · 预测模型入门 · 回归分析",
    title: (
      <>
        明天卖多少杯，
        <br />
        怎样估计才靠谱？
      </>
    ),
    deck: "用一家奶茶店两周的数据，学会线性回归。",
    meta: ["零基础可读", "约 50–60 分钟", "纸笔 + 计算器 + Python", "先修：一次函数、求和符号（会边学边讲）"],
    goal: "读完后，你将能画散点图并计算相关系数，用最小二乘法求回归直线，用 R² 和残差图检查拟合，用虚拟变量建立多元回归并解释系数，在数据范围内做出带区间的预测，并说清楚相关与因果、外推和异常值的边界。",
  },
  practicePath: "/practice/regression",
  application: {
    to: "/quest?case=bike-demand-demo",
    label: "竞赛应用：七关实战",
    endLabel: "用七关实战做需求预测",
  },
  end: {
    title: "会拟合，也要会怀疑拟合。",
    text: "专项练习包括最小二乘计算、R² 与调整 R²、系数解释、预测与外推、相关与因果。答错会告诉你错在哪里、该回看哪一节，但不会直接给出答案。",
    practiceLabel: "开始回归专项",
    note: "预测的结果常常要交给优化模型做决策：可以接着学线性规划，或者到七关实战做一道“先预测、后优化”的题。",
  },
  symbols: [
    ["x / y", "自变量 / 因变量"],
    ["x̄ / ȳ", "平均数"],
    ["r", "相关系数，−1 到 1"],
    ["b₀ / b₁", "截距 / 斜率的估计值"],
    ["ŷ", "拟合值（预测值）"],
    ["e", "残差 y − ŷ"],
    ["SSE / SST", "残差平方和 / 总平方和"],
    ["R²", "决定系数 1 − SSE / SST"],
  ],
};

export function RegressionCoursePage() {
  return <LessonReader def={regression} />;
}
