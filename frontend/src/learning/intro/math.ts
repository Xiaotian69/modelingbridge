/**
 * The small calculations of 第零课. Pure functions; the lesson text, the commute calculator and the
 * umbrella case all call these, and math.test.ts checks them against intro-verified.json (scipy).
 */
import type { UmbrellaCase } from "./data";

// ---------- §1 walking time ----------
/** Minutes to walk `metres` at `speed` m/s, plus fixed waiting minutes. */
export const walkMinutes = (metres: number, speed: number, wait = 0) => metres / speed / 60 + wait;

// ---------- §3 commute ----------
export const mean = (xs: number[]) => xs.reduce((s, x) => s + x, 0) / xs.length;
/** 7:mm for a minute count after 7:00 (40 → “7:40”, 60 → “8:00”). */
export const clock = (minuteAfterSeven: number) => {
  const h = 7 + Math.floor(minuteAfterSeven / 60);
  const m = ((minuteAfterSeven % 60) + 60) % 60;
  return `${h}:${String(m).padStart(2, "0")}`;
};
/** A day is on time when departure + walking time ≤ class time (arriving exactly at 8:00 counts). */
export function commuteCheck(days: number[], depart: number, classMinute: number) {
  const late = days.map((t, i) => (depart + t > classMinute ? i + 1 : 0)).filter(Boolean);
  return { onTime: days.length - late.length, late };
}
/** Latest departure that is on time on every recorded day. */
export const latestSafeDeparture = (days: number[], classMinute: number) => classMinute - Math.max(...days);

// ---------- §7 umbrellas ----------
export type Plan = {
  /** Umbrellas moved from B to A (negative: from A to B). */
  x: number;
  a: number;
  b: number;
  servedA: number;
  servedB: number;
  shortA: number;
  shortB: number;
  /** 借不到伞的人数: the objective, smaller is better. */
  shortage: number;
};
export const total = (c: UmbrellaCase) => c.stock.a + c.stock.b;
/** You can only move umbrellas that are there: −stock.a ≤ x ≤ stock.b. */
export const transferRange = (c: UmbrellaCase) => ({ min: -c.stock.a, max: c.stock.b });

export function plan(c: UmbrellaCase, x: number): Plan {
  const a = c.stock.a + x;
  const b = c.stock.b - x;
  const shortA = Math.max(c.demand.a - a, 0);
  const shortB = Math.max(c.demand.b - b, 0);
  return {
    x,
    a,
    b,
    servedA: Math.min(a, c.demand.a),
    servedB: Math.min(b, c.demand.b),
    shortA,
    shortB,
    shortage: shortA + shortB,
  };
}

/** Why a typed transfer is not allowed (null when it is). */
export function transferProblem(c: UmbrellaCase, x: number): string | null {
  if (!Number.isFinite(x)) return "请输入一个数字。";
  if (!Number.isInteger(x)) return "雨伞要一把一把地调，请输入整数。";
  const { min, max } = transferRange(c);
  if (x > max) return `B 点现在只有 ${c.stock.b} 把伞，最多只能调 ${max} 把到 A 点。`;
  if (x < min) return `A 点现在只有 ${c.stock.a} 把伞，最多只能调 ${-min} 把到 B 点。`;
  return null;
}

export type Optimum = {
  /** Smallest possible shortage over every allowed transfer. */
  shortage: number;
  /** All optimal transfers form one range of integers. */
  low: number;
  high: number;
  /** Among the optimal plans, the one that moves the fewest umbrellas (secondary goal). */
  fewestMoves: number;
  /** Shortage of every allowed transfer, from min to max (what “把每一种调法都算一遍” draws). */
  curve: { x: number; shortage: number }[];
};

/** Exhaustive search over every allowed integer transfer (at most total + 1 plans). */
export function optimum(c: UmbrellaCase): Optimum {
  const { min, max } = transferRange(c);
  const curve: { x: number; shortage: number }[] = [];
  for (let x = min; x <= max; x++) curve.push({ x, shortage: plan(c, x).shortage });
  const best = Math.min(...curve.map((p) => p.shortage));
  const xs = curve.filter((p) => p.shortage === best).map((p) => p.x);
  const low = xs[0];
  const high = xs[xs.length - 1];
  const fewestMoves = xs.reduce((m, x) => (Math.abs(x) < Math.abs(m) ? x : m), xs[0]);
  return { shortage: best, low, high, fewestMoves, curve };
}

/**
 * Closed form, used only to cross-check the search: with free transfers the shortage can reach
 * max(dA + dB − N, 0), and nothing less (N umbrellas can serve at most N people).
 */
export const minShortageClosedForm = (c: UmbrellaCase) => Math.max(c.demand.a + c.demand.b - total(c), 0);
