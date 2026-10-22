/**
 * The three learning routes after 第零课 (shared by 精讲目录 and the end of 第零课), and one line of
 * this browser's progress per lesson.
 */
import { Link } from "react-router-dom";
import { courseById, sectionIndex, type CourseId, type LessonId } from "./courses";
import { INTRO_LAB_MILESTONE, INTRO_LAST_SECTION } from "./intro/sectionIds";
import { useLearning } from "../state/learning";
import type { LearningState } from "../state/learningStore";

export type Track = { id: string; name: string; question: string; courses: CourseId[]; note: string };
/** 学习路线：三条线，每条线内按先后排列。 */
export const TRACKS: Track[] = [
  { id: "optimize", name: "优化", question: "有限的资源、路线、安排，怎样选最好？", courses: ["lp", "graph"], note: "图论不依赖线性规划，也可以单独学" },
  { id: "predict", name: "预测", question: "根据已有数据，估计未来会怎样？", courses: ["regression"], note: "预测的结果常常交给优化模型做决策" },
  { id: "evaluate", name: "评价", question: "多个方案、多项指标，怎样排出先后？", courses: ["ahp", "topsis"], note: "TOPSIS 要用到 AHP 求出的权重，建议按顺序学" },
];

/** 第零课 completion, derived from what this browser stored. */
export function introStatus(state: LearningState) {
  const reading = state.reading.intro;
  const lab = state.milestones?.[INTRO_LAB_MILESTONE] ?? null;
  const course = courseById("intro");
  const tried = course.checkpointIds.filter((id) => state.checkpoints[id]?.tried).length;
  const reachedEnd = !!reading?.visited.includes(INTRO_LAST_SECTION);
  return {
    reading,
    lab,
    tried,
    reachedEnd,
    complete: !!lab && reachedEnd,
  };
}

/** One line of local progress for a lesson; only what this browser has stored. */
export function CourseProgress({ id }: { id: LessonId }) {
  const { state } = useLearning();
  const course = courseById(id);
  const reading = state.reading[id];
  if (id === "intro" && introStatus(state).complete) return <span className="learn-progress is-done">已完成</span>;
  if (!reading) return <span className="learn-progress">未开始</span>;
  if (reading.visited.length >= course.sections.length)
    return <span className="learn-progress is-done">已读完全部 {course.sections.length} 节</span>;
  return (
    <Link className="learn-progress is-reading" to={`${course.lessonPath}#${reading.lastSectionId}`}>
      上次读到第 {sectionIndex(course, reading.lastSectionId) + 1} 节 · 继续
    </Link>
  );
}

/** The three routes with each course and its progress. */
export function TrackList({ headingLevel = 3 }: { headingLevel?: 2 | 3 }) {
  return (
    <ol className="learn-tracks">
      {TRACKS.map((t) => (
        <li key={t.id}>
          <p className="learn-track-name" role="heading" aria-level={headingLevel}>
            <b>{t.name}</b>
            <span>{t.question}</span>
          </p>
          <ol className="learn-track-courses">
            {t.courses.map((id) => (
              <li key={id}>
                <Link to={courseById(id).lessonPath}>{courseById(id).title}</Link>
                <CourseProgress id={id} />
              </li>
            ))}
          </ol>
          <p className="muted-note">{t.note}</p>
        </li>
      ))}
    </ol>
  );
}
