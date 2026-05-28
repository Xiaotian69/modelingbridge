export type ModelMethod = {
  slug: string;
  name: string;
  family: "预测" | "优化" | "评价" | "统计" | "机理" | "网络";
  level: "入门" | "进阶";
  aliases: string[];
  when: string;
  intuition: string;
  inputs: string[];
  outputs: string[];
  learnSteps: string[];
  validation: string[];
  coding: string[];
  paper: string[];
  pitfalls: string[];
  exampleSlugs: string[];
};

export type ClassicProblem = {
  slug: string;
  title: string;
  source: string;
  contest: string;
  year: string;
  type: string;
  difficulty: "入门改编" | "进阶训练" | "冲奖挑战";
  value: string;
  simplifiedTask: string;
  methods: string[];
  deliverables: string[];
};

export type ClassicProblemPracticeLink = {
  href: string;
  label: string;
  ariaLabel: string;
};

export type ContestEvent = {
  slug: string;
  name: string;
  period: string;
  month: number;
  registration: string;
  contestTime: string;
  valueLevel: "核心" | "高" | "训练" | "关注";
  category: "核心赛" | "练手赛" | "专项赛" | "研究生赛" | "中学生赛";
  status: "已确认" | "需核验" | "暂停";
  fit: string;
  prepFocus: string[];
  recommendedFor: string[];
  note: string;
  sourceName: string;
  sourceUrl: string;
};

export type ResourcePack = {
  title: string;
  localPath: string;
  summary: string;
  files: string;
  usage: string[];
};

export type RecentTrainingCase = {
  slug: string;
  title: string;
  contest: "MCM" | "ICM";
  year: string;
  problem: string;
  priority: "P0" | "P1";
  difficulty: "入门友好" | "进阶训练";
  sourceUrl: string;
  localAssets: string[];
  positioning: string;
  modelingLine: string[];
  codingLine: string[];
  paperLine: string[];
  methodSlugs: string[];
  paperRoutes: {
    paperId: string;
    route: string;
    learnPoint: string;
  }[];
  pitfalls: string[];
};

export const learningTracks = [
  {
    title: "零基础建模",
    duration: "7 天入门",
    focus: "读题、题型、数据、基础模型",
    steps: ["拆题模板", "数据清单", "基础模型卡", "一页论文骨架"],
  },
  {
    title: "会 Python 但不会建模",
    duration: "10 天强化",
    focus: "把代码变成模型，把结果变成结论",
    steps: ["特征工程", "模型检验", "图表解释", "复盘记录"],
  },
  {
    title: "赛前冲刺",
    duration: "72 小时节奏",
    focus: "选题、分工、求解、论文合稿",
    steps: ["开题 2 小时", "首版模型", "结果检验", "终稿检查"],
  },
];

