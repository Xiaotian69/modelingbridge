import { useState, type ReactNode } from "react";
import { q1, q2, q3, q4, q5, type ScoredOption } from "./config";
import { evaluateMeal, MEAL_MAX, MEAL_OPTIMUM, MEAL_VERTICES } from "./meal";
import { ahpWeights, PAIRS, rankClubs, type Pairwise } from "./ahp";
import type { Answers } from "./scoring";

type Props<K extends keyof Answers> = {
  value?: Answers[K];
  onAnswer: (value: Answers[K]) => void;
  onNext: () => void;
  last?: boolean;
};

function Feedback({ children, onNext, ready = true, last }: { children: ReactNode; onNext: () => void; ready?: boolean; last?: boolean }) {
  return (
    <div className="cg-feedback" role="status">
      <p className="cg-feedback-kicker">你刚才其实在做建模</p>
      {children}
      <button type="button" className="cg-btn cg-btn-primary cg-next" onClick={onNext} disabled={!ready}>
        {last ? "看我的结果" : "下一题"}
      </button>
    </div>
  );
}

function Choices({ options, selected, onPick, disabled, name }: { options: readonly ScoredOption[]; selected?: string; onPick: (id: string) => void; disabled?: boolean; name: string }) {
  return (
    <div className="cg-choices" role="radiogroup" aria-label={name}>
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          role="radio"
          aria-checked={selected === o.id}
          className={`cg-choice${selected === o.id ? " is-on" : ""}`}
          onClick={() => onPick(o.id)}
          disabled={disabled && selected !== o.id}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------

export function Q1Canteen({ value, onAnswer, onNext }: Props<"q1">) {
  const [picked, setPicked] = useState<string[]>(value ?? []);
  const done = Boolean(value);
  const toggle = (id: string) => {
    if (done) return;
    setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : p.length < q1.pick ? [...p, id] : p));
  };
  return (
    <>
      <p className="cg-prompt">{q1.prompt}</p>
      <div className="cg-choices cg-grid" role="group" aria-label="食堂排队的因素">
        {q1.options.map((o) => {
          const on = picked.includes(o.id);
          return (
            <button
              key={o.id}
              type="button"
              aria-pressed={on}
              className={`cg-choice${on ? " is-on" : ""}`}
              onClick={() => toggle(o.id)}
              disabled={done || (!on && picked.length >= q1.pick)}
            >
              {o.label}
            </button>
          );
        })}
      </div>
      {!done ? (
        <button type="button" className="cg-btn cg-btn-primary cg-next" disabled={picked.length !== q1.pick} onClick={() => onAnswer(picked)}>
          {picked.length === q1.pick ? "就这三个" : `还要选 ${q1.pick - picked.length} 个`}
        </button>
      ) : (
        <Feedback onNext={onNext}>
          <p>{q1.feedback}</p>
        </Feedback>
      )}
    </>
  );
}

// ---------------------------------------------------------------------------

function Stepper({ label, sub, value, max, onChange, disabled }: { label: string; sub: string; value: number; max: number; onChange: (v: number) => void; disabled: boolean }) {
  const id = `cg-${label}`;
  return (
    <div className="cg-stepper">
      <label htmlFor={id}>
        <strong>{label}</strong> <span>{sub}</span>
      </label>
      <div className="cg-stepper-row">
        <button type="button" className="cg-round" aria-label={`${label}少一串`} onClick={() => onChange(Math.max(0, value - 1))} disabled={disabled || value === 0}>
          −
        </button>
        <input id={id} type="range" min={0} max={max} step={1} value={value} onChange={(e) => onChange(Number(e.target.value))} disabled={disabled} />
        <button type="button" className="cg-round" aria-label={`${label}多一串`} onClick={() => onChange(Math.min(max, value + 1))} disabled={disabled || value === max}>
          +
        </button>
        <output htmlFor={id} className="cg-count">
          {value}
          <small>串</small>
        </output>
      </div>
    </div>
  );
}

function Meter({ label, used, cap, unit }: { label: string; used: number; cap: number; unit: string }) {
  const over = used > cap;
  return (
    <div className={`cg-meter${over ? " is-over" : ""}`}>
      <span>{label}</span>
      <div className="cg-meter-track" aria-hidden="true">
        <i style={{ width: `${Math.min(100, (used / cap) * 100)}%` }} />
      </div>
      <b>
        {used}/{cap} {unit}
      </b>
    </div>
  );
}

