/**
 * 层次分析法（AHP）精讲。Original teaching text; every number shown is computed here from
 * data.ts with math.ts (itself verified against numpy), never typed in by hand.
 */
import python from "./examples/ahp_internship.py?raw";
import type { Block } from "../content";
import { ALTERNATIVES, CRITERIA, CRITERIA_UPPER, LOCAL_UPPER } from "./data";
import {
  RANDOM_INDEX,
  analyse,
  columnNormalisedWeights,
  formatJudgment,
  fromUpperTriangle,
  overallCR,
  synthesise,
} from "./math";
import { AHP_SECTIONS } from "./sectionIds";

export type AhpBlock = Block | { type: "ahp-hierarchy" } | { type: "ahp-lab" };
export type AhpSection = { id: string; title: string; lead: string; blocks: AhpBlock[] };

const f3 = (x: number) => x.toFixed(3);
const f4 = (x: number) => x.toFixed(4);
const p = (text: string): AhpBlock => ({ type: "p", text });
const note = (text: string): AhpBlock => ({ type: "note", text });
const formula = (text: string): AhpBlock => ({ type: "formula", text });

// ---- Computed results used in the text ----
export const criteriaMatrix = fromUpperTriangle(3, CRITERIA_UPPER);
export const criteriaResult = analyse(criteriaMatrix);
export const localResults = CRITERIA.map((c) => analyse(fromUpperTriangle(3, LOCAL_UPPER[c.id])));
export const globalScores = synthesise(
  criteriaResult.weights,
  localResults.map((r) => r.weights),
);
export const totalCR = overallCR(criteriaResult.weights, localResults)!;
const order = [...globalScores.keys()].sort((a, b) => globalScores[b] - globalScores[a]);
const [w1, w2, w3] = criteriaResult.weights;
const rowProducts = criteriaMatrix.map((row) => row.reduce((s, v) => s * v, 1));
const rowRoots = rowProducts.map((v) => Math.cbrt(v));
const rootSum = rowRoots.reduce((s, v) => s + v, 0);
const columnWeights = columnNormalisedWeights(criteriaMatrix);
const best = ALTERNATIVES[order[0]];
const second = ALTERNATIVES[order[1]];

const matrixRows = (a: number[][], names: string[]) =>
  a.map((row, i) => [names[i], ...row.map((v) => formatJudgment(v))]);
const criteriaNames = CRITERIA.map((c) => c.name);

