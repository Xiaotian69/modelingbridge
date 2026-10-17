import { useState, type ReactNode } from "react";
import { q1, q2, q3, q4, q5, type ScoredOption } from "./config";
import { evaluateMeal, MEAL_MAX, MEAL_OPTIMUM, MEAL_VERTICES } from "./meal";
import { ahp, explainConsistency, fraction, JUDGEMENTS, PAIRS, type Judgement } from "./ahp";
import { explainRecommendation, rank, rateCourse, scoreCourses } from "./courses";
import { estimate, spread } from "./fermi";
import { workedStep } from "./q1";
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

export function Q1Canteen({ value, onAnswer, onNext, last }: Props<"q1">) {
  // 旧存档（数组或对象）：当作没答过，重新答一次
  const saved = typeof value === "string" && q1.options.some((o) => o.id === value) ? value : undefined;
  const [choice, setChoice] = useState(saved);
  const done = Boolean(saved);
  const chosen = q1.options.find((o) => o.id === choice);
  const { ahead, arrive, serve } = q1.scene;
  return (
    <>
      <p className="cg-prompt cg-story">{q1.story}</p>
      <div className="cg-queue" aria-hidden="true">
        <span className="cg-queue-window">窗口 · 打 {serve} 份/分钟</span>
        <span className="cg-queue-line">
          {Array.from({ length: 12 }, (_, i) => (
            <i key={i} />
          ))}
        </span>
        <em className="cg-queue-count">{ahead} 人</em>
        <span className="cg-queue-in">+{arrive} 人/分钟</span>
      </div>
      <p className="cg-subq cg-q1-ask">{q1.prompt}</p>
      <Choices options={q1.options} selected={choice} onPick={(id) => !done && setChoice(id)} disabled={done} name={q1.prompt} />
      {!done ? (
        <button type="button" className="cg-btn cg-btn-primary cg-next" disabled={!choice} onClick={() => choice && onAnswer(choice)}>
          确认答案
        </button>
      ) : (
        chosen && (
          <div className="cg-feedback" role="status">
            <p className="cg-feedback-kicker">你选了「{chosen.name}」</p>
            <p>{chosen.lead}</p>
            <p className="cg-worked">{workedStep(chosen.id)}</p>
            <p>
              <strong>要注意：</strong>
              {chosen.limit}
            </p>
            <p>{q1.together}</p>
            <p className="cg-aside">{q1.note}</p>
            <button type="button" className="cg-btn cg-btn-primary cg-next" onClick={onNext}>
              {last ? "看我的结果" : "下一题"}
            </button>
          </div>
        )
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
      <table className="cg-rules-card">
        <caption>点菜规则</caption>
        <thead>
          <tr>
            <th scope="col">每串</th>
            <th scope="col">价格</th>
            <th scope="col">吃完要</th>
            <th scope="col">饱腹值</th>
          </tr>
        </thead>
        <tbody>
          {[q2.meat, q2.veg].map((f) => (
            <tr key={f.name}>
              <th scope="row">
                {f.name}
                <small>{f.example}</small>
              </th>
              <td>{f.price} 元</td>
              <td>{f.minutes} 分钟</td>
              <td>+{f.full}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={4}>
              限制：总共不超过 <b>{q2.budget} 元</b>、<b>{q2.minutes} 分钟</b>
            </td>
          </tr>
        </tfoot>
      </table>
      <p className="cg-goal">{q2.goal}</p>
      <div className="cg-panel">
        <Stepper label={q2.meat.name} sub={q2.meat.example} value={meat} max={MEAL_MAX.meat} onChange={setMeat} disabled={submitted} />
        <Stepper label={q2.veg.name} sub={q2.veg.example} value={veg} max={MEAL_MAX.veg} onChange={setVeg} disabled={submitted} />
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
            最优组合：荤菜 {ox} 串 + 素菜 {oy} 串。{q2.feedback}
          </p>
          <p className="cg-preference">{q2.preference}</p>
          <p className="cg-aside">{q2.assumption}</p>
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

const CRITERION_CLASS = ["is-c0", "is-c1", "is-c2"];
const pct = (v: number) => `${Math.round(v * 100)}%`;

/** 一次两难：五档，左端=前者明显更重要，右端=后者明显更重要。 */
function Tug({ index, left, right, question, value, touched, onChange, locked }: { index: number; left: string; right: string; question: string; value: Judgement; touched: boolean; onChange: (v: Judgement) => void; locked: boolean }) {
  const words: Record<Judgement, string> = {
    [-2]: `${left}，明显更重要`,
    [-1]: `${left}，稍微更重要`,
    0: "两个一样重要",
    1: `${right}，稍微更重要`,
    2: `${right}，明显更重要`,
  };
  return (
    <div className={`cg-tug${touched ? " is-touched" : ""}`}>
      <p className="cg-tug-q">
        <span className="cg-tug-n">{index + 1}</span>
        {question}
      </p>
      <div className="cg-tug-row" role="radiogroup" aria-label={`${left}和${right}，哪个更重要`}>
        <span className="cg-tug-end">{left}</span>
        {JUDGEMENTS.map((j) => (
          <button
            key={j}
            type="button"
            role="radio"
            aria-checked={touched && value === j}
            aria-label={words[j]}
            className={`cg-tug-dot is-${Math.abs(j)}${touched && value === j ? " is-on" : ""}`}
            onClick={() => onChange(j)}
            disabled={locked}
          />
        ))}
        <span className="cg-tug-end">{right}</span>
      </div>
      <p className="cg-tug-word" aria-hidden="true">{touched ? words[value] : "点一个圆点：越靠近哪边，就越看重哪边"}</p>
    </div>
  );
}

function Stars({ n }: { n: number }) {
  return (
    <span className="cg-stars" aria-label={`${n} 分`}>
      {"●".repeat(n)}
      <i>{"●".repeat(5 - n)}</i>
    </span>
  );
}

export function Q3Courses({ value, onAnswer, onNext, last }: Props<"q3">) {
  const [choices, setChoices] = useState<Judgement[]>((value?.choices as Judgement[]) ?? [0, 0, 0]);
  const [touched, setTouched] = useState<boolean[]>(value ? [true, true, true] : [false, false, false]);
  const [shown, setShown] = useState(Boolean(value));
  const [use, setUse] = useState(value?.use);
  const names = q3.criteria.map((c) => c.name);
  const result = ahp(choices);
  const rows = scoreCourses(result.weights);
  const order = rank(rows);
  const left = touched.filter((t) => !t).length;
  const check = explainConsistency(names, choices);
  const why = explainRecommendation(names, result.weights, rows);
  const tie = why.tie;

  const set = (k: number, j: Judgement) => {
    setChoices((cs) => cs.map((c, i) => (i === k ? j : c)));
    setTouched((ts) => ts.map((t, i) => (i === k ? true : t)));
  };
  const reopen = () => {
    setShown(false);
    setUse(undefined);
  };

  return (
    <>
      <p className="cg-prompt">{q3.prompt}</p>

      <div className="cg-courses" role="table" aria-label="三门选修课的情况">
        <div className="cg-course-row cg-course-head" role="row">
          <span role="columnheader">课程</span>
          {names.map((n, j) => (
            <span key={n} role="columnheader" className={CRITERION_CLASS[j]}>
              {n}
            </span>
          ))}
        </div>
        {q3.courses.map((c) => {
          const scores = rateCourse(c);
          const facts = [`往届均分 ${c.avgScore}`, c.homeworkText, c.startHour < q3.rules.time.earlyBefore ? `${c.slot} 早八` : c.slot];
          return (
            <div key={c.name} className="cg-course-row" role="row">
              <strong role="rowheader">{c.name}</strong>
              {facts.map((f, j) => (
                <span key={f} role="cell" className={CRITERION_CLASS[j]}>
                  {f}
                  <Stars n={scores[j]} />
                </span>
              ))}
            </div>
          );
        })}
      </div>
      <p className="cg-caption cg-sim-note">{q3.simulatedNote}</p>

      <div className="cg-tugs">
        {PAIRS.map(([i, j], k) => (
          <Tug key={k} index={k} left={names[i]} right={names[j]} question={q3.dilemmas[k]} value={choices[k]} touched={touched[k]} onChange={(v) => set(k, v)} locked={shown} />
        ))}
      </div>

      {!shown ? (
        <button type="button" className="cg-btn cg-btn-primary cg-next" disabled={left > 0} onClick={() => setShown(true)}>
          {left > 0 ? `还有 ${left} 个两难没选` : "确认，帮我选课"}
        </button>
      ) : (
        <div className="cg-feedback" role="status">
          <p className="cg-feedback-kicker">{tie ? `${order[0].name}和${order[1].name}打平了` : `推荐你选：${order[0].name}`}</p>

          <div className="cg-weights" aria-label="你的权重">
            {names.map((n, j) => (
              <span key={n} className={CRITERION_CLASS[j]}>
                <i aria-hidden="true" />
                {n} <b>{pct(result.weights[j])}</b>
              </span>
            ))}
          </div>
          <ol className="cg-rank">
            {order.map((r, place) => (
              <li key={r.name} className={place === 0 && !tie ? "is-top" : undefined}>
                <span className="cg-rank-name">{r.name}</span>
                <span className="cg-stack" aria-hidden="true">
                  {r.parts.map((p, j) => (
                    <i key={j} className={CRITERION_CLASS[j]} style={{ width: `${(p / 5) * 100}%` }} />
                  ))}
                </span>
                <b>{r.total.toFixed(2)}</b>
              </li>
            ))}
          </ol>
          <p className="cg-why">{why.text}</p>
          <p>{q3.feedback}</p>
          <p className={`cg-check is-${check.consistency}`}>{check.text}</p>
          <button type="button" className="cg-link cg-reopen" onClick={reopen}>
            ↺ 改改判断，看推荐怎么变
          </button>
          <details className="cg-math">
            <summary>看看是怎么算的</summary>
            <p>① 课程打分规则（三门课同一套）：</p>
            <ul className="cg-rules">
              {q3.ruleText.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
            <p>② 把三句判断填进“判断矩阵”（行比列重要几倍，Saaty 标度 1、3、5）：</p>
            <table>
              <thead>
                <tr>
                  <th />
                  {names.map((n) => (
                    <th key={n}>{n}</th>
                  ))}
                  <th>权重</th>
                </tr>
              </thead>
              <tbody>
                {result.matrix.map((row, i) => (
                  <tr key={names[i]}>
                    <th>{names[i]}</th>
                    {row.map((v, j) => (
                      <td key={j}>{fraction(v)}</td>
                    ))}
                    <td>{pct(result.weights[i])}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p>③ 权重 = 判断矩阵的主特征向量，归一化后三项加起来是 100%（三项时，每行连乘再开三次方得到的结果与它相同）。</p>
            <p>
              ④ 一致性检验：λmax = {result.lambdaMax.toFixed(3)}，CI = (λmax − 3) ÷ 2 = {((result.lambdaMax - 3) / 2).toFixed(3)}，CR = CI ÷ 0.58 = {result.cr.toFixed(2)}，不超过 0.10 算通过。
            </p>
            <p>
              ⑤ 综合分 = Σ 权重 × 该项得分（满分 5）。例如{order[0].name} ={" "}
              {order[0].scores.map((sc, j) => `${result.weights[j].toFixed(2)}×${sc}`).join(" + ")} ≈ {order[0].total.toFixed(2)}（权重显示时四舍五入到两位）。
            </p>
            <p className="cg-math-note">方法说明：{q3.method}</p>
          </details>
          <p className="cg-subq">{q3.usePrompt}</p>
          <Choices
            options={q3.uses}
            selected={use}
            name={q3.usePrompt}
            onPick={(id) => {
              setUse(id);
              onAnswer({ choices, use: id });
            }}
          />
          <button type="button" className="cg-btn cg-btn-primary cg-next" onClick={onNext} disabled={!use}>
            {last ? "看我的结果" : "下一题"}
          </button>
        </div>
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
          确认答案
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
  // 旧存档里的已删除选项（assume）：当作没答过
  const saved = value && q5.options.some((o) => o.id === value) ? value : undefined;
  const [choice, setChoice] = useState(saved);
  const done = Boolean(saved);
  const route = q5.options.find((o) => o.id === choice);
  const range = spread();
  return (
    <>
      <p className="cg-prompt">{q5.prompt}</p>
      <Choices options={q5.options} selected={choice} onPick={(id) => !done && setChoice(id)} disabled={done} name={q5.title} />
      {!done ? (
        <button type="button" className="cg-btn cg-btn-primary cg-next" disabled={!choice} onClick={() => choice && onAnswer(choice)}>
          确认答案
        </button>
      ) : (
        route && (
          <div className="cg-feedback" role="status">
            <p className="cg-feedback-kicker">你的路线：{route.title}</p>
            <ol className="cg-fermi">
              {route.steps.map((s, i) => (
                <li key={s.label}>
                  <span className="cg-fermi-op" aria-hidden="true">
                    {i === 0 ? "" : s.op}
                  </span>
                  <span className="cg-fermi-label">{s.label}</span>
                  <b>{s.show}</b>
                  <em>假设</em>
                </li>
              ))}
            </ol>
            <p className="cg-fermi-result">
              ≈ <b>{estimate(route)}</b> 杯 / 天
            </p>
            <dl className="cg-fermi-notes">
              <dt>好处</dt>
              <dd>{route.strength}</dd>
              <dt>局限</dt>
              <dd>{route.limit}</dd>
              <dt>容易漏掉</dt>
              <dd>{route.miss}</dd>
            </dl>
            <p className="cg-subq">换条路线会怎样？</p>
            <ul className="cg-fermi-others">
              {q5.options
                .filter((o) => o.id !== route.id)
                .map((o) => (
                  <li key={o.id}>
                    <span>{o.title}</span>
                    <b>≈ {estimate(o)} 杯</b>
                  </li>
                ))}
            </ul>
            <p>
              {q5.feedback}四条路线估出来在 {range.min}–{range.max} 杯之间。{q5.compare}
            </p>
            <p className="cg-aside">{q5.note}</p>
            <button type="button" className="cg-btn cg-btn-primary cg-next" onClick={onNext}>
              {last ? "看我的结果" : "下一题"}
            </button>
          </div>
        )
      )}
    </>
  );
}
