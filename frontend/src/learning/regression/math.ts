/**
 * Linear regression by ordinary least squares, as taught in the lesson.
 *
 * Simple regression (§3–§5): b1 = Sxy / Sxx, b0 = ȳ − b1·x̄, where Sxx = Σ(x − x̄)², Sxy = Σ(x − x̄)(y − ȳ).
 * Multiple regression (§6): coefficients solve the normal equations (XᵀX)b = Xᵀy, X with a column of 1s.
 * Goodness of fit: SST = Σ(y − ȳ)², SSE = Σ(y − ŷ)², R² = 1 − SSE / SST,
 * adjusted R² = 1 − (SSE / (n − p − 1)) / (SST / (n − 1)) for p predictors.
 * Standard errors: s² = SSE / (n − p − 1), se(b_k) = sqrt(s² · [(XᵀX)⁻¹]_kk), t = b_k / se(b_k).
 * Every result is checked against numpy.linalg.lstsq, scipy.stats.linregress and statsmodels OLS
 * in regression-verified.json (verify_regression.py).
 */

const sum = (v: number[]) => v.reduce((s, x) => s + x, 0);
export const mean = (v: number[]) => {
  if (!v.length) throw new RangeError("no data");
  return sum(v) / v.length;
};

export type SimpleFit = {
  n: number;
  xBar: number;
  yBar: number;
  sxx: number;
  sxy: number;
  syy: number;
  intercept: number;
  slope: number;
  /** Pearson correlation coefficient. */
  r: number;
  fitted: number[];
  residuals: number[];
  sse: number;
  sst: number;
  ssr: number;
  r2: number;
};

function checkPairs(x: number[], y: number[]) {
  if (x.length !== y.length) throw new RangeError("x and y need the same length");
  if (x.length < 3) throw new RangeError("need at least three points");
  if ([...x, ...y].some((v) => !Number.isFinite(v))) throw new RangeError("data must be finite numbers");
}

export function simpleRegression(x: number[], y: number[]): SimpleFit {
  checkPairs(x, y);
  const n = x.length;
  const xBar = mean(x);
  const yBar = mean(y);
  const sxx = sum(x.map((v) => (v - xBar) ** 2));
  const syy = sum(y.map((v) => (v - yBar) ** 2));
  const sxy = sum(x.map((v, i) => (v - xBar) * (y[i] - yBar)));
  if (sxx === 0) throw new RangeError("all x are equal: the slope is not defined");
  const slope = sxy / sxx;
  const intercept = yBar - slope * xBar;
  const fitted = x.map((v) => intercept + slope * v);
  const residuals = y.map((v, i) => v - fitted[i]);
  const sse = sum(residuals.map((e) => e * e));
  const sst = syy;
  return {
    n,
    xBar,
    yBar,
    sxx,
    sxy,
    syy,
    intercept,
    slope,
    r: syy === 0 ? 0 : sxy / Math.sqrt(sxx * syy),
    fitted,
    residuals,
    sse,
    sst,
    ssr: sst - sse,
    r2: sst === 0 ? 1 : 1 - sse / sst,
  };
}

/** Sum of squared residuals of any line y = b0 + b1·x (the lab's hand-drawn line). */
export function sseOf(x: number[], y: number[], b0: number, b1: number): number {
  return sum(y.map((v, i) => (v - b0 - b1 * x[i]) ** 2));
}

/** Solve A·z = b by Gaussian elimination with partial pivoting; throws when A is singular. */
export function solve(a: number[][], b: number[]): number[] {
  const n = a.length;
  const m = a.map((row, i) => [...row, b[i]]);
  for (let c = 0; c < n; c++) {
    let pivot = c;
    for (let r = c + 1; r < n; r++) if (Math.abs(m[r][c]) > Math.abs(m[pivot][c])) pivot = r;
    const scale = Math.max(...m.map((row) => Math.abs(row[c])), 1);
    if (Math.abs(m[pivot][c]) < 1e-12 * scale) throw new RangeError("the predictors are linearly dependent");
    [m[c], m[pivot]] = [m[pivot], m[c]];
    for (let r = 0; r < n; r++) {
      if (r === c) continue;
      const f = m[r][c] / m[c][c];
      for (let k = c; k <= n; k++) m[r][k] -= f * m[c][k];
    }
  }
  return m.map((row, i) => row[n] / row[i]);
}

/** Inverse of a small symmetric positive-definite matrix, column by column. */
export function inverse(a: number[][]): number[][] {
  const n = a.length;
  const columns = Array.from({ length: n }, (_, j) => solve(a, Array.from({ length: n }, (_, i) => (i === j ? 1 : 0))));
  return Array.from({ length: n }, (_, i) => columns.map((col) => col[i]));
}

export type MultipleFit = {
  n: number;
  /** Number of predictors p (the intercept is not counted). */
  p: number;
  /** [b0, b1, …, bp]. */
  coefficients: number[];
  fitted: number[];
  residuals: number[];
  sse: number;
  sst: number;
  r2: number;
  adjustedR2: number;
  /** Residual variance s² = SSE / (n − p − 1). */
  sigma2: number;
  standardErrors: number[];
  tStats: number[];
};

