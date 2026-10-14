import { CourseBridge } from "../learning/CourseBridge";
import { LessonReader, type LessonDefinition } from "../learning/LessonReader";
import { graphSections, type GraphBlock } from "../learning/graph/content";
import { GraphFigure } from "../learning/graph/GraphFigure";
import { GraphLab } from "../learning/graph/GraphLab";
import "../learning/graph/graph.css";

/** 图论与网络优化精讲: shortest paths and minimum spanning trees on a campus map. */
const graph: LessonDefinition<GraphBlock> = {
  lesson: "graph",
  name: "图论与网络优化",
  sections: graphSections,
  renderExtra: (block) =>
    block.type === "graph-map" ? (
      <GraphFigure highlight={block.highlight} />
    ) : block.type === "graph-lab" ? (
      <GraphLab mode={block.mode} />
    ) : block.type === "course-bridge" ? (
      <CourseBridge to={block.to} kicker={block.kicker} title={block.title} text={block.text} />
    ) : undefined,
  codeLabel: "Python · networkx · 可在本机运行",
  cover: {
    kicker: "精讲 · 网络模型入门 · 图论与网络优化",
    title: (
      <>
        招新日，
        <br />
        怎么走最近、怎么连最省？
      </>
    ),
    deck: "用一张校园地图，学会最短路与最小生成树。",
    meta: ["零基础可读", "约 45–55 分钟", "纸笔 + Python", "先修：无"],
    goal: "读完后，你将能把实际问题抽象成赋权图，写出邻接矩阵，手工运行 Dijkstra 算法求最短路、运行 Kruskal 算法求最小生成树，说清两者的区别和适用条件，并用 networkx 求解和做断路情景分析。",
  },
  practicePath: "/practice/graph",
  application: {
    to: "/quest?case=bike-demand-demo",
    label: "竞赛应用：七关实战",
    endLabel: "用七关实战做调度题",
  },
  end: {
    title: "先建对图，再选对算法。",
    text: "专项练习包括度与邻接矩阵、Dijkstra 的每一步、Kruskal 的取舍、负权与适用条件、断路情景和模型识别。答错会告诉你错在哪里、该回看哪一节，但不会直接给出答案。",
    practiceLabel: "开始图论专项",
    note: "这是第五门精讲。最短路得到的距离表，常常是下一步优化模型的输入。",
  },
  symbols: [
    ["G = (V, E)", "图：顶点集与边集"],
    ["w(u, v)", "边 u—v 的权（距离、时间…）"],
    ["deg(v)", "顶点 v 的度"],
    ["d(v)", "从起点到 v 的（暂定）距离"],
    ["[ ]", "已确定的最短距离"],
    ["MST", "最小生成树，n − 1 条边"],
  ],
};

export function GraphCoursePage() {
  return <LessonReader def={graph} />;
}
