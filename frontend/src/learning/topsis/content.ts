/**
 * TOPSIS 综合评价精讲。Original teaching text; every number shown is computed here from
 * data.ts with math.ts (itself verified against numpy / scipy), never typed in by hand.
 */
import python from "./examples/topsis_rooms.py?raw";
import type { Block } from "../content";
import type { BridgeBlock } from "../CourseBridge";
import { analyse, formatJudgment, fromUpperTriangle } from "../ahp/math";
import { AHP_UPPER, CRITERIA, DATA, DIRECTIONS, EXTRA_ROOM, EXTRA_ROW, HAND_COLUMN, ROOMS } from "./data";
import { columnNorms, entropyWeights, topsis, type Direction } from "./math";
import { TOPSIS_SECTIONS } from "./sectionIds";

export type TopsisBlock = Block | BridgeBlock | { type: "topsis-plane" } | { type: "topsis-lab" };
export type TopsisSection = { id: string; title: string; lead: string; blocks: TopsisBlock[] };

const f3 = (x: number) => x.toFixed(3);
const f4 = (x: number) => x.toFixed(4);
const p = (text: string): TopsisBlock => ({ type: "p", text });
const note = (text: string): TopsisBlock => ({ type: "note", text });
const formula = (text: string): TopsisBlock => ({ type: "formula", text });

// ---- Computed results used in the text ----
export const ahpCriteria = analyse(fromUpperTriangle(4, AHP_UPPER));
export const ahpWeights = ahpCriteria.weights;
export const result = topsis(DATA, ahpWeights, DIRECTIONS);
export const equalResult = topsis(DATA, [1, 1, 1, 1], DIRECTIONS);
export const entropy = entropyWeights(DATA, DIRECTIONS);
export const entropyResult = topsis(DATA, entropy.weights, DIRECTIONS);
export const sixResult = topsis([...DATA, EXTRA_ROW], ahpWeights, DIRECTIONS);
const flipped: Direction[] = ["benefit", ...DIRECTIONS.slice(1)];
export const rentAsBenefit = topsis(DATA, ahpWeights, flipped);
/** The common “正向化” variant: cost columns rewritten as max − x, then every column is a benefit. */
const shiftedData = DATA.map((row) =>
  row.map((v, j) => (DIRECTIONS[j] === "cost" ? Math.max(...DATA.map((r) => r[j])) - v : v)),
);
export const shiftedResult = topsis(shiftedData, ahpWeights, ["benefit", "benefit", "benefit", "benefit"]);
const norms = columnNorms(DATA);
const handNorm = Math.hypot(...HAND_COLUMN);

const names: string[] = ROOMS.map((r) => r.name);
const sixNames = [...names, EXTRA_ROOM.name];
const C = result.closeness as number[];
const rankOf = (order: number[], i: number) => order.indexOf(i) + 1;
const chain = (order: number[], list = names) => order.map((i) => list[i]).join(" > ");
const [first, second] = result.order;
const cheapest = DATA.reduce((best, row, i) => (row[0] < DATA[best][0] ? i : best), 0);
/** Which room attains a column's extreme in the weighted matrix. */
const attains = (target: number[], j: number) =>
  names.filter((_, i) => Math.abs(result.weighted[i][j] - target[j]) < 1e-12).join("、");
const criterionNames = CRITERIA.map((c) => c.name);
const dirWord = (d: Direction) => (d === "benefit" ? "效益型（越大越好）" : "成本型（越小越好）");
const ahpMatrix = fromUpperTriangle(4, AHP_UPPER);
/** “理想房的月租取自丙，通勤、面积、配套取自戊” from the weighted matrix. */
const composition = (target: number[]) => {
  const groups = new Map<string, string[]>();
  target.forEach((_, j) => {
    const who = attains(target, j);
    groups.set(who, [...(groups.get(who) ?? []), criterionNames[j]]);
  });
  return [...groups].map(([who, list]) => `${list.join("、")}取自${who}`).join("，");
};
const ratio = DATA[4][0] / DATA[2][0];

