import { useId, type ReactNode } from "react";
import type { HelpLevel } from "../state/learningStore";

const names = ["启发", "线索", "完整解析"] as const;

/**
 * 一把帮助梯子 (Q3/D-016): three levels, any can be opened directly. Content here is the
 * course's own verified text. The AI helper attaches to this ladder in step 5; until then
 * nothing here calls a model.
 */
export function HelpLadder({
  level,
  onLevel,
  recommendSolution,
  nudge,
  clue,
  solution,
  knowledgeLink,
}: {
  level: Exclude<HelpLevel, 0>;
  onLevel: (level: Exclude<HelpLevel, 0>) => void;
  recommendSolution: boolean;
  nudge: string;
  clue: string | null;
  solution: { answer: string; explanation: string };
  knowledgeLink: ReactNode;
}) {
  const id = useId();
  return (
    <section className="help-ladder" aria-label="帮助">
      <div className="help-tabs" role="tablist" aria-label="帮助深度">
        {names.map((label, i) => {
          const value = (i + 1) as 1 | 2 | 3;
          return (
            <button
              key={label}
              type="button"
              role="tab"
              id={`${id}-tab-${value}`}
              aria-selected={level === value}
              aria-controls={`${id}-panel`}
              onClick={() => onLevel(value)}
            >
              {value} {label}
              {value === 3 && recommendSolution && <span className="recommend">推荐</span>}
            </button>
          );
        })}
      </div>
      <div className="help-body" role="tabpanel" id={`${id}-panel`} aria-labelledby={`${id}-tab-${level}`}>
        <span className="help-source">课程预置 · 已核验</span>
        {level === 1 && <p>{nudge}</p>}
        {level === 2 && <p>{clue ?? "这道题没有更细的线索了，可以回看知识点或查看完整解析。"}</p>}
        {level === 3 && (
          <>
            <p>
              <b>参考答案：{solution.answer}</b>
            </p>
            <p>{solution.explanation}</p>
          </>
        )}
        <p className="muted-note">相关段落：{knowledgeLink}</p>
      </div>
    </section>
  );
}
