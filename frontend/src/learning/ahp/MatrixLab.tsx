import { useId, useMemo, useState } from "react";
import { ALTERNATIVES, CRITERIA, CRITERIA4_UPPER, CRITERIA_UPPER, EXTRA_CRITERION, LOCAL_UPPER } from "./data";
import {
  SCALE_WORDS,
  analyse,
  formatJudgment,
  fromUpperTriangle,
  mostInconsistentPair,
  nearestScaleValue,
  positionToValue,
  synthesise,
  valueToPosition,
} from "./math";

type Size = 3 | 4;
const criteriaFor = (n: Size) => (n === 3 ? CRITERIA : [...CRITERIA, EXTRA_CRITERION]);
const pairsFor = (n: number) => {
  const out: [number, number][] = [];
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) out.push([i, j]);
  return out;
};
/** Presets as upper triangles. Consistent sets satisfy a_ik = a_ij · a_jk exactly. */
const PRESETS: Record<Size, Record<"course" | "consistent" | "circular", number[]>> = {
  3: { course: CRITERIA_UPPER, consistent: [1 / 3, 2, 6], circular: [3, 1 / 3, 3] },
  4: { course: CRITERIA4_UPPER, consistent: [1 / 3, 2, 1, 6, 3, 1 / 2], circular: [3, 1 / 3, 1, 3, 1 / 3, 3] },
};
const toPositions = (upper: number[]) => upper.map(valueToPosition);
/** Local weights of the alternatives never change in the lab (the lesson's judgments). */
const LOCAL = Object.fromEntries(
  Object.entries(LOCAL_UPPER).map(([id, upper]) => [id, analyse(fromUpperTriangle(3, upper)).weights]),
);
const f3 = (x: number) => x.toFixed(3);

/**
 * Slider: the further toward a side, the more important that side's criterion.
 * Internal value s ∈ [−8, 8]; s < 0 favours the left (row) criterion: a_ij = 1 − s.
 */
const sliderToPosition = (s: number) => -s;
const positionToSlider = (p: number) => -p;

function describe(left: string, right: string, position: number) {
  if (position === 0) return `${left}与${right}同样重要（1）`;
  const value = Math.abs(position) + 1;
  return position > 0
    ? `${left}比${right}${SCALE_WORDS[value]}（${value}）`
    : `${right}比${left}${SCALE_WORDS[value]}（${value}）`;
}

/**
 * 3 个准则时，三对判断与权重的偏离程度在数学上完全相同（|ln a12 − ln a13 + ln a23| / 3），
 * 说不出“最矛盾的是哪一对”。这里改为指出三个判断首尾对不上：a13 应约等于 a12 × a23。
 */
function CycleNote({ names, matrix }: { names: string[]; matrix: number[][] }) {
  const chained = matrix[0][1] * matrix[1][2];
  const offScale = chained > 9 || chained < 1 / 9;
  return (
    <p>
      三个判断首尾对不上：「{names[0]}与{names[1]}」填的是 {formatJudgment(matrix[0][1])}，「{names[1]}与{names[2]}」填的是{" "}
      {formatJudgment(matrix[1][2])}，两者相乘，「{names[0]}与{names[2]}」应约为 {formatJudgment(chained)}
      {offScale ? "（已超出 1–9 标度）" : `（最接近的标度是 ${formatJudgment(nearestScaleValue(chained))}）`}，你填的却是{" "}
      {formatJudgment(matrix[0][2])}。3 个准则时，三对判断偏离的程度相同，说不出是哪一对错了：先回想哪个判断最没把握，再修改它。
    </p>
  );
}

