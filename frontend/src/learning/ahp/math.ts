/**
 * AHP (analytic hierarchy process) calculations used by the lesson, the lab and the exercises.
 *
 * Method (stated to learners in §4 / §5):
 * - Weights = normalised principal eigenvector of the pairwise comparison matrix A.
 *   A is positive, so by Perron–Frobenius it has a unique largest real eigenvalue λmax with a
 *   strictly positive eigenvector. We find it by power iteration from the uniform vector,
 *   normalising to sum 1 each step, until the largest change is below 1e-12 (or 1000 steps).
 *   For positive matrices this converges; the rate depends on |λ2| / λmax.
 * - λmax = average of (Aw)_i / w_i at the converged w (equal to the eigenvalue at convergence).
 * - CI = (λmax − n) / (n − 1), CR = CI / RI(n), RI from Saaty's table; CR < 0.1 is acceptable.
 * Every result is checked against numpy.linalg.eig in ahp-verified.json (verify_ahp.py).
 */

export type Matrix = number[][];

/** Saaty's random consistency index RI(n), n = 1…9 (Saaty, 1980). */
export const RANDOM_INDEX: Record<number, number> = {
  1: 0,
  2: 0,
  3: 0.58,
  4: 0.9,
  5: 1.12,
  6: 1.24,
  7: 1.32,
  8: 1.41,
  9: 1.45,
};

/** The 1–9 scale words used in the lesson (even numbers are “between” values). */
export const SCALE_WORDS: Record<number, string> = {
  1: "同样重要",
  2: "介于同样与稍微之间",
  3: "稍微重要",
  4: "介于稍微与明显之间",
  5: "明显重要",
  6: "介于明显与强烈之间",
  7: "强烈重要",
  8: "介于强烈与极端之间",
  9: "极端重要",
};

/**
 * Slider position → judgment a_ij. Position 0 is “equally important” (1);
 * +k means the row item is (k+1) times as important; −k means the column item is.
 */
export function positionToValue(position: number): number {
  const k = Math.round(position);
  if (k < -8 || k > 8) throw new RangeError("scale position must be within −8…8");
  return k >= 0 ? k + 1 : 1 / (1 - k);
}

export function valueToPosition(value: number): number {
  if (!(value > 0)) throw new RangeError("judgment must be positive");
  return value >= 1 ? Math.round(value) - 1 : 1 - Math.round(1 / value);
}

/** Pretty judgment: 3 → “3”, 1/3 → “1/3”. */
export function formatJudgment(value: number): string {
  if (value >= 1) return String(Math.round(value * 1000) / 1000);
  const inverse = 1 / value;
  return Number.isInteger(Math.round(inverse * 1e9) / 1e9) ? `1/${Math.round(inverse)}` : value.toFixed(3);
}

/** Build a reciprocal matrix from its upper triangle, row by row: a12, a13, …, a23, … */
export function fromUpperTriangle(n: number, upper: number[]): Matrix {
  if (upper.length !== (n * (n - 1)) / 2) throw new RangeError("upper triangle has the wrong length");
  const a: Matrix = Array.from({ length: n }, () => Array(n).fill(1));
  let k = 0;
  for (let i = 0; i < n; i++)
    for (let j = i + 1; j < n; j++) {
      const v = upper[k++];
      if (!(v > 0)) throw new RangeError("judgments must be positive");
      a[i][j] = v;
      a[j][i] = 1 / v;
    }
  return a;
}

export function isReciprocal(a: Matrix, tolerance = 1e-9): boolean {
  const n = a.length;
  return a.every(
    (row, i) =>
      row.length === n &&
      row.every((v, j) => v > 0 && (i === j ? Math.abs(v - 1) <= tolerance : Math.abs(v * a[j][i] - 1) <= tolerance)),
  );
}

const normalise = (v: number[]) => {
  const s = v.reduce((a, b) => a + b, 0);
  return v.map((x) => x / s);
};
const multiply = (a: Matrix, w: number[]) => a.map((row) => row.reduce((s, v, j) => s + v * w[j], 0));

export type Eigen = { weights: number[]; lambdaMax: number; iterations: number; converged: boolean };

