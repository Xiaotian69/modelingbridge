import { Link } from "react-router-dom";
import { CourseBridge } from "../learning/CourseBridge";
import { LessonReader, type LessonDefinition } from "../learning/LessonReader";
import { CommuteCalculator } from "../learning/intro/CommuteCalculator";
import { introSections, type IntroBlock } from "../learning/intro/content";
import { IntroFigure } from "../learning/intro/illustrations";
import { ContestFlow, ModelingCycle, ModelingMap } from "../learning/intro/Overview";
import { ProcessExplorer } from "../learning/intro/ProcessExplorer";
import { INTRO_CHECKPOINT_IDS, INTRO_SECTIONS } from "../learning/intro/sectionIds";
import { TeamBoard } from "../learning/intro/TeamBoard";
import { UmbrellaLab } from "../learning/intro/UmbrellaLab";
import { introStatus, TrackList } from "../learning/tracks";
import { useLearning } from "../state/learning";
import "../learning/intro/intro.css";

/** The end of 第零课: what this browser recorded, and where to go next. */
function IntroEnd() {
  const { state } = useLearning();
  const status = introStatus(state);
  const visited = status.reading?.visited.length ?? 0;
  return (
    <div className="intro-end">
      <p className="kicker">第零课 · 完成情况</p>
      <h2>{status.complete ? "你已经完成了「认识数学建模」。" : "还差一点，就完成第零课了。"}</h2>
      <ul className="intro-end-list">
        <li className={status.reachedEnd ? "is-done" : undefined}>
          <span aria-hidden="true">{status.reachedEnd ? "✓" : "○"}</span>
          读到最后一节（已读 {visited}/{INTRO_SECTIONS.length} 节）
        </li>
        <li className={status.lab ? "is-done" : undefined}>
          <span aria-hidden="true">{status.lab ? "✓" : "○"}</span>
          {status.lab ? "雨伞案例：已完成" : <Link to="#intro-umbrella">雨伞案例：还没有做完</Link>}
        </li>
        <li className={status.tried === INTRO_CHECKPOINT_IDS.length ? "is-done" : undefined}>
          <span aria-hidden="true">{status.tried === INTRO_CHECKPOINT_IDS.length ? "✓" : "○"}</span>
          理解检查：尝试过 {status.tried}/{INTRO_CHECKPOINT_IDS.length}（可以跳过，不计成绩）
        </li>
      </ul>
      <p>完成 = 读到最后一节 + 做完雨伞案例。记录只保存在此浏览器，可以在“学习记录”里查看。</p>
      <div className="topic-actions">
        <Link className="btn btn-primary" to="#intro-next">
          选一条路线
        </Link>
        <Link className="btn btn-secondary" to="/learn">
          回到精讲目录
        </Link>
        <Link className="btn btn-secondary" to="/records">
          学习记录
        </Link>
      </div>
    </div>
  );
}

/** 第零课「认识数学建模」: the general entry, read on the shared lesson reader. */
const intro: LessonDefinition<IntroBlock> = {
  lesson: "intro",
  name: "认识数学建模",
  sections: introSections,
  renderExtra: (block) =>
    block.type === "intro-process" ? (
      <ProcessExplorer />
    ) : block.type === "intro-commute" ? (
      <CommuteCalculator />
    ) : block.type === "intro-team" ? (
      <TeamBoard />
    ) : block.type === "intro-contest-flow" ? (
      <ContestFlow />
    ) : block.type === "intro-map" ? (
      <ModelingMap />
    ) : block.type === "intro-umbrella" ? (
      <UmbrellaLab />
    ) : block.type === "intro-cycle" ? (
      <ModelingCycle />
    ) : block.type === "intro-tracks" ? (
      <TrackList />
    ) : block.type === "intro-figure" ? (
      <IntroFigure id={block.id} />
    ) : block.type === "course-bridge" ? (
      <CourseBridge to={block.to} kicker={block.kicker} title={block.title} text={block.text} />
    ) : undefined,
  codeLabel: "",
  cover: {
    kicker: "精讲 · 第零课 · 所有路线的起点",
    title: "认识数学建模",
    deck: "从一个现实问题开始，学会像建模者一样思考。",
    meta: ["零基础可读", "约 15–20 分钟", "只用四则运算", "不需要任何先修课"],
    figure: <IntroFigure id="intro-01-rain-umbrellas" />,
    goal: "读完后，你将能说清什么是数学模型、为什么需要假设，按“目标—变量—假设—数据—关系—求解—检验—改进”的思路分析一个小问题，知道建模团队和竞赛是怎样工作的，并选出下一步要学的课程。",
  },
  coverActions: (
    <Link className="btn btn-secondary" to="#intro-next">
      已有基础？直接选路线
    </Link>
  ),
  endSlot: <IntroEnd />,
  marginTitle: "本课术语",
  symbols: [
    ["模型", "对现实问题的简化描述，可以计算、可以检验"],
    ["假设", "为了让问题能算下去而暂时接受的条件"],
    ["目标", "用来比较方案好坏的量，比如“借不到伞的人数”"],
    ["决策变量", "由我们来决定的量，比如“调几把伞”"],
    ["约束", "方案必须满足的限制，比如“调走的不能比现有的多”"],
    ["检验", "回到目标和数据，看结果是否合理、是否可信"],
  ],
};

export function IntroCoursePage() {
  return <LessonReader def={intro} />;
}
