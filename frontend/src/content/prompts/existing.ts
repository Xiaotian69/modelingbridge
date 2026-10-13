import { COMMON_LIMITS, type PromptTemplate } from "./types";

const AUTHOR = "模桥 ModelingBridge（原创）";

/** The original nine public IDs and variable keys remain compatible. */
export const existingTemplates: PromptTemplate[] = [
  {
    id: "pr.breakdown.base",
    title: "赛题拆解 · 基础版",
    summary: "先写下自己的理解，再请 AI 追问：目标、约束、对象和还不确定的信息。",
    contests: ["general"],
    taskType: "读题拆解",
    stage: ["read_problem", "breakdown"],
    templateText: `我正在练习数学建模比赛（{比赛名称}）的读题。请你扮演建模教练，不要直接给出模型或答案。

【题目】
{题目内容}

【我自己的初步理解】
{我的初步理解}

请按下面顺序帮助我：
1. 用一句话复述你认为的核心目标，并指出与我的理解不一致的地方；
2. 列出题目中的研究对象、决策或预测目标、明确约束，各自引用题目原句；
3. 指出我遗漏的 1–3 个关键条件或隐含要求；
4. 列出仍需我去确认的信息（数据来源、单位、时间范围等）。
不要推荐具体模型，不要替我写结论。

区分题面明确事实、你的推断和待确认信息；每项推断说明依据和不确定性。输出“题面位置/原句 | 我的理解 | 遗漏或冲突 | 下一步核对动作”。信息不足时先提问，不补造背景条件。`,
    variables: [
      { key: "比赛名称", label: "比赛名称", required: false, example: "全国大学生数学建模竞赛校内选拔" },
      { key: "题目内容", label: "题目内容（可粘贴题面）", required: true, example: "某市共享单车管理部门希望基于历史订单数据预测未来一周各区域需求量……", multiline: true, prefillFrom: "quest.problemText" },
      { key: "我的初步理解", label: "我的初步理解", required: true, example: "我认为核心是先预测各区域需求，再在车辆总数限制下安排调度。", multiline: true },
    ],
    before: "先自己完整读一遍题，写下初步理解后再使用。",
    limits: COMMON_LIMITS,
    source: { author: AUTHOR },
    licenseStatus: "original",
    version: "1.1",
    updatedAt: "2026-10-13",
    reviewStatus: "self-checked",
    demo: true,
  },
  {
    id: "pr.breakdown.io",
    title: "小问输入输出表",
    summary: "把自己拆出的小问整理成“输入 → 输出 → 评价标准”表格，请 AI 检查缺漏。",
    contests: ["general"],
    taskType: "读题拆解",
    stage: ["breakdown"],
    templateText: `下面是我对一道数学建模题的拆解。请帮我检查，而不是重新替我拆解。

【题目摘要】
{题目内容}

【我拆出的小问】
{我的小问列表}

请输出一张表，列为：小问 | 需要的输入 | 预期输出 | 如何判断做得好不好 | 你的疑问。
然后指出：哪些小问的输出不明确、哪些小问之间有先后依赖、是否漏掉了题目要求的小问。
请保留我的原始拆法，只在“你的疑问”一列提出修改建议。

对评价指标区分题目指定与建议采用，说明单位和好坏方向。缺少输入、标准或依赖时标“待补充”；若原拆分不合理，在表后另列修订建议及原因，不悄悄改写原要求。`,
    variables: [
      { key: "题目内容", label: "题目摘要", required: true, example: "在车辆总数约束下预测需求并给出调度方案，使缺车率与运营成本综合最优。", multiline: true, prefillFrom: "quest.problemText" },
      { key: "我的小问列表", label: "我拆出的小问", required: true, example: "1. 预测各区域未来一周每日需求\n2. 计算各区域缺车量\n3. 制定调度方案", multiline: true },
    ],
    before: "先自己拆出 2–4 个小问再使用。",
    limits: COMMON_LIMITS,
    source: { author: AUTHOR },
    licenseStatus: "original",
    version: "1.1",
    updatedAt: "2026-10-13",
    reviewStatus: "self-checked",
    demo: true,
  },
  {
    id: "pr.assumption.check",
    title: "假设与变量自检",
    summary: "列出自己的假设和变量，请 AI 找出不合理、无法检验或与题意冲突的地方。",
    contests: ["general"],
    taskType: "假设与变量",
    stage: ["model"],
    templateText: `我在为一道数学建模题建立模型，下面是我的假设和变量定义。请逐条审查。

【问题描述】
{问题描述}

【我的假设】
{我的假设}

【我的变量与符号】
{我的变量}

请对每条假设回答：是否必要？是否与题意冲突？如何在论文中说明其合理性或做敏感性检验？
对每个变量回答：含义和单位是否清楚？是否与其他变量重复？
最后指出还缺少哪些必要的假设或变量。不要替我选择模型。

进一步检查变量的取值域（连续/整数、非负、上下界）、单位维度及索引范围。将假设分为题目已知条件、建模简化、待验证经验判断；逐条给出证据、适用范围、失效条件和可执行的检验方法。无法根据现有材料验证的假设明确标注。`,
    variables: [
      { key: "问题描述", label: "问题描述", required: true, example: "在两种资源限制下安排两种产品的产量，使总利润最大。", multiline: true },
      { key: "我的假设", label: "我的假设", required: true, example: "1. 单位利润在计划范围内不变\n2. 产量可以取非负小数", multiline: true },
      { key: "我的变量", label: "我的变量与符号", required: true, example: "x：产品 A 的产量（m²）\ny：产品 B 的产量（m²）", multiline: true },
    ],
    before: "先写出至少 2 条假设和全部变量定义。",
    limits: COMMON_LIMITS,
    source: { author: AUTHOR },
    licenseStatus: "original",
    version: "1.1",
    updatedAt: "2026-10-13",
    reviewStatus: "self-checked",
    demo: true,
  },
  {
    id: "pr.method.compare",
    title: "模型选择对比",
    summary: "给出小问目标、数据情况和候选方法，请 AI 对比适用条件与风险，最终由自己决定。",
    contests: ["general"],
    taskType: "方法选择",
    stage: ["model"],
    templateText: `我需要为一个建模小问选择方法，请帮我比较，但最终选择由我决定。

【小问目标】
{小问目标}

【数据情况】
{数据情况}

【我考虑的候选方法】
{候选方法}

请用表格比较每个候选方法：适用条件 | 需要的数据 | 输出是否回答了小问 | 主要风险 | 如何检验结果。
再列出 1 个我没想到、但可能更简单的基线方法。
不要给出“最佳方法”的结论，也不要编造文献或数据。

同时比较样本规模、变量类型、独立性/平稳性等前提、可解释性、计算预算与团队实现条件。区分预测、解释、优化或评价目标，不用模型复杂度替代适配性。给出同一数据划分与指标下的对照方案；时间数据按时间划分，预处理只在训练部分拟合。没有实测结果不能排序宣称性能优劣。`,
    variables: [
      { key: "小问目标", label: "小问目标", required: true, example: "预测未来 7 天每个区域的单车需求量" },
      { key: "数据情况", label: "数据情况", required: true, example: "过去 90 天按小时统计的订单数，含天气字段，约 5% 缺失", multiline: true },
      { key: "候选方法", label: "我考虑的候选方法", required: true, example: "时间序列（ARIMA）、随机森林回归" },
    ],
    before: "先查过方法速查卡，写出自己倾向的 1–2 个候选方法。",
    limits: COMMON_LIMITS,
    source: { author: AUTHOR },
    licenseStatus: "original",
    version: "1.1",
    updatedAt: "2026-10-13",
    reviewStatus: "self-checked",
    demo: true,
  },
  {
    id: "pr.data.plan",
    title: "数据清洗计划审查",
    summary: "描述字段和已发现的问题，请 AI 审查清洗步骤是否会引入偏差。",
    contests: ["general"],
    taskType: "数据预处理",
    stage: ["data"],
    templateText: `请审查我的数据预处理计划。只针对我提供的字段说明讨论，不要假设或编造任何数据值。

【字段说明】
{数据字段说明}

【我已发现的问题】
{已发现的问题}

【我打算的处理方式】
{处理计划}

请指出：
1. 每一步处理可能带来的偏差或信息损失；
2. 哪些处理需要在论文中说明理由；
3. 训练集与测试集是否存在信息泄漏风险；
4. 还应检查的数据质量问题（单位、重复、异常值、时间对齐等）。

逐项检查字段类型、主键/粒度、重复记录、缺失机制和时间顺序。训练/测试划分应先于拟合填补、缩放和特征筛选；时间预测不能用未来值填补过去。异常值先核业务原因，不把真实极端样本直接删掉。输出“步骤 | 证据 | 风险 | 修订建议 | 如何对比验证”，并要求保留原数据与清洗日志。`,
    variables: [
      { key: "数据字段说明", label: "字段说明", required: true, example: "date（日期）、region（区域编号）、orders（订单数）、temp（气温，℃）", multiline: true },
      { key: "已发现的问题", label: "已发现的问题", required: true, example: "约 5% 的 temp 缺失；有 3 天订单数为 0", multiline: true },
      { key: "处理计划", label: "我打算的处理方式", required: true, example: "temp 用前后两天均值填补；订单为 0 的天直接删除", multiline: true },
    ],
    before: "先自己浏览数据，记录字段含义和发现的问题。",
    limits: COMMON_LIMITS,
    source: { author: AUTHOR },
    licenseStatus: "original",
    version: "1.1",
    updatedAt: "2026-10-13",
    reviewStatus: "self-checked",
    demo: true,
  },
  {
    id: "pr.code.debug",
    title: "代码报错排查",
    summary: "附上代码片段、完整报错和已尝试的办法，请 AI 解释原因并给出最小修改。",
    contests: ["general"],
    taskType: "代码调试",
    stage: ["code"],
    templateText: `我的 {编程语言} 代码报错了，请帮我定位原因。

【代码片段】
{代码片段}

【完整报错信息】
{报错信息}

【我已经尝试过】
{我已尝试}

请先用两三句话解释报错的直接原因，再给出最小的修改建议，并说明为什么这样改。
如果信息不够判断，请告诉我还需要提供什么（例如数据的前几行、变量的形状）。
不要重写整个程序。

请区分已能确认的原因与候选原因。核对语言/依赖版本、变量类型和数组形状；Python 注意索引、广播、dtype，MATLAB 注意从 1 开始的索引、行列维度及矩阵运算与逐元素运算的区别。若缺输入样例、预期/实际输出或环境信息，先列最少补充项。给一个复现步骤及修复后应检查的断言，说明修改是否改变原建模含义。不能声称未执行的代码已经运行通过。`,
    variables: [
      { key: "编程语言", label: "编程语言", required: true, example: "Python 3.11（pandas 2.x）" },
      { key: "代码片段", label: "代码片段（只放相关部分）", required: true, example: "df['date'] = pd.to_datetime(df['日期'])", multiline: true },
      { key: "报错信息", label: "完整报错信息", required: true, example: "KeyError: '日期'", multiline: true },
      { key: "我已尝试", label: "我已经尝试过", required: false, example: "检查了文件路径，确认文件能读入", multiline: true },
    ],
    before: "先读一遍报错的最后一行，并确认能稳定复现。不要粘贴密钥或个人信息。",
    limits: COMMON_LIMITS,
    source: { author: AUTHOR },
    licenseStatus: "original",
    version: "1.1",
    updatedAt: "2026-10-13",
    reviewStatus: "self-checked",
    demo: true,
  },
  {
    id: "pr.chart.plan",
    title: "图表方案评审",
    summary: "列出想表达的结论和手头数据，请 AI 评审每张图是否真正服务一个结论。",
    contests: ["general"],
    taskType: "图表",
    stage: ["charts"],
    templateText: `我在规划建模论文中的图表，请评审我的方案。

【我想表达的结论】
{结论列表}

【现有数据与结果】
{现有数据}

【我计划画的图】
{图表计划}

请对每张图回答：它支撑哪条结论？图型是否合适（如趋势用折线、比较用柱状）？坐标轴和单位要怎样标注？是否与其他图重复？
最后指出哪条结论还缺少图表或数据支撑。不要编造任何数值。

检查轴截断或对数刻度是否造成误读、样本量及不确定性是否说明、多组图的单位和尺度是否一致、颜色在黑白打印时能否区分。对每张图标明结果表/计算日志来源；只有文字说明而未提供数据或图片时，明确无法核验数值和实际视觉效果。输出优先修改清单，不为美观改变数据或夸大差异。`,
    variables: [
      { key: "结论列表", label: "我想表达的结论", required: true, example: "1. 工作日早晚高峰需求明显高于周末\n2. 调度后缺车率下降", multiline: true },
      { key: "现有数据", label: "现有数据与结果", required: true, example: "各区域逐小时需求预测值；调度前后的缺车率", multiline: true },
      { key: "图表计划", label: "我计划画的图", required: true, example: "图 1 逐小时需求折线；图 2 调度前后缺车率柱状图", multiline: true },
    ],
    before: "先写出 2–4 条想表达的结论。",
    limits: COMMON_LIMITS,
    source: { author: AUTHOR },
    licenseStatus: "original",
    version: "1.1",
    updatedAt: "2026-10-13",
    reviewStatus: "self-checked",
    demo: true,
  },
  {
    id: "pr.paper.selfcheck",
    title: "摘要草稿自检",
    summary: "粘贴自己写好的摘要，请 AI 按清单逐项检查，只提问题不代写。",
    contests: ["general"],
    taskType: "论文自检",
    stage: ["paper"],
    templateText: `下面是我为数学建模比赛（{比赛名称}）写的论文摘要。请按清单逐项检查，只指出问题，不要改写成新的摘要。

【我的摘要】
{论文摘要}

检查清单：
1. 是否说清了每个小问用的方法和得到的主要结果（含关键数值）？
2. 每个结果是否写明了对应的小问和所用模型，方便我回到正文逐条核对？
3. 是否提到了模型检验或敏感性分析？
4. 是否有空泛表述（如“效果很好”）需要换成具体结论？
5. 篇幅和结构是否符合常见要求？（具体字数、页数以当届官方规则为准）
请对每一项给出“已有证据支持 / 需修改 / 无法判断”和一句理由。只检查提供的摘要，不能判断正文正确性或全文格式。

每项判断引用摘要中的短句定位；区分方法名称、量化结果、验证证据和适用范围。题目或计算记录未提供时，对是否覆盖全部小问、数字真实性标“无法判断”，只提示回查。不能根据纯文本确认最终摘要是否单独成页，不凭经验设定硬性字数要求。`,
    variables: [
      { key: "比赛名称", label: "比赛名称", required: false, example: "MCM/ICM" },
      { key: "论文摘要", label: "我的摘要", required: true, example: "针对问题一，我们建立了……", multiline: true },
    ],
    before: "先完成自己的摘要初稿。",
    limits: COMMON_LIMITS,
    source: { author: AUTHOR },
    licenseStatus: "original",
    version: "1.2",
    updatedAt: "2026-10-13",
    reviewStatus: "self-checked",
    demo: true,
  },
  {
    id: "pr.ai.usage",
    title: "AI 使用记录整理",
    summary: "把自己用过 AI 的场景整理成如实、可核对的使用说明，便于按比赛规则披露。",
    contests: ["general"],
    taskType: "AI使用说明",
    stage: ["paper"],
    templateText: `请帮我把下面的 AI 使用记录整理成一份如实的使用说明。只能整理我提供的信息，不要补充我没有做过的使用，也不要淡化 AI 的作用。

【使用过的工具和版本】
{使用过的工具}

【使用场景记录（时间、问了什么、怎样采用或修改）】
{使用场景记录}

请输出：
1. 一张表：时间 | 工具 | 用途 | AI 输出的处理方式（直接采用 / 修改后采用 / 未采用）| 人工核验方式；
2. 一段简短的总体说明，写明哪些工作由队员独立完成。
提醒：是否允许使用 AI、如何披露、格式要求，以当届比赛官方规则为准。

未提供的工具版本、时间、采用方式、人工核验和队员独立完成工作统一标“待补充”，不能推测填写。区分学生记录和 AI 整理建议，并列出需要保留的对话/代码差异/核验日志。没有官方原文时不判断披露格式是否合规，不通过论文文风推断是否使用 AI。`,
    variables: [
      { key: "使用过的工具", label: "使用过的工具和版本", required: true, example: "某对话式 AI 工具（网页版，2026 年 10 月）" },
      { key: "使用场景记录", label: "使用场景记录", required: true, example: "10/12 晚：请 AI 检查小问拆解表，采纳了“补充评价标准”的建议，其余未采用。", multiline: true },
    ],
    before: "比赛过程中随手记录每次使用 AI 的时间、问题和处理方式。",
    limits: COMMON_LIMITS,
    source: { author: AUTHOR },
    licenseStatus: "original",
    version: "1.1",
    updatedAt: "2026-10-13",
    reviewStatus: "self-checked",
    demo: true,
  },
];
