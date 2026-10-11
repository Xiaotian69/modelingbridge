import { useState } from "react";
import { grade, type Answer, type Grade } from "./grading";
import type { Question as QuestionData } from "./questions";
import { PRACTICE_KEY, readHistory, save } from "./storage";

export function Question({
  question: q,
  onAttempt,
}: {
  question: QuestionData;
  onAttempt?: () => void;
}) {
  const [answer, setAnswer] = useState<Answer>(q.type === "multiple" ? [] : "");
  const [result, setResult] = useState<Grade | null>(null);
  const [hints, setHints] = useState(0);
  const [saveFailed, setSaveFailed] = useState(false);
  const change = (value: Answer) => {
    setAnswer(value);
    setResult(null);
  };
  function submit() {
    const value = grade(q, answer);
    setResult(value);
    if (value !== "invalid") {
      const history = readHistory();
      history[q.id] = {
        correct: value === "correct",
        attempts: (history[q.id]?.attempts || 0) + 1,
        updated: new Date().toISOString(),
      };
      setSaveFailed(!save(PRACTICE_KEY, history));
      onAttempt?.();
    }
  }
  return (
    <div className="lesson-question">
      <p className="eyebrow">
        {q.difficulty} · {q.knowledge} ·{" "}
        {q.type === "multiple"
          ? "多选"
          : q.type === "numeric"
            ? "数值"
            : q.type === "judgment"
              ? "判断"
              : "单选"}
      </p>
      <fieldset>
        <legend>{q.prompt}</legend>
        {q.type === "numeric" ? (
          <label className="numeric-answer">
            你的答案{" "}
            <input
              aria-label="你的数值答案"
              inputMode="decimal"
              value={answer as string}
              onChange={(e) => change(e.target.value)}
            />{" "}
            {q.unit}
            <small>
              允许绝对误差 ±{q.tolerance} {q.unit}
            </small>
          </label>
        ) : (
          q.options.map((option) => (
            <label key={option.id} className="answer-option">
              <input
                type={q.type === "multiple" ? "checkbox" : "radio"}
                name={q.id}
                value={option.id}
                checked={
                  Array.isArray(answer)
                    ? answer.includes(option.id)
                    : answer === option.id
                }
                onChange={() =>
                  change(
                    q.type === "multiple"
                      ? Array.isArray(answer) && answer.includes(option.id)
                        ? answer.filter((a) => a !== option.id)
                        : [...(Array.isArray(answer) ? answer : []), option.id]
                      : option.id,
                  )
                }
              />
              {option.label}
            </label>
          ))
        )}
      </fieldset>
      <div className="lesson-actions">
        <button className="lesson-button" onClick={submit}>
          提交答案
        </button>
        <button
          className="lesson-button secondary"
          disabled={hints >= q.hints.length}
          onClick={() => setHints(hints + 1)}
        >
          提示 {hints}/{q.hints.length}
        </button>
      </div>
      {q.hints.slice(0, hints).map((hint, i) => (
        <p className="hint" key={hint}>
          提示 {i + 1}：{hint}
        </p>
      ))}
      {result && (
        <div role="status" className={`answer-feedback ${result}`}>
          <strong>
            {result === "correct"
              ? "回答正确"
              : result === "incorrect"
                ? "还差一步，看看推导"
                : "请先选择答案或输入有效数字"}
          </strong>
          {result !== "invalid" && (
            <>
              <p>标准答案：{q.answerLabel}</p>
              <p>{q.explanation}</p>
            </>
          )}
        </div>
      )}
      {saveFailed && (
        <p role="alert">本机保存不可用；本次仍可作答，但刷新后记录可能丢失。</p>
      )}
      <small className="question-source">
        {q.source.author} · 已核验 · {q.verification}
      </small>
    </div>
  );
}
