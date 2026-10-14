import { useId, useMemo, useState } from "react";
import { analyse, fromUpperTriangle } from "../ahp/math";
import { AHP_UPPER, CRITERIA, DATA, DIRECTIONS, EXTRA_ROOM, EXTRA_ROW, ROOMS } from "./data";
import { entropyWeights, normaliseWeights, topsis, type Direction, type TopsisResult } from "./math";

type Mode = "ahp" | "equal" | "entropy" | "custom";
const MODES: { id: Mode; label: string }[] = [
  { id: "ahp", label: "小林的 AHP 权重" },
  { id: "equal", label: "等权重" },
  { id: "entropy", label: "熵权法" },
  { id: "custom", label: "自己设定" },
];
const AHP_WEIGHTS = analyse(fromUpperTriangle(4, AHP_UPPER)).weights;
/** Slider start: the AHP weights on a 0–10 scale. */
const CUSTOM_START = AHP_WEIGHTS.map((w) => Math.round(w * 20));
const f3 = (x: number) => x.toFixed(3);
const names = [...ROOMS.map((r) => r.name), EXTRA_ROOM.name];
const chain = (order: number[]) => order.map((i) => names[i]).join(" > ");
/** The lesson's result (AHP weights, five rooms, course directions) for comparison. */
const COURSE = topsis(DATA, AHP_WEIGHTS, DIRECTIONS);

function weightsFor(mode: Mode, data: number[][], directions: Direction[], custom: number[]): number[] | null {
  if (mode === "ahp") return AHP_WEIGHTS;
  if (mode === "equal") return [0.25, 0.25, 0.25, 0.25];
  if (mode === "entropy") return entropyWeights(data, directions).weights;
  return custom.some((v) => v > 0) ? normaliseWeights(custom) : null;
}

/** Order of the five original rooms inside a result that may include 己. */
const originalOrder = (r: TopsisResult) => r.order.filter((i) => i < ROOMS.length);

