import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { learning, useLearning } from "../../state/learning";
import { DEMAND_MAX, SCENARIOS, UMBRELLA, type UmbrellaCase } from "./data";
import { optimum, plan, total, transferProblem, transferRange, type Plan } from "./math";
import { INTRO_LAB_MILESTONE } from "./sectionIds";
import { UmbrellaScene } from "./UmbrellaScene";

const N = total(UMBRELLA);
const RANGE = transferRange(UMBRELLA);
const BEST = optimum(UMBRELLA);
const NOW = plan(UMBRELLA, 0);
/** Equal split: both points get N / 2 umbrellas. */
const EQUAL = plan(UMBRELLA, N / 2 - UMBRELLA.stock.a);

export const LAB_STEPS = ["明确目标", "看清现状", "变量与假设", "动手调配", "如果预测不准", "小结"];

type Goal = "shortage" | "equal" | "moves";
const GOALS: { id: Goal; label: string; fits: boolean; feedback: string }[] = [
  {
    id: "shortage",
    label: "借不到伞的人数：A、B 两点各缺的伞数加起来",
    fits: true,
    feedback: "它直接衡量“借不到伞的情况”：每个点缺的伞数是“需要的 − 现有的”（不够才算，够了就是 0），两点相加，越少越好。",
  },
  {
    id: "equal",
    label: "两个点雨伞数量的差：越接近越好",
    fits: false,
    feedback: `两点各放 ${N / 2} 把时，A 点仍有 ${EQUAL.shortA} 人借不到伞。数量相等不等于需求被满足，这个数没有反映需求。`,
  },
  {
    id: "moves",
    label: "调动的雨伞数量：越少越好",
    fits: false,
    feedback: `不调动最省事，可那样 A 点有 ${NOW.shortA} 人借不到伞。“少调动”是合理的次要考虑：几个方案借不到伞的人数一样时，可以用它来挑，但它代替不了主要目标。`,
  },
];

type Variable = "transfer" | "demand" | "total";
const VARIABLES: { id: Variable; label: string; feedback: string }[] = [
  {
    id: "transfer",
    label: "从 B 点调到 A 点的伞数 x",
    feedback: "对。x 一旦定下，两个点各有多少把伞、各缺多少把，都能算出来。x 为负数时，表示从 A 点往 B 点调。",
  },
  {
    id: "demand",
    label: "下雨时 A 点需要的伞数",
    feedback: "需要多少把，由天气和学生决定，我们只能预测，不能选择。它是模型的输入数据。",
  },
  {
    id: "total",
    label: `雨伞总数 ${N} 把`,
    feedback: "总数今天是固定的，调配不会改变它。它是限制条件（约束）。",
  },
];

const ASSUMPTIONS: [string, string][] = [
  [
    `需求按预测：A 点 ${UMBRELLA.demand.a} 人、B 点 ${UMBRELLA.demand.b} 人来借伞，每人借 1 把。`,
    "预测偏了，最好的调法也会变（第 5 步会试）。",
  ],
  ["调配在下雨前完成，不考虑搬运的人力和时间。", "如果搬运很费事，就要在“少缺伞”和“少搬运”之间权衡。"],
  ["下雨期间不考虑归还：借出的伞不会被还回来再借给别人。", "如果有人很快归还，同一把伞能服务更多人，需要的伞就少了。"],
  ["学生只在自己所在的点借伞，不会跑去另一个点。", "如果有人愿意走过去借，两点的缺口就不能简单相加。"],
];

