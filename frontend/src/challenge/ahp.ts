/**
 * 第 3 题用的 AHP（层次分析法），3 个准则。
 *
 * 权重部分是标准 AHP：
 * - 判断矩阵 A：a_ij = 准则 i 相对 j 的重要程度（Saaty 1–9 标度里取 1、3、5 三档及其倒数），a_ji = 1/a_ij；
 * - 权重 w = A 的主特征向量（归一化）。n = 3 时，行几何平均法与特征向量法结果完全相同，这里用几何平均算；
 * - 一致性：λmax = mean((A·w)_i / w_i)，CI = (λmax − 3)/2，CR = CI / RI，n = 3 时 RI = 0.58，CR ≤ 0.1 视为通过。
 *
 * 方案层是简化演示：社团在每个准则上的表现用题目给定的印象分（1–5）代替两两比较，
 * 按“占该准则总分的比例”换算成局部权重（分配模式），再加权求和：推荐指数_i = Σ_j w_j · p_ij。
 */

/** 一次比较的五档：-2 = 前者明显更重要，-1 = 前者稍微重要，0 = 一样，1 = 后者稍微重要，2 = 后者明显更重要 */
export type Judgement = -2 | -1 | 0 | 1 | 2;
export const JUDGEMENTS: Judgement[] = [-2, -1, 0, 1, 2];

/** 比较顺序：(0,1) (0,2) (1,2)，即 兴趣-时间、兴趣-氛围、时间-氛围 */
export const PAIRS: [number, number][] = [
  [0, 1],
  [0, 2],
  [1, 2],
];

const RATIO: Record<Judgement, number> = { [-2]: 5, [-1]: 3, 0: 1, 1: 1 / 3, 2: 1 / 5 };
export const RI_3 = 0.58;

export function judgementMatrix(choices: Judgement[]): number[][] {
  const m = [
    [1, 1, 1],
    [1, 1, 1],
    [1, 1, 1],
  ];
  PAIRS.forEach(([i, j], k) => {
    m[i][j] = RATIO[choices[k]];
    m[j][i] = 1 / m[i][j];
  });
  return m;
}

/** 方向上的关系：1 = i 比 j 重要，0 = 一样，-1 = j 比 i 重要 */
function relation(choices: Judgement[], i: number, j: number) {
  const k = PAIRS.findIndex(([a, b]) => (a === i && b === j) || (a === j && b === i));
  const sign = -Math.sign(choices[k]); // 负值表示前者更重要
  return PAIRS[k][0] === i ? sign : -sign;
}

/**
 * 方向矛盾：找不到任何一种先后顺序（允许并列）能同时满足三句判断。
 * 例如“兴趣>时间、时间>氛围、氛围>兴趣”，或“兴趣>时间、兴趣=氛围、时间=氛围”。
 */
export function hasContradiction(choices: Judgement[]) {
  for (let a = 0; a < 3; a++)
    for (let b = 0; b < 3; b++)
      for (let c = 0; c < 3; c++) {
        const rank = [a, b, c];
        if (PAIRS.every(([i, j]) => Math.sign(rank[i] - rank[j]) === relation(choices, i, j))) return false;
      }
  return true;
}

export type Consistency = "ok" | "magnitude" | "contradiction";

export function ahp(choices: Judgement[]) {
  const matrix = judgementMatrix(choices);
  const geo = matrix.map((row) => Math.cbrt(row[0] * row[1] * row[2]));
  const sum = geo.reduce((s, v) => s + v, 0);
  const weights = geo.map((v) => v / sum);
  const lambdaMax =
    matrix
      .map((row, i) => row.reduce((s, v, j) => s + v * weights[j], 0) / weights[i])
      .reduce((s, v) => s + v, 0) / 3;
  const ci = Math.max(0, (lambdaMax - 3) / 2);
  const cr = ci / RI_3;
  const consistency: Consistency = hasContradiction(choices) ? "contradiction" : cr > 0.1 ? "magnitude" : "ok";
  return { matrix, weights, lambdaMax, cr, consistency };
}

export type Club = { name: string; scores: number[] };

/** 方案层合成：p_ij = 社团 i 在准则 j 的印象分 / 该准则所有社团的印象分之和；推荐指数 = Σ_j w_j · p_ij（三家合计 1）。 */
export function synthesize(weights: number[], clubs: Club[]) {
  const columnSums = weights.map((_, j) => clubs.reduce((s, c) => s + c.scores[j], 0));
  return clubs.map((club, index) => {
    const parts = weights.map((w, j) => (w * club.scores[j]) / columnSums[j]);
    return { ...club, index, parts, total: parts.reduce((s, v) => s + v, 0) };
  });
}

/** 从高到低的名次（同分按原顺序）。 */
export const ranking = <T extends { total: number; index: number }>(rows: T[]) =>
  [...rows].sort((a, b) => b.total - a.total || a.index - b.index);

// ---------------------------------------------------------------------------
// 给玩家看的解释文字

/** “兴趣比时间稍微重要” / “兴趣和时间一样重要” */
export function describe(names: string[], choices: Judgement[], k: number) {
  const [i, j] = PAIRS[k];
  const c = choices[k];
  if (c === 0) return `${names[i]}和${names[j]}一样重要`;
  const [hi, lo] = c < 0 ? [i, j] : [j, i];
  return `${names[hi]}比${names[lo]}${Math.abs(c) === 2 ? "明显更重要" : "稍微重要"}`;
}

/** 一句话解释一致性检验的结果，内容只依据玩家这次的三句判断。 */
export function explainConsistency(names: string[], choices: Judgement[]) {
  const { matrix, weights, cr, consistency } = ahp(choices);
  const crText = `CR = ${cr.toFixed(2)}`;
  if (consistency === "ok") return { consistency, text: `三句判断前后一致（${crText}，标准是不超过 0.10）。` };
  if (consistency === "contradiction") {
    const said = [0, 1, 2].map((k) => describe(names, choices, k)).join("；");
    return { consistency, text: `你说了：${said}。这三句没法排出一个先后顺序——AHP 的一致性检验正是用来发现这种情况的（${crText}）。` };
  }
  // 方向没问题，只是轻重程度对不上：按权重排出 X ≥ Y ≥ Z，比较 a_XZ 与 a_XY·a_YZ
  const [x, y, z] = [0, 1, 2].sort((a, b) => weights[b] - weights[a] || a - b);
  const pair = (a: number, b: number) => describe(names, choices, PAIRS.findIndex(([p, q]) => (p === a && q === b) || (p === b && q === a)));
  const expected = matrix[x][y] * matrix[y][z];
  const tail =
    matrix[x][z] < expected
      ? `那${names[x]}比${names[z]}按理应该更明显地重要`
      : `那${names[x]}和${names[z]}按理不该差这么多`;
  return {
    consistency,
    text: `方向上没矛盾，但轻重有点对不上：${pair(x, y)}、${pair(y, z)}，${tail}（${crText}，略超 0.10 的常用标准）。真比赛里会回头调整判断，这里不影响推荐。`,
  };
}

/** 判断矩阵里的数写成分数，方便展示。 */
export const fraction = (v: number) => (v >= 1 ? String(Math.round(v)) : `1/${Math.round(1 / v)}`);