/** Principal eigenvector by power iteration (see file comment for why this converges). */
export function principalEigen(a: Matrix, tolerance = 1e-12, maxIterations = 1000): Eigen {
  const n = a.length;
  let w = Array(n).fill(1 / n);
  let iterations = 0;
  let converged = false;
  while (iterations < maxIterations) {
    iterations++;
    const next = normalise(multiply(a, w));
    const change = Math.max(...next.map((x, i) => Math.abs(x - w[i])));
    w = next;
    if (change < tolerance) {
      converged = true;
      break;
    }
  }
  const aw = multiply(a, w);
  const lambdaMax = aw.reduce((s, x, i) => s + x / w[i], 0) / n;
  return { weights: w, lambdaMax, iterations, converged };
}

/** 方根法 (hand method): n-th root of each row product, then normalise. */
export function geometricMeanWeights(a: Matrix): number[] {
  const n = a.length;
  return normalise(a.map((row) => Math.pow(row.reduce((p, v) => p * v, 1), 1 / n)));
}

/** 和积法 (hand method): normalise each column, then average across each row. */
export function columnNormalisedWeights(a: Matrix): number[] {
  const n = a.length;
  const sums = a[0].map((_, j) => a.reduce((s, row) => s + row[j], 0));
  return a.map((row) => row.reduce((s, v, j) => s + v / sums[j], 0) / n);
}

export type Consistency = { n: number; lambdaMax: number; ci: number; ri: number; cr: number | null; acceptable: boolean };

/** CI, RI, CR. For n ≤ 2 every reciprocal matrix is consistent and CR is not defined. */
export function consistency(a: Matrix, lambdaMax = principalEigen(a).lambdaMax): Consistency {
  const n = a.length;
  if (!(n in RANDOM_INDEX)) throw new RangeError("AHP judgment matrices here have 1…9 elements");
  const ci = n > 1 ? Math.max(0, (lambdaMax - n) / (n - 1)) : 0;
  const ri = RANDOM_INDEX[n];
  const cr = ri > 0 ? ci / ri : null;
  return { n, lambdaMax, ci, ri, cr, acceptable: cr === null || cr < 0.1 };
}

export type Analysis = Consistency & { weights: number[]; geometric: number[]; columnNormalised: number[] };

export function analyse(a: Matrix): Analysis {
  if (!isReciprocal(a)) throw new RangeError("not a positive reciprocal matrix");
  const eigen = principalEigen(a);
  return {
    ...consistency(a, eigen.lambdaMax),
    weights: eigen.weights,
    geometric: geometricMeanWeights(a),
    columnNormalised: columnNormalisedWeights(a),
  };
}

/**
 * The judgment that disagrees most with the weights implied by all the others:
 * largest |ln(a_ij · w_j / w_i)|. `implied` = w_i / w_j is what a consistent matrix would hold.
 */
export function mostInconsistentPair(a: Matrix, weights: number[]) {
  let best = { i: 0, j: 1, given: a[0]?.[1] ?? 1, implied: 1, deviation: 0 };
  for (let i = 0; i < a.length; i++)
    for (let j = i + 1; j < a.length; j++) {
      const implied = weights[i] / weights[j];
      const deviation = Math.abs(Math.log(a[i][j] / implied));
      if (deviation > best.deviation) best = { i, j, given: a[i][j], implied, deviation };
    }
  return best;
}

/** Nearest value on the 1–9 scale (including reciprocals) to a ratio. */
export function nearestScaleValue(ratio: number): number {
  const candidates = Array.from({ length: 17 }, (_, k) => positionToValue(k - 8));
  return candidates.reduce((best, v) => (Math.abs(Math.log(v / ratio)) < Math.abs(Math.log(best / ratio)) ? v : best));
}

/** Global priorities: Σ_k criterionWeight_k · local_k[alternative]. local[k][alt]. */
export function synthesise(criteriaWeights: number[], local: number[][]): number[] {
  if (local.length !== criteriaWeights.length) throw new RangeError("one local weight vector per criterion");
  const m = local[0].length;
  return Array.from({ length: m }, (_, alt) => criteriaWeights.reduce((s, w, k) => s + w * local[k][alt], 0));
}

/** Overall consistency of the alternative layer: Σ w_k CI_k / Σ w_k RI_k. */
export function overallCR(criteriaWeights: number[], layer: Consistency[]): number | null {
  const ri = criteriaWeights.reduce((s, w, k) => s + w * layer[k].ri, 0);
  if (ri === 0) return null;
  return criteriaWeights.reduce((s, w, k) => s + w * layer[k].ci, 0) / ri;
}
