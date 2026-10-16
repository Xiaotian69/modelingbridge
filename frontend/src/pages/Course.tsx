import { Link } from "react-router-dom";
import { CourseBridge } from "../learning/CourseBridge";
import { sections, type Block } from "../learning/content";
import { Graph } from "../learning/Graph";
import { LessonReader, type LessonDefinition } from "../learning/LessonReader";

const LAB = "/learn/linear-programming/lab";

/** Entry to the interactive lab; the lab offers the way back to this section. */
function LabEntry({ from, text }: { from: string; text: string }) {
  return (
    <aside className="lab-cta">
      <span>{text}</span>
      <Link className="btn btn-secondary" to={`${LAB}?from=${from}`} state={{ fromLesson: true }}>
        打开交互实验室 →
      </Link>
    </aside>
  );
}

/** 线性规划精讲: the verified content (content.ts) rendered by the shared reader. */
const lp: LessonDefinition<Block> = {
  lesson: "lp",
  name: "线性规划",
  sections,
  renderExtra: (block) =>
    block.type === "graph" ? (
      <>
        <Graph />
        <LabEntry from="geometry" text="想同时改利润、约束系数，或看看无可行解、无界和多重最优解是什么样？" />
      </>
    ) : undefined,
  afterSection: (id) =>
    id === "sensitivity" ? (
      <LabEntry from="sensitivity" text="在实验室里拖动利润和工时，观察最优点在什么范围内保持不变。" />
    ) : id === "variables" ? (
      <CourseBridge
        to="/learn/regression"
        kicker="相关精讲 · 回归分析"
        title="单位工时、单位利润从哪里来？"
        text="本节的参数是题目给定的。真实问题里，它们常常要先用回归从历史数据中估计出来，再交给优化模型做决策。"
      />
    ) : null,
  codeLabel: "Python · SciPy · 可在本机运行",
  cover: {
    kicker: "精讲 · 优化模型入门 · 线性规划",
    title: (
      <>
        有限资源，
        <br />
        怎样分配才更好？
      </>
    ),
    deck: "用一份生产计划，学会线性规划。",
    meta: ["零基础可读", "约 45–60 分钟", "纸笔 + Python", "先修：一次方程（可跳过）"],
    goal: "读完后，你将能独立定义变量、建立资源约束，手算并验证一个最优方案，解释参数变化和整数要求带来的影响。",
  },
  practicePath: "/practice/linear-programming",
  application: {
    to: "/quest?case=optimization-dispatch-demo",
    label: "竞赛应用：七关实战",
    endLabel: "用七关实战做一道调度题",
  },
  end: {
    title: "会看懂，也要会自己做。",
    text: "专项练习提交后判分，答错会告诉你错在哪里、该回看哪一节，但不会直接给出答案。",
    practiceLabel: "开始线性规划专项",
    note: "学完这一章，可以接着学同属“优化”的图论与网络优化，也可以按兴趣进入“预测”（回归分析）或“评价”（层次分析法 → TOPSIS）。",
  },
  symbols: [
    ["x", "A 产量，m²"],
    ["y", "B 产量，m²"],
    ["z", "贡献利润，元"],
  ],
};

export function CoursePage() {
  return <LessonReader def={lp} />;
}
