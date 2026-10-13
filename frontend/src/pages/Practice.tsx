import { useMemo, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { publishedQuestions } from "../learning/questions";
import { practiceBankOf } from "../learning/courseBanks";
import { COURSES, courseById, type LessonId } from "../learning/courses";
import { ExerciseView } from "../practice/ExerciseView";
import { useLearning } from "../state/learning";
import type { ExerciseRecord } from "../state/learningStore";
import "../learning/reader.css";

/** Same bank as V1: everything except the inline thinking question. IDs unchanged. */
export const practiceBank = publishedQuestions.filter((q) => q.placement !== "inline");
const difficulties = ["全部", "基础", "进阶", "挑战"] as const;

export function practiceLabel(id: string) {
  // Other courses prefix their ids ("ahp-self-1"); the label is per course anyway.
  id = id.replace(/^ahp-/, "");
  const self = /^self-(\d+)$/.exec(id);
  if (self) return `自测 ${self[1]}`;
  const practice = /^practice-(\d+)$/.exec(id);
  return practice ? `练习 ${practice[1]}` : id;
}

type Status = "correct" | "wrong" | "draft" | "new";
function statusOf(r?: ExerciseRecord): Status {
  if (!r) return "new";
  if (r.lastStatus === "correct") return "correct";
  if (r.lastStatus) return "wrong";
  const hasDraft = Array.isArray(r.draft) ? r.draft.length > 0 : !!r.draft;
  return hasDraft ? "draft" : "new";
}
const statusMark: Record<Status, { mark: string; text: string }> = {
  correct: { mark: "✓", text: "正确" },
  wrong: { mark: "✕", text: "待重练" },
  draft: { mark: "◐", text: "有草稿" },
  new: { mark: "○", text: "未做" },
};

export function PracticePage({ topic = "lp" }: { topic?: LessonId }) {
  const course = courseById(topic);
  const BASE = course.practicePath;
  const practiceBank = useMemo(() => practiceBankOf(topic), [topic]);
  const { exerciseId } = useParams();
  const navigate = useNavigate();
  const { state, persistent } = useLearning();
  const [difficulty, setDifficulty] = useState<(typeof difficulties)[number]>("全部");
  const [wrongOnly, setWrongOnly] = useState(false);

  const status = (id: string) => statusOf(state.exercises[id]);
  const correct = practiceBank.filter((q) => status(q.id) === "correct").length;
  const wrong = practiceBank.filter((q) => status(q.id) === "wrong").length;
  const list = useMemo(
    () =>
      practiceBank.filter(
        (q) =>
          (difficulty === "全部" || q.difficulty === difficulty) &&
          (!wrongOnly || statusOf(state.exercises[q.id]) === "wrong" || q.id === exerciseId),
      ),
    [difficulty, wrongOnly, state.exercises, exerciseId, practiceBank],
  );

  if (!exerciseId) {
    // Land on the first question not yet answered correctly.
    const target = practiceBank.find((q) => status(q.id) !== "correct") ?? practiceBank[0];
    return <Navigate to={`${BASE}/${target.id}`} replace />;
  }
  const question = practiceBank.find((q) => q.id === exerciseId);
  const index = list.findIndex((q) => q.id === exerciseId);
  const nav = list.length > 1 && index >= 0 ? list : practiceBank;
  const at = nav.findIndex((q) => q.id === exerciseId);
  const link = (i: number) =>
    i >= 0 && i < nav.length ? { href: `${BASE}/${nav[i].id}`, label: practiceLabel(nav[i].id) } : undefined;

  return (
    <div className="practice-shell">
      <div className="site-container">
        <header className="practice-head">
          <nav className="crumbs" aria-label="位置">
            <Link to="/practice">刷题</Link>
            <span>/</span>
            <span>{course.title}</span>
          </nav>
          <h1>{course.title}专项练习</h1>
          <nav className="topic-switch" aria-label="选择专题">
            {COURSES.map((c) => (
              <Link key={c.id} to={c.practicePath} aria-current={c.id === topic ? "page" : undefined}>
                {c.title}
              </Link>
            ))}
          </nav>
          <p className="practice-summary">
            <span>
              {correct} / {practiceBank.length} 题最近一次正确
            </span>
            <span>{wrong} 题待重练</span>
            <span>{persistent ? "记录只保存在此浏览器" : "此浏览器不允许本地保存，刷新后记录会丢失"}</span>
          </p>
        </header>
        <div className="practice-layout">
          <aside className="q-nav" aria-label="题目导航">
            <p className="kicker">
              {course.title} · {practiceBank.length} 题
            </p>
            <ol>
              {list.map((q) => {
                const s = status(q.id);
                return (
                  <li key={q.id}>
                    <Link to={`${BASE}/${q.id}`} aria-current={q.id === exerciseId ? "page" : undefined}>
                      <span className={`q-status is-${s === "wrong" ? "wrong" : s}`} aria-label={statusMark[s].text}>
                        {statusMark[s].mark}
                      </span>
                      {practiceLabel(q.id)}
                      <small>{q.difficulty}</small>
                    </Link>
                  </li>
                );
              })}
            </ol>
            {!list.length && <p className="muted-note">当前筛选下没有待练题目。</p>}
            <div className="q-filters">
              <div className="segmented-buttons" role="group" aria-label="题目范围">
                <button type="button" aria-pressed={!wrongOnly} onClick={() => setWrongOnly(false)}>
                  全部
                </button>
                <button type="button" aria-pressed={wrongOnly} onClick={() => setWrongOnly(true)}>
                  错题 {wrong}
                </button>
              </div>
              <label>
                <span className="sr-only">难度</span>
                <select value={difficulty} onChange={(e) => setDifficulty(e.target.value as typeof difficulty)}>
                  {difficulties.map((d) => (
                    <option key={d} value={d}>
                      难度：{d}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <p className="q-legend">✓ 正确　✕ 待重练　◐ 有草稿　○ 未做</p>
            <Link to={course.lessonPath}>回到精讲 →</Link>
          </aside>

          <div>
            <div className="mobile-q-nav">
              <label className="sr-only" htmlFor="mobile-question">
                选择题目
              </label>
              <select
                id="mobile-question"
                value={exerciseId}
                onChange={(e) => navigate(`${BASE}/${e.target.value}`)}
              >
                {practiceBank.map((q) => (
                  <option key={q.id} value={q.id}>
                    {statusMark[status(q.id)].mark} {practiceLabel(q.id)} · {q.difficulty}
                  </option>
                ))}
              </select>
              <span className="muted-note">{wrong} 题待重练</span>
            </div>
            {question ? (
              <ExerciseView
                key={question.id}
                question={question}
                label={practiceLabel(question.id)}
                path={`${BASE}/${question.id}`}
                previous={link(at - 1)}
                next={link(at + 1)}
              />
            ) : (
              <div className="empty-state" role="alert">
                没有找到这道题（{exerciseId}）。
                <p>
                  <Link to={BASE}>回到{course.title}专项练习</Link>
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
