import json
from pathlib import Path

from fastapi import APIRouter, HTTPException

from app.schemas import CaseDetail, CaseSummary

router = APIRouter(prefix="/api", tags=["cases"])

_CASES_DIR = Path(__file__).resolve().parents[3] / "cases"


def _load_all() -> list[dict]:
    if not _CASES_DIR.is_dir():
        return []
    out: list[dict] = []
    for p in sorted(_CASES_DIR.glob("*.json")):
        with p.open(encoding="utf-8") as f:
            out.append(json.load(f))
    return out


@router.get("/cases", response_model=list[CaseSummary])
def list_cases() -> list[CaseSummary]:
    rows = []
    for raw in _load_all():
        rows.append(
            CaseSummary(
                slug=raw["slug"],
                title=raw["title"],
                difficulty=raw["difficulty"],
                coverage=raw["coverage"],
                audience=raw["audience"],
                data_status=raw["data_status"],
                summary=raw["summary"],
            )
        )
    return rows


@router.get("/cases/{slug}", response_model=CaseDetail)
def get_case(slug: str) -> CaseDetail:
    for raw in _load_all():
        if raw.get("slug") == slug:
            return CaseDetail.model_validate(raw)
    raise HTTPException(status_code=404, detail="case_not_found")


@router.get("/prompts/version")
def prompt_version() -> dict:
    return {"workbench_prompt": "workbench_v1", "updated": "2026-05-14"}
