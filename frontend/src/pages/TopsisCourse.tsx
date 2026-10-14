import { CourseBridge } from "../learning/CourseBridge";
import { LessonReader, type LessonDefinition } from "../learning/LessonReader";
import { topsisSections, type TopsisBlock } from "../learning/topsis/content";
import { IdealPlane } from "../learning/topsis/IdealPlane";
import { TopsisLab } from "../learning/topsis/TopsisLab";
import "../learning/topsis/topsis.css";

/** TOPSIS 综合评价精讲: the third course, continuing the AHP story on the same reader. */
const topsis: LessonDefinition<TopsisBlock> = {
  lesson: "topsis",
  name: "TOPSIS 综合评价",
  sections: topsisSections,
  renderExtra: (block) =>
    block.type === "topsis-plane" ? (
      <IdealPlane />
    ) : block.type === "topsis-lab" ? (
      <TopsisLab />
    ) : block.type === "course-bridge" ? (
      <CourseBridge to={block.to} kicker={block.kicker} title={block.title} text={block.text} />
    ) : undefined,
  codeLabel: "Python · NumPy · 可在本机运行",
  cover: {
    kicker: "精讲 · 评价与决策 · TOPSIS 综合评价法",
    title: (
      <>
        五套房子，
        <br />
        怎样排出先后？
      </>
    ),
    deck: "接着 AHP 的故事，学会用数据给方案排序。",
    meta: ["零基础可读", "约 45–55 分钟", "纸笔 + 计算器 + Python", "建议先学：层次分析法（AHP）"],
    goal: "读完后，你将能判断指标方向，对数据做向量标准化，用 AHP 或熵权法确定权重，求出正、负理想解、距离与贴近度并排名，还能检查结论对权重、方向和方案集合是否稳健。",
  },
  practicePath: "/practice/topsis",
  application: {
    to: "/quest?case=evaluation-topsis-demo",
    label: "竞赛应用：七关实战",
    endLabel: "用七关实战做食堂服务评价",
  },
  end: {
    title: "会排名，也要会解释排名。",
    text: "专项练习包括指标方向、向量标准化、贴近度、熵权法和结果解释。答错会告诉你错在哪里、该回看哪一节，但不会直接给出答案。",
    practiceLabel: "开始 TOPSIS 专项",
    note: "这是第三门精讲，与层次分析法组成“评价与决策”单元。",
  },
  symbols: [
    ["xᵢⱼ", "方案 i 在指标 j 上的原始值"],
    ["rᵢⱼ", "向量标准化后的值"],
    ["wⱼ", "指标权重，和为 1"],
    ["vᵢⱼ", "加权标准化值 wⱼ·rᵢⱼ"],
    ["A⁺ / A⁻", "正理想解 / 负理想解"],
    ["D⁺ / D⁻", "到 A⁺ / A⁻ 的距离"],
    ["C", "相对贴近度 D⁻ / (D⁺ + D⁻)"],
    ["e / d", "信息熵 / 差异系数"],
  ],
};

export function TopsisCoursePage() {
  return <LessonReader def={topsis} />;
}