export function TopsisLab() {
  const id = useId();
  const [mode, setMode] = useState<Mode>("ahp");
  const [custom, setCustom] = useState<number[]>(CUSTOM_START);
  const [directions, setDirections] = useState<Direction[]>(DIRECTIONS);
  const [extra, setExtra] = useState(false);

  const data = useMemo(() => (extra ? [...DATA, EXTRA_ROW] : DATA), [extra]);
  const weights = useMemo(() => weightsFor(mode, data, directions, custom), [mode, data, directions, custom]);
  const res = useMemo(() => (weights ? topsis(data, weights, directions) : null), [data, weights, directions]);
  /** Same settings without 己, to tell whether adding it reordered the original five. */
  const without = useMemo(() => {
    if (!extra) return null;
    const w = weightsFor(mode, DATA, directions, custom);
    return w ? topsis(DATA, w, directions) : null;
  }, [extra, mode, directions, custom]);

  const flipped = CRITERIA.filter((_, j) => directions[j] !== DIRECTIONS[j]);
  const reset = () => {
    setMode("ahp");
    setCustom(CUSTOM_START);
    setDirections(DIRECTIONS);
    setExtra(false);
  };

  const summary: string[] = [];
  if (res) {
    const top = res.order[0];
    const c = res.closeness;
    const tie = c[res.order[1]] !== null && Math.abs((c[top] ?? 0) - (c[res.order[1]] ?? 0)) < 0.005;
    summary.push(
      tie
        ? `${names[top]}和${names[res.order[1]]}的贴近度几乎相同（${f3(c[top] ?? 0)}、${f3(c[res.order[1]] ?? 0)}），这组设置下两者难分高下。`
        : `当前设置下，${names[top]}的贴近度最高（C = ${f3(c[top] ?? 0)}），排名 ${chain(res.order)}。`,
    );
    const same = !extra && res.order.join() === COURSE.order.join();
    if (same) summary.push("与课程中的结果相同。");
    else if (!extra && res.order[0] !== COURSE.order[0])
      summary.push(`第一名变了：课程中（小林的 AHP 权重）是${names[COURSE.order[0]]}，现在是${names[top]}。`);
    else if (!extra) summary.push(`第一名仍是${names[top]}，但后面的顺序与课程不同（课程：${chain(COURSE.order)}）。`);
    if (extra && without) {
      const before = originalOrder(without);
      const after = originalOrder(res);
      const place = res.order.indexOf(ROOMS.length) + 1;
      summary.push(
        before.join() === after.join()
          ? `新房源${EXTRA_ROOM.name}排第 ${place}，原来五套房之间的顺序没有变。`
          : `新房源${EXTRA_ROOM.name}排第 ${place}，可原来五套房之间的顺序变了：加入前 ${chain(before)}，加入后 ${chain(after)}。这就是逆序现象。`,
      );
      if (mode === "entropy") summary.push("注意：熵权由数据算出，加入新房源后权重本身也变了。");
    }
    if (flipped.length)
      summary.push(
        `你把${flipped.map((c) => c.name).join("、")}的方向改得与课程不同。方向写反时，结果往往一眼就不合常理，请对照表 2 检查。`,
      );
  }

  return (
    <figure className="lp-lab topsis-lab" aria-labelledby={`${id}-title`}>
      <figcaption>
        <span className="eyebrow">动手实验 / TOPSIS</span>
        <h3 id={`${id}-title`}>换权重、改方向、加房源，看排名怎样变化</h3>
      </figcaption>

      <fieldset className="topsis-group">
        <legend>权重</legend>
        <div className="segmented-buttons" role="group" aria-label="权重来源">
          {MODES.map((m) => (
            <button key={m.id} type="button" aria-pressed={mode === m.id} onClick={() => setMode(m.id)}>
              {m.label}
            </button>
          ))}
        </div>
        {mode === "custom" && (
          <div className="topsis-sliders">
            {CRITERIA.map((c, j) => (
              <label key={c.id}>
                <span>
                  {c.name}
                  <output>{custom[j]}</output>
                </span>
                <input
                  type="range"
                  min={0}
                  max={10}
                  step={1}
                  value={custom[j]}
                  aria-valuetext={`${c.name}重要程度 ${custom[j]}`}
                  onChange={(e) => setCustom((prev) => prev.map((v, k) => (k === j ? Number(e.target.value) : v)))}
                />
              </label>
            ))}
            <p className="muted-note">滑块是相对重要程度（0–10），程序会把它们除以总和，变成和为 1 的权重。</p>
          </div>
        )}
        {weights ? (
          <ul className="topsis-bars" aria-label="当前权重">
            {CRITERIA.map((c, j) => (
              <li key={c.id}>
                <span className="topsis-bar-label">{c.name}</span>
                <span className="topsis-bar" aria-hidden="true">
                  <i style={{ width: `${weights[j] * 100}%` }} />
                </span>
                <b>{f3(weights[j])}</b>
              </li>
            ))}
          </ul>
        ) : (
          <p role="alert" className="inline-alert">
            至少给一个指标大于 0 的重要程度，才能计算权重。
          </p>
        )}
      </fieldset>

      <fieldset className="topsis-group">
        <legend>指标方向</legend>
        <div className="topsis-directions">
          {CRITERIA.map((c, j) => (
            <div key={c.id} className={directions[j] !== DIRECTIONS[j] ? "is-changed" : undefined}>
              <span>{c.name}</span>
              <div className="segmented-buttons" role="group" aria-label={`${c.name}的方向`}>
                {(["benefit", "cost"] as const).map((d) => (
                  <button
                    key={d}
                    type="button"
                    aria-pressed={directions[j] === d}
                    onClick={() => setDirections((prev) => prev.map((v, k) => (k === j ? d : v)))}
                  >
                    {d === "benefit" ? "越大越好" : "越小越好"}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </fieldset>

      <label className="lab-check topsis-extra">
        <input type="checkbox" checked={extra} onChange={(e) => setExtra(e.target.checked)} />
        加入新房源{EXTRA_ROOM.name}（{EXTRA_ROW[0]} 元、{EXTRA_ROW[1]} 分钟、{EXTRA_ROW[2]} m²、{EXTRA_ROW[3]} 处配套）
      </label>

      {res && (
        <>
          <div className="topsis-ranking">
            <p className="kicker">排名（按贴近度 C）</p>
            <ol>
              {res.order.map((i, place) => (
                <li key={names[i]} className={i === ROOMS.length ? "is-extra" : undefined}>
                  <span className="topsis-bar-label">
                    {place + 1}. {names[i]}
                  </span>
                  <span className="topsis-bar is-score" aria-hidden="true">
                    <i style={{ width: `${(res.closeness[i] ?? 0) * 100}%` }} />
                  </span>
                  <b>{res.closeness[i] === null ? "—" : f3(res.closeness[i]!)}</b>
                </li>
              ))}
            </ol>
          </div>
          <div className="lab-result" aria-live="polite">
            {summary.map((s) => (
              <p key={s}>{s}</p>
            ))}
          </div>
          <details>
            <summary>查看加权矩阵、理想解与距离</summary>
            <div className="table-scroll">
              <table className="topsis-table">
                <caption>加权标准化矩阵 V（绿色 = 该列最好，橙色 = 该列最差）</caption>
                <thead>
                  <tr>
                    <th scope="col">房源</th>
                    {CRITERIA.map((c) => (
                      <th scope="col" key={c.id}>
                        {c.name}
                      </th>
                    ))}
                    <th scope="col">D⁺</th>
                    <th scope="col">D⁻</th>
                    <th scope="col">C</th>
                  </tr>
                </thead>
                <tbody>
                  {res.weighted.map((row, i) => (
                    <tr key={names[i]}>
                      <th scope="row">{names[i]}</th>
                      {row.map((v, j) => (
                        <td
                          key={j}
                          className={v === res.best[j] ? "is-best" : v === res.worst[j] ? "is-worst" : undefined}
                        >
                          {v.toFixed(4)}
                          {v === res.best[j] ? <span className="sr-only">（该列最好）</span> : v === res.worst[j] ? <span className="sr-only">（该列最差）</span> : null}
                        </td>
                      ))}
                      <td>{res.dPlus[i].toFixed(4)}</td>
                      <td>{res.dMinus[i].toFixed(4)}</td>
                      <td>{res.closeness[i] === null ? "—" : res.closeness[i]!.toFixed(4)}</td>
                    </tr>
                  ))}
                  <tr className="is-ideal">
                    <th scope="row">A⁺</th>
                    {res.best.map((v, j) => (
                      <td key={j}>{v.toFixed(4)}</td>
                    ))}
                    <td colSpan={3} />
                  </tr>
                  <tr className="is-ideal">
                    <th scope="row">A⁻</th>
                    {res.worst.map((v, j) => (
                      <td key={j}>{v.toFixed(4)}</td>
                    ))}
                    <td colSpan={3} />
                  </tr>
                </tbody>
              </table>
            </div>
          </details>
        </>
      )}

      <div className="lesson-actions">
        <button type="button" className="lesson-button secondary" onClick={reset}>
          恢复课程设置
        </button>
      </div>
      <details>
        <summary>这些数是怎么算出来的</summary>
        <p>
          每一列先做向量标准化（除以该列平方和的平方根），乘以权重；效益型取最大值、成本型取最小值组成理想房，反之组成最差房；D⁺、D⁻
          为欧氏距离，C = D⁻ / (D⁺ + D⁻)。熵权按当前的方向和房源重新计算。所有计算都在你的浏览器里完成，并与 NumPy / SciPy
          的独立实现对照验证过。
        </p>
      </details>
    </figure>
  );
}