export const recentTrainingCases: RecentTrainingCase[] = [
  {
    slug: "mcm-2023c-wordle",
    title: "2023C Predicting Wordle Results",
    contest: "MCM",
    year: "2023",
    problem: "C",
    priority: "P0",
    difficulty: "入门友好",
    sourceUrl: "https://www.contest.comap.org/undergraduate/contests/matrix/index.html",
    localAssets: ["2023_MCM_Problem_C.pdf", "Problem_C_Data_Wordle.xlsx", "2023C O奖论文 12 篇"],
    positioning: "用亲切的文字游戏数据训练特征工程、预测分布和英文结果表达。",
    modelingLine: ["把报告人数预测、得分分布预测、难度分类拆成三个子问题", "从单词本身派生重复字母、元音、字母频率、词频等特征", "保留 baseline，再比较回归、随机森林、聚类等模型"],
    codingLine: ["清洗 Excel 合并表头并重命名字段", "计算 Hard Mode 比例和平均猜测次数", "构造单词特征表并预测 1-6-X 得分分布"],
    paperLine: ["解释每个单词特征为什么可能影响难度", "用误差指标和敏感性分析说明模型可信度", "最后写成给 NYT Puzzle Editor 的短建议"],
    methodSlugs: ["regression-tree", "time-series", "clustering"],
    paperRoutes: [
      { paperId: "2300348", route: "GRU + 回归分析 + 网格搜索随机森林 + K-Means++", learnPoint: "学习如何把四个问题拆成预测、解释和分类三条线。" },
      { paperId: "2301192", route: "SIRS/Prophet + 多元线性回归 + BP 神经网络 + K-Means++", learnPoint: "学习类比建模的解释力和边界。" },
    ],
    pitfalls: ["随机切分报告人数会造成时间泄漏", "只预测平均猜测次数会漏掉题目要求的完整分布", "难度分层必须回到单词特征解释"],
  },
  {
    slug: "mcm-2024c-tennis-momentum",
    title: "2024C Momentum in Tennis",
    contest: "MCM",
    year: "2024",
    problem: "C",
    priority: "P0",
    difficulty: "进阶训练",
    sourceUrl: "https://www.contest.comap.org/undergraduate/contests/matrix/index.html",
    localAssets: ["2024_MCM_Problem_C_FINAL.pdf", "Wimbledon_featured_matches.csv", "data_dictionary.csv", "2024C O奖论文 11 篇"],
    positioning: "把 momentum 这种模糊概念量化成点级时序指标，再做检验和预测。",
    modelingLine: ["定义局部优势指标而不是直接把连续得分叫 momentum", "用滑动窗口、发球优势修正和随机性检验描述比赛走势", "把优势反转转成可预测的二分类或状态转移问题"],
    codingLine: ["按 match_id 与 point_no 排序，先选决赛单场试跑", "构造 player1/player2 点级胜负变量与滑动窗口优势曲线", "标记优势反转点并输出候选影响因素表"],
    paperLine: ["先定义 momentum 的数学含义", "用 match flow 曲线解释模型输出", "给教练 memo 写可执行而非玄学的建议"],
    methodSlugs: ["regression-tree", "time-series", "clustering"],
    paperRoutes: [
      { paperId: "2401298", route: "发球/接发重加权 + 滑动窗口/AUC + 随机性检验 + 双时间贝叶斯网络", learnPoint: "学习先定义指标，再检验随机性的论文顺序。" },
      { paperId: "2401445", route: "动态比赛指数 DPI + GBDT + DTW + 随机森林/HMM", learnPoint: "学习复杂状态指标如何组织成可读论文。" },
    ],
    pitfalls: ["忽略发球优势会高估 momentum", "只画曲线不做随机性对比说服力不够", "只分析决赛而不测试其他比赛会削弱泛化性"],
  },
  {
    slug: "mcm-2025c-olympic-medals",
    title: "2025C Models for Olympic Medal Tables",
    contest: "MCM",
    year: "2025",
    problem: "C",
    priority: "P0",
    difficulty: "进阶训练",
    sourceUrl: "https://www.comap.org/membership/member-resources/item/models-for-olympic-medal-tables",
    localAssets: ["2025C O奖论文 15 篇", "COMAP 官方题面", "官方夏奥奖牌与运动员数据"],
    positioning: "用奥运奖牌预测训练面板数据、排名预测、不确定性和因素解释。",
    modelingLine: ["拆成奖牌预测、首枚奖牌国家、项目贡献、名帅效应四个子问题", "构造国家-年份面板数据并加入主场、历史奖牌、项目数量等特征", "用 baseline、随机森林、回归或 Poisson/Bootstrap 输出区间"],
    codingLine: ["整理国家代码、年份、金牌数和总奖牌数", "训练 gold 与 total 两个目标的预测模型", "对无奖牌国家做首奖概率分类并输出解释特征"],
    paperLine: ["预测表必须带区间而不是只有排名", "项目贡献要用图表解释国家优势", "名帅效应只能谨慎表达，避免把相关直接写成因果"],
    methodSlugs: ["regression-tree", "time-series", "entropy-topsis"],
    paperRoutes: [
      { paperId: "2505964", route: "随机森林 + Monte Carlo + Poisson/线性回归 + 名帅模型", learnPoint: "学习预测、模拟和解释如何组合。" },
      { paperId: "2507817", route: "网格搜索随机森林 + Logistic 回归 + 项目贡献比例 + Lasso", learnPoint: "学习预测和首奖分类的任务接口。" },
      { paperId: "2510862", route: "Stacking ensemble + SHAP + PSM-DID", learnPoint: "作为进阶材料理解因果表达边界。" },
    ],
    pitfalls: ["只给奖牌排名没有预测区间", "把金牌数和总奖牌数混成一个目标", "名帅效应缺少对照组时不能强写因果"],
  },
  {
    slug: "mcm-2025b-sustainable-tourism",
    title: "2025B Managing Sustainable Tourism",
    contest: "MCM",
    year: "2025",
    problem: "B",
    priority: "P1",
    difficulty: "进阶训练",
    sourceUrl: "https://www.comap.org/membership/member-resources/item/managing-sustainable-tourism",
    localAssets: ["2025B O奖论文 7 篇", "COMAP 官方题面"],
    positioning: "用 Juneau 旅游问题训练经济、社会、环境三目标评价与政策优化。",
    modelingLine: ["建立经济收益、居民压力、环境影响三类指标", "比较 AHP/熵权、动态模型和多目标规划", "把税率、游客上限、财政分配作为政策变量"],
    codingLine: ["整理游客量、收入、环境代理变量和政策参数", "计算可持续综合得分并做参数敏感性", "用 SLSQP 或动态规划搜索政策方案"],
    paperLine: ["先解释三目标冲突，再给政策权衡", "结果部分必须区分短期收益和长期可持续性", "memo 要写给旅游委员会而不是写成模型说明书"],
    methodSlugs: ["entropy-topsis", "ahp", "linear-programming", "differential-equation"],
    paperRoutes: [
      { paperId: "2502617", route: "经济/社会/环境子模型 + SLSQP Pareto 优化", learnPoint: "学习多目标优化的论文组织方式。" },
      { paperId: "2503268", route: "动态系统 + AHP 综合评价 + 敏感性分析", learnPoint: "学习评价模型和动态系统的组合。" },
      { paperId: "2504448", route: "游客需求模型 + 环境熵权指标 + 动态规划", learnPoint: "学习政策变量如何进入模型。" },
    ],
    pitfalls: ["只追求游客收入会偏离可持续目标", "指标权重没有来源会削弱可信度", "政策建议必须能对应模型变量"],
  },
];

