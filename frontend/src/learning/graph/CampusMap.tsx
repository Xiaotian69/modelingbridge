import { useId } from "react";
import { CURVED, PLACES } from "./data";
import type { Edge } from "./math";

export const edgeKey = (u: number, v: number) => (u < v ? `${u}-${v}` : `${v}-${u}`);
const W = 640;
const H = 470;

function geometry(u: number, v: number) {
  const a = PLACES[u];
  const b = PLACES[v];
  if (edgeKey(u, v) === edgeKey(CURVED[0], CURVED[1])) {
    const c = CURVED[2];
    // Quadratic Bézier; its midpoint (t = ½) carries the label.
    return { d: `M ${a.x} ${a.y} Q ${c.x} ${c.y} ${b.x} ${b.y}`, mid: { x: (a.x + 2 * c.x + b.x) / 4, y: (a.y + 2 * c.y + b.y) / 4 } };
  }
  return { d: `M ${a.x} ${a.y} L ${b.x} ${b.y}`, mid: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 } };
}

export type MapProps = {
  edges: Edge[];
  title: string;
  desc: string;
  /** Extra class per edge key, e.g. "is-path", "is-tree", "is-rejected", "is-current". */
  edgeClass?: (key: string) => string | undefined;
  /** Extra class per vertex, e.g. "is-settled", "is-current", "is-source", "is-target". */
  nodeClass?: (v: number) => string | undefined;
  /** Small badge under a vertex (a distance in the lab). */
  badge?: (v: number) => string | undefined;
};

/** The campus as a weighted graph. Colour is never the only signal: the lab repeats every state in text. */
export function CampusMap({ edges, title, desc, edgeClass, nodeClass, badge }: MapProps) {
  const id = useId();
  return (
    <svg className="campus-map" viewBox={`0 0 ${W} ${H}`} role="img" aria-labelledby={`${id}-t ${id}-d`}>
      <title id={`${id}-t`}>{title}</title>
      <desc id={`${id}-d`}>{desc}</desc>
      {edges.map(([u, v, w]) => {
        const g = geometry(u, v);
        const key = edgeKey(u, v);
        return (
          <g key={key} className={`campus-edge ${edgeClass?.(key) ?? ""}`}>
            <path d={g.d} />
            <text x={g.mid.x} y={g.mid.y + 4} textAnchor="middle" className="campus-weight">
              {w}
            </text>
          </g>
        );
      })}
      {PLACES.map((pl, v) => (
        <g key={pl.id} className={`campus-node ${nodeClass?.(v) ?? ""}`}>
          <rect x={pl.x - 50} y={pl.y - 19} width="100" height="38" rx="19" />
          <text x={pl.x} y={pl.y + 6} textAnchor="middle" className="campus-name">
            {pl.name}
          </text>
          {badge?.(v) && (
            <text x={pl.x} y={pl.y + 40} textAnchor="middle" className="campus-badge">
              {badge(v)}
            </text>
          )}
        </g>
      ))}
    </svg>
  );
}
