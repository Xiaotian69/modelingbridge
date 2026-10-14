/**
 * 回归分析精讲。Original teaching text; every number shown is computed here from data.ts with
 * math.ts (itself verified against scipy / statsmodels), never typed in by hand.
 */
import python from "./examples/regression_milktea.py?raw";
import type { Block } from "../content";
import type { BridgeBlock } from "../CourseBridge";
import { COLD_DAY, EVENT_DAY, HAND_X, HAND_Y, SALES, TEMPERATURE, TOMORROW, WEEKDAY_NAMES, WEEKEND } from "./data";
import { mean, multipleRegression, predict, predictionInterval, simpleRegression, twoSidedP } from "./math";
import { REGRESSION_SECTIONS } from "./sectionIds";

export type RegressionFigure = "scatter" | "residuals" | "two-lines";
export type RegressionBlock = Block | BridgeBlock | { type: "regression-figure"; view: RegressionFigure } | { type: "regression-lab" };
export type RegressionSection = { id: string; title: string; lead: string; blocks: RegressionBlock[] };

const f1 = (x: number) => x.toFixed(1);
const f2 = (x: number) => x.toFixed(2);
const f3 = (x: number) => x.toFixed(3);
const p = (text: string): RegressionBlock => ({ type: "p", text });
const note = (text: string): RegressionBlock => ({ type: "note", text });
const formula = (text: string): RegressionBlock => ({ type: "formula", text });
const pText = (pv: number) => (pv < 0.001 ? "< 0.001" : pv.toFixed(3));

// ---- Computed results used in the text ----
export const simple = simpleRegression(TEMPERATURE, SALES);
export const both = multipleRegression([TEMPERATURE, WEEKEND], SALES);
export const hand = simpleRegression(HAND_X, HAND_Y);
export const withEvent = simpleRegression([...TEMPERATURE, EVENT_DAY.temperature], [...SALES, EVENT_DAY.sales]);
export const tomorrowBoth = predict(both.coefficients, [TOMORROW.temperature, TOMORROW.weekend]);
export const tomorrowSimple = simple.intercept + simple.slope * TOMORROW.temperature;
export const tomorrowInterval = predictionInterval([TEMPERATURE, WEEKEND], SALES, [TOMORROW.temperature, TOMORROW.weekend]);
export const coldWeekday = predict(both.coefficients, [COLD_DAY, 0]);
const [b0, b1, b2] = both.coefficients;
const pValues = both.tStats.map((t) => twoSidedP(t, both.n - both.p - 1));
const typicalError = Math.sqrt(both.sigma2);
const weekendTemp = mean(TEMPERATURE.filter((_, i) => WEEKEND[i]));
const weekdayTemp = mean(TEMPERATURE.filter((_, i) => !WEEKEND[i]));
export const tempWeekendCorr = simpleRegression(TEMPERATURE, WEEKEND).r;
const weekendResiduals = simple.residuals.filter((_, i) => WEEKEND[i]);
const minT = Math.min(...TEMPERATURE);
const maxT = Math.max(...TEMPERATURE);
const dayName = (i: number) => `第 ${i + 1} 天（周${WEEKDAY_NAMES[i % 7]}）`;
const handRows = HAND_X.map((x, i) => {
  const dx = x - hand.xBar;
  const dy = HAND_Y[i] - hand.yBar;
  return [String(x), String(HAND_Y[i]), String(dx), String(dy), String(dx * dy), String(dx * dx)];
});

