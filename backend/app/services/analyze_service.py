import logging

from app.schemas import ProblemInput, WorkbenchAnalysis
from app.services import llm_client

log = logging.getLogger(__name__)


async def run_analysis(payload: ProblemInput) -> WorkbenchAnalysis:
    try:
        return await llm_client.analyze_with_llm(payload)
    except Exception as e:
        log.warning("llm_analyze_failed: %s", e)
        out = llm_client.analyze_demo(payload)
        out.type_reason = (
            out.type_reason
            + "（大模型调用失败，已回退到演示模式；请检查所选模型的 API Key、Base URL 与模型名。）"
        )
        return out