export const modelMethods: ModelMethod[] = [
  {
    slug: "linear-programming",
    name: "线性规划 / 整数规划",
    family: "优化",
    level: "入门",
    aliases: ["线性规划", "整数规划", "多目标线性规划", "混合整数规划", "MILP", "LP", "优化模型", "最小费用流"],
    when: "资源有限、目标明确、约束可写成等式或不等式时使用。",
    intuition: "把现实决策翻译成变量、目标函数和约束条件，求一个满足硬约束的最好方案。",
    inputs: ["决策变量", "目标系数", "供给/需求约束", "容量/预算/时间限制"],
    outputs: ["最优决策表", "目标函数值", "约束是否满足", "灵敏度变化"],
    learnSteps: ["先写变量含义和单位", "列目标函数", "逐条翻译约束", "用小样例手算检查", "再交给求解器"],
    validation: ["检查求解状态是否 optimal", "逐条验算约束", "做边界情景", "扰动关键参数"],
    coding: ["PuLP 更适合新手读代码", "scipy.optimize.linprog 适合连续线性规划", "变量矩阵要保留行列索引", "不可行时先查供需平衡"],
    paper: ["目标函数和约束分开展示", "每条约束配一句现实解释", "结果表必须说明单位", "灵敏度图只保留影响最大的变量"],
    pitfalls: ["只写目标函数不写完整约束", "把必须为整数的量当连续变量", "没有检查无可行解", "多目标权重没有依据"],
    exampleSlugs: ["emergency-dispatch", "bike-dispatch", "traffic-police-platform"],
  },
  {
    slug: "time-series",
    name: "时间序列预测",
    family: "预测",
    level: "入门",
    aliases: ["ARIMA", "指数平滑", "时间序列", "Prophet", "滚动预测", "需求预测"],
    when: "数据按时间排列，并且题目要求预测未来需求、销量、流量、温度等指标。",
    intuition: "用过去的趋势、周期和扰动推断未来，但必须承认预测误差会传递到后续决策。",
    inputs: ["时间戳", "目标变量", "节假日/天气等外生变量", "训练/验证时间划分"],
    outputs: ["未来预测值", "误差指标", "置信区间或误差范围", "残差诊断"],
    learnSteps: ["画时间序列图", "做平稳性和周期判断", "建立 baseline", "滚动验证", "输出误差解释"],
    validation: ["MAE/RMSE/MAPE", "残差是否有结构", "滚动窗口验证", "与历史均值 baseline 对比"],
    coding: ["先按时间排序", "不要随机切分时序数据", "特征滞后不能偷看未来", "预测矩阵要能被优化模型读取"],
    paper: ["先写趋势与周期观察", "再解释模型选择", "误差图比单个分数更有说服力", "说明极端天气或突发事件局限"],
    pitfalls: ["只拿历史均值当模型", "训练集测试集时间穿越", "MAPE 在接近 0 时失真", "不说明误差对决策的影响"],
    exampleSlugs: ["bike-dispatch", "carbon-forecast", "sales-demand"],
  },
  {
    slug: "regression-tree",
    name: "回归 / 随机森林",
    family: "预测",
    level: "入门",
    aliases: ["线性回归", "多元回归", "随机森林", "XGBoost", "LightGBM", "特征重要性"],
    when: "目标变量受多个因素影响，需要解释因素关系或做监督学习预测。",
    intuition: "回归重解释，树模型重效果；竞赛里常用 baseline + 进阶模型对比。",
    inputs: ["目标变量", "数值/类别特征", "训练/测试划分", "缺失值处理规则"],
    outputs: ["预测结果", "误差指标", "变量影响", "特征重要性"],
    learnSteps: ["先跑线性回归 baseline", "检查共线性和异常值", "再尝试树模型", "比较泛化误差", "解释关键因素"],
    validation: ["交叉验证", "训练误差与测试误差差距", "特征重要性稳定性", "残差图"],
    coding: ["sklearn Pipeline 管理预处理", "类别变量需编码", "随机森林要固定 random_state", "保存特征列顺序"],
    paper: ["用 baseline 证明改进", "变量解释不要越界成因果", "树模型需补充可解释性", "展示误差对业务指标影响"],
    pitfalls: ["把相关说成因果", "只报训练集分数", "特征泄露", "特征重要性不稳定还硬解释"],
    exampleSlugs: ["credit-decision", "sales-demand", "wine-evaluation"],
  },
  {
    slug: "entropy-topsis",
    name: "熵权法 / TOPSIS",
    family: "评价",
    level: "入门",
    aliases: ["TOPSIS", "熵权法", "综合评价", "评价模型", "排名", "优劣解距离法"],
    when: "多个对象、多项指标，需要综合排名或评价优劣。",
    intuition: "先把不同量纲的指标变成可比较数字，再根据指标差异确定权重，最后看谁更接近理想对象。",
    inputs: ["评价对象", "指标矩阵", "指标方向", "权重来源"],
    outputs: ["标准化矩阵", "权重向量", "接近度", "综合排名"],
    learnSteps: ["判断效益/成本型", "标准化", "计算熵权或设定权重", "求正负理想解", "做排名稳健性"],
    validation: ["权重扰动", "删除单个指标重算", "与 AHP 或加权评分对比", "检查指标相关性"],
    coding: ["标准化时处理同列全相等", "权重归一化", "矩阵维度要写清", "排名输出保留原对象名"],
    paper: ["指标体系先于公式", "解释权重高低原因", "排名后必须给改进建议", "稳健性结果单独成节"],
    pitfalls: ["指标方向写反", "虚构问卷数据", "接近度当百分制分数", "权重没有解释"],
    exampleSlugs: ["canteen-service", "wine-evaluation", "city-livability"],
  },
  {
    slug: "ahp",
    name: "AHP 层次分析法",
    family: "评价",
    level: "入门",
    aliases: ["AHP", "层次分析", "主观权重", "判断矩阵"],
    when: "指标权重需要专家判断，且能构建目标层、准则层、方案层。",
    intuition: "让人类判断两两指标谁更重要，再用一致性检验约束主观性。",
    inputs: ["层次结构", "判断矩阵", "专家打分", "方案指标值"],
    outputs: ["主观权重", "一致性比率", "综合得分", "排序"],
    learnSteps: ["画层次结构", "构造判断矩阵", "求权重", "做一致性检验", "与客观权重对比"],
    validation: ["CR < 0.1", "专家权重敏感性", "与熵权结果对照", "检查打分来源"],
    coding: ["矩阵必须互反", "最大特征值计算", "一致性指标 RI 要查表", "多专家可取几何平均"],
    paper: ["解释指标层次", "说明专家来源或模拟假设", "一致性检验必须出现", "不要只报最终排名"],
    pitfalls: ["判断矩阵随意填", "CR 不合格还继续用", "主观权重伪装成客观结论", "层次过多导致不可解释"],
    exampleSlugs: ["canteen-service", "supplier-selection", "city-livability"],
  },
  {
    slug: "clustering",
    name: "聚类分析",
    family: "统计",
    level: "入门",
    aliases: ["KMeans", "层次聚类", "聚类", "分类画像", "群体划分"],
    when: "没有标签，但希望把对象按相似性分组，做画像或策略分层。",
    intuition: "让数据自己形成若干类，再由人解释每类有什么共同特征。",
    inputs: ["对象特征矩阵", "标准化规则", "聚类数量", "距离度量"],
    outputs: ["类别标签", "类中心", "群体画像", "差异解释"],
    learnSteps: ["选择能解释的特征", "标准化", "用肘部法/轮廓系数选 K", "解释类中心", "给策略建议"],
    validation: ["轮廓系数", "类内/类间距离", "不同 K 的稳定性", "业务解释是否通顺"],
    coding: ["标准化很关键", "固定随机种子", "降维可视化只做展示", "输出每类样本数"],
    paper: ["先解释为什么要分群", "类名要来自特征而非想象", "策略建议对应每类短板", "不要把聚类当监督分类"],
    pitfalls: ["未标准化导致量纲支配", "K 值没有依据", "只画图不解释", "类名随意贴标签"],
    exampleSlugs: ["customer-segmentation", "city-livability", "campus-risk"],
  },
  {
    slug: "differential-equation",
    name: "微分方程 / 机理模型",
    family: "机理",
    level: "进阶",
    aliases: ["微分方程", "SIR", "动力学模型", "机理分析", "状态转移"],
    when: "题目关注系统随时间演化，变量之间有明确机制关系。",
    intuition: "用状态变量和变化率刻画系统机制，而不是只做数据拟合。",
    inputs: ["状态变量", "参数含义", "初始条件", "外部输入"],
    outputs: ["演化曲线", "参数估计", "稳定性分析", "情景模拟"],
    learnSteps: ["定义状态变量", "写变化率方程", "估计参数", "数值求解", "做情景解释"],
    validation: ["参数敏感性", "初值扰动", "与观测数据拟合", "极端情景是否合理"],
    coding: ["scipy.integrate.solve_ivp", "参数范围要有限制", "先画单变量曲线", "避免过多自由参数"],
    paper: ["每个方程解释现实含义", "参数表要完整", "用情景模拟支撑建议", "承认机理简化"],
    pitfalls: ["方程看起来复杂但变量无意义", "参数全靠拍脑袋", "没有单位检查", "只拟合不解释机制"],
    exampleSlugs: ["epidemic-sir", "carbon-forecast", "population-flow"],
  },
  {
    slug: "network-flow",
    name: "网络流 / 图模型",
    family: "网络",
    level: "进阶",
    aliases: ["网络流", "图模型", "最短路", "最大流", "路径优化", "复杂网络"],
    when: "对象天然是节点和边，例如道路、物流、通信、社交传播。",
    intuition: "把实体看成节点，把关系看成边，在网络结构上做路径、流量或重要性分析。",
    inputs: ["节点表", "边表", "权重/容量", "起终点或需求"],
    outputs: ["最短路径", "流量分配", "关键节点", "网络鲁棒性"],
    learnSteps: ["定义节点和边", "明确边权含义", "选择路径/流/中心性模型", "可视化网络", "做断边情景"],
    validation: ["路径可达性", "容量约束", "断点敏感性", "与基准策略对比"],
    coding: ["networkx 适合建图和可视化", "边权方向要确认", "大图先抽样展示", "输出路径时保留节点名"],
    paper: ["网络图只展示关键子图", "解释节点重要性指标", "情景分析比静态指标更有价值", "约束条件要和现实对应"],
    pitfalls: ["无向图/有向图混用", "边权单位不一致", "图太乱看不出结论", "只算中心性不回到问题"],
    exampleSlugs: ["emergency-dispatch", "traffic-police-platform", "bike-dispatch"],
  },
];