/** 可行域小图：横轴荤菜、纵轴素菜。 */
function MealChart({ you }: { you: [number, number] }) {
  const W = 280;
  const H = 220;
  const pad = 30;
  const sx = (x: number) => pad + (x / 11) * (W - pad - 10);
  const sy = (y: number) => H - pad - (y / 14) * (H - pad - 10);
  const poly = MEAL_VERTICES.map(([x, y]) => `${sx(x)},${sy(y)}`).join(" ");
  const [ox, oy] = MEAL_OPTIMUM.point;
  return (
    <svg className="cg-chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`可行区域图：你的组合 荤 ${you[0]} 素 ${you[1]}，最优解 荤 ${ox} 素 ${oy}`}>
      <polygon points={poly} className="cg-region" />
      <line x1={pad} y1={H - pad} x2={W - 6} y2={H - pad} className="cg-axis" />
      <line x1={pad} y1={H - pad} x2={pad} y2={6} className="cg-axis" />
      <text x={W - 8} y={H - pad - 6} textAnchor="end" className="cg-axis-label">荤菜（串）</text>
      <text x={pad + 4} y={14} className="cg-axis-label">素菜（串）</text>
      {[0, 5, 10].map((t) => (
        <text key={`x${t}`} x={sx(t)} y={H - pad + 14} textAnchor="middle" className="cg-tick">{t}</text>
      ))}
      {[5, 10].map((t) => (
        <text key={`y${t}`} x={pad - 6} y={sy(t) + 4} textAnchor="end" className="cg-tick">{t}</text>
      ))}
      <text x={sx(0.6)} y={sy(2.5)} className="cg-tick">钱够、时间也够</text>
      <circle cx={sx(ox)} cy={sy(oy)} r={7} className="cg-opt" />
      <text x={sx(ox) + 10} y={sy(oy) - 8} className="cg-opt-label">最优 ({ox},{oy})</text>
      <circle cx={sx(you[0])} cy={sy(you[1])} r={5} className="cg-you" />
      {(you[0] !== ox || you[1] !== oy) && (
        <text x={sx(you[0]) + 8} y={sy(you[1]) + 16} className="cg-you-label">你</text>
      )}
    </svg>
  );
}

export function Q2Meal({ value, onAnswer, onNext, last }: Props<"q2">) {
  const [meat, setMeat] = useState(value?.meat ?? 0);
  const [veg, setVeg] = useState(value?.veg ?? 0);
  const [submitted, setSubmitted] = useState(Boolean(value));
  const [method, setMethod] = useState(value?.method);
  const m = evaluateMeal(meat, veg);
  const [ox, oy] = MEAL_OPTIMUM.point;
  const pick = (id: string) => {
    setMethod(id);
    onAnswer({ meat, veg, optimal: m.optimal, method: id });
  };
  return (
    <>
      <p className="cg-prompt">{q2.story}</p>
      <div className="cg-panel">
        <Stepper label={q2.meat.name} sub={`${q2.meat.example} · ${q2.meat.price} 元 · ${q2.meat.note}`} value={meat} max={MEAL_MAX.meat} onChange={setMeat} disabled={submitted} />
        <Stepper label={q2.veg.name} sub={`${q2.veg.example} · ${q2.veg.price} 元 · ${q2.veg.note}`} value={veg} max={MEAL_MAX.veg} onChange={setVeg} disabled={submitted} />
        <div className="cg-meters">
          <Meter label="花钱" used={m.cost} cap={q2.budget} unit="元" />
          <Meter label="用时" used={m.minutes} cap={q2.minutes} unit="分钟" />
        </div>
        <div className="cg-score" aria-live="polite">
          <span>饱腹值</span>
          <strong>{m.full}</strong>
          <small>
            荤菜每串 +{q2.meat.full}，素菜每串 +{q2.veg.full}
          </small>
        </div>
        {m.overBudget && <p className="cg-warn">钱不够了！</p>}
        {m.late && <p className="cg-warn">吃不完，要迟到了！</p>}
      </div>
      {!submitted ? (
        <button type="button" className="cg-btn cg-btn-primary cg-next" disabled={!m.feasible || m.full === 0} onClick={() => setSubmitted(true)}>
          {m.full === 0 ? "拖动滑块点菜" : m.feasible ? "就这么吃" : "超出了，调一调"}
        </button>
      ) : (
        <div className="cg-feedback" role="status">
          <p className="cg-feedback-kicker">{m.optimal ? "你找到了最优解！" : `你的饱腹值 ${m.full}，最优是 ${MEAL_OPTIMUM.value}`}</p>
          <MealChart you={[meat, veg]} />
          <p>
            最优组合：荤菜 {ox} 串 + 素菜 {oy} 串，正好花完 {q2.budget} 元、用完 {q2.minutes} 分钟。{q2.feedback}
          </p>
          <p className="cg-subq">{q2.methodPrompt}</p>
          <Choices options={q2.methods} selected={method} onPick={pick} name={q2.methodPrompt} />
          <button type="button" className="cg-btn cg-btn-primary cg-next" onClick={onNext} disabled={!method}>
            {last ? "看我的结果" : "下一题"}
          </button>
        </div>
      )}
    </>
  );
}

