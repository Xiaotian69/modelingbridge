import { useId, useState } from "react";
import { defaults, solve, type Parameters, type Point } from "./solver";
import { objectiveSegment } from "./chartGeometry";
const fmt = (n: number) => Number(n.toFixed(3)).toLocaleString("zh-CN");
const X = (x: number) => 48 + x * 3.6;
const Y = (y: number) => 476 - y * 3.6;

export function Graph() {
  const [p, setP] = useState(defaults);
  const [integer, setInteger] = useState(false);
  const id = useId();
  const r = solve(p, integer);
  const best = r.optima[0];
  const displayOptima = r.optima.slice(0, 20);
  const parameters: {
    key: keyof Parameters;
    label: string;
    max: number;
    unit: string;
  }[] = [
    { key: "a", label: "A 单位利润", max: 80, unit: "元/m²" },
    { key: "b", label: "B 单位利润", max: 80, unit: "元/m²" },
    { key: "b1", label: "切割上限", max: 120, unit: "小时" },
    { key: "b2", label: "装配上限", max: 120, unit: "小时" },
  ];
  const coord = (v: Point) => `${X(v[0])},${Y(v[1])}`;
  const objective = objectiveSegment(p.a, p.b, r.value);
  return (
    <figure className="lp-lab">
      <figcaption>
        <span className="eyebrow">动手实验 / INTERACTIVE LAB</span>
        <h3>拖动参数，让答案自己变化</h3>
      </figcaption>
      <div className="lab-controls">
        {parameters.map(({ key, label, max, unit }) => (
          <label key={key} htmlFor={`${id}-${key}`}>
            <span>
              {label}
              <output>
                {p[key]} {unit}
              </output>
            </span>
            <input
              id={`${id}-${key}`}
              type="range"
              min="0"
              max={max}
              step="1"
              value={p[key]}
              onChange={(e) => setP({ ...p, [key]: Number(e.target.value) })}
            />
          </label>
        ))}
      </div>
      <div className="lesson-actions">
        <button
          className="lesson-button secondary"
          onClick={() => {
            setP(defaults);
            setInteger(false);
          }}
        >
          恢复默认
        </button>
        <button
          className="lesson-button secondary"
          onClick={() => {
            setP({ ...defaults, b1: 9, b2: 8 });
            setInteger(true);
          }}
        >
          整数反例
        </button>
        <label>
          <input
            type="checkbox"
            checked={integer}
            onChange={(e) => setInteger(e.target.checked)}
          />{" "}
          整块生产（整数）
        </label>
      </div>
      <svg
        viewBox="0 0 530 525"
        role="img"
        aria-labelledby={`${id}-title ${id}-desc`}
      >
        <title id={`${id}-title`}>当前生产计划的可行域与最优解</title>
        <desc id={`${id}-desc`}>
          横轴 A 产量、纵轴 B 产量，单位平方米。切割约束 2x+y≤{p.b1}，装配约束
          x+2y≤{p.b2}。最大利润 {fmt(r.value)}{" "}
          元。具体顶点和结果见图后文字与表格。
        </desc>
        {[0, 20, 40, 60, 80, 100, 120].map((t) => (
          <g key={t}>
            <line className="lab-grid" x1={X(t)} y1={Y(0)} x2={X(t)} y2={Y(120)} />
            <line className="lab-grid" x1={X(0)} y1={Y(t)} x2={X(120)} y2={Y(t)} />
            <text x={X(t)} y="496" textAnchor="middle">
              {t}
            </text>
            <text x="35" y={Y(t) + 4} textAnchor="end">
              {t}
            </text>
          </g>
        ))}
        <polygon
          className="lab-region"
          points={r.vertices.map(coord).join(" ")}
          strokeWidth="2"
        />
        <line
          x1={X(p.b1 / 2)}
          y1={Y(0)}
          x2={X(0)}
          y2={Y(p.b1)}
          className="lab-cut"
          strokeWidth="2"
        />
        <line
          x1={X(p.b2)}
          y1={Y(0)}
          x2={X(0)}
          y2={Y(p.b2 / 2)}
          className="lab-assemble"
          strokeDasharray="8 5"
          strokeWidth="2"
        />
        {objective.length >= 2 && (
          <line
            x1={X(objective[0][0])}
            y1={Y(objective[0][1])}
            x2={X(objective[objective.length - 1][0])}
            y2={Y(objective[objective.length - 1][1])}
            className="lab-objective"
            strokeDasharray="3 5"
            strokeWidth="2"
          />
        )}
        {!integer && r.optima.length === 2 && (
          <line
            x1={X(r.optima[0][0])}
            y1={Y(r.optima[0][1])}
            x2={X(r.optima[1][0])}
            y2={Y(r.optima[1][1])}
            className="lab-optimum-edge"
            strokeWidth="5"
          />
        )}
        {displayOptima.map((v, i) => (
          <circle
            key={i}
            cx={X(v[0])}
            cy={Y(v[1])}
            r="6"
            className="lab-optimum"
            strokeWidth="2"
          />
        ))}
        <text x="48" y="22">
          B 产量 / m²
        </text>
        <text x="475" y="520" textAnchor="end">
          A 产量 / m²
        </text>
      </svg>
      <div className="chart-legend">
        <span>绿区：连续可行域</span>
        <span>蓝实线：切割</span>
        <span>紫虚线：装配</span>
        <span>橙点：最优；橙点线：等利润线</span>
      </div>
      <div className="lab-result" aria-live="polite">
        <strong>最大利润 {fmt(r.value)} 元</strong>
        <p>
          {r.optima.length > 1 ? "多个最优方案；示例：" : "最优方案："}A ={" "}
          {fmt(best[0])} m²，B = {fmt(best[1])} m²。
        </p>
        <p>
          此方案剩余切割 {fmt(p.b1 - 2 * best[0] - best[1])} 小时，装配{" "}
          {fmt(p.b2 - best[0] - 2 * best[1])} 小时。
        </p>
        {r.optima.length > 1 && (
          <p>
            {integer
              ? `共 ${r.optima.length} 个整数最优点，图中最多标出 20 个。`
              : p.a === 0 && p.b === 0
                ? "利润系数均为零，整个可行域都同样最优。"
                : "橙色顶点之间的线段也全部最优。"}
          </p>
        )}
      </div>
      <details>
        <summary>查看连续可行域顶点与利润（图表的数值说明）</summary>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>A / m²</th>
                <th>B / m²</th>
                <th>利润 / 元</th>
              </tr>
            </thead>
            <tbody>
              {r.vertices.map(([x, y], i) => (
                <tr key={i}>
                  <td>{fmt(x)}</td>
                  <td>{fmt(y)}</td>
                  <td>{fmt(p.a * x + p.b * y)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </figure>
  );
}