/** OLS with an intercept. `predictors` holds one array per predictor (column), each of length n. */
export function multipleRegression(predictors: number[][], y: number[]): MultipleFit {
  const n = y.length;
  const p = predictors.length;
  if (p < 1) throw new RangeError("need at least one predictor");
  if (predictors.some((col) => col.length !== n)) throw new RangeError("every predictor needs one value per observation");
  if (n <= p + 1) throw new RangeError("need more observations than coefficients");
  if ([...predictors.flat(), ...y].some((v) => !Number.isFinite(v))) throw new RangeError("data must be finite numbers");
  const rows = y.map((_, i) => [1, ...predictors.map((col) => col[i])]);
  const k = p + 1;
  const xtx = Array.from({ length: k }, (_, a) => Array.from({ length: k }, (_, b) => sum(rows.map((r) => r[a] * r[b]))));
  const xty = Array.from({ length: k }, (_, a) => sum(rows.map((r, i) => r[a] * y[i])));
  const coefficients = solve(xtx, xty);
  const fitted = rows.map((r) => sum(r.map((v, j) => v * coefficients[j])));
  const residuals = y.map((v, i) => v - fitted[i]);
  const yBar = mean(y);
  const sse = sum(residuals.map((e) => e * e));
  const sst = sum(y.map((v) => (v - yBar) ** 2));
  const sigma2 = sse / (n - k);
  const inv = inverse(xtx);
  const standardErrors = inv.map((row, j) => Math.sqrt(sigma2 * row[j]));
  return {
    n,
    p,
    coefficients,
    fitted,
    residuals,
    sse,
    sst,
    r2: 1 - sse / sst,
    adjustedR2: 1 - sse / (n - k) / (sst / (n - 1)),
    sigma2,
    standardErrors,
    tStats: coefficients.map((b, j) => b / standardErrors[j]),
  };
}

/** ŷ = b0 + Σ b_k x_k. */
export function predict(coefficients: number[], values: number[]): number {
  if (values.length !== coefficients.length - 1) throw new RangeError("one value per predictor");
  return coefficients[0] + sum(values.map((v, i) => v * coefficients[i + 1]));
}

// ---- Student t distribution (for p-values and prediction intervals) ----

/** ln Γ(z) for z > 0 (Lanczos approximation, g = 7, n = 9; relative error < 1e-13). */
export function logGamma(z: number): number {
  const c = [
    0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059,
    12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7,
  ];
  if (z < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * z)) - logGamma(1 - z);
  z -= 1;
  let a = c[0];
  const t = z + 7.5;
  for (let i = 1; i < 9; i++) a += c[i] / (z + i);
  return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(a);
}

/** Continued fraction for the incomplete beta function (modified Lentz). */
function betaContinuedFraction(a: number, b: number, x: number): number {
  const tiny = 1e-300;
  let c = 1;
  let d = 1 - ((a + b) * x) / (a + 1);
  if (Math.abs(d) < tiny) d = tiny;
  d = 1 / d;
  let h = d;
  for (let m = 1; m <= 300; m++) {
    const m2 = 2 * m;
    let aa = (m * (b - m) * x) / ((a + m2 - 1) * (a + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < tiny) d = tiny;
    c = 1 + aa / c;
    if (Math.abs(c) < tiny) c = tiny;
    d = 1 / d;
    h *= d * c;
    aa = (-(a + m) * (a + b + m) * x) / ((a + m2) * (a + m2 + 1));
    d = 1 + aa * d;
    if (Math.abs(d) < tiny) d = tiny;
    c = 1 + aa / c;
    if (Math.abs(c) < tiny) c = tiny;
    d = 1 / d;
    const delta = d * c;
    h *= delta;
    if (Math.abs(delta - 1) < 1e-15) break;
  }
  return h;
}

/** Regularized incomplete beta I_x(a, b). */
export function incompleteBeta(x: number, a: number, b: number): number {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  const front = Math.exp(logGamma(a + b) - logGamma(a) - logGamma(b) + a * Math.log(x) + b * Math.log(1 - x));
  return x < (a + 1) / (a + b + 2)
    ? (front * betaContinuedFraction(a, b, x)) / a
    : 1 - (front * betaContinuedFraction(b, a, 1 - x)) / b;
}

/** P(T ≤ t) for Student's t with `df` degrees of freedom. */
export function studentTCdf(t: number, df: number): number {
  if (!(df > 0)) throw new RangeError("degrees of freedom must be positive");
  const tail = 0.5 * incompleteBeta(df / (df + t * t), df / 2, 0.5);
  return t >= 0 ? 1 - tail : tail;
}

/** Two-sided p-value of a t statistic. */
export const twoSidedP = (t: number, df: number) => 2 * (1 - studentTCdf(Math.abs(t), df));

/** The t value with P(T ≤ t) = p (bisection on the CDF; |error| < 1e-12). */
export function tQuantile(p: number, df: number): number {
  if (!(p > 0 && p < 1)) throw new RangeError("p must be between 0 and 1");
  let lo = -1e3;
  let hi = 1e3;
  for (let i = 0; i < 200 && hi - lo > 1e-13; i++) {
    const mid = (lo + hi) / 2;
    if (studentTCdf(mid, df) < p) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

/**
 * 95 % (or other) prediction interval for one new observation at `values`:
 * ŷ ± t · sqrt(s² · (1 + x₀ᵀ(XᵀX)⁻¹x₀)), x₀ = (1, values…), df = n − p − 1.
 */
export function predictionInterval(predictors: number[][], y: number[], values: number[], level = 0.95) {
  const fit = multipleRegression(predictors, y);
  const rows = y.map((_, i) => [1, ...predictors.map((col) => col[i])]);
  const k = fit.p + 1;
  const xtx = Array.from({ length: k }, (_, a) => Array.from({ length: k }, (_, b) => sum(rows.map((r) => r[a] * r[b]))));
  const inv = inverse(xtx);
  const x0 = [1, ...values];
  const leverage = sum(x0.map((u, a) => sum(x0.map((v, b) => u * inv[a][b] * v))));
  const center = predict(fit.coefficients, values);
  const half = tQuantile(1 - (1 - level) / 2, fit.n - k) * Math.sqrt(fit.sigma2 * (1 + leverage));
  return { center, lower: center - half, upper: center + half };
}
