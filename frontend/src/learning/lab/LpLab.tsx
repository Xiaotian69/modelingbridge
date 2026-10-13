import { useId, useMemo, useState } from "react";
import { explain, fmtPoint } from "./explain";
import { clippedRegion, solveLab, type Constraint, type Model, type Point } from "./lp2d";

/** Controls of the lab: the textbook workshop model plus an optional order requirement. */
export type LabState = {
  c1: number;
  c2: number;
  cutA: number;
  cutB: number;
  cutCap: number;
  asmA: number;
  asmB: number;
  asmCap: number;
  orderOn: boolean;
  order: number;
};

export const DEFAULT_STATE: LabState = {
  c1: 40,
  c2: 50,
  cutA: 2,
  cutB: 1,
  cutCap: 100,
  asmA: 1,
  asmB: 2,
  asmCap: 80,
  orderOn: false,
  order: 60,
};

export const PRESETS: { id: string; label: string; state: LabState; note: string }[] = [
  { id: "default", label: "恢复默认", state: DEFAULT_STATE, note: "教材中的加工坊：最优 A 40、B 20，利润 2600 元。" },
  { id: "multiple", label: "多重最优", state: { ...DEFAULT_STATE, c1: 25 }, note: "A 的利润降到 25 元，利润比 25:50 与装配约束 1:2 相同。" },
  { id: "infeasible", label: "无可行解", state: { ...DEFAULT_STATE, orderOn: true, order: 70 }, note: "订单要求至少 70 m²，超过资源能做出的最大产量。" },
  { id: "unbounded", label: "无界", state: { ...DEFAULT_STATE, cutB: 0, asmB: 0 }, note: "假设 B 不消耗切割和装配工时。" },
];

export function toModel(s: LabState): Model {
  const constraints: Constraint[] = [
    { id: "cut", label: "切割", a: s.cutA, b: s.cutB, rhs: s.cutCap, sense: "<=" },
    { id: "assemble", label: "装配", a: s.asmA, b: s.asmB, rhs: s.asmCap, sense: "<=" },
  ];
  if (s.orderOn) constraints.push({ id: "order", label: "最低订单", a: 1, b: 1, rhs: s.order, sense: ">=" });
  return { c: [s.c1, s.c2], constraints };
}

type Slider = { key: keyof LabState; label: string; min: number; max: number; step: number; unit: string };
const GROUPS: { title: string; hint: string; sliders: Slider[] }[] = [
  {
    title: "目标函数：max 利润",
    hint: "每 m² 的贡献利润",
    sliders: [
      { key: "c1", label: "A 的利润", min: 0, max: 80, step: 5, unit: "元/m²" },
      { key: "c2", label: "B 的利润", min: 0, max: 80, step: 5, unit: "元/m²" },
    ],
  },
  {
    title: "约束 1：切割",
    hint: "每 m² 占用的工时，以及本周可用工时",
    sliders: [
      { key: "cutA", label: "A 占用", min: 0, max: 4, step: 0.5, unit: "小时" },
      { key: "cutB", label: "B 占用", min: 0, max: 4, step: 0.5, unit: "小时" },
      { key: "cutCap", label: "可用工时", min: 0, max: 150, step: 5, unit: "小时" },
    ],
  },
  {
    title: "约束 2：装配",
    hint: "每 m² 占用的工时，以及本周可用工时",
    sliders: [
      { key: "asmA", label: "A 占用", min: 0, max: 4, step: 0.5, unit: "小时" },
      { key: "asmB", label: "B 占用", min: 0, max: 4, step: 0.5, unit: "小时" },
      { key: "asmCap", label: "可用工时", min: 0, max: 150, step: 5, unit: "小时" },
    ],
  },
];

const num = (x: number) => (Number.isInteger(x) ? String(x) : String(Math.round(x * 100) / 100));
const term = (k: number, v: string) => (k === 0 ? "" : `${k === 1 ? "" : num(k)}${v}`);
const lhs = (a: number, b: number) => [term(a, "x"), term(b, "y")].filter(Boolean).join(" + ") || "0";

/** Where the line a·x + b·y = rhs crosses the square plot [0, e]². */
function lineInBox(a: number, b: number, rhs: number, e: number): Point[] {
  const pts: Point[] = [];
  if (b !== 0) for (const x of [0, e]) pts.push([x, (rhs - a * x) / b]);
  if (a !== 0) for (const y of [0, e]) pts.push([(rhs - b * y) / a, y]);
  const inside = pts.filter(([x, y]) => x >= -1e-9 && x <= e + 1e-9 && y >= -1e-9 && y <= e + 1e-9);
  return inside.filter((p, i) => inside.findIndex((q) => Math.abs(p[0] - q[0]) < 1e-9 && Math.abs(p[1] - q[1]) < 1e-9) === i);
}

/** Plot extent: big enough for every finite intercept and corner, rounded to a nice number. */
function extentFor(m: Model, corners: Point[]): number {
  const values: number[] = corners.flat();
  for (const r of m.constraints) {
    if (r.a > 0) values.push(r.rhs / r.a);
    if (r.b > 0) values.push(r.rhs / r.b);
  }
  const top = Math.max(60, ...values.filter((v) => Number.isFinite(v) && v <= 320)) * 1.12;
  const step = top > 160 ? 50 : 20;
  return Math.min(320, Math.ceil(top / step) * step);
}

