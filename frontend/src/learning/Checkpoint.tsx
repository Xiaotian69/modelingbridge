import { useId, useState } from "react";
import { AnswerInput, emptyAnswer, typeLabel } from "./AnswerInput";
import { evaluate, helpLevels, type Evaluation } from "./evaluate";
import type { Answer } from "./grading";
import type { Question } from "./questions";
import { learning } from "../state/learning";

/**
 * 精讲内的检查点 (D-011/D-012): checked instantly with 「核对」, can be skipped,
 * never counted as a score. Only “tried + last result” is kept, apart from practice records.
 */
export function Checkpoint({ question: q }: { question: Question }) {
  const name = useId();
  const [answer, setAnswer] = useState<Answer>(() => emptyAnswer(q));
  const [result, setResult] = useState<Evaluation | null>(null);
  const [hint, setHint] = useState(false);
  const [solution, setSolution] = useState(false);
  const [first, second, full] = helpLevels(q);
  const label = q.placement === "inline" ? "试一试 · 检查点" : "章节自测 · 检查点";

  function check() {
    const value = evaluate(q, answer);
    setResult(value);
    if (value.status !== "invalid") learning.recordCheckpoint(q.id, value.status === "correct");
  }

  return (
    <section className="checkpoint" aria-label={`${label}：${q.knowledge}`} data-checkpoint={q.id}>
      <p className="kicker">
        {label} · {q.knowledge} · {typeLabel(q)}
      </p>
      <AnswerInput
        question={q}
        value={answer}
        name={name}
        onChange={(v) => {
          setAnswer(v);
          setResult(null);
        }}
      />
      <div className="checkpoint-actions">
        <button type="button" className="btn btn-secondary" onClick={check}>
          核对
        </button>
        <span className="muted-note">可以跳过，不计成绩</span>
      </div>
      {result && (
        <div
          role="status"
          className={`feedback is-${result.status}`}
        >
          {result.status === "invalid" && <strong>请先选择一个答案，或输入有效数字</strong>}
          {result.status === "correct" && (
            <>
              <strong>✓ 对了</strong>
              <p>{full.explanation}</p>
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
              <strong>✕ 再想想{result.tag ? ` · ${result.tag}` : ""}</strong>
              <p>{result.message ?? "答案和参考不一致。可以先看一点提示，再试一次。"}</p>
            </>
          )}
          {(result.status === "incorrect" || result.status === "partial") && (
            <div className="feedback-actions">
              <button type="button" className="link-button" onClick={() => setHint(true)}>
                我没理解，给我一点提示
              </button>
              <button type="button" className="link-button" onClick={() => setSolution(true)}>
                直接看解析
              </button>
            </div>
          )}
          {hint && result.status !== "correct" && (
            <p>
              提示：{first}
              {second ? ` ${second}` : ""}
            </p>
          )}
          {solution && result.status !== "correct" && (
            <p>
              解析：{full.answer}。{full.explanation}
            </p>
          )}
        </div>
      )}
      <p className="source-line">
        {q.source.author} · 已核验 · {q.verification}
      </p>
    </section>
  );
}
