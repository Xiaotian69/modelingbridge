import json
import re

import httpx

from app.config import settings
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


PROVIDERS = {
    "deepseek": {
        "name": "DeepSeek",
        "note": "默认模型，适合中文拆题与结构化输出。",
    },
    "mimo": {
        "name": "Xiaomi MiMo",
        "note": "Token Plan 测试模型；若调用失败，请核对订阅页 Base URL。",
    },
}


def _provider_settings(provider: str) -> dict:
    requested = provider if provider and provider != "default" else (settings.llm_provider or "deepseek")
    if requested not in PROVIDERS:
        requested = "deepseek"
    if requested == "mimo":
        return {
            "id": "mimo",
            "name": PROVIDERS["mimo"]["name"],
            "api_key": settings.mimo_api_key,
            "base_url": settings.mimo_base_url,
            "model": settings.mimo_model,
            "note": PROVIDERS["mimo"]["note"],
        }
    return {
        "id": "deepseek",
        "name": PROVIDERS["deepseek"]["name"],
        "api_key": settings.llm_api_key,
        "base_url": settings.llm_base_url,
        "model": settings.llm_model,
        "note": PROVIDERS["deepseek"]["note"],
    }


def list_providers() -> list[LlmProviderInfo]:
    deepseek = _provider_settings("deepseek")
    mimo = _provider_settings("mimo")
    return [
        LlmProviderInfo(
            id="deepseek",
            name=deepseek["name"],
            model=deepseek["model"],
            enabled=bool(deepseek["api_key"]),
            note=deepseek["note"],
        ),
        LlmProviderInfo(
            id="mimo",
            name=mimo["name"],
            model=mimo["model"],
            enabled=bool(mimo["api_key"]),
            note=mimo["note"],
        ),
    ]


SYSTEM_PROMPT = """你是数学建模教学助手，面向大学生。只输出合法 JSON，不要 Markdown，不要代码块。
必须遵守：不生成可直接提交的论文终稿；不虚构数据或文献；所有外部数据标注需人工确认；语气是引导与解释。

输出 JSON 的键必须严格如下（中文值为字符串，数组元素为对象）：
{
  "problem_type": "主要题型标签",
  "type_reason": "判断依据",
  "mixed_types": "可能的混合题型，没有则写无",
  "modeling_mainline": "一句话建模主线",
  "type_confirm_notes": "需要学生人工确认的点",
  "subtasks": [{"id":"q1","index":1,"direct_goal":"","implicit_goal":"","inputs":"","outputs":"","constraints":"","metrics":""}],
  "data_needs": [{"field_name":"","data_role":"","source_suggestion":"题目附件/公开数据/人工整理","required":"必须或可选","fallback_if_missing":"","needs_manual_confirm":true}],
  "models": [{"name":"","tier":"基础模型或进阶模型","model_type":"","reason":"","inputs":"","outputs":"","pros":"","cons":"","validation":""}],
  "learning": {"why_important":"","common_mistakes":"","done_criteria":"","student_must_confirm":"","recommended_next":""},
  "action_list": ["下一步行动1","下一步行动2"]
}
至少 2 个小问（如题目明显只有一问则 1 个），至少 3 条数据需求，至少 2 个基础模型和 2 个进阶模型。"""


PLAN_SYSTEM_PROMPT = """你是数学建模备赛规划助手。只输出合法 JSON，不要 Markdown，不要代码块。
目标：根据学生基础、每周可投入时间、目标赛事和已选赛事，制定免费试运行阶段的备赛计划。
必须遵守：不承诺获奖；不鼓励代写；AI 只作为学习辅助；需要人工核验赛事时间和报名规则。

输出 JSON 键严格如下：
{
  "summary": "一句话总体策略",
  "recommended_path": ["阶段1","阶段2","阶段3"],
  "monthly_plan": [{"month":"月份或阶段","focus":"本阶段重点","tasks":["任务1","任务2"],"deliverable":"阶段产物"}],
  "weekly_rhythm": ["每周固定动作1","每周固定动作2"],
  "risk_notes": ["风险1","风险2"],
  "next_actions": ["下一步1","下一步2"]
}
计划要务实，按学生基础调整强度。小白先安排低压力练手赛和基础模型；进阶队伍可以加入美赛、国赛、专项赛。"""


def _extract_json(text: str) -> dict:
    text = text.strip()
    m = re.search(r"\{[\s\S]*\}\s*$", text)
    if m:
        text = m.group(0)
    return json.loads(text)


def _normalize_required(value: object) -> str:
    text = str(value or "").strip()
    if "可选" in text or "非必须" in text:
        return "可选"
    return "必须"


def _normalize_tier(value: object) -> str:
    text = str(value or "").strip()
    if "进阶" in text or "高级" in text or "创新" in text:
        return "进阶模型"
    return "基础模型"