export const classicProblems: ClassicProblem[] = [
  {
    slug: "traffic-police-platform",
    title: "交巡警服务平台设置与调度（简化版）",
    source: "国赛经典题型改编",
    contest: "CUMCM",
    year: "2011",
    type: "选址 + 调度 + 网络优化",
    difficulty: "冲奖挑战",
    value: "非常适合学习“数据地图化、约束转译、服务半径、响应时间”这条综合链路。",
    simplifiedTask: "给定路口节点、道路时间和警力数量，规划服务平台覆盖范围，并在突发事件中给出调度顺序。",
    methods: ["network-flow", "linear-programming", "clustering"],
    deliverables: ["覆盖率表", "响应时间分布", "关键节点图", "调度方案解释"],
  },
  {
    slug: "wine-evaluation",
    title: "葡萄酒评价与指标筛选（简化版）",
    source: "国赛经典题型改编",
    contest: "CUMCM",
    year: "2012",
    type: "综合评价 + 统计检验",
    difficulty: "进阶训练",
    value: "适合学习评价类题目的指标筛选、主客观权重、排名稳健性和可解释性。",
    simplifiedTask: "给出多位评委评分和若干理化指标，判断评分可靠性，并建立综合评价模型。",
    methods: ["entropy-topsis", "ahp", "regression-tree"],
    deliverables: ["评分一致性分析", "指标权重", "样本排名", "敏感性检查"],
  },
  {
    slug: "lunar-landing",
    title: "软着陆轨迹设计（概念简化版）",
    source: "国赛经典题型改编",
    contest: "CUMCM",
    year: "2014",
    type: "机理建模 + 最优控制",
    difficulty: "冲奖挑战",
    value: "适合训练状态变量、物理约束、目标函数和数值模拟意识。",
    simplifiedTask: "在二维平面中模拟飞行器高度、速度和燃料消耗，设计安全着陆策略。",
    methods: ["differential-equation", "linear-programming"],
    deliverables: ["状态方程", "轨迹曲线", "燃料消耗", "参数敏感性"],
  },
  {
    slug: "credit-decision",
    title: "中小微企业信贷决策（简化版）",
    source: "国赛经典题型改编",
    contest: "CUMCM",
    year: "2020",
    type: "预测 + 评价 + 决策",
    difficulty: "进阶训练",
    value: "覆盖数据清洗、风险评分、额度分配和政策解释，是商业建模常见母题。",
    simplifiedTask: "根据企业经营指标和历史违约情况，建立风险评分并给出授信额度建议。",
    methods: ["regression-tree", "entropy-topsis", "linear-programming"],
    deliverables: ["风险分层", "授信额度表", "变量重要性", "公平性说明"],
  },
  {
    slug: "wordle-prediction",
    title: "Wordle 结果预测（简化版）",
    source: "MCM 经典传播题型改编",
    contest: "MCM",
    year: "2023",
    type: "预测 + 解释 + 文本特征",
    difficulty: "进阶训练",
    value: "适合学习如何把非传统数据变成特征，并把预测结果写成清楚的英文论文逻辑。",
    simplifiedTask: "基于每日词汇特征和历史猜测分布，预测未来词的难度，并解释影响因素。",
    methods: ["regression-tree", "time-series", "clustering"],
    deliverables: ["特征表", "难度预测", "误差分析", "因素解释"],
  },
  {
    slug: "bike-dispatch",
    title: "共享单车需求预测与调度",
    source: "训练样题",
    contest: "校内训练",
    year: "改编",
    type: "预测 + 优化",
    difficulty: "入门改编",
    value: "最适合作为新手第一题，能把预测输出如何进入优化模型讲清楚。",
    simplifiedTask: "预测各区域未来需求，并在车辆总数限制下给出调入调出建议。",
    methods: ["time-series", "regression-tree", "linear-programming"],
    deliverables: ["需求预测矩阵", "调度矩阵", "缺车率对比", "误差传递讨论"],
  },
  {
    slug: "canteen-service",
    title: "校园食堂服务质量评价",
    source: "训练样题",
    contest: "校内训练",
    year: "改编",
    type: "综合评价",
    difficulty: "入门改编",
    value: "评价类入门友好，能快速练会指标方向、标准化、权重和排名稳健性。",
    simplifiedTask: "用排队时长、满意度、价格、卫生评分等指标对食堂窗口排序。",
    methods: ["entropy-topsis", "ahp", "clustering"],
    deliverables: ["指标体系", "权重表", "TOPSIS 排名", "改进建议"],
  },
  {
    slug: "emergency-dispatch",
    title: "应急物资调度路径优化",
    source: "训练样题",
    contest: "校内训练",
    year: "改编",
    type: "运输优化",
    difficulty: "进阶训练",
    value: "优化类核心样题，适合从线性规划走到网络流、整数规划和情景分析。",
    simplifiedTask: "在仓库库存、车辆容量和道路时间限制下，给多个安置点配送物资。",
    methods: ["linear-programming", "network-flow"],
    deliverables: ["调度量矩阵", "总成本", "不可行约束说明", "道路中断情景"],
  },
];

