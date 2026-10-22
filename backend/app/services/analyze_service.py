from app.schemas import ProblemInput, WorkbenchAnalysis
from app.services import llm_client


async def run_analysis(payload: ProblemInput) -> WorkbenchAnalysis:
    """Public snapshot: always the teaching demo, never a paid model call."""
    return llm_client.analyze_demo(payload)
