import { ahpSections, type AhpBlock } from "../learning/ahp/content";
import { CourseBridge } from "../learning/CourseBridge";
import { Hierarchy } from "../learning/ahp/Hierarchy";
import { MatrixLab } from "../learning/ahp/MatrixLab";
import { LessonReader, type LessonDefinition } from "../learning/LessonReader";
import "../learning/ahp/ahp.css";

/** 层次分析法精讲: the second course, on the same reader as linear programming. */
const ahp: LessonDefinition<AhpBlock> = {
  lesson: "ahp",
  name: "层次分析法",
  sections: ahpSections,
  renderExtra: (block) =>
    block.type === "ahp-hierarchy" ? (
      <Hierarchy />
    ) : block.type === "ahp-lab" ? (
      <MatrixLab />
    ) : block.type === "course-bridge" ? (
      <CourseBridge to={block.to} kicker={block.kicker} title={block.title} text={block.text} />
    ) : undefined,
  codeLabel: "Python · NumPy · 可在本机运行",
  cover: {
    kicker: "精讲 · 评价与决策入门 · 层次分析法（AHP）",
    title: (
      <>
        三份实习，
        <br />
        怎样选得有理有据？
      </>
    ),
    deck: "用一次真实的选择，学会层次分析法。",
    meta: ["零基础可读", "约 40–50 分钟", "纸笔 + 计算器 + Python", "先修：分数与开方（矩阵可边学边懂）"],
    goal: "读完后，你将能画出决策的层次结构，用 1–9 标度构造判断矩阵，求出权重并做一致性检验，合成最终排序，并说清楚结论的适用范围。",
  },
  practicePath: "/practice/ahp",
  application: {
    to: "/quest?case=city-livability-demo",
    label: "竞赛应用：七关实战",
    endLabel: "用七关实战做一道评价题",
  },
  end: {
    title: "会算权重，也要会解释权重。",
    text: "专项练习包括权重计算、一致性检验、层次总排序和结果解释。答错会告诉你错在哪里、该回看哪一节，但不会直接给出答案。",
    practiceLabel: "开始 AHP 专项",
    note: "“评价”这条线的下一门：TOPSIS 综合评价，用这里求出的权重给有数据的方案排序。",
  },
  symbols: [
    ["aᵢⱼ", "第 i 个比第 j 个重要几倍"],
    ["w", "权重向量，和为 1"],
    ["λmax", "判断矩阵的最大特征值"],
    ["CI / CR", "一致性指标 / 一致性比率"],
    ["RI", "随机一致性指标"],
  ],
};

export function AhpCoursePage() {
  return <LessonReader def={ahp} />;
}