export const ahpSections: AhpSection[] = [
  {
    id: "decision",
    title: AHP_SECTIONS[0].title,
    lead: "从一个真实的选择出发",
    blocks: [
      p(
        "小林是数学专业大三学生，手里有三份暑期实习 offer：A 互联网公司，工资最高，但通勤要一个多小时；B 研究所，导师带着做项目，能系统学到建模和数据分析；C 本地制造企业，离家近，节奏稳定。他最在意三件事：薪资待遇、成长空间、通勤生活。",
      ),
      p(
        "凭感觉选，往往前后矛盾：今天觉得成长最重要，明天看到工资又动摇。常见的改进是“打分加权”——给每个方案在每一项上打分，再乘以权重相加。可权重从哪里来？直接写下“成长 0.6、薪资 0.3、通勤 0.1”，很难说清依据，也没法检查自己有没有自相矛盾。",
      ),
      p(
        "层次分析法（Analytic Hierarchy Process，AHP）由 T. L. Saaty 在 20 世纪 70 年代提出。它把“定权重”拆成一次只比较两个因素的小判断，用矩阵计算把这些判断合成权重，并且检查判断是否前后一致。最后再把各个准则下的比较合成一个总排序。",
      ),
      note(
        "这是为教学设计的原创案例。判断值代表小林个人的偏好，不代表任何真实单位的情况；换一个人，判断完全可以不同。AHP 处理的正是这种主观、但需要讲清楚依据的决策。",
      ),
      { type: "question", id: "ahp-think-1" },
    ],
  },
  {
    id: "hierarchy",
    title: AHP_SECTIONS[1].title,
    lead: "目标、准则、方案三层",
    blocks: [
      p(
        "AHP 的第一步不是计算，而是把问题画清楚。最上层是目标：选出最适合小林的实习。中间是准则层：用什么标准评价。最下层是方案层：在哪些选项之间选择。每一个准则都要用来评价每一个方案。",
      ),
      { type: "ahp-hierarchy" },
      p(
        "画层次时有三点要注意。第一，准则之间尽量不重叠，“工资”和“收入”同时出现就会把同一件事算两次。第二，同一层的元素不宜超过 9 个：n 个元素需要做 n(n−1)/2 次两两比较，太多既费力也难以保持一致。第三，准则太多时可以再分出子准则，形成更多层。",
      ),
      formula(String.raw`\text{两两比较次数}=\frac{n(n-1)}{2}`),
      p("3 个准则只需比较 3 次；9 个准则就要比较 36 次。"),
      { type: "question", id: "ahp-think-2" },
    ],
  },
  {
    id: "scale",
    title: AHP_SECTIONS[2].title,
    lead: "一次只比较两个",
    blocks: [
      p(
        "人很难直接说出“成长占 65%”，却比较容易回答“成长比薪资重要多少”。AHP 用 Saaty 的 1–9 标度记录这种两两比较：",
      ),
      {
        type: "table",
        caption: "表 1 · Saaty 1–9 标度",
        headers: ["标度 aᵢⱼ", "含义（第 i 个与第 j 个相比）"],
        rows: [
          ["1", "同样重要"],
          ["3", "稍微重要"],
          ["5", "明显重要"],
          ["7", "强烈重要"],
          ["9", "极端重要"],
          ["2、4、6、8", "介于相邻两个判断之间"],
          ["1/3、1/5 …", "反过来比较：第 j 个比第 i 个重要"],
        ],
      },
      p(
        "矩阵就是一张按行和列排好的数表。把所有两两判断写进矩阵 A：第 i 行第 j 列的数记作 aᵢⱼ，表示“第 i 个准则比第 j 个准则重要几倍”。自己和自己比，对角线（左上到右下）都等于 1；反过来比取倒数，aⱼᵢ = 1/aᵢⱼ。这样的矩阵叫正互反矩阵。所以 3 个准则只需要判断对角线右上方的 3 个数，其余自动确定。",
      ),
      formula(
        String.raw`A=\begin{pmatrix}1 & a_{12} & a_{13}\\ 1/a_{12} & 1 & a_{23}\\ 1/a_{13} & 1/a_{23} & 1\end{pmatrix},\qquad a_{ij}>0,\quad a_{ii}=1,\quad a_{ji}=\frac{1}{a_{ij}}`,
      ),
      p(
        `小林的三个判断：成长空间比薪资待遇稍微重要（a₂₁ = 3，所以 a₁₂ = 1/3）；薪资待遇比通勤生活略重要（a₁₃ = 2）；成长空间比通勤生活明显重要（a₂₃ = 5）。得到准则判断矩阵：`,
      ),
      {
        type: "table",
        caption: "表 2 · 小林的准则判断矩阵（行比列重要几倍）",
        headers: ["", ...criteriaNames],
        rows: matrixRows(criteriaMatrix, criteriaNames),
      },
    ],
  },
  {
    id: "weights",
    title: AHP_SECTIONS[3].title,
    lead: "让矩阵告诉我们权重",
    blocks: [
      p(
        "设三个准则的权重为 w₁、w₂、w₃（都是正数，加起来等于 1），把它们排成一列，叫权重向量 w。如果判断完全一致，每个 aᵢⱼ 都应该恰好等于权重之比 wᵢ / wⱼ。",
      ),
      p(
        "A·w 的意思是：用矩阵 A 的第 i 行和 w 逐项相乘再相加，得到一个新数，记作 (Aw)ᵢ。Σ 是求和号。下面的式子说明：判断完全一致时，每一行算出来都正好是 n 乘 wᵢ。",
      ),
      formula(String.raw`a_{ij}=\frac{w_i}{w_j}\quad\Longrightarrow\quad (Aw)_i=\sum_{j=1}^{n}\frac{w_i}{w_j}\,w_j=n\,w_i`),
      p(
        "举一个能手算的例子：A = [[1, 2, 4], [1/2, 1, 2], [1/4, 1/2, 1]] 是完全一致的，取 w = (4/7, 2/7, 1/7)。第 1 行：1×4/7 + 2×2/7 + 4×1/7 = 12/7，正好是 3 × 4/7；另外两行同样是 3 倍。也就是说，A 乘上 w 之后，w 的方向不变，只被放大了 n = 3 倍。满足 A·w = λ·w 的向量叫 A 的特征向量，放大倍数 λ 叫特征值。",
      ),
      p(
        "真实的判断不会完全一致，找不到恰好放大 n 倍的向量。AHP 的做法是取 A 的最大特征值 λmax 所对应的特征向量，归一化（每个分量除以它们的总和，使总和为 1）后作为权重。没学过线性代数也没关系：手算时用下面的近似方法，精确值交给程序。",
      ),
      formula(String.raw`A\,w=\lambda_{\max}\,w,\qquad \sum_{i=1}^{n}w_i=1`),
      p("手算时常用两种近似方法。方根法（也叫几何平均法）：每一行的数连乘，开 n 次方，再归一化。下面是小林准则矩阵（n = 3）的完整计算："),
      {
        type: "table",
        caption: "表 3 · 方根法计算准则权重",
        headers: ["准则", "行连乘", "开 3 次方", "权重"],
        rows: [
          ...criteriaNames.map((name, i) => [name, f4(rowProducts[i]), f4(rowRoots[i]), f3(rowRoots[i] / rootSum)]),
          ["合计", "", f4(rootSum), "1.000"],
        ],
      },
      p(
        `和积法：把每一列除以该列之和，再对每一行求平均，得到 (${columnWeights.map(f3).join(", ")})，与方根法的 (${criteriaResult.geometric.map(f3).join(", ")}) 相差不到 0.001。结论很清楚：在小林心中，成长空间的权重约 ${f3(w2)}，约是薪资（${f3(w1)}）的 ${(w2 / w1).toFixed(1)} 倍，通勤生活只占 ${f3(w3)}。`,
      ),
      note(
        "选读 · 计算机怎样求特征向量？本课程的程序用幂迭代：从均匀权重出发，反复计算 A·w 并归一化，直到相邻两次结果之差小于 10⁻¹²。判断矩阵的元素都是正数，由 Perron–Frobenius 定理，它有唯一的最大正特征值和一个分量全为正的特征向量，幂迭代从正向量出发必然收敛到它。课程中的每个结果都与 NumPy 的特征值分解对照过。另外，对 3 阶矩阵，方根法与特征向量法的权重完全相同；4 阶及以上两者可能略有差别。",
      ),
    ],
  },
  {
    id: "consistency",
    title: AHP_SECTIONS[4].title,
    lead: "判断会不会自相矛盾",
    blocks: [
      p(
        "小林认为成长是薪资的 3 倍、薪资是通勤的 2 倍。如果判断完全一致，成长应该是通勤的 3 × 2 = 6 倍；他实际写的是 5。差一点没有关系，人的判断本来就不精确。但如果他写成 1/2（通勤比成长重要），判断就前后矛盾了。",
      ),
      formula(String.raw`\text{完全一致：}\quad a_{ik}=a_{ij}\,a_{jk}\quad\text{对所有 } i,j,k \text{ 成立}`),
      p(
        "可以证明，正互反矩阵总有 λmax ≥ n，而且只有在完全一致时取等号；判断越矛盾，λmax 比 n 大得越多。AHP 用两个量衡量矛盾程度：一致性指标 CI 和一致性比率 CR。",
      ),
      formula(String.raw`CI=\frac{\lambda_{\max}-n}{n-1},\qquad CR=\frac{CI}{RI(n)}`),
      p(
        "为什么除以 n − 1？矩阵对角线上 n 个 1 的和，等于全部特征值之和，也就是 n。λmax 比 n 多出来的部分，正好由其余 n − 1 个特征值“抵消”，CI 就是这部分在它们之间的平均大小。另外，即使随机填写，CI 也会随 n 变大而变大，所以再除以同阶随机矩阵的平均水平 RI，得到可以跨阶数比较的 CR。",
      ),
      {
        type: "table",
        caption: "表 4 · 随机一致性指标 RI（Saaty，1980）",
        headers: ["n", "3", "4", "5", "6", "7", "8", "9"],
        rows: [["RI", ...[3, 4, 5, 6, 7, 8, 9].map((n) => RANDOM_INDEX[n].toFixed(2))]],
      },
      p(
        `RI 是用 1–9 标度随机填写的大量判断矩阵的平均 CI。CR < 0.1 时，一般认为判断的一致性可以接受；否则应回到原始判断，找出最矛盾的那一对重新比较。小林的准则矩阵 λmax = ${f4(criteriaResult.lambdaMax)}，CI = ${f4(criteriaResult.ci)}，CR = ${f4(criteriaResult.cr!)}，远小于 0.1。`,
      ),
      note(
        "n = 1、2 时任何判断都一致（RI = 0），不需要检验。0.1 是国内教材和比赛论文最常用的阈值；Saaty 后来对 3 阶、4 阶矩阵建议更严格的 0.05、0.08。RI 的取值在不同文献中也略有差别，本课程采用 Saaty（1980）的表。写比赛论文时，应注明所用的阈值和 RI 来源。",
      ),
      p("下面的实验用的就是这套计算。改变任意一个判断，权重、λmax、CI、CR 都会重新计算；实验底部的“实习推荐”是怎么得来的，下一节解释。"),
      { type: "ahp-lab" },
    ],
  },
  {
    id: "synthesis",
    title: AHP_SECTIONS[5].title,
    lead: "从局部到整体",
    blocks: [
      p(
        "准则权重只回答了“小林更在意什么”。接下来，在每个准则下再两两比较三个方案：在薪资上 A 比 B 高出较多（4），比 C 也稍高一截（3）；在成长上 B 最好；在通勤上 C 离家最近。每个准则得到一个 3 × 3 判断矩阵，分别求权重并检验一致性：",
      ),
      {
        type: "table",
        caption: "表 5 · 方案层：各准则下的局部权重",
        headers: ["准则（权重）", "判断 A:B, A:C, B:C", ...ALTERNATIVES.map((a) => a.short), "CR"],
        rows: CRITERIA.map((c, k) => [
          `${c.name}（${f3(criteriaResult.weights[k])}）`,
          LOCAL_UPPER[c.id].map(formatJudgment).join(", "),
          ...localResults[k].weights.map(f3),
          f4(localResults[k].cr!),
        ]),
      },
      p("每个方案的总得分，是它在各准则下的局部权重按准则权重加权求和。式中 wₖ 是第 k 个准则的权重，vₖ⁽ᵐ⁾ 是方案 m 在第 k 个准则下的局部权重："),
      formula(String.raw`\text{总得分}(\text{方案 }m)=\sum_{k}w_k\cdot v_{k}^{(m)}`),
      {
        type: "table",
        caption: "表 6 · 层次总排序",
        headers: ["方案", ...CRITERIA.map((c, k) => `${c.name} × ${f3(criteriaResult.weights[k])}`), "总得分", "排名"],
        rows: ALTERNATIVES.map((a, m) => [
          a.short,
          ...CRITERIA.map((_, k) => f3(criteriaResult.weights[k] * localResults[k].weights[m])),
          f3(globalScores[m]),
          String(order.indexOf(m) + 1),
        ]),
      },
      p(
        `结果是 ${best.short}（${f3(globalScores[order[0]])}）第一，${second.short}（${f3(globalScores[order[1]])}）第二。A 的工资最高，在薪资准则下的局部权重达到 ${f3(localResults[0].weights[0])}，但小林把成长空间看得最重（${f3(w2)}），而 B 在成长上明显领先。总排序同样要做一致性检验：用准则权重对各方案层矩阵的 CI 和 RI 分别加权再相除，CR总 = ${f4(totalCR)} < 0.1。`,
      ),
      formula(String.raw`CR_{\text{总}}=\frac{\sum_k w_k\,CI_k}{\sum_k w_k\,RI_k}`),
      note(
        "结论应该写成“在小林的偏好下，B 最合适”，而不是“B 客观上最好”。回到上一节的实验，把薪资调得更重要，看看 A 在什么时候反超 B——这就是一次简单的敏感性分析。",
      ),
    ],
  },
  {
    id: "python",
    title: AHP_SECTIONS[6].title,
    lead: "用代码核对每一个数",
    blocks: [
      p(
        "下面的程序用 NumPy 的特征值分解（而不是本页面使用的幂迭代）重新计算全部结果，可以用来核对手算和上面的实验。",
      ),
      { type: "code", text: python },
      p(
        `运行后应得到：准则权重 (${criteriaResult.weights.map(f3).join(", ")})，CR = ${f4(criteriaResult.cr!)}；总得分 A、B、C 依次为 ${globalScores.map(f3).join("、")}；层次总排序 CR = ${f4(totalCR)}。`,
      ),
      note("NumPy 返回的特征向量可能整体带负号，所以程序先取绝对值再归一化；对正互反矩阵，最大特征值对应的特征向量各分量同号。程序最后一行计算总排序 CR 时，利用了三个方案层矩阵都是 3 阶（RI 相同）、准则权重之和为 1。"),
    ],
  },
  {
    id: "limits",
    title: AHP_SECTIONS[7].title,
    lead: "知道什么时候不该用",
    blocks: [
      p(
        "主观性。权重来自判断，换一个人可能完全不同。比赛中应说明判断依据（文献、专家打分、问卷）；多位专家的判断可以先对每个元素取几何平均，再计算权重。",
      ),
      p(
        "规模。同一层元素一般不超过 9 个。指标很多时，应先分组形成多层结构，而不是硬做一个 15 × 15 的判断矩阵。",
      ),
      p(
        "逆序问题。加入或删除一个方案，原有方案之间的相对排序可能改变。这是 AHP 最常被讨论的局限之一；比赛中可以通过敏感性分析说明结论在合理的判断范围内是否稳定。",
      ),
      p(
        "有客观数据时。如果指标有大量客观数据（如城市人均 GDP、空气质量），可以用熵权法等由数据确定权重，再用 TOPSIS 等方法对方案排序；也可以把 AHP 的主观权重与熵权法的客观权重组合使用，并说明组合方式。",
      ),
      note(
        "常见错误：不做一致性检验；判断矩阵不满足互反；把某个准则下的局部权重当成最终结果；为了让 CR < 0.1 随意改判断而不说明理由；准则之间含义重叠。",
      ),
    ],
  },
  {
    id: "ahp-self-test",
    title: AHP_SECTIONS[8].title,
    lead: "不计成绩，检查自己是否理解",
    blocks: [
      p("下面三道题对应本章最容易混淆的三个概念。点“核对”即时反馈，不计成绩；想系统练习，可以进入专项练习。"),
      { type: "question", id: "ahp-self-1" },
      { type: "question", id: "ahp-self-2" },
      { type: "question", id: "ahp-self-3" },
    ],
  },
  {
    id: "ahp-transfer",
    title: AHP_SECTIONS[9].title,
    lead: "从一道选择题到一道评价题",
    blocks: [
      p(
        "竞赛中的评价类题目（城市宜居度、服务质量、方案优选等）常用 AHP 定权重。一份完整的做法通常是：建立指标层次结构 → 说明判断依据并构造判断矩阵 → 计算权重并做一致性检验 → 合成总排序 → 敏感性分析与结果解释。",
      ),
      p(
        "想练完整流程，可以用七关实战中的“城市宜居性综合评价”教学案例，从读题、拆解一直走到论文框架。写论文时，请把判断矩阵、权重、CR 全部列出，让读者可以复核。",
      ),
      note(
        "参考：Saaty, T. L. (1977). A scaling method for priorities in hierarchical structures. Journal of Mathematical Psychology, 15(3), 234–281；Saaty, T. L. (1980). The Analytic Hierarchy Process. McGraw-Hill。",
      ),
    ],
  },
];