export function LpLab() {
  const id = useId();
  const [s, setS] = useState<LabState>(DEFAULT_STATE);
  const model = useMemo(() => toModel(s), [s]);
  const result = useMemo(() => solveLab(model), [model]);
  const text = useMemo(() => explain(model, result), [model, result]);

  const e = extentFor(model, result.vertices);
  const scale = 432 / e;
  const X = (x: number) => 48 + x * scale;
  const Y = (y: number) => 476 - y * scale;
  const pt = ([x, y]: Point) => `${X(x)},${Y(y)}`;
  const tick = e > 160 ? 50 : 20;
  const ticks = Array.from({ length: Math.floor(e / tick) + 1 }, (_, i) => i * tick);
  const region = result.status === "infeasible" ? [] : clippedRegion(model, e, e);
  const cut = lineInBox(s.cutA, s.cutB, s.cutCap, e);
  const asm = lineInBox(s.asmA, s.asmB, s.asmCap, e);
  const order = s.orderOn ? lineInBox(1, 1, s.order, e) : [];
  const optimal = result.status === "optimal" ? result : null;
  const level = optimal && (s.c1 > 0 || s.c2 > 0) ? lineInBox(s.c1, s.c2, optimal.value, e) : [];
  const extendsBeyond = result.status !== "infeasible" && result.rays.length > 0;
  const set = (key: keyof LabState, value: number | boolean) => setS((prev) => ({ ...prev, [key]: value }));

  return (
    <figure className="lp-lab lp-explorer" aria-labelledby={`${id}-title`}>
      <figcaption>
        <span className="eyebrow">交互实验室 / 二维线性规划</span>
        <h3 id={`${id}-title`}>改参数，看最优解怎样移动</h3>
      </figcaption>

      <p className="lab-model" aria-label="当前模型">
        max z = {lhs(s.c1, s.c2)}
        <br />
        s.t. 切割 {lhs(s.cutA, s.cutB)} ≤ {num(s.cutCap)}，装配 {lhs(s.asmA, s.asmB)} ≤ {num(s.asmCap)}
        {s.orderOn && `，订单 x + y ≥ ${num(s.order)}`}，x, y ≥ 0
      </p>

      <div className="lesson-actions lab-presets" role="group" aria-label="预设场景">
        {PRESETS.map((p) => (
          <button key={p.id} type="button" className="lesson-button secondary" title={p.note} onClick={() => setS(p.state)}>
            {p.label}
          </button>
        ))}
      </div>

      <div className="lab-explorer-grid">
        <div className="lab-explorer-controls">
          {GROUPS.map((g) => (
            <fieldset key={g.title} className="lab-group">
              <legend>
                {g.title}
                <small>{g.hint}</small>
              </legend>
              {g.sliders.map((sl) => (
                <label key={sl.key} htmlFor={`${id}-${sl.key}`}>
                  <span>
                    {sl.label}
                    <output htmlFor={`${id}-${sl.key}`}>
                      {num(s[sl.key] as number)} {sl.unit}
                    </output>
                  </span>
                  <input
                    id={`${id}-${sl.key}`}
                    type="range"
                    min={sl.min}
                    max={sl.max}
                    step={sl.step}
                    value={s[sl.key] as number}
                    onChange={(ev) => set(sl.key, Number(ev.target.value))}
                  />
                </label>
              ))}
            </fieldset>
          ))}
          <fieldset className="lab-group">
            <legend>
              附加约束：最低订单
              <small>A 与 B 合计至少要生产多少</small>
            </legend>
            <label className="lab-check">
              <input type="checkbox" checked={s.orderOn} onChange={(ev) => set("orderOn", ev.target.checked)} />
              加入 x + y ≥ 订单量
            </label>
            {s.orderOn && (
              <label htmlFor={`${id}-order`}>
                <span>
                  订单量
                  <output htmlFor={`${id}-order`}>{num(s.order)} m²</output>
                </span>
                <input
                  id={`${id}-order`}
                  type="range"
                  min={0}
                  max={150}
                  step={5}
                  value={s.order}
                  onChange={(ev) => set("order", Number(ev.target.value))}
                />
              </label>
            )}
          </fieldset>
        </div>

        <div className="lab-explorer-chart">
          <svg viewBox="0 0 530 525" role="img" aria-labelledby={`${id}-svg-title ${id}-svg-desc`}>
            <title id={`${id}-svg-title`}>可行域、约束线与最优解</title>
            <desc id={`${id}-svg-desc`}>
              横轴 A 产量 x，纵轴 B 产量 y，单位 m²，坐标范围 0 到 {e}。{text.headline}。
            </desc>
            {ticks.map((t) => (
              <g key={t}>
                <line className="lab-grid" x1={X(t)} y1={Y(0)} x2={X(t)} y2={Y(e)} />
                <line className="lab-grid" x1={X(0)} y1={Y(t)} x2={X(e)} y2={Y(t)} />
                <text x={X(t)} y="496" textAnchor="middle">
                  {t}
                </text>
                <text x="35" y={Y(t) + 4} textAnchor="end">
                  {t}
                </text>
              </g>
            ))}
            <text x={X(e)} y="518" textAnchor="end" className="lab-axis-label">
              A 产量 x（m²）
            </text>
            <text x="48" y="22" className="lab-axis-label">
              B 产量 y（m²）
            </text>
            {region.length >= 3 && <polygon className="lab-region" points={region.map(pt).join(" ")} strokeWidth="2" />}
            {region.length === 2 && <line className="lab-region-line" x1={X(region[0][0])} y1={Y(region[0][1])} x2={X(region[1][0])} y2={Y(region[1][1])} />}
            {cut.length === 2 && <line className="lab-cut" strokeWidth="2" x1={X(cut[0][0])} y1={Y(cut[0][1])} x2={X(cut[1][0])} y2={Y(cut[1][1])} />}
            {asm.length === 2 && (
              <line className="lab-assemble" strokeWidth="2" strokeDasharray="8 5" x1={X(asm[0][0])} y1={Y(asm[0][1])} x2={X(asm[1][0])} y2={Y(asm[1][1])} />
            )}
            {order.length === 2 && (
              <line className="lab-order" strokeWidth="2" strokeDasharray="2 4" x1={X(order[0][0])} y1={Y(order[0][1])} x2={X(order[1][0])} y2={Y(order[1][1])} />
            )}
            {level.length === 2 && (
              <line className="lab-objective" strokeWidth="2" strokeDasharray="3 5" x1={X(level[0][0])} y1={Y(level[0][1])} x2={X(level[1][0])} y2={Y(level[1][1])} />
            )}
            {optimal && optimal.optima.length === 2 && (
              <line
                className="lab-optimum-edge"
                strokeWidth="5"
                x1={X(optimal.optima[0][0])}
                y1={Y(optimal.optima[0][1])}
                x2={X(optimal.optima[1][0])}
                y2={Y(optimal.optima[1][1])}
              />
            )}
            {optimal &&
              optimal.optima.length <= 4 &&
              optimal.optima.map((v, i) => <circle key={i} cx={X(v[0])} cy={Y(v[1])} r="6" className="lab-optimum" strokeWidth="2" />)}
            {extendsBeyond && (
              <text x={X(e) - 6} y="44" textAnchor="end" className="lab-extends">
                可行域延伸到图外，没有边界
              </text>
            )}
            {result.status === "infeasible" && (
              <text x={X(e / 2)} y={Y(e / 2)} textAnchor="middle" className="lab-empty">
                可行域为空
              </text>
            )}
          </svg>
          <div className="chart-legend">
            <span className="legend-cut">— 切割</span>
            <span className="legend-assemble">- - 装配</span>
            {s.orderOn && <span className="legend-order">··· 最低订单</span>}
            {level.length === 2 && <span className="legend-objective">-·- 最优利润等值线</span>}
            {region.length > 0 && <span className="legend-region">▧ 可行域</span>}
          </div>
          <div className={`lab-result is-${text.tone}`} aria-live="polite">
            <strong>{text.headline}</strong>
            {text.lines.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>
        </div>
      </div>

      {/* Phones: the sticky chart only shows the headline; the full explanation sits here. */}
      <div className={`lab-result lab-result-mobile is-${text.tone}`}>
        <strong>为什么？</strong>
        {text.lines.map((line) => (
          <p key={line}>{line}</p>
        ))}
      </div>

      {result.status !== "infeasible" && result.vertices.length > 0 && result.vertices.length <= 8 && (
        <div className="table-scroll">
          <table className="lab-vertices">
            <caption>可行域的角点与利润（最优解一定出现在角点上，除非模型无界）</caption>
            <thead>
              <tr>
                <th scope="col">角点</th>
                <th scope="col">利润 z</th>
              </tr>
            </thead>
            <tbody>
              {result.vertices.map((v) => {
                const z = s.c1 * v[0] + s.c2 * v[1];
                const best = optimal?.optima.some((o) => o[0] === v[0] && o[1] === v[1]);
                return (
                  <tr key={`${v[0]}-${v[1]}`} className={best ? "is-best" : undefined}>
                    <td>{fmtPoint(v)}</td>
                    <td>
                      {num(z)} 元{best ? " ← 最优" : ""}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <details>
        <summary>实验室怎样计算</summary>
        <p>
          逐一求出约束线（含两条坐标轴）的交点，保留满足全部约束的点，就是可行域的角点；可行域在第一象限内，只要不是空集就一定有角点，所以找不到角点就说明无可行解。
          再检查可行域沿哪些方向可以无限延伸：若沿某个方向利润一直增加，模型无界；否则最大利润一定出现在某个角点上，并列最大的角点之间的整条边都是最优解。
          计算与 SciPy（HiGHS）求解器逐一对照验证过，参数在教材范围内时与课程的线性规划求解器结果完全一致。
        </p>
      </details>
    </figure>
  );
}
