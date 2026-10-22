"""Teaching-demo responses for the AI workbench.

The V3.0 public snapshot does not include a live AI service: there is no code
path that calls DeepSeek or any other paid model, even if an API key is set.
Every endpoint returns the deterministic teaching demo below.
"""

from app.schemas import (
    ContestPlanInput,
    ContestPlanOutput,
    DataNeedRow,
    LlmProviderInfo,
    LearningExplain,
    ModelRow,
    ProblemInput,
    SubtaskRow,
    WorkbenchAnalysis,
)

SNAPSHOT_DEMO_NOTE = "公开快照为演示模式，真实 AI 服务不包含在 V3.0 公开快照中。"


def list_providers() -> list[LlmProviderInfo]:
    """Only the teaching demo is available; it never reports a live model."""
    return [
        LlmProviderInfo(
            id="default",
            name="教学演示",
            model="demo",
            enabled=False,
            note=SNAPSHOT_DEMO_NOTE,
        )
    ]


def build_demo_contest_plan(payload: ContestPlanInput) -> ContestPlanOutput:
    level_name = {
        "beginner": "小白",
        "intermediate": "有 Python 或基础建模经验",
        "advanced": "有完整参赛经验",
    }.get(payload.student_level, "小白")
    contests = payload.selected_contests or []
    contest_names = [str(item.get("name", "未命名赛事")) for item in contests]
    has_core = any(str(item.get("valueLevel", "")) == "核心" for item in contests)
    has_training = any(str(item.get("valueLevel", "")) == "训练" for item in contests)
    first_contest = contest_names[0] if contest_names else "一次低压力练手赛"
    target = "、".join(contest_names[:4]) if contest_names else "国赛前训练"

    recommended_path = [
        f"先按 {level_name} 水平补齐读题、数据清洗和基础模型。",
        f"用 {first_contest} 做第一轮完整流程演练。",
        "每次比赛后整理 AI 使用记录、代码复现实验和论文扣分点。",
    ]
    if has_core:
        recommended_path.append("核心赛前至少完成 2 次全流程模拟和 1 次论文限时合稿。")
    if not has_training:
        recommended_path.append("建议补一个练手赛或校内模拟赛，降低直接冲核心赛的风险。")

    base_tasks = ["完成 2 张模型方法卡学习", "跑通 1 个教学案例代码框架", "写 1 页问题分析和假设表"]
    monthly_plan = [
        {
            "month": "第 1-2 周",
            "focus": "补基础与定方向",
            "tasks": base_tasks,
            "deliverable": "个人能力诊断、模型清单、队伍分工表",
        },
        {
            "month": "第 3-4 周",
            "focus": "练手赛或简化经典题",
            "tasks": ["选 1 道简化经典题", "完成拆题-数据-模型-检验闭环", "复盘论文结构和图表表达"],
            "deliverable": "一份可复盘的训练报告和代码目录",
        },
        {
            "month": "赛前 3-4 周",
            "focus": f"围绕 {target} 做专项训练",
            "tasks": ["按目标赛事题型补模型短板", "做一次限时开题", "整理常用代码模板和图表模板"],
            "deliverable": "目标赛事备赛包",
        },
        {
            "month": "赛前 7 天",
            "focus": "流程检查与降风险",
            "tasks": ["确认报名/账号/队伍信息", "检查论文模板和引用规范", "约定 72/96 小时协作节奏"],
            "deliverable": "最终检查清单",
        },
    ]

    weekly_hours = payload.weekly_hours
    if weekly_hours <= 5:
        rhythm = ["每周 1 次 90 分钟模型学习", "每周 1 次代码复现", "每周末写 300 字复盘"]
    elif weekly_hours <= 12:
        rhythm = ["每周 2 次模型/代码训练", "每周 1 次例题拆解", "每两周 1 次小论文合稿演练"]
    else:
        rhythm = ["每周 3 次专项训练", "每周 1 次限时建模", "每周 1 次论文互评和代码复现"]

    return ContestPlanOutput(
        mode="demo",
        provider="demo",
        summary=f"建议围绕「{payload.goal}」制定阶梯计划：先练流程，再补模型，最后冲目标赛事。",
        recommended_path=recommended_path,
        monthly_plan=monthly_plan,
        weekly_rhythm=rhythm,
        risk_notes=[
            "所有赛事报名时间和规则需在官网或学校通知中再次确认。",
            "小白队伍不要直接把核心赛作为第一次完整参赛。",
            "AI 输出只能用于拆解和学习，最终论文表达与数据来源必须人工确认。",
        ],
        next_actions=[
            "先选择 1 个练手赛 + 1 个核心赛加入规划。",
            "在学习页完成线性规划、TOPSIS、时间序列三张基础模型卡。",
            "用 AI 工作台跑一遍共享单车或应急调度样题并保存记录。",
        ],
    )