const classicProblemCaseSlugs: Record<string, string> = {
  "traffic-police-platform": "traffic-police-platform-demo",
  "wine-evaluation": "wine-evaluation-demo",
  "credit-decision": "credit-decision-demo",
  "wordle-prediction": "wordle-prediction-demo",
  "bike-dispatch": "bike-demand-demo",
  "canteen-service": "evaluation-topsis-demo",
  "emergency-dispatch": "optimization-dispatch-demo",
};

export function getClassicProblemPracticeLink(problem: ClassicProblem): ClassicProblemPracticeLink {
  const caseSlug = classicProblemCaseSlugs[problem.slug];
  if (caseSlug) {
    return {
      href: `/cases/${caseSlug}`,
      label: "查看完整拆解",
      ariaLabel: `${problem.title} 查看完整拆解`,
    };
  }

  const query = new URLSearchParams();
  query.set("problem_text", `${problem.title}\n${problem.simplifiedTask}`);
  query.set("attachment_note", `来自经典题改编：${problem.source} ${problem.year}。请把输出作为学习提示，不生成可直接提交的论文。`);
  return {
    href: `/workbench?${query.toString()}`,
    label: "带入工作台",
    ariaLabel: `${problem.title} 带入工作台`,
  };
}

export const codingTips = [
  {
    title: "先让数据表干净，再谈模型",
    items: ["每列字段写清单位", "缺失值处理留日志", "时间字段统一时区", "原始数据不覆盖"],
  },
  {
    title: "每个模型都要有 baseline",
    items: ["预测题用历史均值或朴素预测", "评价题用等权评分", "优化题用不调度或贪心方案", "论文里说明提升幅度"],
  },
  {
    title: "代码目录按论文逻辑组织",
    items: ["data/ 放原始与清洗数据", "models/ 放训练和求解", "analysis/ 放检验和灵敏度", "figures/ 放论文图表"],
  },
  {
    title: "可复现实验比花哨更重要",
    items: ["固定随机种子", "保存参数配置", "导出关键中间表", "错误结果也记录原因"],
  },
];

