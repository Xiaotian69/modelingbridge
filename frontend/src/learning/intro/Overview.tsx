/** Static figures of 第零课: the contest process (§5), the problem-type map (§6) and the umbrella recap (§8). */
import { Link } from "react-router-dom";
import { UMBRELLA_STEPS } from "./process";

const CONTEST_FLOW: [string, string][] = [
  ["阅读赛题", "通读题目和附件，弄清每一问到底要什么。"],
  ["理解和选择问题", "有几道题可选时，结合队伍的兴趣和能力尽快选定。"],
  ["查找资料、分析背景", "了解问题背景、前人的做法和能用的数据。"],
  ["建立假设和模型", "确定目标、变量和假设，选择合适的方法。"],
  ["编程计算或开展实验", "处理数据、实现算法、做模拟或计算。"],
  ["检验结果、修改模型", "检查结果是否合理、是否稳定，不行就回头修改。"],
  ["整理图表和论文", "写清思路、过程、结果和局限，让读者看得懂、信得过。"],
  ["按要求提交", "核对格式、文件和截止时间，按当届规定提交。"],
];

export function ContestFlow() {
  return (
    <figure className="intro-flow" aria-label="一次建模比赛的常见过程">
      <ol>
        {CONTEST_FLOW.map(([name, text]) => (
          <li key={name}>
            <b>{name}</b>
            <span>{text}</span>
          </li>
        ))}
      </ol>
      <figcaption className="muted-note">
        第 4–6 步往往要来回好几轮。这是一般流程，不是某项赛事的规定。
      </figcaption>
    </figure>
  );
}

type MapCard = { type: string; question: string; example: string; ideas: string; courses: { to: string; label: string }[] };
const MAP: MapCard[] = [
  {
    type: "最优化",
    question: "资源有限，怎样安排最好？",
    example: "工时有限，两种产品各做多少，利润最大？",
    ideas: "线性规划、整数规划等",
    courses: [{ to: "/learn/linear-programming", label: "线性规划" }],
  },
  {
    type: "网络与路径",
    question: "地点之间怎样连、怎样走？",
    example: "招新日从宿舍到广场，怎样走最近？",
    ideas: "最短路、最小生成树等图论方法",
    courses: [{ to: "/learn/graph", label: "图论与网络优化" }],
  },
  {
    type: "预测",
    question: "根据已有数据，估计会怎样？",
    example: "根据两周的销量，估计明天卖多少杯？",
    ideas: "回归分析、时间序列等",
    courses: [{ to: "/learn/regression", label: "回归分析" }],
  },
  {
    type: "评价与决策",
    question: "多个方案、多个标准，怎样排序或选择？",
    example: "三份实习、五套房子，怎样排出先后？",
    ideas: "层次分析法、TOPSIS 等",
    courses: [
      { to: "/learn/ahp", label: "层次分析法（AHP）" },
      { to: "/learn/topsis", label: "TOPSIS 综合评价" },
    ],
  },
];
const BASICS = ["数学思维", "数据分析", "基础编程", "资料检索", "写作表达"];

export function ModelingMap() {
  return (
    <figure className="intro-map" aria-labelledby="intro-map-title">
      <figcaption>
        <span className="eyebrow">学习地图</span>
        <h3 id="intro-map-title">四类常见问题，和模桥现有的课程</h3>
      </figcaption>
      <ul className="intro-map-cards">
        {MAP.map((m) => (
          <li key={m.type}>
            <p className="intro-map-type">{m.type}</p>
            <p className="intro-map-question">{m.question}</p>
            <p>例：{m.example}</p>
            <p className="muted-note">可以考虑：{m.ideas}</p>
            <p className="intro-map-courses">
              模桥课程：
              {m.courses.map((c, i) => (
                <span key={c.to}>
                  {i > 0 && " → "}
                  <Link to={c.to}>{c.label}</Link>
                </span>
              ))}
            </p>
          </li>
        ))}
      </ul>
      <div className="intro-map-base">
        <p className="kicker">四类问题都用得上的基础能力</p>
        <ul>
          {BASICS.map((b) => (
            <li key={b}>{b}</li>
          ))}
        </ul>
      </div>
    </figure>
  );
}

/** §8: the nine steps, filled in with what the learner did in the umbrella case. */
export function ModelingCycle() {
  return (
    <figure className="intro-cycle" aria-labelledby="intro-cycle-title">
      <figcaption>
        <span className="eyebrow">回顾 · 雨伞调配</span>
        <h3 id="intro-cycle-title">刚才的每一步，对应建模流程的哪一步</h3>
      </figcaption>
      <ol>
        {UMBRELLA_STEPS.map((s, i) => (
          <li key={s.name}>
            <span className="intro-step-no">{i + 1}</span>
            <b>{s.name}</b>
            <span>{s.did}</span>
          </li>
        ))}
      </ol>
      <p className="intro-loop-hint">
        <span aria-hidden="true">↺</span> 第 8 步发现需求变了、原方案不再最好，就回到第 5 步换数据、第 7 步重新求解。
      </p>
    </figure>
  );
}