def analyze_demo(payload: ProblemInput) -> WorkbenchAnalysis:
    text = payload.problem_text.strip()
    snippet = text[:120].replace("\n", " ")
    subtasks = [
        SubtaskRow(
            id="q1",
            index=1,
            direct_goal="明确问题背景、目标与需要回答的核心问题",
            implicit_goal="梳理解题边界，避免漏问或误解题意",
            inputs="题目文字与附件字段说明",
            outputs="小问清单、每问输入输出与约束",
            constraints="时间、数据可得性、题目隐含假设",
            metrics="是否覆盖所有问号与评分点",
        ),
        SubtaskRow(
            id="q2",
            index=2,
            direct_goal="建立可计算的模型并完成结果解释",
            implicit_goal="在可解释性与复杂度之间取得平衡",
            inputs="数据需求表、变量定义",
            outputs="模型形式、参数、预测/优化结果",
            constraints="模型假设需与题意一致",
            metrics="误差/稳定性/灵敏度或优化目标值",
        ),
    ]
    data_needs = [
        DataNeedRow(
            field_name="题目给定核心数据",
            data_role="支撑模型估计与检验",
            source_suggestion="题目附件",
            required="必须",
            fallback_if_missing="改为合理假设并写明假设依据（需人工确认）",
            needs_manual_confirm=True,
        ),
        DataNeedRow(
            field_name="外部补充数据（如统计年鉴、公开数据集）",
            data_role="增强解释变量或校验趋势",
            source_suggestion="公开数据（需标注来源与获取日期）",
            required="可选",
            fallback_if_missing="使用题目内变量或简化模型",
            needs_manual_confirm=True,
        ),
        DataNeedRow(
            field_name="参数与常数（单位、量纲）",
            data_role="保证模型可运行与结果可解释",
            source_suggestion="人工整理",
            required="必须",
            fallback_if_missing="用文献或常识范围并做灵敏度分析",
            needs_manual_confirm=True,
        ),
    ]
    models = [
        ModelRow(
            name="多元线性回归 / 广义线性模型",
            tier="基础模型",
            model_type="统计回归",
            reason="变量关系较清晰、样本量适中时易于解释与检验",
            inputs="特征矩阵与目标变量",
            outputs="系数、显著性、拟合指标",
            pros="解释性强、实现成本低",
            cons="线性/分布假设可能过强",
            validation="残差分析、共线性检查、交叉验证",
        ),
        ModelRow(
            name="时间序列分解 + ARIMA/ETS",
            tier="基础模型",
            model_type="预测",
            reason="若题目含明显时间维度与趋势季节性",
            inputs="等间隔时间序列",
            outputs="点预测与区间",
            pros="对趋势季节刻画直观",
            cons="对结构性突变敏感",
            validation="滚动预测、残差白噪声检验",
        ),
        ModelRow(
            name="随机森林 / Gradient Boosting",
            tier="进阶模型",
            model_type="机器学习",
            reason="存在非线性与特征交互且解释性要求可放宽",
            inputs="表格特征",
            outputs="预测值、特征重要性",
            pros="拟合能力强",
            cons="外推与因果解释需谨慎",
            validation="交叉验证、校准曲线、稳定性重复实验",
        ),
        ModelRow(
            name="优化模型（线性/整数规划）",
            tier="进阶模型",
            model_type="优化决策",
            reason="题目要求方案选择、资源配置或调度",
            inputs="决策变量、目标函数、约束",
            outputs="最优或近似最优方案",
            pros="与决策问题直接对齐",
            cons="模型规模变大时求解成本上升",
            validation="灵敏度分析、可行性检查、边界案例",
        ),
    ]
    learning = LearningExplain(
        why_important="先拆题与数据再选模型，能避免方向性错误与无效返工。",
        common_mistakes="漏问；把假设当事实；模型复杂但无法解释；缺少检验与误差分析。",
        done_criteria="能说清每问目标、数据从哪来、为什么选主线模型、如何检验结果。",
        student_must_confirm="题型是否准确；小问是否完整；数据是否真实可得；主线模型是否合理。",
        recommended_next="整理数据需求表 → 选择主线模型并写假设 → 搭建代码文件结构 → 规划图表与检验项。",
    )
    action_list = [
        "用 5 句话复述题意，并标出所有问号与附件关键字段。",
        "完成数据需求表：字段、来源、是否必须、缺失替代方案（需人工确认）。",
        "在基础模型与进阶模型中各选 1 条主线，写出选型理由与局限。",
        "画出代码目录结构与函数职责，不写具体业务实现前先跑通数据读入。",
        "列出论文图表清单：每张图服务哪个结论，对应哪一小问。",
    ]
    return WorkbenchAnalysis(
        problem_type="混合题（预测/评价/优化中择一或组合，需你确认）",
        type_reason=f"演示模式：未调用大模型。根据你粘贴的题目片段「{snippet}…」先给出通用建模骨架。{SNAPSHOT_DEMO_NOTE}",
        mixed_types="可能是预测 + 评价，或优化 + 灵敏度分析；以题目实际要求为准。",
        modeling_mainline="先澄清目标与数据，再建立可检验的主线模型，最后回到问题要求给出可执行建议。",
        type_confirm_notes="请对照题目附件与评分点，确认题型标签是否准确。",
        subtasks=subtasks,
        data_needs=data_needs,
        models=models,
        learning=learning,
        action_list=action_list,
        prompt_version="workbench_v1_demo",
        mode="demo",
        provider="demo",
    )