/** One rain point: umbrellas against demand, with served people and the shortage. */
function Station({ name, place, umbrellas, demand }: { name: string; place: string; umbrellas: number; demand: number }) {
  const scale = Math.max(N, demand, 1);
  const short = Math.max(demand - umbrellas, 0);
  const spare = Math.max(umbrellas - demand, 0);
  return (
    <div className={`intro-station${short ? " is-short" : ""}`}>
      <p className="intro-station-name">
        <b>{name}</b> {place}
      </p>
      <div className="intro-station-bar" aria-hidden="true">
        <i style={{ width: `${(umbrellas / scale) * 100}%` }} />
        <span className="intro-demand" style={{ left: `${(demand / scale) * 100}%` }} />
      </div>
      <p>
        伞 {umbrellas} 把 · 需要 {demand} 人
      </p>
      <p className="intro-station-out">
        借到 {Math.min(umbrellas, demand)} 人 · {short ? <b>缺 {short} 把</b> : spare ? `多出 ${spare} 把` : "刚好够"}
      </p>
    </div>
  );
}

/** “把每一种调法都算一遍”: shortage for every allowed transfer, current x marked. */
function ShortageCurve({ c, x }: { c: UmbrellaCase; x: number }) {
  const o = useMemo(() => optimum(c), [c]);
  const W = 320;
  const H = 170;
  const pad = { l: 34, r: 10, t: 12, b: 34 };
  const maxS = Math.max(...o.curve.map((p) => p.shortage), 1);
  const sx = (v: number) => pad.l + ((v - RANGE.min) / (RANGE.max - RANGE.min)) * (W - pad.l - pad.r);
  const sy = (v: number) => H - pad.b - (v / maxS) * (H - pad.t - pad.b);
  const points = o.curve.map((p) => `${sx(p.x)},${sy(p.shortage)}`).join(" ");
  const current = plan(c, x).shortage;
  const ticks = [RANGE.min, 0, 20, RANGE.max];
  return (
    <figure className="intro-curve">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`横轴是调配数量 x，纵轴是借不到伞的人数。x 从 ${RANGE.min} 到 ${RANGE.max} 一共 ${o.curve.length} 种调法，x = ${o.low === o.high ? o.low : `${o.low} 到 ${o.high}`} 时最少，为 ${o.shortage} 人。当前 x = ${x}，${current} 人。`}>
        <line className="lab-grid" x1={pad.l} y1={H - pad.b} x2={W - pad.r} y2={H - pad.b} />
        <line className="lab-grid" x1={pad.l} y1={pad.t} x2={pad.l} y2={H - pad.b} />
        {ticks.map((t) => (
          <text key={t} x={sx(t)} y={H - pad.b + 14} textAnchor="middle">
            {t}
          </text>
        ))}
        <text x={pad.l - 6} y={sy(maxS) + 4} textAnchor="end">
          {maxS}
        </text>
        <text x={pad.l - 6} y={sy(0) + 4} textAnchor="end">
          0
        </text>
        <text x={(W + pad.l) / 2} y={H - 4} textAnchor="middle">
          x（从 B 调到 A 的伞数）
        </text>
        <rect className="intro-curve-best" x={sx(o.low) - 3} y={sy(o.shortage) - 3} width={sx(o.high) - sx(o.low) + 6} height={6} rx={3} />
        <polyline className="intro-curve-line" points={points} />
        <circle className="intro-curve-now" cx={sx(x)} cy={sy(current)} r={5} />
      </svg>
      <figcaption className="muted-note">
        一共 {o.curve.length} 种调法，全部算了一遍。橙点是你现在的方案；绿色标出借不到伞最少的方案。
      </figcaption>
    </figure>
  );
}

function PlanSummary({ p }: { p: Plan }) {
  return (
    <p className="intro-result" role="status">
      {p.x === 0 ? "不调配" : p.x > 0 ? `从 B 调 ${p.x} 把到 A` : `从 A 调 ${-p.x} 把到 B`}：A 点 {p.a} 把、B 点 {p.b} 把，
      <b>借不到伞的有 {p.shortage} 人</b>
      {p.shortage ? `（A 点缺 ${p.shortA}，B 点缺 ${p.shortB}）` : ""}。
    </p>
  );
}

const moveText = (x: number) => (x === 0 ? "不调配" : x > 0 ? `从 B 调 ${x} 把到 A` : `从 A 调 ${-x} 把到 B`);

