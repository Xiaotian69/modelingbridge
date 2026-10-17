import type { Answer } from "./grading";
import type { CourseQuestion as Question } from "./courseQuestion";

export const emptyAnswer = (q: Question): Answer => (q.type === "multiple" ? [] : "");

export const typeLabel = (q: Question) =>
  q.type === "multiple" ? "多选" : q.type === "numeric" ? "数值" : q.type === "judgment" ? "判断" : "单选";

/** Radio / checkbox / numeric input for one verified question. */
export function AnswerInput({
  question: q,
  value,
  onChange,
  name,
}: {
  question: Question;
  value: Answer;
  onChange: (value: Answer) => void;
  /** Unique per rendered instance (radio groups). */
  name: string;
}) {
  if (q.type === "numeric")
    return (
      <fieldset className="choices">
        <legend>{q.prompt}</legend>
        <label className="numeric-field">
          你的答案
          <input
            aria-label="你的数值答案"
            inputMode="decimal"
            autoComplete="off"
            value={typeof value === "string" ? value : ""}
            onChange={(e) => onChange(e.target.value)}
          />
          {q.unit}
          <small>
            填数字即可；允许误差 ±{q.tolerance} {q.unit}
          </small>
        </label>
      </fieldset>
    );
  const chosen = Array.isArray(value) ? value : value ? [value] : [];
  return (
    <fieldset className="choices">
      <legend>{q.prompt}</legend>
      {q.options.map((option) => (
        <label key={option.id} className="choice">
          <input
            type={q.type === "multiple" ? "checkbox" : "radio"}
            name={name}
            value={option.id}
            checked={chosen.includes(option.id)}
            onChange={() =>
              onChange(
                q.type === "multiple"
                  ? chosen.includes(option.id)
                    ? chosen.filter((c) => c !== option.id)
                    : [...chosen, option.id]
                  : option.id,
              )
            }
          />
          <span>{option.label}</span>
        </label>
      ))}
    </fieldset>
  );
}
