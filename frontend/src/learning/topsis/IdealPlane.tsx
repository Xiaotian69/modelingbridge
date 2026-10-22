import { useId, useState } from "react";
import { result } from "./content";
import { CRITERIA, ROOMS } from "./data";

/**
 * 正、负理想解的平面示意：only 月租 (cost, column 0) and 面积 (benefit, column 2) of the lesson's
 * weighted matrix, so the picture is exactly table 5 / table 6 restricted to two criteria.
 */
const X_COL = 2;
const Y_COL = 0;
const W = 520;
const H = 340;
const PAD = { left: 86, right: 24, top: 20, bottom: 54 };
const f3 = (x: number) => x.toFixed(3);

const xs = [...result.weighted.map((r) => r[X_COL]), result.best[X_COL], result.worst[X_COL]];
const ys = [...result.weighted.map((r) => r[Y_COL]), result.best[Y_COL], result.worst[Y_COL]];
const span = (v: number[]) => {
  const lo = Math.min(...v);
  const hi = Math.max(...v);
  const pad = (hi - lo) * 0.12;
  return [lo - pad, hi + pad] as const;
};
const [x0, x1] = span(xs);
const [y0, y1] = span(ys);
const sx = (x: number) => PAD.left + ((x - x0) / (x1 - x0)) * (W - PAD.left - PAD.right);
const sy = (y: number) => H - PAD.bottom - ((y - y0) / (y1 - y0)) * (H - PAD.top - PAD.bottom);
const ticks = (lo: number, hi: number) => Array.from({ length: 4 }, (_, k) => lo + ((k + 0.5) * (hi - lo)) / 4);
const dist2d = (i: number, target: number[]) =>
  Math.hypot(result.weighted[i][X_COL] - target[X_COL], result.weighted[i][Y_COL] - target[Y_COL]);

export function IdealPlane() {
  const id = useId();
  const [selected, setSelected] = useState(3);
  const room = result.weighted[selected];
  const best = { x: sx(result.best[X_COL]), y: sy(result.best[Y_COL]) };
  const worst = { x: sx(result.worst[X_COL]), y: sy(result.worst[Y_COL]) };
  const here = { x: sx(room[X_COL]), y: sy(room[Y_COL]) };
  const name = ROOMS[selected].name;
  return (
    <figure className="lp-lab topsis-plane" aria-labelledby={`${id}-title`}>
      <figcaption>
        <span className="eyebrow">图示 / 只看两个指标</span>
        <h3 id={`${id}-title`}>理想房、最差房与五套真实的房子</h3>
      </figcaption>
      <div className="segmented-buttons" role="group" aria-label="选择一套房">
        {ROOMS.map((r, i) => (
          <button key={r.id} type="button" aria-pressed={i === selected} onClick={() => setSelected(i)}>
            {r.name}
          </button>
        ))}
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-labelledby={`${id}-svg-title ${id}-svg-desc`}>
        <title id={`${id}-svg-title`}>加权后的月租与面积平面</title>
        <desc id={`${id}-svg-desc`}>
          横轴为加权标准化面积，越往右越好；纵轴为加权标准化月租，越往下越便宜。理想房位于右下角，最差房位于左上角。当前选中{name}
          ，它到理想房的距离约 {f3(dist2d(selected, result.best))}，到最差房的距离约 {f3(dist2d(selected, result.worst))}。
        </desc>
        {ticks(x0, x1).map((t) => (
          <g key={`x${t}`}>
            <line className="lab-grid" x1={sx(t)} x2={sx(t)} y1={PAD.top} y2={H - PAD.bottom} />
            <text x={sx(t)} y={H - PAD.bottom + 16} textAnchor="middle">
              {t.toFixed(3)}
            </text>
          </g>
        ))}
        {ticks(y0, y1).map((t) => (
          <g key={`y${t}`}>
            <line className="lab-grid" x1={PAD.left} x2={W - PAD.right} y1={sy(t)} y2={sy(t)} />
            <text x={PAD.left - 6} y={sy(t) + 4} textAnchor="end">
              {t.toFixed(3)}
            </text>
          </g>
        ))}
        <text className="lab-axis-label" x={(PAD.left + W - PAD.right) / 2} y={H - 10} textAnchor="middle">
          加权{CRITERIA[X_COL].name} → 越大越好
        </text>
        <text
          className="lab-axis-label"
          transform={`translate(18 ${(PAD.top + H - PAD.bottom) / 2}) rotate(-90)`}
          textAnchor="middle"
        >
          加权{CRITERIA[Y_COL].name} ↑ 越贵
        </text>
        <line className="topsis-dist is-best" x1={here.x} y1={here.y} x2={best.x} y2={best.y} />
        <line className="topsis-dist is-worst" x1={here.x} y1={here.y} x2={worst.x} y2={worst.y} />
        {result.weighted.map((r, i) => (
          <g key={ROOMS[i].id} className={`topsis-room${i === selected ? " is-selected" : ""}`}>
            <circle cx={sx(r[X_COL])} cy={sy(r[Y_COL])} r={i === selected ? 8 : 6} />
            <text x={sx(r[X_COL]) + 10} y={sy(r[Y_COL]) - 8}>
              {ROOMS[i].name}
            </text>
          </g>
        ))}
        <g className="topsis-ideal is-best">
          <rect x={best.x - 7} y={best.y - 7} width="14" height="14" />
          <text x={best.x - 10} y={best.y + 22} textAnchor="end">
            A⁺ 理想房
          </text>
        </g>
        <g className="topsis-ideal is-worst">
          <rect x={worst.x - 7} y={worst.y - 7} width="14" height="14" />
          <text x={worst.x + 10} y={worst.y - 10}>
            A⁻ 最差房
          </text>
        </g>
      </svg>
      <p className="chart-legend">
        <span className="legend-best">— 到理想房的距离 D⁺</span>
        <span className="legend-worst">- - 到最差房的距离 D⁻</span>
      </p>
      <div className="lab-result" aria-live="polite">
        <p>
          只看这两个指标，{name}到理想房 {f3(dist2d(selected, result.best))}、到最差房 {f3(dist2d(selected, result.worst))}。
          四个指标一起算：D⁺ = {f3(result.dPlus[selected])}，D⁻ = {f3(result.dMinus[selected])}。
        </p>
      </div>
    </figure>
  );
}
