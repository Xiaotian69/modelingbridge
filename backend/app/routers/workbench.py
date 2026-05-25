from fastapi import APIRouter

from app.schemas import ContestPlanInput, ContestPlanOutput, LlmProviderInfo, ProblemInput, WorkbenchAnalysis
from app.services.analyze_service import run_analysis
from app.services.llm_client import build_contest_plan_with_llm, build_demo_contest_plan, list_providers

router = APIRouter(prefix="/api", tags=["workbench"])


@router.post("/analyze-problem", response_model=WorkbenchAnalysis)
async def analyze_problem(payload: ProblemInput) -> WorkbenchAnalysis:
    """MVP：一次返回题型、小问、数据、模型与学习提示（与前端步骤条对齐）。"""
    return await run_analysis(payload)


@router.get("/llm-providers", response_model=list[LlmProviderInfo])
def llm_providers() -> list[LlmProviderInfo]:
    """Return locally configured LLM providers for the trial workbench."""
    return list_providers()


@router.post("/contest-plan", response_model=ContestPlanOutput)
async def contest_plan(payload: ContestPlanInput) -> ContestPlanOutput:
    """Generate a contest preparation plan. Falls back to a deterministic plan if LLM fails."""
    try:
        return await build_contest_plan_with_llm(payload)
    except Exception:
        return build_demo_contest_plan(payload)
