import { useId, useMemo, useState } from "react";
import { CampusMap, edgeKey } from "./CampusMap";
import type { GraphLabMode } from "./content";
import { CAMPUS, CONSTRUCTION, DORM, PLACES, PLAZA } from "./data";
import { dijkstra, kruskal, pathTo, withWeight } from "./math";

const name = (v: number) => PLACES[v].name;
const fmt = (d: number) => (d === Infinity ? "∞" : `${d}`);
const BASE = dijkstra(CAMPUS, DORM);

/** 最短路 / 最小生成树 step-through lab on the campus map. */
export function GraphLab({ mode: initialMode }: { mode: GraphLabMode }) {
  const id = useId();
  const [mode, setMode] = useState<GraphLabMode>(initialMode);
  const [source, setSource] = useState(DORM);
  const [target, setTarget] = useState(PLAZA);
  const [construction, setConstruction] = useState(false);
  const [step, setStep] = useState(0);

  const graph = useMemo(
    () => (construction ? withWeight(CAMPUS, CONSTRUCTION.u, CONSTRUCTION.v, CONSTRUCTION.weight) : CAMPUS),
    [construction],
  );
  const run = useMemo(() => dijkstra(graph, source), [graph, source]);
  const tree = useMemo(() => kruskal(graph), [graph]);
  const total = mode === "path" ? run.steps.length : tree.steps.length;
  const at = Math.min(step, total);
  const finished = at === total;
  const restart = () => setStep(0);

  // ---- 最短路 ----
  const current = at > 0 ? run.steps[at - 1] : null;
  const dist = current ? current.dist : run.steps[0].dist.map((_, v) => (v === source ? 0 : Infinity));
  const done = current ? current.done : [];
  /** prev as known after `at` steps (the last relaxation that lowered each vertex). */
  const prevNow = useMemo(() => {
    const prev: (number | null)[] = Array(CAMPUS.n).fill(null);
    run.steps.slice(0, at).forEach((s) => s.relaxed.forEach(([v]) => (prev[v] = s.settled)));
    return prev;
  }, [run, at]);
  const route = finished ? pathTo(run.prev, run.dist, target) : [];
  const routeKeys = new Set(route.slice(1).map((v, i) => edgeKey(route[i], v)));
  const relaxedKeys = new Set(current?.relaxed.map(([v]) => edgeKey(current.settled, v)) ?? []);
  const treeKeys = new Set(
    prevNow.flatMap((p, v) => (p === null ? [] : [edgeKey(p, v)])),
  );

  // ---- 最小生成树 ----
  const kStep = at > 0 ? tree.steps[at - 1] : null;
  const chosen = new Set(tree.steps.slice(0, at).filter((s) => s.accepted).map((s) => edgeKey(s.edge[0], s.edge[1])));
  const skipped = new Set(tree.steps.slice(0, at).filter((s) => !s.accepted).map((s) => edgeKey(s.edge[0], s.edge[1])));

  const edgeClass =
    mode === "path"
      ? (key: string) =>
          routeKeys.has(key) ? "is-path" : relaxedKeys.has(key) ? "is-current" : treeKeys.has(key) ? "is-tree" : undefined
      : (key: string) =>
          kStep && edgeKey(kStep.edge[0], kStep.edge[1]) === key
            ? kStep.accepted
              ? "is-current"
              : "is-rejected is-current"
            : chosen.has(key)
              ? "is-tree"
              : skipped.has(key)
                ? "is-rejected"
                : undefined;
  const nodeClass =
    mode === "path"
      ? (v: number) =>
          [
            v === source ? "is-source" : "",
            v === target && finished ? "is-target" : "",
            current?.settled === v ? "is-current" : done.includes(v) ? "is-settled" : "",
          ].join(" ")
      : undefined;

  let message: string;
  if (mode === "path") {
    if (!current) message = `开始：${name(source)}的距离为 0，其余地点都是 ∞。点“下一步”确定第一个地点。`;
    else {
      const updates = current.relaxed.map(([v, from, to]) => `${name(v)} ${fmt(from)} → ${to}`);
      message = `第 ${at} 步：确定${name(current.settled)}（${dist[current.settled]} 米）。${
        updates.length ? `更新：${updates.join("，")}。` : "没有邻居可以更新。"
      }`;
    }
    if (finished)
      message += ` 全部确定。${name(source)}到${name(target)}最短 ${run.dist[target]} 米：${route.map(name).join(" → ")}。`;
    if (finished && construction && source === DORM && target === PLAZA)
      message += ` 施工前是 ${BASE.dist[PLAZA]} 米。`;
  } else if (!kStep) message = "开始：所有边按长度从短到长排好。点“下一步”依次考虑每一条边。";
  else
    message = `第 ${at} 条：${name(kStep.edge[0])}—${name(kStep.edge[1])}（${kStep.edge[2]} 米）${
      kStep.accepted ? "：两端还没连通，选用。" : "：两端已经连通，选它会形成环，跳过。"
    }已选 ${kStep.count} 条，共 ${kStep.total} 米。${finished ? `已选满 ${CAMPUS.n - 1} 条，最小生成树总长 ${tree.total} 米。` : ""}`;

  const switchMode = (m: GraphLabMode) => {
    setMode(m);
    setStep(0);
  };

  return (
    <figure className="lp-lab graph-lab" aria-labelledby={`${id}-title`}>
      <figcaption>
        <span className="eyebrow">动手实验 / 校园地图</span>
        <h3 id={`${id}-title`}>{mode === "path" ? "一步一步运行 Dijkstra 算法" : "一步一步运行 Kruskal 算法"}</h3>
      </figcaption>
      <div className="graph-toolbar">
        <div className="segmented-buttons" role="group" aria-label="选择问题">
          <button type="button" aria-pressed={mode === "path"} onClick={() => switchMode("path")}>
            最短路
          </button>
          <button type="button" aria-pressed={mode === "tree"} onClick={() => switchMode("tree")}>
            最小生成树
          </button>
        </div>
        {mode === "path" && (
          <div className="graph-selects">
            <label>
              起点
              <select
                value={source}
                onChange={(e) => {
                  setSource(Number(e.target.value));
                  restart();
                }}
              >
                {PLACES.map((pl, v) => (
                  <option key={pl.id} value={v}>
                    {pl.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              终点
              <select value={target} onChange={(e) => setTarget(Number(e.target.value))}>
                {PLACES.map((pl, v) => (
                  <option key={pl.id} value={v}>
                    {pl.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
        )}
        <label className="lab-check">
          <input
            type="checkbox"
            checked={construction}
            onChange={(e) => {
              setConstruction(e.target.checked);
              restart();
            }}
          />
          图书馆—教学楼施工（200 → {CONSTRUCTION.weight} 米）
        </label>
      </div>

      <CampusMap
        edges={graph.edges}
        title={mode === "path" ? "Dijkstra 算法演示" : "Kruskal 算法演示"}
        desc={message}
        edgeClass={edgeClass}
        nodeClass={nodeClass}
        badge={mode === "path" ? (v) => (done.includes(v) ? `[${dist[v]}]` : fmt(dist[v])) : undefined}
      />
      <p className="chart-legend">
        {mode === "path" ? (
          <>
            <span className="graph-legend-current">— 本步更新的边</span>
            <span className="graph-legend-tree">— 目前的最佳来路</span>
            <span className="graph-legend-path">— 最短路线</span>
            <span>[ ] 已确定的距离</span>
          </>
        ) : (
          <>
            <span className="graph-legend-current">— 正在考虑的边</span>
            <span className="graph-legend-tree">— 已选用</span>
            <span className="graph-legend-rejected">- - 跳过（会成环）</span>
          </>
        )}
      </p>

      <div className="lesson-actions">
        <button type="button" className="lesson-button" disabled={finished} onClick={() => setStep((s) => Math.min(Math.min(s, total) + 1, total))}>
          下一步
        </button>
        <button type="button" className="lesson-button secondary" disabled={at === 0} onClick={() => setStep((s) => Math.max(Math.min(s, total) - 1, 0))}>
          上一步
        </button>
        <button type="button" className="lesson-button secondary" disabled={finished} onClick={() => setStep(total)}>
          直接看结果
        </button>
        <button type="button" className="lesson-button secondary" disabled={at === 0} onClick={restart}>
          重新开始
        </button>
        <span className="muted-note">
          {at} / {total} 步
        </span>
      </div>
      <div className="lab-result" aria-live="polite">
        <p>{message}</p>
      </div>

      {mode === "path" && (
        <div className="table-scroll">
          <table className="graph-table">
            <caption>每个地点的状态（单位：米）</caption>
            <thead>
              <tr>
                <th scope="col">地点</th>
                <th scope="col">状态</th>
                <th scope="col">距离</th>
                <th scope="col">来自</th>
              </tr>
            </thead>
            <tbody>
              {PLACES.map((pl, v) => (
                <tr key={pl.id} className={current?.settled === v ? "is-current" : undefined}>
                  <th scope="row">{pl.name}</th>
                  <td>{done.includes(v) ? "已确定" : dist[v] === Infinity ? "未到达" : "暂定"}</td>
                  <td>{fmt(dist[v])}</td>
                  <td>{prevNow[v] === null ? "—" : name(prevNow[v]!)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <details>
        <summary>这些数是怎么算出来的</summary>
        <p>
          最短路：每一步在未确定的地点中选距离最小的确定下来，再用它更新邻居（松弛）。最小生成树：边按长度从短到长依次考虑，用“并查集”判断两端是否已经连通，连通就跳过。所有计算都在你的浏览器里完成，并与
          networkx 的结果对照验证过。
        </p>
      </details>
    </figure>
  );
}