// ---------------------------------------------------------------------------

export function Q3Clubs({ value, onAnswer, onNext, last }: Props<"q3">) {
  const [choices, setChoices] = useState<(Pairwise | undefined)[]>(value?.choices ?? [undefined, undefined, undefined]);
  const [shown, setShown] = useState(Boolean(value));
  const [use, setUse] = useState(value?.use);
  const complete = choices.every((c) => c !== undefined);
  const names = q3.criteria.map((c) => c.name);
  const ahp = complete ? ahpWeights(choices as Pairwise[]) : null;
  const ranking = ahp ? rankClubs(ahp.weights, q3.clubs) : [];
  const set = (k: number, c: Pairwise) => !shown && setChoices((cs) => cs.map((x, i) => (i === k ? c : x)));
  return (
    <>
      <div className="cg-clubs">
        {q3.clubs.map((c) => (
          <div key={c.name} className="cg-club">
            <strong>{c.name}</strong>
            <span>{c.note}</span>
          </div>
        ))}
      </div>
      <p className="cg-prompt">{q3.prompt}</p>
      <div className="cg-pairs">
        {PAIRS.map(([i, j], k) => (
          <div key={k} className="cg-pair" role="radiogroup" aria-label={`${names[i]}和${names[j]}哪个更重要`}>
            {([-1, 0, 1] as Pairwise[]).map((c) => (
              <button
                key={c}
                type="button"
                role="radio"
                aria-checked={choices[k] === c}
                className={`cg-chip${choices[k] === c ? " is-on" : ""}`}
                onClick={() => set(k, c)}
                disabled={shown && choices[k] !== c}
              >
                {c === -1 ? `${names[i]}更重要` : c === 1 ? `${names[j]}更重要` : "一样"}
              </button>
            ))}
          </div>
        ))}
      </div>
      {!shown ? (
        <button type="button" className="cg-btn cg-btn-primary cg-next" disabled={!complete} onClick={() => setShown(true)}>
          {complete ? "算一算该选谁" : "三组都比完再算"}
        </button>
      ) : (
        ahp && (
          <div className="cg-feedback" role="status">
            <p className="cg-feedback-kicker">按你的判断，推荐：{ranking[0].name}</p>
            <div className="cg-weights">
              {names.map((n, i) => (
                <div key={n} className="cg-weight">
                  <span>{n}</span>
                  <div className="cg-meter-track" aria-hidden="true">
                    <i style={{ width: `${ahp.weights[i] * 100}%` }} />
                  </div>
                  <b>{Math.round(ahp.weights[i] * 100)}%</b>
                </div>
              ))}
            </div>
            <ol className="cg-rank">
              {ranking.map((r) => (
                <li key={r.name}>
                  {r.name} <small>{r.total.toFixed(2)} 分</small>
                </li>
              ))}
            </ol>
            {!ahp.consistent && <p className="cg-note">你的三次判断有点“绕圈”（A 比 B 重要、B 比 C 重要、C 又比 A 重要）。AHP 里有专门的“一致性检验”来发现这种情况。</p>}
            <p>{q3.feedback}</p>
            <p className="cg-subq">{q3.usePrompt}</p>
            <Choices
              options={q3.uses}
              selected={use}
              name={q3.usePrompt}
              onPick={(id) => {
                setUse(id);
                onAnswer({ choices: choices as Pairwise[], use: id });
              }}
            />
            <button type="button" className="cg-btn cg-btn-primary cg-next" onClick={onNext} disabled={!use}>
              {last ? "看我的结果" : "下一题"}
            </button>
          </div>
        )
      )}
    </>
  );
}