export const topsisSections: TopsisSection[] = [
  {
    id: "rooms",
    title: TOPSIS_SECTIONS[0].title,
    lead: "接着 AHP 那一课往下走",
    blocks: [
      p(
        "在层次分析法（AHP）那一课里，小林用两两比较选中了 B 研究所。实习要持续两个月，他还得在研究所附近租一间房。中介发来五套合租房的信息：",
      ),
      {
        type: "table",
        caption: "表 1 · 五套房的原始数据（原创教学数据）",
        headers: ["房源", ...CRITERIA.map((c) => `${c.name}（${c.unit}）`)],
        rows: DATA.map((row, i) => [names[i], ...row.map(String)]),
      },
      p(
        "每一套都有长处：丙最便宜，戊离得最近、面积最大、配套最多，可是也最贵。这一次能不能再用 AHP？可以，但很费力：除了 4 个准则之间的 6 次比较，还要在每个准则下把 5 套房两两比较，4 × 10 = 40 次。更重要的是，月租、通勤这些都是量得出来的数据，“甲的月租比乙好几倍”这种判断，等于把手里的精确数字换成了粗糙的感觉。",
      ),
      p(
        "当方案有现成的指标数据时，常用 TOPSIS（逼近理想解排序法，Technique for Order Preference by Similarity to Ideal Solution），由 Hwang 和 Yoon 在 1981 年提出。它的想法只有一句话：先想象一套“每项都最好”的理想房和一套“每项都最差”的最差房，再看每套真实的房子离理想有多近、离最差有多远。",
      ),
      p(
        "这门课按 TOPSIS 的计算顺序展开：先确定每个指标的方向，再把不同单位的数据变成可以比较的数，用 AHP 求出的权重加权，找出理想房与最差房，最后计算距离和贴近度并排名。",
      ),
      note(
        "这是为教学设计的原创案例，数据不是真实房源。“配套”指步行 10 分钟内的超市、食堂、药店等生活设施的个数。",
      ),
      { type: "question", id: "topsis-think-1" },
    ],
  },
  {
    id: "direction",
    title: TOPSIS_SECTIONS[1].title,
    lead: "先分清每个指标的方向",
    blocks: [
      p(
        "评价之前先问每个指标：数值越大越好，还是越小越好？数值越大越好的叫效益型指标，例如面积、配套；数值越小越好的叫成本型指标，例如月租、通勤时间。",
      ),
      {
        type: "table",
        caption: "表 2 · 四个指标的方向",
        headers: ["指标", "类型", "理由"],
        rows: CRITERIA.map((c) => [c.name, dirWord(c.direction), c.note]),
      },
      p(
        "方向由评价目标决定，而不是由单位决定。同样是“价格”，对租房的人是成本型，对房东就是效益型。还有一类指标“适中最好”，例如室内温度以 22 ℃ 左右最舒适，太高太低都不好。这类指标要先换算成“离最佳值有多远”，例如 |x − 22|，它就变成了成本型。本课只用到效益型和成本型。",
      ),
      p(
        "TOPSIS 不需要改写原始数据来统一方向：方向只在第 5 节“找最好、最差的值”时用到。效益型取最大值作为最好，成本型取最小值作为最好。很多教程会先把成本型指标“正向化”（例如改成 max − x），这样做会改变计算结果，第 9 节会专门比较。",
      ),
      { type: "question", id: "topsis-think-2" },
    ],
  },
  {
    id: "normalise",
    title: TOPSIS_SECTIONS[2].title,
    lead: "去掉单位，保留比例",
    blocks: [
      p(
        "月租是几千元，配套只有几个，单位也各不相同。直接比较，月租的数字会压倒一切。所以先把每一列都变成没有单位、大小相近的数，这一步叫标准化。经典 TOPSIS 用的是向量标准化：每个数除以它所在那一列的“长度”。",
      ),
      formula(String.raw`r_{ij}=\frac{x_{ij}}{\sqrt{\sum_{k=1}^{m}x_{kj}^{2}}}`),
      p(
        "式中 xᵢⱼ 是第 i 个方案在第 j 个指标上的原始值，m 是方案个数（这里 m = 5），Σ 表示把第 j 列的 m 个平方加起来。分母就是把这一列看成一个向量时的长度，和勾股定理“直角边平方和再开方”是同一个意思。",
      ),
      p(
        `先手算一个小例子：某一列是 (${HAND_COLUMN.join(", ")})，长度是 √(${HAND_COLUMN.map((x) => `${x}²`).join(" + ")}) = √${HAND_COLUMN.reduce((s, x) => s + x * x, 0)} = ${handNorm}，标准化后是 (${HAND_COLUMN.map((x) => `${x}/${handNorm}`).join(", ")}) ≈ (${HAND_COLUMN.map((x) => f3(x / handNorm)).join(", ")})。`,
      ),
      p(
        `向量标准化有三个好处。第一，单位被约掉了：元除以元、分钟除以分钟，结果是纯数。第二，换单位不改变结果：把月租写成千元，分子分母同时缩小 1000 倍。第三，同一列里的比例不变：标准化前戊的月租是丙的 ${DATA[4][0]} / ${DATA[2][0]} ≈ ${ratio.toFixed(2)} 倍，标准化后还是 ${(result.normalised[4][0] / result.normalised[2][0]).toFixed(2)} 倍。注意，它不会改变指标的方向，成本型的月租标准化后依然是越小越好。`,
      ),
      {
        type: "table",
        caption: "表 3 · 各列的长度与标准化后的矩阵 R（保留 4 位小数）",
        headers: ["房源", ...criterionNames],
        rows: [
          ["列长度 √Σx²", ...norms.map((v) => v.toFixed(2))],
          ...result.normalised.map((row, i) => [names[i], ...row.map(f4)]),
        ],
      },
      note(
        "标准化的方法不止一种：还有极差标准化 (x − min) / (max − min)、比重标准化 x / Σx 等。不同方法得到的排名可能不同。经典 TOPSIS 用向量标准化；如果比赛论文用了别的方法，要写明并说明理由。",
      ),
    ],
  },
  {
    id: "weights",
    title: TOPSIS_SECTIONS[3].title,
    lead: "AHP 定权重，数据评方案",
    blocks: [
      p(
        "标准化之后，四个指标在数值上平起平坐。可小林并不同等看待它们：他是学生，房租最要紧。指标有多重要，要靠权重表达。权重从哪里来？正好用上一门课的方法。",
      ),
      {
        type: "course-bridge",
        to: "/learn/ahp#weights",
        kicker: "回顾 · 层次分析法",
        title: "判断矩阵 → 特征向量 → 权重 → 一致性检验",
        text: "忘了权重怎么从判断矩阵算出来？回到 AHP 第 4、5 节复习，再回来继续。",
      },
      p(
        "小林这次只需要比较 4 个准则，共 6 次判断：月租比通勤略重要（2），比面积稍微重要（3），比配套重要得再多一些（4，介于稍微与明显之间）；通勤比面积、比配套都略重要（2）；面积与配套同样重要（1）。",
      ),
      {
        type: "table",
        caption: "表 4 · 小林的准则判断矩阵（行比列重要几倍）",
        headers: ["", ...criterionNames],
        rows: ahpMatrix.map((row, i) => [criterionNames[i], ...row.map(formatJudgment)]),
      },
      p(
        `按 AHP 的特征向量法，四个准则的权重依次为 ${ahpWeights.map(f3).join("、")}；λmax = ${f4(ahpCriteria.lambdaMax)}，CR = ${f4(ahpCriteria.cr!)} < 0.1，一致性可以接受。`,
      ),
      p("把标准化矩阵的每一列乘以对应的权重，得到加权标准化矩阵 V："),
      formula(String.raw`v_{ij}=w_j\,r_{ij},\qquad \sum_{j=1}^{n}w_j=1`),
      {
        type: "table",
        caption: "表 5 · 加权标准化矩阵 V = 权重 × R（保留 4 位小数）",
        headers: ["房源", ...criterionNames.map((n, j) => `${n} × ${f3(ahpWeights[j])}`)],
        rows: result.weighted.map((row, i) => [names[i], ...row.map(f4)]),
      },
      p(
        "乘上权重后，权重大的月租、通勤两列，各房之间的差距明显大于面积、配套两列，在后面算距离时说话更有分量；面积、配套的权重小，原始数据差别再大，在距离里也只占一小部分。",
      ),
      note(
        "分工很清楚：AHP 只回答“四个准则各有多重要”（主观判断，6 次比较，要做一致性检验）；五套房谁好谁坏，交给真实数据和 TOPSIS。“AHP 定权 + TOPSIS 排序”是比赛评价类论文最常见的组合之一。",
      ),
    ],
  },
  {
    id: "ideal",
    title: TOPSIS_SECTIONS[4].title,
    lead: "两套想象出来的房子",
    blocks: [
      p(
        "在加权矩阵 V 的每一列里挑出最好的值，拼在一起就是正理想解 A⁺；挑出最差的值拼在一起，就是负理想解 A⁻。效益型的最好是最大值，成本型的最好是最小值，这一步终于用上了第 2 节的方向。",
      ),
      formula(
        String.raw`A^{+}_j=\begin{cases}\max_i v_{ij}, & j\ \text{为效益型}\\ \min_i v_{ij}, & j\ \text{为成本型}\end{cases}\qquad A^{-}_j=\begin{cases}\min_i v_{ij}, & j\ \text{为效益型}\\ \max_i v_{ij}, & j\ \text{为成本型}\end{cases}`,
      ),
      {
        type: "table",
        caption: "表 6 · 正理想解与负理想解（加权后的值，括号内是取到它的房源）",
        headers: ["", ...criterionNames],
        rows: [
          ["A⁺ 理想房", ...result.best.map((v, j) => `${f4(v)}（${attains(result.best, j)}）`)],
          ["A⁻ 最差房", ...result.worst.map((v, j) => `${f4(v)}（${attains(result.worst, j)}）`)],
        ],
      },
      p(
        `理想房的${composition(result.best)}；最差房的${composition(result.worst)}。这样的房子并不存在。正理想解和负理想解都是“拼出来”的参照点，作用就像地图上的两个路标，用来衡量每套真实的房子。`,
      ),
      p(
        "下图只取月租和面积两个指标，在平面上画出五套房、理想房和最差房。点一套房，看它到两个参照点的距离。真实计算用的是 4 个指标，原理完全相同，只是没法画在纸上。",
      ),
      { type: "topsis-plane" },
      { type: "question", id: "topsis-think-3" },
    ],
  },
  {
    id: "closeness",
    title: TOPSIS_SECTIONS[5].title,
    lead: "离理想多近，离最差多远",
    blocks: [
      p(
        "每套房到理想房的距离记作 D⁺，到最差房的距离记作 D⁻。这里的距离就是平面上两点间距离公式的推广：每个指标上的差平方后相加，再开平方。",
      ),
      formula(
        String.raw`D_i^{+}=\sqrt{\sum_{j=1}^{n}\left(v_{ij}-A_j^{+}\right)^2},\qquad D_i^{-}=\sqrt{\sum_{j=1}^{n}\left(v_{ij}-A_j^{-}\right)^2}`,
      ),
      p(
        "D⁺ 越小越好，D⁻ 越大越好。只看其中一个够不够？不够：两套房可能离理想房一样近，但其中一套也离最差房很近（例如某一项极差）。TOPSIS 把两个距离合成一个数，叫相对贴近度 C：",
      ),
      formula(String.raw`C_i=\frac{D_i^{-}}{D_i^{+}+D_i^{-}},\qquad 0\le C_i\le 1`),
      p(
        "如果某套房恰好就是最差房，D⁻ = 0，C = 0；恰好就是理想房，D⁺ = 0，C = 1。C 越大，排名越靠前。",
      ),
      {
        type: "table",
        caption: "表 7 · 距离、贴近度与排名（AHP 权重）",
        headers: ["房源", "D⁺", "D⁻", "C = D⁻ / (D⁺ + D⁻)", "排名"],
        rows: names.map((n, i) => [n, f4(result.dPlus[i]), f4(result.dMinus[i]), f4(C[i]), String(rankOf(result.order, i))]),
      },
      p(
        `排名是 ${chain(result.order)}。${names[first]}（C = ${f3(C[first])}）第一，${names[second]}（${f3(C[second])}）第二。${names[first]}没有哪一项是最好的，但月租中等、通勤 ${DATA[first][1]} 分钟、面积和配套都不差，在小林看重的方向上最均衡。最便宜的${names[cheapest]}排在第 ${rankOf(result.order, cheapest)}：它省下的房租，抵不过 ${DATA[cheapest][1]} 分钟的通勤和最少的配套。`,
      ),
      note(
        `贴近度 C 是相对的：它只说明在这五套房、这组权重下谁更接近理想，不是百分制分数，也不能和另一次评价的 C 直接比较。“${names[first]}的 C = ${f3(C[first])}”不表示${names[first]}“好 ${Math.round(C[first] * 100)}%”。`,
      ),
      p("下面的实验用的就是这套计算。换权重、改指标方向、加入一套新房源，看看排名怎么变。"),
      { type: "topsis-lab" },
    ],
  },
  {
    id: "entropy",
    title: TOPSIS_SECTIONS[6].title,
    lead: "让数据自己说话",
    blocks: [
      p(
        "如果没有可靠的主观判断，比如评价几十个城市、指标是统计年鉴里的数据，也可以让数据本身决定权重。熵权法的想法是：在某个指标上，如果所有方案都差不多，这个指标就分不出高低，权重应该小；差别越大，提供的信息越多，权重越大。",
      ),
      p("计算分四步。第一步，按方向把每列缩放到 0 到 1：效益型 y = (x − min) / (max − min)，成本型 y = (max − x) / (max − min)，这样 1 总是该列最好的。第二步，把每列变成比重 pᵢⱼ = yᵢⱼ / Σᵢ yᵢⱼ。"),
      p("第三步，计算每列的信息熵 e。熵是信息论中衡量“分布有多均匀”的量：比重越平均，e 越接近 1；越集中在少数方案上，e 越小。约定 0 · ln 0 = 0。第四步，差异系数 d = 1 − e，归一化后就是权重。"),
      formula(String.raw`e_j=-\frac{1}{\ln m}\sum_{i=1}^{m}p_{ij}\ln p_{ij},\qquad d_j=1-e_j,\qquad w_j=\frac{d_j}{\sum_{k=1}^{n}d_k}`),
      {
        type: "table",
        caption: "表 8 · 熵权法与 AHP 权重对比",
        headers: ["", ...criterionNames],
        rows: [
          ["信息熵 e", ...entropy.entropy.map(f4)],
          ["差异系数 d = 1 − e", ...entropy.divergence.map(f4)],
          ["熵权 w", ...entropy.weights.map(f3)],
          ["AHP 权重（小林）", ...ahpWeights.map(f3)],
        ],
      },
      p(
        `五套房在四个指标上的差异程度相近，熵权几乎平均，面积略高（${f3(entropy.weights[2])}）。用熵权做 TOPSIS，排名变成 ${chain(entropyResult.order)}，和 AHP 权重的 ${chain(result.order)} 不同。`,
      ),
      p(
        "两种权重回答的是不同的问题：熵权衡量“这个指标把方案区分得多开”，AHP 衡量“这个指标对决策者有多重要”。月租对小林最重要，可它在五套房之间的差异并不比别的指标更突出，所以熵权只给了 " +
          f3(entropy.weights[0]) +
          "。没有对错之分，要看题目要的是哪一种。比赛中也常把两者组合，例如 w = α·w主观 + (1 − α)·w客观，但 α 怎么取必须说明理由，并做敏感性分析。",
      ),
      note(
        "熵权法也有不同写法：有的先用极差缩放（本课），有的直接用原始数据求比重，有的给 0 加一个很小的数避免 ln 0。不同写法的权重会有差别，论文中应写清楚公式。某一列所有方案都相同时，它不提供信息，本课约定它的熵为 1、权重为 0。",
      ),
    ],
  },
  {
    id: "python",
    title: TOPSIS_SECTIONS[7].title,
    lead: "用代码核对每一个数",
    blocks: [
      p("下面的程序用 NumPy 从头计算 AHP 权重、熵权和三种权重下的 TOPSIS 排名，可以用来核对手算和上面的实验。"),
      { type: "code", text: python },
      p(
        `运行后应得到：AHP 权重 ${ahpWeights.map(f3).join("、")}，CR = ${f4(ahpCriteria.cr!)}；AHP 权重下贴近度 ${names.map((n, i) => `${n} ${f3(C[i])}`).join("、")}，排名 ${chain(result.order)}；等权重下排名 ${chain(equalResult.order)}；熵权下排名 ${chain(entropyResult.order)}。`,
      ),
      note(
        "程序中 np.where(benefit, …, …) 按方向逐列选取最大或最小值；X.sum(axis=0) 是按列求和。若要处理更多方案或指标，只需修改矩阵 X、方向 benefit 和判断矩阵 A，不必改动函数。",
      ),
    ],
  },
  {
    id: "limits",
    title: TOPSIS_SECTIONS[8].title,
    lead: "把结论放进检验里",
    blocks: [
      p(
        `权重敏感。同一份数据，AHP 权重下 ${names[first]} 第一；四个指标等权重时，排名变成 ${chain(equalResult.order)}。结论依赖权重，所以论文里要做敏感性分析：在合理范围内变动权重，看排名是否稳定，并如实报告排名会在什么条件下改变。`,
      ),
      p(
        `方向写反。把月租误当成越大越好，最贵的戊会得到 C = ${f3(rentAsBenefit.closeness[4]!)}：它的每一项都成了“最好”。排名第一却是最贵的房子，这样的结果一眼就该怀疑。每个指标的方向都要单独核对。`,
      ),
      p(
        `逆序现象。假设中介又发来一套${EXTRA_ROOM.name}：月租 ${EXTRA_ROW[0]} 元、通勤 ${EXTRA_ROW[1]} 分钟、${EXTRA_ROW[2]} m²，但周边只有 ${EXTRA_ROW[3]} 处配套。重新计算后，${EXTRA_ROOM.name}只排第 ${rankOf(sixResult.order, 5)}，可原来的五套之间顺序却变了：${chain(sixResult.order, sixNames)}，${names[sixResult.order[0]]}超过了${names[first]}。原因是标准化用的列长度、理想解和负理想解都取决于参与比较的全体方案：${EXTRA_ROOM.name}带来了更短的通勤和更少的配套，参照点移动了。`,
      ),
      p(
        "所以，用 TOPSIS 之前要先确定候选方案的范围，不要边算边加；如果方案集合确实会变，应在论文中说明，并比较加入前后的排名。在实验里勾选“加入新房源”，可以亲眼看到这个现象。",
      ),
      p(
        `“正向化”的不同做法。不少教程先把成本型指标改成 max − x，再按效益型计算。这一步并不等价：向量标准化保留的是比例，而减法改变了比例（最贵的房子月租变成 0）。本例用 max − x 正向化后，排名变成 ${chain(shiftedResult.order)}。两种做法在文献和教程中都能见到，没有唯一的标准答案，但论文必须写清楚用的是哪一种，最好再检验结论是否依赖这个选择。`,
      ),
      p("指标重复。如果同时使用“面积”和“房间数”，两个高度相关的指标会把同一件事算两次。建立指标体系时，先检查指标之间是否含义重叠、是否高度相关。"),
      note(
        "常见错误：成本型指标方向写反；把贴近度当成百分制分数；权重没有来源或说明；换了标准化方法却不交代；只报告一种权重下的排名，没有敏感性分析；方案集合变了还直接沿用旧结论。",
      ),
    ],
  },
  {
    id: "topsis-self-test",
    title: TOPSIS_SECTIONS[9].title,
    lead: "不计成绩，检查自己是否理解",
    blocks: [
      p("下面三道题对应本章最容易混淆的三个概念。点“核对”即时反馈，不计成绩；想系统练习，可以进入专项练习。"),
      { type: "question", id: "topsis-self-1" },
      { type: "question", id: "topsis-self-2" },
      { type: "question", id: "topsis-self-3" },
    ],
  },
  {
    id: "topsis-transfer",
    title: TOPSIS_SECTIONS[10].title,
    lead: "从选一间房到一道评价题",
    blocks: [
      p(
        "竞赛中的评价类题目（城市宜居度、高校综合实力、供应商选择等）常用这一套流程：建立指标体系并说明每个指标的含义和方向 → 收集数据并标准化 → 确定权重（AHP 主观权重、熵权法客观权重，或两者组合）→ TOPSIS 计算贴近度并排名 → 敏感性与稳健性分析 → 解释结果并给出建议。",
      ),
      p(
        "写论文时，请列出原始数据表（或来源）、指标方向、标准化方法、权重及其来源（AHP 要给出判断矩阵和 CR）、正负理想解、每个方案的 D⁺、D⁻、C 和排名，让读者可以逐步复核。",
      ),
      p("想练完整流程，可以用七关实战中的“校园食堂服务质量综合评价”教学案例：它用熵权法定权重、TOPSIS 排序，从读题、建立指标体系一直走到论文框架。"),
      {
        type: "course-bridge",
        to: "/learn/ahp",
        kicker: "相关精讲",
        title: "层次分析法（AHP）",
        text: "需要主观权重时，回到 AHP：画层次结构、构造判断矩阵、求权重并做一致性检验。",
      },
      note(
        "参考：Hwang, C.-L., & Yoon, K. (1981). Multiple Attribute Decision Making: Methods and Applications. Springer；Shannon, C. E. (1948). A Mathematical Theory of Communication. Bell System Technical Journal, 27, 379–423；García-Cascales, M. S., & Lamata, M. T. (2012). On rank reversal and TOPSIS method. Mathematical and Computer Modelling, 56(5–6), 123–132。",
      ),
    ],
  },
];
