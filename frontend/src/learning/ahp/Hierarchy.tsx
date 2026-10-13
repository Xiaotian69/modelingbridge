import { useId } from "react";
import { ALTERNATIVES, CRITERIA } from "./data";

const W = 640;
const BOX = { w: 156, h: 44 };
const layerY = { goal: 18, criteria: 128, alternatives: 238 };
const xs = (count: number) => Array.from({ length: count }, (_, i) => ((i + 0.5) * W) / count);

/** 目标层 → 准则层 → 方案层. Every criterion connects to every alternative. */
export function Hierarchy() {
  const id = useId();
  const cx = xs(CRITERIA.length);
  const ax = xs(ALTERNATIVES.length);
  const box = (x: number, y: number, label: string, sub: string, kind: string) => (
    <g className={`ahp-node is-${kind}`} key={`${kind}-${label}`}>
      <rect x={x - BOX.w / 2} y={y} width={BOX.w} height={BOX.h} rx="10" />
      <text x={x} y={y + 19} textAnchor="middle" className="ahp-node-label">
        {label}
      </text>
      <text x={x} y={y + 35} textAnchor="middle" className="ahp-node-sub">
        {sub}
      </text>
    </g>
  );
  return (
    <figure className="ahp-hierarchy">
      <svg viewBox={`0 0 ${W} 300`} role="img" aria-labelledby={`${id}-title ${id}-desc`}>
        <title id={`${id}-title`}>选择暑期实习的层次结构</title>
        <desc id={`${id}-desc`}>
          目标层：选出最适合的实习。准则层：{CRITERIA.map((c) => c.name).join("、")}。方案层：
          {ALTERNATIVES.map((a) => a.short).join("、")}。每个准则都连接全部三个方案。
        </desc>
        {cx.map((x) => (
          <line key={`g-${x}`} className="ahp-edge" x1={W / 2} y1={layerY.goal + BOX.h} x2={x} y2={layerY.criteria} />
        ))}
        {cx.flatMap((x) =>
          ax.map((y) => (
            <line
              key={`c-${x}-${y}`}
              className="ahp-edge is-faint"
              x1={x}
              y1={layerY.criteria + BOX.h}
              x2={y}
              y2={layerY.alternatives}
            />
          )),
        )}
        {box(W / 2, layerY.goal, "选出最适合的实习", "目标层", "goal")}
        {CRITERIA.map((c, i) => box(cx[i], layerY.criteria, c.name, c.note, "criterion"))}
        {ALTERNATIVES.map((a, i) => box(ax[i], layerY.alternatives, a.short, "方案", "alternative"))}
      </svg>
      {/* Narrow screens: the same hierarchy as stacked layers (the SVG text would be too small). */}
      <ol className="ahp-layers" aria-label="选择暑期实习的层次结构">
        <li>
          <span className="ahp-layer-name">目标层</span>
          <span className="ahp-chip is-goal">选出最适合的实习</span>
        </li>
        <li>
          <span className="ahp-layer-name">准则层</span>
          {CRITERIA.map((c) => (
            <span key={c.id} className="ahp-chip is-criterion">
              {c.name}
              <small>{c.note}</small>
            </span>
          ))}
        </li>
        <li>
          <span className="ahp-layer-name">方案层（每个准则都评价全部方案）</span>
          {ALTERNATIVES.map((a) => (
            <span key={a.id} className="ahp-chip">
              {a.short}
            </span>
          ))}
        </li>
      </ol>
      <figcaption>图 1 · 层次结构：目标层、准则层、方案层</figcaption>
    </figure>
  );
}