export const writingTips = [
  {
    title: "摘要不要写成背景介绍",
    items: ["问题一句话", "方法一句话", "关键结果要有数字", "最后给可执行建议"],
  },
  {
    title: "假设要有依据",
    items: ["每条假设写现实理由", "不要用假设掩盖数据缺失", "影响大的假设做敏感性分析", "假设与模型变量对应"],
  },
  {
    title: "图表必须服务结论",
    items: ["图名前置结论", "坐标轴写单位", "不要堆重复图", "每张图后解释一句发现"],
  },
  {
    title: "AI 使用记录单独留档",
    items: ["记录输入题面", "记录模型建议", "记录人工修改", "最终论文自己组织表达"],
  },
];

export const contestCalendar: ContestEvent[] = [
  {
    slug: "mcm-icm",
    name: "MCM/ICM 美赛",
    period: "每年 1-2 月",
    month: 1,
    registration: "2026 截止：1 月 29 日 15:00 EST 前",
    contestTime: "2026 年 1 月 29 日 17:00 至 2 月 2 日 20:00 EST",
    valueLevel: "核心",
    category: "核心赛",
    status: "已确认",
    fit: "英文论文、国际化履历、跨学科开放题",
    prepFocus: ["英文论文", "96 小时协作", "开放题选题", "可视化表达"],
    recommendedFor: ["有国赛/校赛经验", "英语写作愿意投入", "想练跨学科问题"],
    note: "规则和时间以 COMAP 当年页面为准，注意时区换算。",
    sourceName: "COMAP 2026 Rules",
    sourceUrl: "https://www.contest.comap.org/undergraduate/contests/mcm/instructions.php",
  },
  {
    slug: "cumcm",
    name: "高教社杯全国大学生数学建模竞赛（国赛）",
    period: "每年 9 月",
    month: 9,
    registration: "通常校内 5-8 月组织，具体以学校/赛区通知为准",
    contestTime: "官网已标注 2026 赛题发布时间：9 月 10 日 18:00",
    valueLevel: "核心",
    category: "核心赛",
    status: "已确认",
    fit: "国内最核心数模竞赛，适合所有方向队伍重点准备",
    prepFocus: ["中文论文", "三天协作", "题型识别", "模型检验"],
    recommendedFor: ["所有本科队伍", "数学建模协会主线训练", "希望拿校级/省级/国家级奖项"],
    note: "报名、提交和 AI 使用规定以全国组委会与学校通知为准。",
    sourceName: "全国大学生数学建模竞赛官网",
    sourceUrl: "https://www.mcm.edu.cn/?key=WWW.CN2025",
  },
  {
    slug: "mathorcup",
    name: "MathorCup 数学应用挑战赛",
    period: "每年 4 月左右",
    month: 4,
    registration: "2026 报名：2025.12.30 至 2026.04.16 12:00",
    contestTime: "2026 年 4 月中下旬，适合作为国赛前训练",
    valueLevel: "高",
    category: "练手赛",
    status: "已确认",
    fit: "应用题、数据题、产教融合题，适合练完整流程",
    prepFocus: ["应用建模", "数据处理", "论文结构", "赛前节奏"],
    recommendedFor: ["想提前练手的国赛队", "会 Python 但缺流程的队伍", "协会训练营"],
    note: "具体时间以 MathorCup 官网与赛氪页面为准。",
    sourceName: "MathorCup 官网",
    sourceUrl: "https://www.mathorcup.org/",
  },
  {
    slug: "wuyi",
    name: "五一数学建模竞赛",
    period: "4-5 月",
    month: 5,
    registration: "2026 报名：4 月 2 日 8:00 至 4 月 30 日 24:00",
    contestTime: "五一假期前后，适合作为省赛/国赛前热身",
    valueLevel: "训练",
    category: "练手赛",
    status: "已确认",
    fit: "协会组织训练、低门槛练论文节奏",
    prepFocus: ["第一次完整参赛", "中文论文", "基础模型", "团队分工"],
    recommendedFor: ["小白队伍", "校内协会训练", "需要低压力试水"],
    note: "多为省级赛事属性，含金量因学校和地区认定不同而变化。",
    sourceName: "大学生数学竞赛网通知",
    sourceUrl: "https://www.cmathc.org.cn/mcm/tz/424.html",
  },
  {
    slug: "shuwei",
    name: "数维杯全国大学生数学建模挑战赛",
    period: "春季 5 月 / 秋季另行通知",
    month: 5,
    registration: "2026 春季：3 月下旬至 5 月 8 日 06:00",
    contestTime: "2026 春季：5 月 8 日 09:00 至 5 月 11 日 09:00",
    valueLevel: "训练",
    category: "练手赛",
    status: "已确认",
    fit: "新队伍熟悉 72 小时协作、练基础论文结构",
    prepFocus: ["72 小时流程", "基础题型", "论文合稿", "代码复现"],
    recommendedFor: ["小白队伍", "新组队磨合", "国赛前流程训练"],
    note: "适合试错和练手，不建议替代国赛/美赛主线准备。",
    sourceName: "数维杯官网",
    sourceUrl: "https://www.nmmcm.org.cn/",
  },
  {
    slug: "huashu",
    name: "华数杯国际大学生数学建模竞赛",
    period: "每年 1 月左右",
    month: 1,
    registration: "2026 报名：至 1 月 16 日",
    contestTime: "2026 年 1 月 17 日 06:00 至 1 月 21 日 09:00",
    valueLevel: "训练",
    category: "练手赛",
    status: "已确认",
    fit: "美赛前英文论文与节奏模拟",
    prepFocus: ["英文摘要", "美赛预演", "跨学科表达", "图表规范"],
    recommendedFor: ["准备美赛的队伍", "想练英文论文", "已有基础的队伍"],
    note: "适合美赛前全真练手，含金量按学校政策确认。",
    sourceName: "赛氪赛事页",
    sourceUrl: "https://m.saikr.com/mcmicm2026",
  },
  {
    slug: "apmcm",
    name: "APMCM 亚太地区大学生数学建模竞赛",
    period: "常见在 7 月或 11 月",
    month: 7,
    registration: "每年通知变动，需查看当年中文/英文通知",
    contestTime: "2025 中文赛项为 7 月 11 日至 7 月 15 日",
    valueLevel: "关注",
    category: "练手赛",
    status: "需核验",
    fit: "国际化题型、英文表达、跨校训练",
    prepFocus: ["英文/中文赛项选择", "跨学科题", "暑期训练", "论文排版"],
    recommendedFor: ["暑期有时间训练", "想补国际赛经历", "已有一次完整参赛经验"],
    note: "当前先做关注项，正式备赛需核验当年官方通知。",
    sourceName: "APMCM / 赛氪通知",
    sourceUrl: "https://www.apmcm.org/detail/2299",
  },
  {
    slug: "shenzhen-cup",
    name: "深圳杯数学建模挑战赛",
    period: "2026 暂停",
    month: 7,
    registration: "2026 年暂停举办",
    contestTime: "2026 年暂停举办",
    valueLevel: "关注",
    category: "专项赛",
    status: "暂停",
    fit: "往年偏研究型挑战，适合高水平队伍关注",
    prepFocus: ["研究型建模", "论文深度", "复杂问题拆解"],
    recommendedFor: ["高水平队伍", "有科研训练基础", "长期关注即可"],
    note: "2026 年已公告暂停，不要安排进今年试运行报名提醒。",
    sourceName: "大学生数学竞赛网通知",
    sourceUrl: "https://www.cmathc.org.cn/mcm/tz/488.html",
  },
  {
    slug: "tzmcm",
    name: "“认证杯”数学中国数学建模网络挑战赛",
    period: "常见 4-5 月分阶段",
    month: 5,
    registration: "2026 第十九届已发布通知，具体阶段以官网为准",
    contestTime: "常见分两阶段网络赛，适合作为低压力练手",
    valueLevel: "训练",
    category: "练手赛",
    status: "需核验",
    fit: "网络赛、论文公示、适合新队伍看他人思路复盘",
    prepFocus: ["快速组队", "论文结构", "赛后复盘", "阅读优秀论文"],
    recommendedFor: ["小白队伍", "想多练完整流程", "协会训练"],
    note: "不同阶段和报名规则需以数学中国官网当年通知为准。",
    sourceName: "数学中国通知",
    sourceUrl: "https://www.tzmcm.cn/tz.html",
  },
  {
    slug: "eecmcm",
    name: "中国电机工程学会杯电工数学建模竞赛",
    period: "常见 5 月",
    month: 5,
    registration: "2026 年赛项已发布报名通知，具体校内选拔时间不同",
    contestTime: "2026 年 5 月中下旬前后，需按赛氪/学校通知核验",
    valueLevel: "高",
    category: "专项赛",
    status: "需核验",
    fit: "电气、能源、电力系统方向，工科应用建模含金量较好",
    prepFocus: ["电力系统背景", "优化调度", "工程约束", "仿真解释"],
    recommendedFor: ["电气/能源相关专业", "会优化模型", "想做专项应用题"],
    note: "校内选拔和正式赛时间可能不同，需看本校通知。",
    sourceName: "赛氪电工杯页面",
    sourceUrl: "https://m.saikr.com/EECMCM2026",
  },
  {
    slug: "cpgmcm",
    name: "“华为杯”中国研究生数学建模竞赛",
    period: "每年 9 月左右",
    month: 9,
    registration: "2026 审核起止：6 月 1 日 8:00 至 9 月 20 日 17:00",
    contestTime: "研究生队伍为主，通常 9 月下旬比赛，需以研创网当年通知为准",
    valueLevel: "核心",
    category: "研究生赛",
    status: "已确认",
    fit: "研究生核心建模赛事，题目更偏工程、产业和研究深度",
    prepFocus: ["工程建模", "复杂数据", "论文深度", "团队科研表达"],
    recommendedFor: ["研究生", "高年级本科旁听学习", "准备科研型题目"],
    note: "本科生通常不作为主目标，但可用于学习高阶题型。",
    sourceName: "大学生数学竞赛网通知",
    sourceUrl: "https://www.cmathc.org.cn/mcm/tz/465.html",
  },
  {
    slug: "zhongqing-cup",
    name: "中青杯全国大学生数学建模竞赛",
    period: "常见 6 月",
    month: 6,
    registration: "2026 信息需以当年通知核验",
    contestTime: "资料显示 2026 年常见安排在 6 月上旬，需核验官方通知",
    valueLevel: "训练",
    category: "练手赛",
    status: "需核验",
    fit: "小比赛练手，适合国赛前补一次完整流程",
    prepFocus: ["中文论文", "基础模型", "团队磨合", "赛后复盘"],
    recommendedFor: ["小白队伍", "国赛前练手", "时间较充裕的队伍"],
    note: "来源分散，正式规划前请让 ClaudeCode 核验当年官方链接。",
    sourceName: "待核验来源",
    sourceUrl: "https://bzdshumo.com/",
  },
];