export const regressionSections: RegressionSection[] = [
  {
    id: "shop",
    title: REGRESSION_SECTIONS[0].title,
    lead: "从一家奶茶店的备料问题出发",
    blocks: [
      p(
        "学校里有一家奶茶店，店长找到数模协会：每天早上要提前煮茶、备水果，备多了当天卖不完只能倒掉，备少了下午就断货。能不能根据天气，提前估计当天大概卖多少杯？",
      ),
      p("店长翻出了最近两周的记录：每天的最高气温、是否周末，以及卖出的杯数。第 1 天是星期一。"),
      {
        type: "table",
        caption: "表 1 · 两周的销售记录（原创教学数据）",
        headers: ["日期", "最高气温（℃）", "周末", "销量（杯）"],
        rows: TEMPERATURE.map((t, i) => [dayName(i), String(t), WEEKEND[i] ? "是" : "否", String(SALES[i])]),
      },
      p(
        `最简单的办法是按平均数备料：两周平均每天 ${f1(simple.yBar)} 杯。可是表里最少的一天只卖了 ${Math.min(...SALES)} 杯，最多的一天卖了 ${Math.max(...SALES)} 杯，差了 ${Math.max(...SALES) - Math.min(...SALES)} 杯。天热的日子多卖、周末多卖，平均数把这些信息全扔掉了。`,
      ),
      p(
        "回归分析研究的正是这种问题：一个量（销量）怎样随着另一些量（气温、是否周末）变化，并把这种关系写成一个可以计算的式子，用来解释和预测。这门课从一元线性回归讲起，再扩展到多元回归，最后讨论什么时候不能相信回归的结论。",
      ),
      note("这是为教学设计的原创数据，不是真实店铺的记录。为了方便手算和画图，只用了两周 14 天。"),
      { type: "question", id: "regression-think-1" },
    ],
  },
  {
    id: "scatter",
    title: REGRESSION_SECTIONS[1].title,
    lead: "画图永远是第一步",
    blocks: [
      p(
        "以气温为横轴、销量为纵轴，每一天画成一个点，这样的图叫散点图。我们想预测或解释的量（销量）叫因变量，记作 y；用来解释它的量（气温）叫自变量，记作 x。",
      ),
      { type: "regression-figure", view: "scatter" },
      p(
        "图中能看出三件事。第一，整体是“左低右高”：气温越高，销量往往越多，这叫正相关。第二，点并没有排成一条直线，而是围绕一个趋势上下散开。第三，四个周末（实心方块）大多落在其他点的上方，这一点先记住，第 5 节会用到。",
      ),
      p("相关系数 r 用一个数衡量两个量“有多接近一条直线”："),
      formula(String.raw`r=\frac{\sum_{i}(x_i-\bar x)(y_i-\bar y)}{\sqrt{\sum_{i}(x_i-\bar x)^2}\,\sqrt{\sum_{i}(y_i-\bar y)^2}},\qquad -1\le r\le 1`),
      p(
        `式中 x̄、ȳ 是平均数（x̄ 读作“x 拔”）。分子把每天“气温偏离平均多少”与“销量偏离平均多少”相乘再相加：两者同时偏高或同时偏低，乘积为正。r 接近 1 表示点几乎排成一条上升的直线，接近 −1 表示几乎排成一条下降的直线，接近 0 表示看不出直线关系。这两周的 r = ${f3(simple.r)}，正相关比较明显，但离 1 还有距离。`,
      ),
      note(
        "r 只衡量直线关系。r 接近 0 不代表两个量无关：例如气温太低、太高都不想出门，人流量与气温可能呈“拱形”，r 却接近 0。所以要先画散点图，再算 r。",
      ),
      { type: "question", id: "regression-think-2" },
    ],
  },
  {
    id: "model",
    title: REGRESSION_SECTIONS[2].title,
    lead: "斜率、截距和误差",
    blocks: [
      p("一元线性回归假设销量与气温之间有这样的关系："),
      formula(String.raw`y=\beta_0+\beta_1x+\varepsilon`),
      p(
        "β₁ 是斜率：气温每升高 1 ℃，销量平均增加多少杯。β₀ 是截距：直线在 x = 0 处的高度。ε（读作 epsilon）是误差项：同样 30 ℃ 的两天，销量也不会完全一样，因为还有很多没写进模型的因素，比如有没有考试、有没有下雨。模型不假装能解释一切，而是把这些因素都放进 ε，并假定它们平均起来为 0。",
      ),
      p(
        "β₀、β₁ 是“真实关系”中的参数，我们不知道。手里只有 14 天数据，能做的是根据数据算出它们的估计值，记作 b₀、b₁。用估计出的直线算出的值叫拟合值 ŷ（读作“y 帽”），实际值与拟合值的差叫残差 e：",
      ),
      formula(String.raw`\hat y_i=b_0+b_1x_i,\qquad e_i=y_i-\hat y_i`),
      p("残差为正，说明那天实际卖得比直线预计的多；为负，说明卖得少。下一个问题是：在无数条可能的直线里，b₀、b₁ 应该取多少？"),
    ],
  },
  {
    id: "least-squares",
    title: REGRESSION_SECTIONS[3].title,
    lead: "让残差的平方和最小",
    blocks: [
      p(
        "直觉上，好的直线应该让残差尽量小。但不能直接把残差相加：正负会互相抵消，一条离谱的直线也可能让残差之和等于 0。最常用的办法是把每个残差平方后相加，让这个残差平方和（SSE）最小，这就是最小二乘法（“二乘”即平方）。",
      ),
      formula(String.raw`\text{SSE}(b_0,b_1)=\sum_{i=1}^{n}\left(y_i-b_0-b_1x_i\right)^2\ \longrightarrow\ \text{最小}`),
      p("用微积分可以求出使 SSE 最小的 b₀、b₁，结果只需要平均数和两个求和："),
      formula(
        String.raw`b_1=\frac{S_{xy}}{S_{xx}}=\frac{\sum_i(x_i-\bar x)(y_i-\bar y)}{\sum_i(x_i-\bar x)^2},\qquad b_0=\bar y-b_1\bar x`,
      ),
      p(
        `先手算一个 5 个点的小例子：x = (${HAND_X.join(", ")})，y = (${HAND_Y.join(", ")})。x̄ = ${hand.xBar}，ȳ = ${hand.yBar}。`,
      ),
      {
        type: "table",
        caption: "表 2 · 手算最小二乘（5 个点）",
        headers: ["x", "y", "x − x̄", "y − ȳ", "(x − x̄)(y − ȳ)", "(x − x̄)²"],
        rows: [...handRows, ["", "", "", "合计", String(hand.sxy), String(hand.sxx)]],
      },
      p(
        `所以 b₁ = ${hand.sxy} / ${hand.sxx} = ${hand.slope}，b₀ = ${hand.yBar} − ${hand.slope} × ${hand.xBar} = ${f1(hand.intercept)}，回归直线是 ŷ = ${f1(hand.intercept)} + ${hand.slope}x。`,
      ),
      p(
        `奶茶店的数据也一样算：x̄ = ${f2(simple.xBar)} ℃，ȳ = ${f2(simple.yBar)} 杯，Sxy = ${f2(simple.sxy)}，Sxx = ${f2(simple.sxx)}。得到 b₁ = ${f2(simple.slope)}，b₀ = ${f2(simple.intercept)}：`,
      ),
      formula(String.raw`\hat y=${f2(simple.intercept)}+${f2(simple.slope)}\,x`),
      p(
        `解读：在这两周里，最高气温每高 1 ℃，平均多卖约 ${f1(simple.slope)} 杯。由 b₀ = ȳ − b₁x̄ 可以看出，最小二乘直线一定经过点 (x̄, ȳ)，并且所有残差加起来恰好等于 0。`,
      ),
      p("下面的实验里，你可以自己拖动一条直线，看看能不能让 SSE 比最小二乘更小。"),
      { type: "regression-lab" },
      note(
        "选读 · 公式是怎么来的？SSE 是 b₀、b₁ 的二次函数，图像是一个“碗”。最低点处对 b₀、b₁ 的偏导数都为 0：∂SSE/∂b₀ = −2Σ(yᵢ − b₀ − b₁xᵢ) = 0，∂SSE/∂b₁ = −2Σxᵢ(yᵢ − b₀ − b₁xᵢ) = 0。第一个方程就是“残差之和为 0”，化简即得 b₀ = ȳ − b₁x̄；代入第二个方程即得 b₁ = Sxy / Sxx。",
      ),
    ],
  },
  {
    id: "fit",
    title: REGRESSION_SECTIONS[4].title,
    lead: "直线解释了多少，漏掉了什么",
    blocks: [
      p(
        "最小二乘直线是“最好的直线”，但最好的直线也可能不够好。先看销量本身有多少波动：每天的销量与平均值之差，平方后相加，叫总平方和 SST。它可以分成两部分：直线能解释的部分 SSR，和直线解释不了、留在残差里的部分 SSE。",
      ),
      formula(String.raw`\underbrace{\sum_i(y_i-\bar y)^2}_{\text{SST}}=\underbrace{\sum_i(\hat y_i-\bar y)^2}_{\text{SSR}}+\underbrace{\sum_i(y_i-\hat y_i)^2}_{\text{SSE}},\qquad R^2=1-\frac{\text{SSE}}{\text{SST}}`),
      p(
        `决定系数 R² 就是“被直线解释的波动占总波动的比例”，在 0 到 1 之间。奶茶店的一元回归 SST = ${f1(simple.sst)}，SSE = ${f1(simple.sse)}，R² = ${f3(simple.r2)}：气温大约解释了销量波动的 ${Math.round(simple.r2 * 100)}%。在一元线性回归中，R² 恰好等于相关系数的平方：${f3(simple.r)}² = ${f3(simple.r * simple.r)}。`,
      ),
      p(
        "R² 只给出一个总的数字，要知道漏掉了什么，还得看残差。把每天的残差画出来（横轴仍是气温），这叫残差图。如果模型已经抓住了主要规律，残差应该在 0 附近随机地上下散开，看不出任何模式。",
      ),
      { type: "regression-figure", view: "residuals" },
      p(
        `这张残差图有明显的模式：四个周末的残差全部为正（${weekendResiduals.map(f1).join("、")} 杯），也就是说，每到周末，直线都低估了销量。残差里还藏着一个系统性的因素，没有写进模型：是否周末。`,
      ),
      { type: "question", id: "regression-think-3" },
    ],
  },
  {
    id: "multiple",
    title: REGRESSION_SECTIONS[5].title,
    lead: "把“是否周末”放进模型",
    blocks: [
      p(
        "“是否周末”不是一个能测量的数值，但可以编码成 0 和 1：周末记 1，工作日记 0。这种只取 0、1 的变量叫虚拟变量（也叫哑变量）。把它和气温一起放进模型，就是多元线性回归：",
      ),
      formula(String.raw`y=\beta_0+\beta_1x_1+\beta_2x_2+\varepsilon,\qquad x_1=\text{气温},\ x_2=\begin{cases}1,&\text{周末}\\0,&\text{工作日}\end{cases}`),
      p(
        "估计方法仍然是最小二乘：找 b₀、b₁、b₂，使残差平方和最小。变量多了，公式不再能用平均数简单写出，而是解一个线性方程组（称为正规方程），这一步交给计算机：",
      ),
      formula(String.raw`(X^{\mathsf T}X)\,b=X^{\mathsf T}y`),
      p(
        "X 是一张 14 行 3 列的表：第一列全是 1（对应截距），第二列是气温，第三列是是否周末；y 是 14 天的销量。不熟悉矩阵也没关系，下一节的 Python 程序一行就能求出结果。",
      ),
      {
        type: "table",
        caption: "表 3 · 多元回归结果（14 天）",
        headers: ["", "系数 b", "标准误", "t 值", "P 值"],
        rows: ["常数项", "气温（℃）", "周末（是 = 1）"].map((name, j) => [
          name,
          f2(both.coefficients[j]),
          f2(both.standardErrors[j]),
          f2(both.tStats[j]),
          pText(pValues[j]),
        ]),
      },
      formula(String.raw`\hat y=${f2(b0)}+${f2(b1)}\,x_1+${f2(b2)}\,x_2`),
      p(
        `解读多元回归的系数，要加上“其他变量不变”：在是否周末相同的情况下，气温每高 1 ℃，平均多卖约 ${f1(b1)} 杯；在气温相同的情况下，周末比工作日平均多卖约 ${f1(b2)} 杯。在图上，这相当于两条平行的直线：周末那条整体高出 ${f1(b2)} 杯。`,
      ),
      { type: "regression-figure", view: "two-lines" },
      p(
        `R² 从 ${f3(simple.r2)} 提高到 ${f3(both.r2)}。值得注意的是，气温的系数也变了：从 ${f2(simple.slope)} 变成了 ${f2(b1)}。原因是这两周的周末恰好偏凉：周末平均 ${f1(weekendTemp)} ℃，工作日平均 ${f1(weekdayTemp)} ℃。一元模型里，凉快的周末仍然卖得不少，把直线“拉平”了，气温的作用被低估。把周末单独考虑后，比较的是条件相同的日子，气温的作用才显现出来。遗漏了一个与自变量有关的重要因素，会让系数产生偏差，这叫遗漏变量偏差。`,
      ),
      p(
        `标准误衡量系数估计的不确定程度，t 值 = 系数 / 标准误。粗略地说，|t| 大于 2 左右（P 值小于 0.05）时，可以认为这个变量的作用不是偶然出现的。气温和周末的 |t| 都远大于 2。常数项的 t 值只有 ${f2(both.tStats[0])}（P 值 ${pText(pValues[0])}），和 0 区分不开，这并不要紧：它对应 0 ℃，远在数据范围之外，本来就没有实际含义。`,
      ),
      note(
        `再多加变量，R² 只会增大或不变，哪怕加的是毫无关系的变量。所以多元回归常看调整 R²，它会对变量个数“扣分”。本例调整 R² = ${f3(both.adjustedR2)}。P 值 < 0.05 是约定俗成的界线，不是“真理”的分界；论文里应同时报告系数、标准误和样本量。`,
      ),
    ],
  },
  {
    id: "predict",
    title: REGRESSION_SECTIONS[6].title,
    lead: "给出数字，也给出范围",
    blocks: [
      p(
        `天气预报说明天（星期六）最高 ${TOMORROW.temperature} ℃。代入多元回归模型：ŷ = ${f2(b0)} + ${f2(b1)} × ${TOMORROW.temperature} + ${f2(b2)} × 1 ≈ ${f1(tomorrowBoth)} 杯。如果只用一元模型，会得到 ${f1(tomorrowSimple)} 杯，少了 ${Math.round(tomorrowBoth - tomorrowSimple)} 杯，因为它不知道明天是周末。`,
      ),
      p(
        `预测值只是“平均来说”的估计。模型残差的标准差约为 ${f1(typicalError)} 杯，这是典型的误差大小。更严格地，可以算出单日销量的 95% 预测区间：约 ${Math.round(tomorrowInterval.lower)} 到 ${Math.round(tomorrowInterval.upper)} 杯（计算方法见 Python 程序中的 get_prediction）。给店长的建议可以写成：“按 ${Math.round(tomorrowBoth)} 杯准备；如果想把断货的可能压得很低，原料备到约 ${Math.round(tomorrowInterval.upper)} 杯。”这个区间建立在模型假设成立的前提下。`,
      ),
      p(
        `外推要格外小心。这两周的气温都在 ${minT} ℃ 到 ${maxT} ℃ 之间。如果把 ${COLD_DAY} ℃ 的工作日代进去，模型给出 ${f1(coldWeekday)} 杯；把 0 ℃ 代进去，会得到 ${f1(b0)} 杯，销量成了负数。直线关系只在数据覆盖的范围里得到了检验，天冷时大家可能改喝热饮，关系完全可能不同。`,
      ),
      note(
        "原则：只在自变量的数据范围内做预测；超出范围时，要么补充数据，要么明确说明这是外推、结论可能不可靠。比赛中常见的“用 3 年数据预测 20 年后”，尤其要讨论这一点。",
      ),
    ],
  },
  {
    id: "python",
    title: REGRESSION_SECTIONS[7].title,
    lead: "用代码核对每一个数",
    blocks: [
      p("下面的程序先按第 4 节的公式手算一元回归，再用 statsmodels 做多元回归和预测。statsmodels 的 summary() 会输出与表 3 相同的系数、标准误、t 值和 P 值。"),
      { type: "code", text: python },
      p(
        `运行后应得到：一元回归 销量 = ${f2(simple.intercept)} + ${f2(simple.slope)} × 气温，r = ${f3(simple.r)}，R² = ${f3(simple.r2)}；多元回归 销量 = ${f2(b0)} + ${f2(b1)} × 气温 + ${f2(b2)} × 周末，R² = ${f3(both.r2)}，调整 R² = ${f3(both.adjustedR2)}；明天预测 ${f1(tomorrowBoth)} 杯，95% 预测区间 ${f1(tomorrowInterval.lower)} ~ ${f1(tomorrowInterval.upper)} 杯。`,
      ),
      note(
        "sm.add_constant 给数据加上全为 1 的一列，对应截距；忘了它，模型会被强行拉过原点。样本只有 14 个时，summary() 可能提示某些正态性检验需要更多数据，这是正常的。",
      ),
    ],
  },
  {
    id: "limits",
    title: REGRESSION_SECTIONS[8].title,
    lead: "回归告诉你“一起变化”，不告诉你“为什么”",
    blocks: [
      p(
        "相关不是因果。气温高的日子，奶茶卖得多，防晒霜也卖得多。用防晒霜销量做自变量，同样能“预测”奶茶销量，但谁也不会说防晒霜让人想喝奶茶：两者都是被气温推动的。回归系数描述的是数据中一起变化的规律，要说明因果，需要实验设计或更强的论证。",
      ),
      p(
        `异常值。假设店里有一天办了校园活动：${EVENT_DAY.temperature} ℃ 的工作日卖了 ${EVENT_DAY.sales} 杯。只多这一个点，一元回归的斜率就从 ${f2(simple.slope)} 变成 ${f2(withEvent.slope)}，R² 从 ${f3(simple.r2)} 跌到 ${f3(withEvent.r2)}。最小二乘把残差平方，离群越远的点影响越大。在实验中勾选“加入活动日”可以亲眼看到。`,
      ),
      p(
        "遇到异常值，不能悄悄删掉了事：先查清原因（记录错误？特殊事件？），再决定修正数据、把它单独建模（例如加一个“是否活动日”的虚拟变量），还是在说明理由后排除，并报告排除前后的结果。",
      ),
      p(
        "非线性。如果残差图呈现弯曲的形状，说明关系不是直线，可以考虑加入 x² 项、对变量取对数，或者换用其他模型。线性回归中的“线性”指的是对系数是线性的，y = b₀ + b₁x + b₂x² 仍然可以用最小二乘求解。",
      ),
      p(
        "变量太多、样本太少。14 天数据配上十几个自变量，R² 可以很高，预测新的一天却可能很差，这叫过拟合。经验上，每个自变量至少要有十来个观测。另外，两个几乎一样的自变量（例如最高气温和平均气温）同时放进模型，系数会变得很不稳定，这叫多重共线性。",
      ),
      note(
        "常见错误：不画散点图就算 r 和 R²；把 R² 高当成“模型正确”或“存在因果”；忽略残差图里的模式；拿模型做远超数据范围的外推；样本很少却放很多变量；按时间排列的数据（如逐日销量）还要检查前后几天的误差是否相关，必要时改用时间序列方法。",
      ),
    ],
  },
  {
    id: "regression-self-test",
    title: REGRESSION_SECTIONS[9].title,
    lead: "不计成绩，检查自己是否理解",
    blocks: [
      p("下面三道题对应本章最容易混淆的三个概念。点“核对”即时反馈，不计成绩；想系统练习，可以进入专项练习。"),
      { type: "question", id: "regression-self-1" },
      { type: "question", id: "regression-self-2" },
      { type: "question", id: "regression-self-3" },
    ],
  },
  {
    id: "regression-transfer",
    title: REGRESSION_SECTIONS[10].title,
    lead: "从一家奶茶店到一道预测题",
    blocks: [
      p(
        "竞赛中的预测类题目（需求、销量、客流、价格……）常用这样的流程：画图观察并清洗数据 → 选择自变量并说明理由 → 建立回归模型，报告系数、标准误和 R² → 检查残差图、异常值和共线性 → 在数据范围内预测，并给出预测区间 → 讨论局限，必要时与其他模型（时间序列、机器学习）比较。",
      ),
      p(
        "预测往往不是终点。店长知道明天大概卖多少杯之后，还要决定备多少料、排几个人上班，这就是一个优化问题：回归给出需求的估计，线性规划在资源约束下做决策。“先预测、后优化”是比赛中非常常见的两步建模路线。",
      ),
      {
        type: "course-bridge",
        to: "/learn/linear-programming#variables",
        kicker: "相关精讲 · 线性规划",
        title: "预测之后：在有限资源下做最优安排",
        text: "线性规划第 2 节讨论了回归与优化的分工：回归从数据估计关系，优化在约束下选出最好的决策。",
      },
      p("想练完整流程，可以用七关实战中的“校园共享单车：需求预测与调度建议”教学案例，从读题、建立预测模型一直走到调度方案和论文框架。"),
      p("本课只讲线性回归。关系明显弯曲、变量很多或需要更高的预测精度时，比赛中也常用随机森林等机器学习方法，可以先在方法速查的“回归 / 随机森林”中了解，并始终用线性回归作为对照的基准。"),
      note(
        "参考：Montgomery, D. C., Peck, E. A., & Vining, G. G. (2021). Introduction to Linear Regression Analysis (6th ed.). Wiley；James, G., Witten, D., Hastie, T., & Tibshirani, R. (2021). An Introduction to Statistical Learning (2nd ed.), Chapter 3. Springer。",
      ),
    ],
  },
];