/** §7 我的第一次建模: the umbrella case, one small step at a time. Every number is computed here. */
export function UmbrellaLab() {
  const id = useId();
  const { state, persistent } = useLearning();
  const doneBefore = !!state.milestones?.[INTRO_LAB_MILESTONE];
  const [step, setStep] = useState(0);
  const [goal, setGoal] = useState<Goal | null>(null);
  const [goalChecked, setGoalChecked] = useState(false);
  const [nowAnswer, setNowAnswer] = useState("");
  const [nowResult, setNowResult] = useState<"correct" | "incorrect" | "invalid" | null>(null);
  const [nowShown, setNowShown] = useState(false);
  const [variable, setVariable] = useState<Variable | null>(null);
  const [x, setX] = useState(0);
  const [typed, setTyped] = useState("0");
  const [typedProblem, setTypedProblem] = useState<string | null>(null);
  const [curve, setCurve] = useState(false);
  const [chosen, setChosen] = useState<number | null>(null);
  const [demand, setDemand] = useState(UMBRELLA.demand);
  const [seen, setSeen] = useState<string[]>([`${UMBRELLA.demand.a}/${UMBRELLA.demand.b}`]);
  const heading = useRef<HTMLHeadingElement>(null);
  const moved = useRef(false);

  useEffect(() => {
    // Keyboard and screen-reader users land on the new step; not on first render.
    if (moved.current) heading.current?.focus();
    moved.current = true;
  }, [step]);
  useEffect(() => {
    if (step === LAB_STEPS.length - 1) learning.markMilestone(INTRO_LAB_MILESTONE);
  }, [step]);

  const current = plan(UMBRELLA, x);
  const chosenPlan = chosen === null ? null : plan(UMBRELLA, chosen);
  const chosenOptimal = chosenPlan !== null && chosenPlan.shortage === BEST.shortage;
  const scenario: UmbrellaCase = useMemo(() => ({ stock: UMBRELLA.stock, demand }), [demand]);
  const scenarioBest = useMemo(() => optimum(scenario), [scenario]);
  const plannedX = chosen ?? BEST.fewestMoves;
  const oldPlan = plan(scenario, plannedX);
  const newPlan = plan(scenario, scenarioBest.fewestMoves);
  const needed = demand.a + demand.b;

  const ready = [goalChecked, nowResult === "correct" || nowShown, variable !== null, chosenOptimal, seen.length >= 2, true];
  const waiting = [
    "先选一个，再点“确定”。",
    "先算出现状，再点“核对”。",
    "先选出由我们决定的那个量。",
    "找到借不到伞最少的方案，并点“就用这个方案”。",
    "至少换一种需求情况看看。",
    "",
  ];

  function setTransfer(v: number) {
    setX(v);
    setTyped(String(v));
    setTypedProblem(null);
    setChosen(null);
  }
  function applyTyped() {
    const v = typed.trim() === "" ? Number.NaN : Number(typed);
    const problem = transferProblem(UMBRELLA, v);
    setTypedProblem(problem);
    if (!problem) {
      setX(v);
      setChosen(null);
    }
  }
  function checkNow() {
    const t = nowAnswer.trim();
    if (!/^-?\d+$/.test(t)) return setNowResult("invalid");
    setNowResult(Number(t) === NOW.shortage ? "correct" : "incorrect");
  }
  function pickDemand(a: number, b: number) {
    setDemand({ a, b });
    setSeen((prev) => (prev.includes(`${a}/${b}`) ? prev : [...prev, `${a}/${b}`]));
  }
  function restart() {
    setStep(0);
    setGoal(null);
    setGoalChecked(false);
    setNowAnswer("");
    setNowResult(null);
    setNowShown(false);
    setVariable(null);
    setTransfer(0);
    setCurve(false);
    setDemand(UMBRELLA.demand);
    setSeen([`${UMBRELLA.demand.a}/${UMBRELLA.demand.b}`]);
  }

  const nowWrong =
    nowResult === "incorrect"
      ? Number(nowAnswer) === 0
        ? `伞的总数 ${N} 刚好等于需求 ${UMBRELLA.demand.a} + ${UMBRELLA.demand.b}，可是伞放错了地方：不调配的话，B 点多出的伞，A 点的同学借不到。`
        : Number(nowAnswer) === UMBRELLA.demand.a
          ? `好像把 A 点的需求 ${UMBRELLA.demand.a} 当成了缺口。A 点已经有 ${UMBRELLA.stock.a} 把，缺的是 ${UMBRELLA.demand.a} − ${UMBRELLA.stock.a}。`
          : Number(nowAnswer) < 0
            ? "缺口不会是负数：伞比人多的点，缺口是 0，多出来的伞也帮不了另一个点。"
            : "分别算 A、B 两点各缺几把再相加。伞比人多的点，缺口是 0。"
      : null;

  return (
    <section className="lp-lab intro-lab" aria-labelledby={`${id}-title`}>
      <header className="intro-lab-head">
        <div>
          <span className="eyebrow">动手建模 / 共享雨伞</span>
          <h3 id={`${id}-title`}>下雨前，伞该怎么调？</h3>
        </div>
        <button type="button" className="link-button" onClick={restart}>
          ↺ 重新开始
        </button>
      </header>
      {doneBefore && step < LAB_STEPS.length - 1 && <p className="muted-note">你在此浏览器里已经完成过一次，可以再做一遍。</p>}
      <ol className="intro-lab-progress" aria-label="练习进度">
        {LAB_STEPS.map((s, i) => (
          <li key={s} aria-current={i === step ? "step" : undefined} className={i < step ? "is-done" : undefined}>
            <span>{i + 1}</span>
            {s}
          </li>
        ))}
      </ol>

      <div className="intro-lab-step">
        <h4 ref={heading} tabIndex={-1}>
          第 {step + 1} 步 · {LAB_STEPS[step]}
        </h4>

        {step === 0 && (
          <>
            <p>
              学校说：“尽量减少学生借不到伞的情况。”要比较不同的调法，先得把这句话变成一个能计算的数。下面哪个数最能衡量它？
            </p>
            <fieldset className="choices">
              <legend className="sr-only">选择一个衡量指标</legend>
              {GOALS.map((g) => (
                <label key={g.id} className="choice">
                  <input
                    type="radio"
                    name={`${id}-goal`}
                    checked={goal === g.id}
                    onChange={() => {
                      setGoal(g.id);
                      setGoalChecked(false);
                    }}
                  />
                  <span>{g.label}</span>
                </label>
              ))}
            </fieldset>
            <button type="button" className="btn btn-secondary" disabled={!goal} onClick={() => setGoalChecked(true)}>
              确定
            </button>
            {goalChecked && goal && (
              <div className={`feedback ${GOALS.find((g) => g.id === goal)!.fits ? "is-correct" : "is-partial"}`} role="status">
                <strong>{GOALS.find((g) => g.id === goal)!.fits ? "✓ 和学校关心的问题一致" : "◐ 这个数能算，但回答的是别的问题"}</strong>
                <p>{GOALS.find((g) => g.id === goal)!.feedback}</p>
                <p>
                  <b>本题的目标：借不到伞的人数，越少越好。</b>
                </p>
              </div>
            )}
          </>
        )}

        {step === 1 && (
          <>
            <UmbrellaScene x={0} demand={UMBRELLA.demand} />
            <ul className="intro-facts">
              <li>
                雨伞一共 <b>{N}</b> 把
              </li>
              <li>
                A 点（教学楼）：现有 <b>{UMBRELLA.stock.a}</b> 把，预计 <b>{UMBRELLA.demand.a}</b> 人要借
              </li>
              <li>
                B 点（宿舍区）：现有 <b>{UMBRELLA.stock.b}</b> 把，预计 <b>{UMBRELLA.demand.b}</b> 人要借
              </li>
            </ul>
            <label className="numeric-field">
              如果不调配，会有多少人借不到伞？
              <input
                inputMode="numeric"
                autoComplete="off"
                aria-label="不调配时借不到伞的人数"
                value={nowAnswer}
                onChange={(e) => {
                  setNowAnswer(e.target.value);
                  setNowResult(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") checkNow();
                }}
              />
              人
            </label>
            <div className="checkpoint-actions">
              <button type="button" className="btn btn-secondary" onClick={checkNow}>
                核对
              </button>
              {nowResult === "incorrect" && (
                <button type="button" className="link-button" onClick={() => setNowShown(true)}>
                  看算式
                </button>
              )}
            </div>
            {nowResult === "invalid" && (
              <p className="feedback is-invalid" role="status">
                请输入一个整数。
              </p>
            )}
            {nowResult === "incorrect" && (
              <div className="feedback is-incorrect" role="status">
                <strong>✕ 再算算</strong>
                <p>{nowWrong}</p>
              </div>
            )}
            {(nowResult === "correct" || nowShown) && (
              <div className={`feedback ${nowResult === "correct" ? "is-correct" : "is-partial"}`} role="status">
                {nowResult === "correct" && <strong>✓ 对了</strong>}
                <p>
                  A 点缺 {UMBRELLA.demand.a} − {UMBRELLA.stock.a} = {NOW.shortA} 把；B 点伞比人多，缺口是 0（多出的 {UMBRELLA.stock.b - UMBRELLA.demand.b} 把放着没人借）。合计 <b>{NOW.shortage} 人</b>借不到伞。总数够，只是放错了地方，这就是调配要解决的事。
                </p>
              </div>
            )}
          </>
        )}

        {step === 2 && (
          <>
            <p>在这个问题里，哪个量是由我们来决定的？</p>
            <fieldset className="choices">
              <legend className="sr-only">选择决策变量</legend>
              {VARIABLES.map((v) => (
                <label key={v.id} className="choice">
                  <input type="radio" name={`${id}-var`} checked={variable === v.id} onChange={() => setVariable(v.id)} />
                  <span>{v.label}</span>
                </label>
              ))}
            </fieldset>
            {variable && (
              <div className={`feedback ${variable === "transfer" ? "is-correct" : "is-incorrect"}`} role="status">
                <strong>{variable === "transfer" ? "✓ 这就是决策变量" : "✕ 这个量我们决定不了"}</strong>
                <p>{VARIABLES.find((v) => v.id === variable)!.feedback}</p>
                {variable !== "transfer" && <p>本题的决策变量是：从 B 点调到 A 点的伞数 x。</p>}
              </div>
            )}
            <p className="intro-lab-sub">
              <b>写下假设</b>：现实比这复杂得多，下面是本题暂时接受的条件，以及它们不成立时会怎样。
            </p>
            <ul className="intro-assumptions">
              {ASSUMPTIONS.map(([a, risk]) => (
                <li key={a}>
                  <span>{a}</span>
                  <small>不成立时：{risk}</small>
                </li>
              ))}
            </ul>
            <p className="intro-relation">
              A 点有 {UMBRELLA.stock.a} + x 把，B 点有 {UMBRELLA.stock.b} − x 把；
              <br />
              借不到伞的人数 = A 点缺的 + B 点缺的，每个点缺的 = 需要的 − 现有的（不够才算，够了就是 0）。
              <br />x 只能在 {RANGE.min} 到 {RANGE.max} 之间：调走的伞不能比现有的多。
            </p>
          </>
        )}

        {step === 3 && (
          <>
            <p>拖动滑块或输入数字，改变调配数量 x，观察两点的变化。目标：让借不到伞的人尽量少。</p>
            <label className="intro-range">
              <span>
                x = <output>{x}</output>（{moveText(x)}）
              </span>
              <input
                type="range"
                min={RANGE.min}
                max={RANGE.max}
                step={1}
                value={x}
                aria-valuetext={`${moveText(x)}，借不到伞 ${current.shortage} 人`}
                onChange={(e) => setTransfer(Number(e.target.value))}
              />
            </label>
            <div className="intro-exact">
              <button type="button" className="icon-button" aria-label="少调 1 把" disabled={x <= RANGE.min} onClick={() => setTransfer(x - 1)}>
                −
              </button>
              <label>
                <span className="sr-only">输入调配数量 x</span>
                <input
                  inputMode="numeric"
                  autoComplete="off"
                  value={typed}
                  aria-invalid={!!typedProblem}
                  onChange={(e) => setTyped(e.target.value)}
                  onBlur={applyTyped}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") applyTyped();
                  }}
                />
              </label>
              <button type="button" className="icon-button" aria-label="多调 1 把" disabled={x >= RANGE.max} onClick={() => setTransfer(x + 1)}>
                +
              </button>
            </div>
            {typedProblem && (
              <p role="alert" className="inline-alert">
                {typedProblem}方案保持 x = {x}。
              </p>
            )}
            <UmbrellaScene x={x} demand={UMBRELLA.demand} />
            <div className="intro-stations">
              <Station name="A 点" place="教学楼" umbrellas={current.a} demand={UMBRELLA.demand.a} />
              <Station name="B 点" place="宿舍区" umbrellas={current.b} demand={UMBRELLA.demand.b} />
            </div>
            <PlanSummary p={current} />
            <div className="checkpoint-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setChosen(x)}>
                就用这个方案
              </button>
              <button type="button" className="link-button" aria-expanded={curve} onClick={() => setCurve((v) => !v)}>
                {curve ? "收起" : "把每一种调法都算一遍"}
              </button>
            </div>
            {curve && <ShortageCurve c={UMBRELLA} x={x} />}
            {chosenPlan && (
              <div className={`feedback ${chosenOptimal ? "is-correct" : "is-partial"}`} role="status">
                {chosenOptimal ? (
                  <>
                    <strong>✓ 这是最优方案</strong>
                    <p>
                      借不到伞的人数为 {chosenPlan.shortage}，是全部 {RANGE.max - RANGE.min + 1} 种调法里最少的。
                      {BEST.low === BEST.high
                        ? `在本题的假设下，x = ${BEST.low} 是唯一的最优方案：少调一把，A 点就缺一把；多调一把，B 点就缺一把。`
                        : `x 取 ${BEST.low} 到 ${BEST.high} 之间都一样好。`}
                    </p>
                    <p>别忘了这个结论依赖上一步的假设，尤其是“需求按预测”。下一步就来检验它。</p>
                  </>
                ) : (
                  <>
                    <strong>◐ 还能更好</strong>
                    <p>
                      这个方案有 {chosenPlan.shortage} 人借不到伞，而最少可以是 {BEST.shortage} 人。看看是哪个点在缺伞，再往那个方向调。
                    </p>
                    <button type="button" className="link-button" onClick={() => setTransfer(BEST.fewestMoves)}>
                      我卡住了，直接把 x 设成最优值
                    </button>
                  </>
                )}
              </div>
            )}
          </>
        )}

        {step === 4 && (
          <>
            <p>
              需求只是预测。真下起雨来，来借伞的人可能更多，也可能更少。你的方案是 x = {plannedX}（{moveText(plannedX)}），换一种需求情况，它还是最好的吗？
            </p>
            <div className="segmented-buttons" role="group" aria-label="需求情况">
              {SCENARIOS.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  aria-pressed={demand.a === s.demand.a && demand.b === s.demand.b}
                  onClick={() => pickDemand(s.demand.a, s.demand.b)}
                >
                  {s.label}
                </button>
              ))}
            </div>
            <div className="intro-demand-sliders">
              {(["a", "b"] as const).map((k) => (
                <label key={k} className="intro-range">
                  <span>
                    {k === "a" ? "A 点需求" : "B 点需求"} <output>{demand[k]}</output> 人
                  </span>
                  <input
                    type="range"
                    min={0}
                    max={DEMAND_MAX}
                    step={1}
                    value={demand[k]}
                    aria-valuetext={`${demand[k]} 人`}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      pickDemand(k === "a" ? v : demand.a, k === "b" ? v : demand.b);
                    }}
                  />
                </label>
              ))}
            </div>
            <p className="intro-lab-sub">你的方案（{moveText(plannedX)}）遇到这组需求时：</p>
            <UmbrellaScene x={plannedX} demand={demand} />
            <div className="table-scroll">
              <table className="intro-compare">
                <caption>
                  需求 A {demand.a} 人、B {demand.b} 人时（伞仍是 {N} 把）
                </caption>
                <thead>
                  <tr>
                    <th scope="col">方案</th>
                    <th scope="col">调配</th>
                    <th scope="col">A 缺</th>
                    <th scope="col">B 缺</th>
                    <th scope="col">借不到伞</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <th scope="row">你的方案</th>
                    <td>{moveText(plannedX)}</td>
                    <td>{oldPlan.shortA}</td>
                    <td>{oldPlan.shortB}</td>
                    <td>{oldPlan.shortage}</td>
                  </tr>
                  <tr>
                    <th scope="row">新的最优</th>
                    <td>{moveText(scenarioBest.fewestMoves)}</td>
                    <td>{newPlan.shortA}</td>
                    <td>{newPlan.shortB}</td>
                    <td>{newPlan.shortage}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="intro-result" role="status">
              <p>
                {oldPlan.shortage === scenarioBest.shortage
                  ? `你的方案在这种情况下仍然是最优的之一。`
                  : `你的方案会让 ${oldPlan.shortage} 人借不到伞，比最优方案多 ${oldPlan.shortage - scenarioBest.shortage} 人：预测变了，最好的调法也变了。`}
              </p>
              {scenarioBest.low !== scenarioBest.high && (
                <p>
                  最优方案不止一个：x 取 {scenarioBest.low} 到 {scenarioBest.high} 之间的任何整数，借不到伞的都是 {scenarioBest.shortage} 人。
                  这时可以用次要目标来挑，调动最少的是 x = {scenarioBest.fewestMoves}。
                </p>
              )}
              {needed > N && (
                <p>
                  需求一共 {needed} 人，超过了 {N} 把伞，无论怎样调配，至少有 {needed - N} 人借不到。想改善只能增加雨伞或改变规则，这已经超出了“调配”这个模型能回答的范围。
                </p>
              )}
            </div>
          </>
        )}

        {step === 5 && (
          <>
            <p>
              <b>你刚才完成了一次简化的数学建模。</b>回顾一下：
            </p>
            <ul className="intro-recap">
              <li>目标：借不到伞的人数越少越好。</li>
              <li>
                现状：不调配时有 {NOW.shortage} 人借不到伞。
              </li>
              <li>决策变量：从 B 调到 A 的伞数 x；条件：总数 {N} 把，调走的不能比现有的多。</li>
              <li>
                求解：算遍 {RANGE.max - RANGE.min + 1} 种调法，x = {BEST.low} 时没有人借不到伞。
              </li>
              <li>检验：需求一变，原方案就不一定最好；需求超过 {N} 人时，调配本身解决不了问题。</li>
            </ul>
            <p className="muted-note">
              {persistent ? "已在此浏览器的学习记录中标记：雨伞案例完成。" : "此浏览器不允许本地保存，完成状态在关闭页面后不会保留。"}
            </p>
            <div className="checkpoint-actions">
              <Link className="btn btn-primary" to="#intro-review">
                继续：回头看完整流程 →
              </Link>
              <button type="button" className="link-button" onClick={restart}>
                ↺ 再做一遍
              </button>
            </div>
          </>
        )}
      </div>

      <nav className="intro-lab-turn" aria-label="练习步骤">
        <button type="button" className="btn btn-secondary" disabled={step === 0} onClick={() => setStep((s) => s - 1)}>
          ← 上一步
        </button>
        {step < LAB_STEPS.length - 1 && (
          <button type="button" className="btn btn-primary" disabled={!ready[step]} onClick={() => setStep((s) => s + 1)}>
            下一步 →
          </button>
        )}
      </nav>
      {step < LAB_STEPS.length - 1 && !ready[step] && <p className="muted-note intro-waiting">{waiting[step]}</p>}
    </section>
  );
}
