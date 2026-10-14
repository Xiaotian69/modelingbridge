import { useId, useMemo, useState } from "react";
import { FitLine, Frame, Marker, makeScale, type Point } from "./Chart";
import { EVENT_DAY, SALES, TEMPERATURE, WEEKDAY_NAMES, WEEKEND } from "./data";
import { mean, multipleRegression, simpleRegression, sseOf } from "./math";

const PIVOT = mean(TEMPERATURE);
/** The learner's line: y = height + slope · (x − x̄), x̄ of the two weeks. Starts flat at the mean. */
const START = { slope: 0, height: Math.round(mean(SALES)) };
const SCALE = makeScale(22, 37, 160, 310);
const f1 = (x: number) => x.toFixed(1);
const f2 = (x: number) => x.toFixed(2);
const eq = (b0: number, b1: number) => `ŷ = ${b0 < 0 ? "−" : ""}${f2(Math.abs(b0))} ${b1 < 0 ? "−" : "+"} ${f2(Math.abs(b1))}x`;

export function RegressionLab() {
  const id = useId();
  const [slope, setSlope] = useState(START.slope);
  const [height, setHeight] = useState(START.height);
  const [showResiduals, setShowResiduals] = useState(true);
  const [showBest, setShowBest] = useState(false);
  const [event, setEvent] = useState(false);
  const [byWeekend, setByWeekend] = useState(false);

  const data = useMemo(() => {
    const x = event ? [...TEMPERATURE, EVENT_DAY.temperature] : TEMPERATURE;
    const y = event ? [...SALES, EVENT_DAY.sales] : SALES;
    const w = event ? [...WEEKEND, EVENT_DAY.weekend] : WEEKEND;
    const points: Point[] = x.map((t, i) => ({
      x: t,
      y: y[i],
      weekend: !!w[i],
      extra: i >= TEMPERATURE.length,
      label: i >= TEMPERATURE.length ? `校园活动日：${t} ℃，${y[i]} 杯` : `第 ${i + 1} 天（周${WEEKDAY_NAMES[i % 7]}）：${t} ℃，${y[i]} 杯`,
    }));
    return { x, y, w, points, best: simpleRegression(x, y), multi: multipleRegression([x, w], y) };
  }, [event]);
  const base = useMemo(() => simpleRegression(TEMPERATURE, SALES), []);

  const b1 = slope;
  const b0 = height - slope * PIVOT;
  const mine = sseOf(data.x, data.y, b0, b1);
  const best = data.best;
  const extra = mine / best.sse - 1;
  const [m0, m1, m2] = data.multi.coefficients;

  const reset = () => {
    setSlope(START.slope);
    setHeight(START.height);
    setShowBest(false);
    setEvent(false);
    setByWeekend(false);
  };

  return (
    <figure className="lp-lab reg-lab" aria-labelledby={`${id}-title`}>
      <figcaption>
        <span className="eyebrow">动手实验 / 最小二乘</span>
        <h3 id={`${id}-title`}>拖动直线，让残差平方和尽量小</h3>
      </figcaption>

      <div className="reg-lab-controls">
        <label>
          <span>
            斜率 b₁（杯 / ℃）<output>{f2(slope)}</output>
          </span>
          <input
            type="range"
            min={-2}
            max={10}
            step={0.05}
            value={slope}
            aria-valuetext={`斜率 ${f2(slope)} 杯每摄氏度`}
            onChange={(e) => setSlope(Number(e.target.value))}
          />
        </label>
        <label>
          <span>
            直线在 x̄ = {f1(PIVOT)} ℃ 处的高度（杯）<output>{f1(height)}</output>
          </span>
          <input
            type="range"
            min={170}
            max={250}
            step={0.5}
            value={height}
            aria-valuetext={`高度 ${f1(height)} 杯`}
            onChange={(e) => setHeight(Number(e.target.value))}
          />
        </label>
      </div>
      <div className="reg-lab-toggles">
        <label className="lab-check">
          <input type="checkbox" checked={showResiduals} onChange={(e) => setShowResiduals(e.target.checked)} />
          显示残差
        </label>
        <label className="lab-check">
          <input type="checkbox" checked={showBest} onChange={(e) => setShowBest(e.target.checked)} />
          显示最小二乘直线
        </label>
        <label className="lab-check">
          <input type="checkbox" checked={event} onChange={(e) => setEvent(e.target.checked)} />
          加入活动日（{EVENT_DAY.temperature} ℃，{EVENT_DAY.sales} 杯）
        </label>
        <label className="lab-check">
          <input type="checkbox" checked={byWeekend} onChange={(e) => setByWeekend(e.target.checked)} />
          区分周末（多元回归）
        </label>
      </div>

      <Frame
        s={SCALE}
        title="最小二乘实验"
        desc={`你的直线 ${eq(b0, b1)}，残差平方和 ${f1(mine)}；最小二乘直线 ${eq(best.intercept, best.slope)}，残差平方和 ${f1(best.sse)}。`}
        xLabel="最高气温（℃）"
        yLabel="销量（杯）"
        yStep={20}
      >
        {showResiduals &&
          data.points.map((p, i) => (
            <line key={`r${i}`} className="reg-residual" x1={SCALE.sx(p.x)} x2={SCALE.sx(p.x)} y1={SCALE.sy(p.y)} y2={SCALE.sy(b0 + b1 * p.x)} />
          ))}
        {byWeekend && (
          <>
            <FitLine b0={m0} b1={m1} s={SCALE} className="reg-line is-weekday" />
            <FitLine b0={m0 + m2} b1={m1} s={SCALE} className="reg-line is-weekend" />
          </>
        )}
        {showBest && <FitLine b0={best.intercept} b1={best.slope} s={SCALE} className="reg-line is-best" />}
        <FitLine b0={b0} b1={b1} s={SCALE} className="reg-line is-mine" />
        {data.points.map((p, i) => (
          <Marker key={i} p={p} s={SCALE} />
        ))}
      </Frame>
      <p className="chart-legend">
        <span className="reg-legend-mine">— 你的直线</span>
        {showBest && <span className="reg-legend-best">— 最小二乘直线</span>}
        {byWeekend && <span className="reg-legend-weekend-line">— 周末线 / 工作日线</span>}
        <span className="reg-legend-weekend">■ 周末</span>
        {event && <span className="reg-legend-extra">◆ 活动日</span>}
      </p>

      <dl className="reg-stats">
        <div>
          <dt>你的直线</dt>
          <dd>{eq(b0, b1)}</dd>
        </div>
        <div>
          <dt>你的 SSE</dt>
          <dd>{f1(mine)}</dd>
        </div>
        <div className="is-best">
          <dt>最小二乘 SSE</dt>
          <dd>{f1(best.sse)}</dd>
        </div>
        <div>
          <dt>{byWeekend ? "R²（一元 / 多元）" : "R²（最小二乘）"}</dt>
          <dd>{byWeekend ? `${best.r2.toFixed(3)} / ${data.multi.r2.toFixed(3)}` : best.r2.toFixed(3)}</dd>
        </div>
      </dl>

      <div className="lab-result" aria-live="polite">
        <p>
          {extra < 0.005
            ? "你的直线已经和最小二乘直线几乎一样了：再怎么调，SSE 也不会明显变小。"
            : `你的直线的残差平方和比最小二乘多 ${Math.round(extra * 100)}%。${slope === START.slope && height === START.height ? "现在是一条水平线（每天都按平均数预测），试着先调斜率。" : ""}`}
        </p>
        {showBest && (
          <p>
            最小二乘直线 {eq(best.intercept, best.slope)}，经过点 (x̄, ȳ) = ({f1(mean(data.x))}, {f1(mean(data.y))})。
          </p>
        )}
        {event && (
          <p>
            只多了一个活动日，最小二乘斜率就从 {f2(base.slope)} 变成 {f2(best.slope)}，R² 从 {base.r2.toFixed(3)} 变成 {best.r2.toFixed(3)}：平方让远离直线的点有很大的“拉力”。
          </p>
        )}
        {byWeekend && (
          <p>
            多元回归：{eq(m0, m1).replace("x", " × 气温")} + {f2(m2)} × 周末。两条线平行，周末线高出 {f1(m2)} 杯；R² 从 {best.r2.toFixed(3)} 提高到 {data.multi.r2.toFixed(3)}。
          </p>
        )}
      </div>
      <div className="lesson-actions">
        <button type="button" className="lesson-button secondary" onClick={reset}>
          重新开始
        </button>
      </div>
      <details>
        <summary>这些数是怎么算出来的</summary>
        <p>
          你的直线写成 ŷ = 高度 + 斜率 × (x − x̄)，换算成 b₀ = 高度 − 斜率 × x̄。SSE = Σ(实际销量 − 直线上的值)²。最小二乘直线按 b₁ = Sxy / Sxx、b₀ = ȳ − b₁x̄
          计算；多元回归解正规方程 (XᵀX)b = Xᵀy。所有计算都在你的浏览器里完成，并与 SciPy、statsmodels 的结果对照验证过。
        </p>
      </details>
    </figure>
  );
}