def _normalize_llm_payload(raw: dict) -> dict:
    """Keep OpenAI-compatible model output inside the strict frontend schema."""
    raw.setdefault("mixed_types", "无")
    raw.setdefault("modeling_mainline", "")
    raw.setdefault("type_confirm_notes", "请人工确认题型、小问、数据来源与模型主线。")
    raw.setdefault("subtasks", [])
    raw.setdefault("data_needs", [])
    raw.setdefault("models", [])
    raw.setdefault("action_list", [])

    for i, item in enumerate(raw["subtasks"], start=1):
        item.setdefault("id", f"q{i}")
        item.setdefault("index", i)
        item.setdefault("direct_goal", "")
        item.setdefault("implicit_goal", "")
        item.setdefault("inputs", "")
        item.setdefault("outputs", "")
        item.setdefault("constraints", "")
        item.setdefault("metrics", "")

    for item in raw["data_needs"]:
        item.setdefault("field_name", "")
        item.setdefault("data_role", "")
        item.setdefault("source_suggestion", "题目附件 / 人工整理 / 公开数据需人工确认")
        item["required"] = _normalize_required(item.get("required"))
        item.setdefault("fallback_if_missing", "改用简化模型或合理假设，并人工确认。")
        item["needs_manual_confirm"] = bool(item.get("needs_manual_confirm", True))

    for item in raw["models"]:
        item.setdefault("name", "")
        item["tier"] = _normalize_tier(item.get("tier"))
        item.setdefault("model_type", "")
        item.setdefault("reason", "")
        item.setdefault("inputs", "")
        item.setdefault("outputs", "")
        item.setdefault("pros", "")
        item.setdefault("cons", "")
        item.setdefault("validation", "")

    learning = raw.setdefault("learning", {})
    learning.setdefault("why_important", "先解释原因，再选择方法，能减少方向性错误。")
    learning.setdefault("common_mistakes", "常见问题包括漏问、数据来源不清、模型不贴题、缺少检验。")
    learning.setdefault("done_criteria", "能说清小问、数据、模型、检验和论文表达之间的关系。")
    learning.setdefault("student_must_confirm", "题型、小问、数据来源、模型主线和结果合理性都需要人工确认。")
    learning.setdefault("recommended_next", "先核对小问与数据，再选择主线模型并规划检验。")
    return raw


async def analyze_with_llm(payload: ProblemInput) -> WorkbenchAnalysis:
    provider = _provider_settings(payload.provider)
    if not provider["api_key"]:
        raise RuntimeError(f"missing_api_key:{provider['id']}")

    user_content = (
        f"学生水平：{payload.student_level}\n"
        f"附件说明：{payload.attachment_note or '无'}\n\n"
        f"题目：\n{payload.problem_text}"
    )
    body = {
        "model": provider["model"],
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_content},
        ],
        "temperature": 0.3,
    }
    url = provider["base_url"].rstrip("/") + "/chat/completions"
    headers = {"Authorization": f"Bearer {provider['api_key']}"}
    async with httpx.AsyncClient(timeout=120.0) as client:
        r = await client.post(url, headers=headers, json=body)
        r.raise_for_status()
        data = r.json()
    content = data["choices"][0]["message"]["content"]
    raw = _normalize_llm_payload(_extract_json(content))
    raw["prompt_version"] = f"workbench_v1_{provider['id']}"
    raw["mode"] = "llm"
    raw["provider"] = provider["id"]
    return WorkbenchAnalysis.model_validate(raw)


def _normalize_plan_payload(raw: dict) -> dict:
    raw.setdefault("summary", "先用练手赛建立完整流程，再围绕核心赛事做模型、代码和论文训练。")
    raw.setdefault("recommended_path", [])
    raw.setdefault("monthly_plan", [])
    raw.setdefault("weekly_rhythm", [])
    raw.setdefault("risk_notes", [])
    raw.setdefault("next_actions", [])
    return raw


def build_demo_contest_plan(payload: ContestPlanInput, provider: str = "demo") -> ContestPlanOutput:
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
        mode="demo" if provider == "demo" else "llm",
        provider=provider,
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


async def build_contest_plan_with_llm(payload: ContestPlanInput) -> ContestPlanOutput:
    provider = _provider_settings(payload.provider)
    if not provider["api_key"]:
        raise RuntimeError(f"missing_api_key:{provider['id']}")

    user_content = json.dumps(
        {
            "student_level": payload.student_level,
            "weekly_hours": payload.weekly_hours,
            "goal": payload.goal,
            "team_status": payload.team_status,
            "strengths": payload.strengths,
            "weaknesses": payload.weaknesses,
            "selected_contests": payload.selected_contests,
        },
        ensure_ascii=False,
    )
    body = {
        "model": provider["model"],
        "messages": [
            {"role": "system", "content": PLAN_SYSTEM_PROMPT},
            {"role": "user", "content": user_content},
        ],
        "temperature": 0.35,
    }
    url = provider["base_url"].rstrip("/") + "/chat/completions"
    headers = {"Authorization": f"Bearer {provider['api_key']}"}
    async with httpx.AsyncClient(timeout=120.0) as client:
        r = await client.post(url, headers=headers, json=body)
        r.raise_for_status()
        data = r.json()
    content = data["choices"][0]["message"]["content"]
    raw = _normalize_plan_payload(_extract_json(content))
    raw["mode"] = "llm"
    raw["provider"] = provider["id"]
    return ContestPlanOutput.model_validate(raw)


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
        type_reason=f"演示模式：未调用大模型。根据你粘贴的题目片段「{snippet}…」先给出通用建模骨架；配置 API 后可获得更贴题的分析。",
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
