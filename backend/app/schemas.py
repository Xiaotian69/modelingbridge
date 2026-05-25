from typing import Literal

from pydantic import BaseModel, Field

ProviderId = Literal["default", "deepseek", "mimo"]


class ProblemInput(BaseModel):
    problem_text: str = Field(..., min_length=10, max_length=12000)
    attachment_note: str = Field(default="", max_length=4000)
    student_level: Literal["beginner", "intermediate", "advanced"] = "beginner"
    provider: ProviderId = "default"


class SubtaskRow(BaseModel):
    id: str
    index: int
    direct_goal: str
    implicit_goal: str
    inputs: str
    outputs: str
    constraints: str
    metrics: str


class DataNeedRow(BaseModel):
    field_name: str
    data_role: str
    source_suggestion: str
    required: Literal["必须", "可选"]
    fallback_if_missing: str
    needs_manual_confirm: bool


class ModelRow(BaseModel):
    name: str
    tier: Literal["基础模型", "进阶模型"]
    model_type: str
    reason: str
    inputs: str
    outputs: str
    pros: str
    cons: str
    validation: str


class LearningExplain(BaseModel):
    why_important: str
    common_mistakes: str
    done_criteria: str
    student_must_confirm: str
    recommended_next: str


class WorkbenchAnalysis(BaseModel):
    problem_type: str
    type_reason: str
    mixed_types: str
    modeling_mainline: str
    type_confirm_notes: str
    subtasks: list[SubtaskRow]
    data_needs: list[DataNeedRow]
    models: list[ModelRow]
    learning: LearningExplain
    action_list: list[str]
    prompt_version: str
    mode: Literal["llm", "demo"]
    provider: str = "demo"


class LlmProviderInfo(BaseModel):
    id: str
    name: str
    model: str
    enabled: bool
    note: str


class ContestPlanInput(BaseModel):
    student_level: Literal["beginner", "intermediate", "advanced"] = "beginner"
    weekly_hours: int = Field(default=8, ge=1, le=80)
    goal: str = Field(default="国赛前完成一次完整训练", max_length=500)
    team_status: str = Field(default="未组队", max_length=200)
    strengths: str = Field(default="", max_length=500)
    weaknesses: str = Field(default="", max_length=500)
    selected_contests: list[dict] = Field(default_factory=list)
    provider: ProviderId = "default"


class ContestPlanOutput(BaseModel):
    mode: Literal["llm", "demo"]
    provider: str = "demo"
    summary: str
    recommended_path: list[str]
    monthly_plan: list[dict]
    weekly_rhythm: list[str]
    risk_notes: list[str]
    next_actions: list[str]


class CaseSummary(BaseModel):
    slug: str
    title: str
    difficulty: str
    coverage: list[str]
    audience: str
    data_status: str
    summary: str


class CaseDetail(CaseSummary):
    sections: dict[str, str]