export const resourcePacks: ResourcePack[] = [
  {
    title: "2000-2024 年美赛赛题汇总",
    localPath: "E:/数模网站开发/2000-2024年美赛赛题汇总【公众号：数模加油站】",
    summary: "本地已识别 110 个文件，其中 PDF 赛题 76 个、表格数据 6 个、压缩包 10 个。",
    files: "MCM/ICM 历年题目、部分数据附件和中英资料",
    usage: ["整理经典母题", "做题型标签", "提炼简化训练题", "训练英文题面阅读"],
  },
  {
    title: "2006-2025 年美赛优秀论文汇总",
    localPath: "E:/数模网站开发/2006-2025年美赛优秀论文汇总【公众号：数模加油站】",
    summary: "本地已识别 206 个文件，其中 PDF 论文 186 个、压缩包 19 个。",
    files: "O 奖/特等奖论文、部分年份合辑和附件",
    usage: ["拆解摘要结构", "学习图表表达", "对照模型检验写法", "提炼英文论文模板"],
  },
  {
    title: "历年美赛赛题、翻译、优秀论文与解析归档",
    localPath: "E:/数模网站开发/历年美赛赛题、翻译、优秀论文（中英文）、赛题解析等",
    summary: "本地已识别 419 个文件，其中 PDF 381 个、ZIP 24 个、RAR 8 个、DOCX 4 个，覆盖 2006-2025 年多套 O 奖论文、中文摘要、英文原文、赛题和解析资料。",
    files: "2006-2024 O 奖论文合集、2018-2020 中文摘要+英文原文+赛题、2024/2025 O 奖论文集",
    usage: ["补齐原题入口", "对照中英文题面", "按年份/题号抽取获奖论文路线", "沉淀近三年真题拆解"],
  },
  {
    title: "美赛 Prompt 与论文模板",
    localPath: "E:/数模网站开发/数学建模Prompt",
    summary: "本地已识别 559 个文件，含 PDF、DOCX、XLSX 和多套提示词资料。",
    files: "美赛题型提示词、论文模板、摘要优化和模型检验提示",
    usage: ["清洗成合规提示词库", "提炼问答式学习模板", "区分辅助学习与代写风险"],
  },
];

export function findModelMethod(name: string) {
  const normalized = name.toLowerCase();
  return modelMethods.find((method) =>
    [method.name, ...method.aliases].some((alias) => normalized.includes(alias.toLowerCase()) || alias.toLowerCase().includes(normalized)),
  );
}

export function getRecentTrainingCase(slug: string): RecentTrainingCase | null {
  return recentTrainingCases.find((item) => item.slug === slug) ?? null;
}