export function MatrixLab() {
  const id = useId();
  const [size, setSize] = useState<Size>(3);
  const [positions, setPositions] = useState<number[]>(() => toPositions(CRITERIA_UPPER));
  const criteria = useMemo(() => criteriaFor(size), [size]);
  const names = criteria.map((c) => c.name);
  const pairs = pairsFor(size);

  const result = useMemo(() => {
    const matrix = fromUpperTriangle(size, positions.map(positionToValue));
    const analysis = analyse(matrix);
    const pair = mostInconsistentPair(matrix, analysis.weights);
    const scores = synthesise(
      analysis.weights,
      criteria.map((c) => LOCAL[c.id]),
    );
    return { matrix, analysis, pair, scores };
  }, [size, positions, criteria]);
  const { matrix, analysis, pair, scores } = result;
  const course = useMemo(
    () =>
      synthesise(
        analyse(fromUpperTriangle(size, PRESETS[size].course)).weights,
        criteria.map((c) => LOCAL[c.id]),
      ),
    [size, criteria],
  );

  const rank = (v: number[]) => [...v.keys()].sort((a, b) => v[b] - v[a]);
  const order = rank(scores);
  const courseOrder = rank(course);
  const byWeight = rank(analysis.weights);
  const top = byWeight[0];
  const runnerUp = byWeight[1];
  const cr = analysis.cr ?? 0;
  const ok = analysis.acceptable;
  const changedWinner = order[0] !== courseOrder[0];

  function load(kind: "course" | "consistent" | "circular", n: Size = size) {
    setSize(n);
    setPositions(toPositions(PRESETS[n][kind]));
  }
  const setOne = (k: number, s: number) =>
    setPositions((prev) => prev.map((p, i) => (i === k ? sliderToPosition(s) : p)));
  const pairIndex = pairs.findIndex(([i, j]) => i === pair.i && j === pair.j);

  return (
    <figure className="lp-lab ahp-lab" aria-labelledby={`${id}-title`}>
      <figcaption>
        <span className="eyebrow">动手实验 / 判断矩阵</span>
        <h3 id={`${id}-title`}>改变判断，看权重和一致性如何变化</h3>
      </figcaption>

      <div className="ahp-lab-toolbar">
        <div className="segmented-buttons" role="group" aria-label="准则个数">
          <button type="button" aria-pressed={size === 3} onClick={() => load("course", 3)}>
            3 个准则
          </button>
          <button type="button" aria-pressed={size === 4} onClick={() => load("course", 4)}>
            4 个准则（加入{EXTRA_CRITERION.name}）
          </button>
        </div>
        <div className="lesson-actions">
          <button type="button" className="lesson-button secondary" onClick={() => load("course")}>
            小林的判断
          </button>
          <button type="button" className="lesson-button secondary" onClick={() => load("consistent")}>
            完全一致的判断
          </button>
          <button type="button" className="lesson-button secondary" onClick={() => load("circular")}>
            前后矛盾的判断
          </button>
        </div>
      </div>

      <fieldset className="ahp-pairs">
        <legend>两两比较：滑块越靠近哪一边，那一边越重要</legend>
        {pairs.map(([i, j], k) => {
          const position = positions[k];
          const text = describe(names[i], names[j], position);
          const flagged = !ok && k === pairIndex;
          return (
            <div key={`${i}-${j}`} className={`ahp-pair${flagged ? " is-flagged" : ""}`}>
              <label htmlFor={`${id}-pair-${k}`} className="ahp-pair-names">
                <span>{names[i]}</span>
                <span className="sr-only"> 与 </span>
                <span>{names[j]}</span>
              </label>
              <input
                id={`${id}-pair-${k}`}
                type="range"
                min={-8}
                max={8}
                step={1}
                value={positionToSlider(position)}
                aria-valuetext={text}
                onChange={(e) => setOne(k, Number(e.target.value))}
              />
              <output htmlFor={`${id}-pair-${k}`}>
                a<sub>{i + 1}{j + 1}</sub> = {formatJudgment(positionToValue(position))} · {text}
              </output>
            </div>
          );
        })}
      </fieldset>

      <div className="ahp-lab-grid">
        <div className="table-scroll">
          <table className="ahp-matrix">
            <caption>判断矩阵 A（自动填入倒数）</caption>
            <thead>
              <tr>
                <th scope="col">
                  <span className="sr-only">行比列</span>
                </th>
                {names.map((n) => (
                  <th scope="col" key={n}>
                    {n}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {matrix.map((row, i) => (
                <tr key={names[i]}>
                  <th scope="row">{names[i]}</th>
                  {row.map((v, j) => {
                    const hot = !ok && ((i === pair.i && j === pair.j) || (i === pair.j && j === pair.i));
                    return (
                      <td key={j} className={i === j ? "is-diagonal" : hot ? "is-flagged" : undefined}>
                        {formatJudgment(v)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="ahp-weights">
          <p className="kicker">权重（特征向量法）</p>
          <ul>
            {names.map((n, i) => (
              <li key={n}>
                <span className="ahp-bar-label">{n}</span>
                <span className="ahp-bar" aria-hidden="true">
                  <i style={{ width: `${analysis.weights[i] * 100}%` }} />
                </span>
                <b>{f3(analysis.weights[i])}</b>
                <small>方根法 {f3(analysis.geometric[i])}</small>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <dl className="ahp-stats">
        <div>
          <dt>λmax</dt>
          <dd>{analysis.lambdaMax.toFixed(4)}</dd>
        </div>
        <div>
          <dt>CI = (λmax − {size}) / {size - 1}</dt>
          <dd>{analysis.ci.toFixed(4)}</dd>
        </div>
        <div>
          <dt>RI({size})</dt>
          <dd>{analysis.ri.toFixed(2)}</dd>
        </div>
        <div className={ok ? "is-ok" : "is-bad"}>
          <dt>CR = CI / RI</dt>
          <dd>
            {cr.toFixed(4)} {ok ? "< 0.1 ✓" : "≥ 0.1 ✕"}
          </dd>
        </div>
      </dl>

      <div className="lab-result" aria-live="polite">
        <strong>{ok ? "一致性可以接受" : "判断前后矛盾，需要修改"}</strong>
        {analysis.weights[top] / analysis.weights[runnerUp] < 1.05 ? (
          <p>当前判断下，{names[top]}和{names[runnerUp]}的权重几乎相同（{f3(analysis.weights[top])}），判断没有分出主次。</p>
        ) : (
          <p>
            当前判断下，{names[top]}的权重最大（{f3(analysis.weights[top])}），约是{names[runnerUp]}的{" "}
            {(analysis.weights[top] / analysis.weights[runnerUp]).toFixed(1)} 倍。
          </p>
        )}
        {ok ? (
          <p>
            CR = {cr.toFixed(3)}，小于 0.1：判断中的小偏差可以接受，这组权重可以用于下一步合成。
          </p>
        ) : size === 3 ? (
          <CycleNote names={names} matrix={matrix} />
        ) : (
          <p>
            最矛盾的是「{names[pair.i]}与{names[pair.j]}」：你填的是 {formatJudgment(pair.given)}，按其余判断推算应约为{" "}
            {pair.implied.toFixed(2)}（最接近的标度是 {formatJudgment(nearestScaleValue(pair.implied))}）。先重新思考这一对，而不是随意改动其他判断。
          </p>
        )}
      </div>

      <div className="ahp-ranking">
        <p className="kicker">实习推荐（方案层判断保持课程中的数值）</p>
        <ol>
          {order.map((m, place) => (
            <li key={ALTERNATIVES[m].id}>
              <span className="ahp-bar-label">
                {place + 1}. {ALTERNATIVES[m].short}
              </span>
              <span className="ahp-bar is-score" aria-hidden="true">
                <i style={{ width: `${(scores[m] / scores[order[0]]) * 100}%` }} />
              </span>
              <b>{f3(scores[m])}</b>
            </li>
          ))}
        </ol>
        <p className="muted-note">
          {changedWinner
            ? `推荐变了：在小林原来的判断下第一名是 ${ALTERNATIVES[courseOrder[0]].short}，现在是 ${ALTERNATIVES[order[0]].short}。`
            : `推荐与小林原来的判断相同：${ALTERNATIVES[order[0]].short} 第一。`}
          {!ok && " 注意：CR ≥ 0.1 时这个排序建立在相互矛盾的判断上，不应作为结论。"}
        </p>
      </div>

      <details>
        <summary>这些数是怎么算出来的</summary>
        <p>
          权重用幂迭代求最大特征值对应的特征向量（迭代至相邻两次差小于 10⁻¹²），λmax 取 (A·w)ᵢ / wᵢ 的平均；方根法为每行连乘开{" "}
          {size} 次方后归一化。总得分 = Σ 准则权重 × 方案在该准则下的局部权重。所有计算都在你的浏览器里完成，并与 NumPy 的结果对照验证过。
        </p>
      </details>
    </figure>
  );
}
