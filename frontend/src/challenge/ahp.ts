/**
 * 第 3 题用的极简 AHP：3 个准则、两两比较只取 1/3、1、3 三档。
 * 权重用几何平均法，一致性比率 CR = CI / RI（n = 3 时 RI = 0.58）。
 */

/** 一次比较：-1 = 前者更重要，0 = 一样，1 = 后者更重要 */
export type Pairwise = -1 | 0 | 1;

/** 比较顺序：(0,1) (0,2) (1,2)，即 兴趣-时间、兴趣-氛围、时间-氛围 */
export const PAIRS: [number, number][] = [
  [0, 1],
  [0, 2],
  [1, 2],
];

const ratio = (c: Pairwise) => (c === -1 ? 3 : c === 1 ? 1 / 3 : 1);

export function judgementMatrix(choices: Pairwise[]): number[][] {
  const m = [
    [1, 1, 1],
    [1, 1, 1],
    [1, 1, 1],
  ];
  PAIRS.forEach(([i, j], k) => {
    m[i][j] = ratio(choices[k]);
    m[j][i] = 1 / m[i][j];
  });
  return m;
}

export function ahpWeights(choices: Pairwise[]) {
  const m = judgementMatrix(choices);
  const geo = m.map((row) => Math.cbrt(row[0] * row[1] * row[2]));
  const sum = geo.reduce((s, v) => s + v, 0);
  const weights = geo.map((v) => v / sum);
  // λmax ≈ mean((A·w)_i / w_i)
  const lambda =
    m
      .map((row, i) => row.reduce((s, v, j) => s + v * weights[j], 0) / weights[i])
      .reduce((s, v) => s + v, 0) / 3;
  const ci = (lambda - 3) / 2;
  const cr = ci / 0.58;
  return { weights, cr, consistent: cr <= 0.1 };
}

export function rankClubs(weights: number[], clubs: { name: string; scores: number[] }[]) {
  return clubs
    .map((club, index) => ({
      ...club,
      index,
      total: club.scores.reduce((s, v, i) => s + v * weights[i], 0),
    }))
    .sort((a, b) => b.total - a.total || a.index - b.index);
}
