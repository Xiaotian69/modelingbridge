import { useId, useRef, useState, type KeyboardEvent } from "react";
import { COMMUTE_STEPS } from "./process";

/** §3: the nine modelling steps of the commute case as tabs (arrow keys move between steps). */
export function ProcessExplorer() {
  const id = useId();
  const [active, setActive] = useState(0);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const step = COMMUTE_STEPS[active];
  const select = (i: number, focus = false) => {
    const next = (i + COMMUTE_STEPS.length) % COMMUTE_STEPS.length;
    setActive(next);
    if (focus) tabs.current[next]?.focus();
  };
  const onKey = (event: KeyboardEvent) => {
    const moves: Record<string, number> = { ArrowRight: active + 1, ArrowDown: active + 1, ArrowLeft: active - 1, ArrowUp: active - 1, Home: 0, End: COMMUTE_STEPS.length - 1 };
    if (!(event.key in moves)) return;
    event.preventDefault();
    select(moves[event.key], true);
  };

  return (
    <figure className="intro-process" aria-labelledby={`${id}-title`}>
      <figcaption>
        <span className="eyebrow">建模流程 · 早八几点出门</span>
        <h3 id={`${id}-title`}>九个步骤，每一步交出什么</h3>
      </figcaption>
      <div className="intro-steps" role="tablist" aria-label="建模步骤" onKeyDown={onKey}>
        {COMMUTE_STEPS.map((s, i) => (
          <button
            key={s.id}
            ref={(el) => {
              tabs.current[i] = el;
            }}
            type="button"
            role="tab"
            id={`${id}-tab-${i}`}
            aria-selected={i === active}
            aria-controls={`${id}-panel`}
            tabIndex={i === active ? 0 : -1}
            className={step.loopsTo?.includes(i + 1) ? "is-loop-target" : undefined}
            onClick={() => select(i)}
          >
            <span className="intro-step-no">{i + 1}</span>
            {s.name}
          </button>
        ))}
      </div>
      <p className="intro-loop-hint">
        <span aria-hidden="true">↺</span> 检验不通过时，要回到前面的步骤修改；虚线框标出的是当前这一步要回去的地方。
      </p>
      <div className="intro-step-panel" role="tabpanel" id={`${id}-panel`} aria-labelledby={`${id}-tab-${active}`}>
        <p className="intro-step-title">
          第 {active + 1} 步 · {step.name}
        </p>
        <dl>
          <dt>为什么要做</dt>
          <dd>{step.why}</dd>
          <dt>需要知道什么</dt>
          <dd>{step.need}</dd>
          <dt>容易卡在哪里</dt>
          <dd>{step.pitfall}</dd>
          <dt>这一步的结果</dt>
          <dd className="intro-step-result">{step.result}</dd>
          <dt>下一步怎样用它</dt>
          <dd>
            {step.loopsTo && <span className="intro-loop-badge">↺ 回到第 {step.loopsTo.join("、")} 步</span>}
            {step.next}
          </dd>
        </dl>
        <div className="intro-step-turn">
          <button type="button" className="link-button" disabled={active === 0} onClick={() => select(active - 1)}>
            ← 上一步
          </button>
          <span>
            {active + 1} / {COMMUTE_STEPS.length}
          </span>
          <button
            type="button"
            className="link-button"
            disabled={active === COMMUTE_STEPS.length - 1}
            onClick={() => select(active + 1)}
          >
            下一步 →
          </button>
        </div>
      </div>
    </figure>
  );
}
