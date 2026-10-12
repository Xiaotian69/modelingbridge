import { useEffect, useId, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AnswerInput, emptyAnswer, typeLabel } from "../learning/AnswerInput";
import { evaluate, helpLevels, type Evaluation } from "../learning/evaluate";
import { metaFor } from "../learning/exerciseMeta";
import type { Question } from "../learning/questions";
import { sectionNumber, sectionTitle } from "../learning/sectionIds";
import { usePrefs } from "../app/PrefsContext";
import { learning, useLearning } from "../state/learning";
import type { HelpLevel } from "../state/learningStore";
import { setReturnTicket } from "../state/returnTicket";
import { HelpLadder } from "./HelpLadder";

const statusText = { correct: "回答正确", incorrect: "还不对", partial: "部分正确" } as const;

/**
 * One exercise, submit-then-feedback (D-012). First wrong answer never reveals the
 * reference answer; the full solution is only shown when the learner opens it (Q7).
 */
export function ExerciseView({
  question: q,
  label,
  path,
  next,
  previous,
}: {
  question: Question;
  label: string;
  path: string;
  next?: { href: string; label: string };
  previous?: { href: string; label: string };
}) {
  const name = useId();
  const navigate = useNavigate();
  const { state } = useLearning();
  const { prefs, update: updatePrefs } = usePrefs();
  const record = state.exercises[q.id];
  const meta = metaFor(q.id);
  const [first, clue, solution] = helpLevels(q);

  // Restored on mount from the local record: draft, attempts and help level (要求 5).
  const [answer, setAnswer] = useState(() => record?.draft ?? emptyAnswer(q));
  const [restored, setRestored] = useState(
    () => !!record && (record.draft !== undefined || record.attempts > 0 || record.helpLevel > 0),
  );
  const [result, setResult] = useState<Evaluation | null>(null);
  const [helpOpen, setHelpOpen] = useState(() => (record?.helpLevel ?? 0) > 0);
  const [level, setLevel] = useState<Exclude<HelpLevel, 0>>(
    () => (record?.helpLevel ? record.helpLevel : 1) as Exclude<HelpLevel, 0>,
  );
  const [nudgeHidden, setNudgeHidden] = useState(false);
  const firstInput = useRef<HTMLDivElement>(null);
  useEffect(() => () => learning.flush(), []);

  const attempts = record?.attempts ?? 0;
  const solved = record?.lastStatus === "correct";
  const struggling = attempts >= 2 && !solved;
  const showNudge =
    !!result &&
    (result.status === "incorrect" || result.status === "partial") &&
    attempts >= 2 &&
    prefs.nudges &&
    !record?.nudgeDismissed &&
    !nudgeHidden;

  function change(value: typeof answer) {
    setAnswer(value);
    setResult(null);
    learning.saveDraft(q.id, value);
  }
  function submit() {
    const value = evaluate(q, answer);
    setResult(value);
    setRestored(false);
    if (value.status !== "invalid") learning.recordSubmission(q.id, value.status);
  }
  function openLevel(value: Exclude<HelpLevel, 0>) {
    setHelpOpen(true);
    setLevel(value);
    learning.openHelp(q.id, value, solved);
  }
  function restart() {
    learning.restart(q.id);
    setAnswer(emptyAnswer(q));
    setResult(null);
    setRestored(false);
    setHelpOpen(false);
    setLevel(1);
  }
  function retry() {
    setResult(null);
    firstInput.current?.querySelector<HTMLElement>("input")?.focus();
  }
  /** Leave for the lesson with a return ticket; the draft is flushed first. */
  function reviewKnowledge() {
    learning.saveDraft(q.id, answer);
    learning.flush();
    setReturnTicket({
      from: { kind: "exercise", id: q.id, path, label },
      to: { sectionId: meta.sectionId },
    });
    navigate(`/learn/linear-programming#${meta.sectionId}`);
  }

  const knowledgeLink = (
    <button type="button" className="link-button" onClick={reviewKnowledge}>
      {q.knowledge} · 第 {sectionNumber(meta.sectionId)} 节「{sectionTitle(meta.sectionId)}」→
    </button>
  );

  return (
    <article className="exercise" aria-labelledby={`${name}-title`}>
      {restored && (
        <div className="restore-banner" role="status">
          <span>
            已恢复你的作答 · 已尝试 {attempts} 次
            {record?.lastStatus ? ` · 上次结果：${statusText[record.lastStatus]}` : ""}
            {record?.helpLevel ? ` · 提示看到第 ${record.helpLevel} 级` : ""}
            {record?.legacy ? "（旧版记录）" : ""}
          </span>
          <button type="button" className="link-button" onClick={restart}>
            清空重做
          </button>
        </div>
      )}
      <p className="kicker" id={`${name}-title`}>
        {label} · {q.difficulty} · {q.knowledge} · {typeLabel(q)}
      </p>
      <div ref={firstInput}>
        <AnswerInput question={q} value={answer} onChange={change} name={name} />
      </div>
      <div className="exercise-actions">
        <button type="button" className="btn btn-primary" onClick={submit}>
          提交答案
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          aria-expanded={helpOpen}
          onClick={() => (helpOpen ? setHelpOpen(false) : openLevel(level))}
        >
          帮助 {helpOpen ? "▴" : "▾"}
        </button>
        <span className="attempts">已尝试 {attempts} 次</span>
      </div>

      {result && (
        <div role="status" className={`feedback is-${result.status}`}>
          {result.status === "invalid" && <strong>请先选择答案，或输入有效数字</strong>}
          {result.status === "correct" && (
            <>
              <strong>✓ 回答正确</strong>
              {record?.solvedAfterSolution && <p className="muted-note">（看过完整解析后答对）</p>}
              <p>
                <b>{solution.answer}</b>。{solution.explanation}
              </p>
              <div className="feedback-actions">
                <span>用到的知识点：{knowledgeLink}</span>
                {next && (
                  <Link className="btn btn-secondary" to={next.href}>
                    下一题：{next.label} →
                  </Link>
                )}
              </div>
            </>
          )}
          {result.status === "partial" && (
            <>
              <strong>◐ 部分正确</strong>
              <p>{result.message}</p>
            </>
          )}
          {result.status === "incorrect" && (
            <>
              <strong>✕ 还不对{result.tag ? ` · 错误类型：${result.tag}` : ""}</strong>
              <p>
                {result.message ??
                  "答案与参考不一致。我们无法确定具体原因，可以打开帮助，或回看相关知识点。"}
              </p>
            </>
          )}
          {(result.status === "incorrect" || result.status === "partial") && (
            <>
              <div className="feedback-actions">
                <button type="button" className="btn btn-secondary" onClick={retry}>
                  再试一次
                </button>
                <span>回看：{knowledgeLink}</span>
              </div>
              <p className="muted-note">这里不会直接显示标准答案；需要时可以打开帮助。</p>
              {showNudge && (
                <div className="nudge">
                  <span>卡住了？可以回看知识点，或打开帮助。</span>
                  <button type="button" className="link-button" onClick={() => openLevel(1)}>
                    打开帮助
                  </button>
                  <button
                    type="button"
                    className="link-button"
                    onClick={() => {
                      setNudgeHidden(true);
                      learning.dismissNudge(q.id);
                    }}
                  >
                    这题不再提示
                  </button>
                  <button
                    type="button"
                    className="link-button"
                    onClick={() => updatePrefs({ nudges: false })}
                  >
                    关闭所有帮助建议
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {helpOpen && (
        <HelpLadder
          level={level}
          onLevel={openLevel}
          recommendSolution={struggling}
          nudge={first}
          clue={clue}
          solution={solution}
          knowledgeLink={knowledgeLink}
        />
      )}

      <nav className="exercise-nav" aria-label="上一题 / 下一题">
        {previous ? <Link to={previous.href}>← {previous.label}</Link> : <span>第一题</span>}
        {next ? <Link to={next.href}>{next.label} →</Link> : <span>最后一题</span>}
      </nav>
      <p className="exercise-source">
        {q.source.author} · 已核验（{q.verification}）· 确定性判分，不使用 AI
      </p>
    </article>
  );
}
