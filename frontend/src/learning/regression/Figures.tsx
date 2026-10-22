import type { RegressionFigure as View } from "./content";
import { both, simple } from "./content";
import { FitLine, Frame, Marker, makeScale, type Point } from "./Chart";
import { SALES, TEMPERATURE, WEEKDAY_NAMES, WEEKEND } from "./data";

const f1 = (x: number) => x.toFixed(1);
const points: Point[] = TEMPERATURE.map((t, i) => ({
  x: t,
  y: SALES[i],
  weekend: !!WEEKEND[i],
  label: `第 ${i + 1} 天（周${WEEKDAY_NAMES[i % 7]}）：${t} ℃，${SALES[i]} 杯`,
}));
const SALES_SCALE = makeScale(22, 37, 160, 260);
const residualMax = Math.ceil(Math.max(...simple.residuals.map(Math.abs)) / 10) * 10;
const RESIDUAL_SCALE = makeScale(22, 37, -residualMax, residualMax);

function Legend({ lines }: { lines: [string, string][] }) {
  return (
    <p className="chart-legend">
      <span className="reg-legend-weekday">● 工作日</span>
      <span className="reg-legend-weekend">■ 周末</span>
      {lines.map(([cls, text]) => (
        <span key={text} className={cls}>
          {text}
        </span>
      ))}
    </p>
  );
}

/** Static figures of the lesson (§2 scatter, §5 residuals, §6 two parallel lines). */
export function RegressionFigure({ view }: { view: View }) {
  if (view === "residuals")
    return (
      <figure className="lp-lab reg-figure">
        <figcaption>
          <span className="eyebrow">图 · 残差图（一元回归）</span>
        </figcaption>
        <Frame
          s={RESIDUAL_SCALE}
          title="一元回归的残差图"
          desc={`横轴为最高气温，纵轴为残差（实际销量减去直线的估计）。四个周末的残差分别为 ${simple.residuals
            .filter((_, i) => WEEKEND[i])
            .map(f1)
            .join("、")} 杯，全部为正。`}
          xLabel="最高气温（℃）"
          yLabel="残差 e（杯）"
          yStep={10}
        >
          {simple.residuals.map((e, i) => (
            <line key={`s${i}`} className="reg-residual" x1={RESIDUAL_SCALE.sx(TEMPERATURE[i])} x2={RESIDUAL_SCALE.sx(TEMPERATURE[i])} y1={RESIDUAL_SCALE.sy(0)} y2={RESIDUAL_SCALE.sy(e)} />
          ))}
          {points.map((p, i) => (
            <Marker key={i} p={{ ...p, y: simple.residuals[i] }} s={RESIDUAL_SCALE} />
          ))}
        </Frame>
        <Legend lines={[["reg-legend-zero", "— 残差为 0"]]} />
      </figure>
    );
  const [b0, b1, b2] = both.coefficients;
  return (
    <figure className="lp-lab reg-figure">
      <figcaption>
        <span className="eyebrow">{view === "scatter" ? "图 · 散点图" : "图 · 多元回归：两条平行线"}</span>
      </figcaption>
      <Frame
        s={SALES_SCALE}
        title={view === "scatter" ? "气温与销量的散点图" : "多元回归给出的周末线与工作日线"}
        desc={
          view === "scatter"
            ? `14 天的最高气温与销量，相关系数 r = ${simple.r.toFixed(3)}。四个周末大多位于其他点上方。`
            : `工作日线：销量 = ${b0.toFixed(2).replace(/^-/, "−")} + ${b1.toFixed(2)} × 气温；周末线比它整体高 ${b2.toFixed(2)} 杯。虚线是只用气温的一元回归直线，斜率 ${simple.slope.toFixed(2)}，更平。`
        }
        xLabel="最高气温（℃）"
        yLabel="销量（杯）"
        yStep={20}
      >
        {view === "two-lines" && (
          <>
            <FitLine b0={simple.intercept} b1={simple.slope} s={SALES_SCALE} className="reg-line is-simple" />
            <FitLine b0={b0} b1={b1} s={SALES_SCALE} className="reg-line is-weekday" />
            <FitLine b0={b0 + b2} b1={b1} s={SALES_SCALE} className="reg-line is-weekend" />
          </>
        )}
        {points.map((p, i) => (
          <Marker key={i} p={p} s={SALES_SCALE} />
        ))}
      </Frame>
      <Legend
        lines={
          view === "two-lines"
            ? [
                ["reg-legend-weekday-line", "— 工作日线"],
                ["reg-legend-weekend-line", "— 周末线"],
                ["reg-legend-simple", "- - 一元回归（只用气温）"],
              ]
            : []
        }
      />
    </figure>
  );
}
