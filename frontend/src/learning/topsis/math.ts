/**
 * TOPSIS (Technique for Order Preference by Similarity to Ideal Solution, Hwang & Yoon 1981)
 * and the entropy weight method, as taught in the lesson.
 *
 * Method (stated to learners in §3–§6):
 * - Vector normalisation r_ij = x_ij / sqrt(Σ_i x_ij²), column by column (needs a non-zero column).
 * - Weighted matrix v_ij = w_j · r_ij with w_j ≥ 0, Σ w_j = 1.
 * - Ideal solutions per column: for a benefit criterion A⁺ = max_i v_ij and A⁻ = min_i v_ij;
 *   for a cost criterion the other way round. Direction is handled here, not by rewriting data.
 * - Euclidean distances D⁺_i, D⁻_i and closeness C_i = D⁻_i / (D⁺_i + D⁻_i) ∈ [0, 1].
 * Entropy weights: min–max scaling in the criterion's direction, p_ij = y_ij / Σ_i y_ij,
 * e_j = −(1 / ln m) Σ_i p_ij ln p_ij with 0 · ln 0 = 0, d_j = 1 − e_j, w_j = d_j / Σ d_j.
 * Every result is checked against an independent numpy implementation in
 * topsis-verified.json (verify_topsis.py).
 */

export type Matrix = number[][];
export type Direction = "benefit" | "cost";

const sum = (v: number[]) => v.reduce((s, x) => s + x, 0);
const column = (x: Matrix, j: number) => x.map((row) => row[j]);

function check(x: Matrix, directions: Direction[]) {
  if (!x.length || !x[0].length) throw new RangeError("decision matrix is empty");
  const n = x[0].length;
  if (x.some((row) => row.length !== n)) throw new RangeError("rows have different lengths");
  if (directions.length !== n) throw new RangeError("one direction per criterion");
  if (x.some((row) => row.some((v) => !Number.isFinite(v) || v < 0)))
    throw new RangeError("TOPSIS here expects finite, non-negative data");
}

/** Column norms sqrt(Σ_i x_ij²). */
export function columnNorms(x: Matrix): number[] {
  return x[0].map((_, j) => Math.sqrt(sum(column(x, j).map((v) => v * v))));
}

/** r_ij = x_ij / ‖column j‖. Units cancel; scaling a column (元 → 千元) changes nothing. */
export function vectorNormalise(x: Matrix): Matrix {
  const norms = columnNorms(x);
  if (norms.some((s) => s === 0)) throw new RangeError("a criterion is zero for every alternative");
  return x.map((row) => row.map((v, j) => v / norms[j]));
}

/** Rescale non-negative weights to sum 1. */
export function normaliseWeights(raw: number[]): number[] {
  if (raw.some((w) => !Number.isFinite(w) || w < 0)) throw new RangeError("weights must be non-negative");
  const s = sum(raw);
  if (!(s > 0)) throw new RangeError("at least one weight must be positive");
  return raw.map((w) => w / s);
}

export type TopsisResult = {
  normalised: Matrix;
  weighted: Matrix;
  /** Positive / negative ideal solution, one value per criterion (weighted scale). */
  best: number[];
  worst: number[];
  dPlus: number[];
  dMinus: number[];
  /** Relative closeness C_i; null when D⁺ + D⁻ = 0 (all alternatives identical on weighted criteria). */
  closeness: (number | null)[];
  /** Alternative indices, best first (ties keep the original order). */
  order: number[];
};

export function topsis(x: Matrix, weights: number[], directions: Direction[]): TopsisResult {
  check(x, directions);
  if (weights.length !== directions.length) throw new RangeError("one weight per criterion");
  const w = normaliseWeights(weights);
  const normalised = vectorNormalise(x);
  const weighted = normalised.map((row) => row.map((r, j) => r * w[j]));
  const n = directions.length;
  const best: number[] = [];
  const worst: number[] = [];
  for (let j = 0; j < n; j++) {
    const col = column(weighted, j);
    const hi = Math.max(...col);
    const lo = Math.min(...col);
    best.push(directions[j] === "benefit" ? hi : lo);
    worst.push(directions[j] === "benefit" ? lo : hi);
  }
  const distance = (row: number[], target: number[]) => Math.sqrt(sum(row.map((v, j) => (v - target[j]) ** 2)));
  const dPlus = weighted.map((row) => distance(row, best));
  const dMinus = weighted.map((row) => distance(row, worst));
  const closeness = dPlus.map((dp, i) => (dp + dMinus[i] > 0 ? dMinus[i] / (dp + dMinus[i]) : null));
  const order = [...closeness.keys()].sort((a, b) => (closeness[b] ?? -1) - (closeness[a] ?? -1) || a - b);
  return { normalised, weighted, best, worst, dPlus, dMinus, closeness, order };
}

export type EntropyResult = {
  /** Min–max scaled data in each criterion's direction (1 = best in that column). */
  scaled: Matrix;
  /** Proportions p_ij (columns sum to 1; a constant column is all 0). */
  proportions: Matrix;
  entropy: number[];
  divergence: number[];
  weights: number[];
};

/**
 * Entropy weights. A criterion that is the same for everyone carries no information:
 * its scaled column is 0, its entropy is taken as 1 and its weight is 0.
 */
export function entropyWeights(x: Matrix, directions: Direction[]): EntropyResult {
  check(x, directions);
  const m = x.length;
  if (m < 2) throw new RangeError("entropy weights need at least two alternatives");
  const n = directions.length;
  const lo = x[0].map((_, j) => Math.min(...column(x, j)));
  const hi = x[0].map((_, j) => Math.max(...column(x, j)));
  const scaled = x.map((row) =>
    row.map((v, j) => {
      const span = hi[j] - lo[j];
      if (span === 0) return 0;
      return directions[j] === "benefit" ? (v - lo[j]) / span : (hi[j] - v) / span;
    }),
  );
  const totals = x[0].map((_, j) => sum(column(scaled, j)));
  const proportions = scaled.map((row) => row.map((y, j) => (totals[j] > 0 ? y / totals[j] : 0)));
  const entropy = Array.from({ length: n }, (_, j) =>
    totals[j] > 0 ? -sum(column(proportions, j).map((p) => (p > 0 ? p * Math.log(p) : 0))) / Math.log(m) : 1,
  );
  const divergence = entropy.map((e) => 1 - e);
  if (!(sum(divergence) > 0)) throw new RangeError("no criterion distinguishes the alternatives");
  return { scaled, proportions, entropy, divergence, weights: normaliseWeights(divergence) };
}

/** 1-based rank of every alternative from an order (best first). */
export function ranksFromOrder(order: number[]): number[] {
  const ranks = Array(order.length).fill(0);
  order.forEach((alt, place) => (ranks[alt] = place + 1));
  return ranks;
}
