import { useId } from "react";
import { UMBRELLA, type UmbrellaCase } from "./data";
import { plan } from "./math";

/** Slots per row in each station's grid. */
export const COLS = 8;
const CELL = 24;
const PAD = 14;
const GRID = { a: { x: 30, y: 54 }, b: { x: 30 + COLS * CELL + 2 * PAD + 44, y: 54 } };
/** Scene width in SVG units: two station panels and the gap with the transfer route. */
const WIDTH = GRID.b.x + COLS * CELL + PAD + 16;

export type Slot = { station: "a" | "b"; index: number };
/**
 * Where umbrella `id` (0 … N−1) stands for a given number at A. A fills its slots from id 0 up,
 * B from id N−1 down, so a transfer only moves the umbrellas that change station: those are the
 * ones that animate, and every other umbrella keeps its place.
 */
export function slotOf(id: number, atA: number, total: number): Slot {
  return id < atA ? { station: "a", index: id } : { station: "b", index: total - 1 - id };
}
export const slotPoint = ({ station, index }: Slot) => ({
  x: GRID[station].x + (index % COLS) * CELL + CELL / 2,
  y: GRID[station].y + Math.floor(index / COLS) * CELL + CELL / 2,
});
/** What a slot shows: an umbrella someone borrows, a spare umbrella, or a person left without one. */
export function slotKind(index: number, umbrellas: number, demand: number): "served" | "spare" | "unmet" | "empty" {
  if (index < Math.min(umbrellas, demand)) return "served";
  if (index < umbrellas) return "spare";
  if (index < demand) return "unmet";
  return "empty";
}

const UMBRELLA_PATH = "M-8 1 A8 8 0 0 1 8 1 Q6 -1 4 1 Q2 -1 0 1 Q-2 -1 -4 1 Q-6 -1 -8 1 Z M0 1 V7 Q0 9 -2 8";

/**
 * The two rain points drawn from the real numbers: one icon per umbrella, one dashed slot per person
 * who still has none. Moving x makes exactly |x| umbrellas travel between the points (instantly when
 * the system asks for reduced motion). Decorative: the lab states every number in text.
 */
export function UmbrellaScene({ x, demand, stock = UMBRELLA.stock, rain = true }: { x: number; demand: UmbrellaCase["demand"]; stock?: UmbrellaCase["stock"]; rain?: boolean }) {
  const id = useId();
  const total = stock.a + stock.b;
  const p = plan({ stock, demand }, x);
  const rows = Math.max(Math.ceil(total / COLS), Math.ceil(Math.max(total, demand.a, demand.b) / COLS));
  const gridBottom = GRID.a.y + rows * CELL;
  const height = gridBottom + 48;
  const slots = (station: "a" | "b") => {
    const count = Math.max(station === "a" ? p.a : p.b, station === "a" ? demand.a : demand.b);
    return Array.from({ length: count }, (_, index) => index);
  };

  return (
    <div className="intro-scene" aria-hidden="true" data-testid="umbrella-scene">
      {rain && <div className="intro-scene-rain" />}
      <svg viewBox={`0 0 ${WIDTH} ${height}`} width={WIDTH} height={height}>
        <defs>
          <path id={`${id}-u`} d={UMBRELLA_PATH} />
        </defs>
        {(["a", "b"] as const).map((s) => (
          <g key={s} className="intro-scene-station">
            <rect x={GRID[s].x - PAD} y={12} width={COLS * CELL + 2 * PAD} height={height - 22} rx={14} />
            <text x={GRID[s].x + (COLS * CELL) / 2} y={40} textAnchor="middle">
              {s === "a" ? "A 点 · 教学楼" : "B 点 · 宿舍区"}
            </text>
            <text x={GRID[s].x + (COLS * CELL) / 2} y={gridBottom + 24} textAnchor="middle" className="intro-scene-count">
              伞 {s === "a" ? p.a : p.b} · 需要 {s === "a" ? demand.a : demand.b}
            </text>
            {slots(s).map((index) => {
              const kind = slotKind(index, s === "a" ? p.a : p.b, s === "a" ? demand.a : demand.b);
              const { x: cx, y: cy } = slotPoint({ station: s, index });
              return kind === "unmet" ? (
                <rect key={index} className="intro-slot is-unmet" x={cx - 9} y={cy - 9} width={18} height={18} rx={5} />
              ) : index < (s === "a" ? demand.a : demand.b) ? (
                <rect key={index} className="intro-slot" x={cx - 10} y={cy - 10} width={20} height={20} rx={5} />
              ) : null;
            })}
          </g>
        ))}
        <path
          className="intro-scene-route"
          d={`M ${GRID.a.x + COLS * CELL + PAD} ${(GRID.a.y + gridBottom) / 2} H ${GRID.b.x - PAD}`}
        />
        {Array.from({ length: total }, (_, u) => {
          const slot = slotOf(u, p.a, total);
          const { x: tx, y: ty } = slotPoint(slot);
          const kind = slotKind(slot.index, slot.station === "a" ? p.a : p.b, slot.station === "a" ? demand.a : demand.b);
          return (
            <use
              key={u}
              href={`#${id}-u`}
              className={`intro-umbrella is-${kind}`}
              style={{ transform: `translate(${tx}px, ${ty}px)`, ["--i" as string]: Math.abs(u - stock.a) % 20 }}
            />
          );
        })}
      </svg>
      <p className="intro-scene-legend">
        <span className="is-served">借到伞</span>
        <span className="is-spare">多出来、没人借的伞</span>
        <span className="is-unmet">想借却没借到的人</span>
      </p>
    </div>
  );
}