// ---------------------------------------------------------------------------

/** 占用率示意曲线 + 选中选项的虚线延伸。 */
function LibraryChart({ choice, reveal }: { choice?: string; reveal: boolean }) {
  const W = 300;
  const H = 180;
  const pad = 28;
  const n = q4.observed.length + 1;
  const sx = (i: number) => pad + (i / (n - 1)) * (W - pad - 16);
  const sy = (v: number) => H - pad - (v / 100) * (H - pad - 14);
  const last = q4.observed[q4.observed.length - 1];
  const path = q4.observed.map((p, i) => `${i ? "L" : "M"}${sx(i)},${sy(p.v)}`).join(" ");
  const option = q4.options.find((o) => o.id === choice);
  return (
    <svg className="cg-chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="座位占用率示意曲线：6:30 约 4%，7:00 约 16%，7:30 约 44%，8:00 约 78%">
      <line x1={pad} y1={sy(100)} x2={W - 10} y2={sy(100)} className="cg-cap" />
      <text x={pad + 2} y={sy(100) - 4} className="cg-tick">座位上限 100%</text>
      <line x1={pad} y1={H - pad} x2={W - 10} y2={H - pad} className="cg-axis" />
      {[...q4.observed.map((p) => p.t), q4.nextLabel].map((t, i) => (
        <text key={t} x={sx(i)} y={H - pad + 15} textAnchor="middle" className="cg-tick">{t}</text>
      ))}
      <path d={path} className="cg-line" />
      {q4.observed.map((p, i) => (
        <circle key={p.t} cx={sx(i)} cy={sy(p.v)} r={3.5} className="cg-dot" />
      ))}
      {option?.guess != null && !reveal && (
        <line x1={sx(n - 2)} y1={sy(last.v)} x2={sx(n - 1)} y2={sy(option.guess)} className="cg-guess" />
      )}
      {reveal && (
        <>
          <line x1={sx(n - 2)} y1={sy(last.v)} x2={sx(n - 1)} y2={sy(q4.actual)} className="cg-line cg-actual" />
          <circle cx={sx(n - 1)} cy={sy(q4.actual)} r={5} className="cg-opt" />
          <text x={sx(n - 1) - 6} y={sy(q4.actual) + 18} textAnchor="end" className="cg-opt-label">{q4.actual}%</text>
        </>
      )}
    </svg>
  );
}

export function Q4Library({ value, onAnswer, onNext, last }: Props<"q4">) {
  const [choice, setChoice] = useState(value);
  const done = Boolean(value);
  return (
    <>
      <p className="cg-prompt">{q4.prompt}</p>
      <LibraryChart choice={choice} reveal={done} />
      <p className="cg-caption">示意数据，不是真实统计</p>
      <Choices options={q4.options} selected={choice} onPick={(id) => !done && setChoice(id)} disabled={done} name="8:30 会怎样" />
      {!done ? (
        <button type="button" className="cg-btn cg-btn-primary cg-next" disabled={!choice} onClick={() => choice && onAnswer(choice)}>
          揭晓
        </button>
      ) : (
        <Feedback onNext={onNext} last={last}>
          <p>{q4.feedback}</p>
        </Feedback>
      )}
    </>
  );
}

// ---------------------------------------------------------------------------

export function Q5Fermi({ value, onAnswer, onNext, last }: Props<"q5">) {
  const done = Boolean(value);
  return (
    <>
      <p className="cg-prompt">{q5.prompt}</p>
      <Choices options={q5.options} selected={value} onPick={(id) => !done && onAnswer(id)} disabled={done} name={q5.title} />
      {done && (
        <Feedback onNext={onNext} last={last}>
          <p>{q5.feedback}</p>
        </Feedback>
      )}
    </>
  );
}
