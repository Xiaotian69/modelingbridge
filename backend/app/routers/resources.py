import base64
import re
import secrets
from pathlib import Path

from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import FileResponse

from app.config import settings

router = APIRouter(prefix="/api", tags=["resources"])

PROJECT_ROOT = Path(__file__).resolve().parents[3]

RESOURCE_ROOTS = [
    {
        "key": "mcm_problems",
        "title": "2000-2024 年美赛赛题汇总",
        "kind": "赛题",
        "path": PROJECT_ROOT / "2000-2024年美赛赛题汇总【公众号：数模加油站】",
    },
    {
        "key": "mcm_papers",
        "title": "2006-2025 年美赛优秀论文汇总",
        "kind": "优秀论文",
        "path": PROJECT_ROOT / "2006-2025年美赛优秀论文汇总【公众号：数模加油站】",
    },
    {
        "key": "mcm_full_archive",
        "title": "历年美赛赛题、翻译、优秀论文（中英文）、赛题解析等",
        "kind": "综合资料",
        "path": PROJECT_ROOT / "历年美赛赛题、翻译、优秀论文（中英文）、赛题解析等",
    },
    {
        "key": "prompts",
        "title": "美赛 Prompt 与论文模板",
        "kind": "提示词/模板",
        "path": PROJECT_ROOT / "数学建模Prompt",
    },
]

DOWNLOADABLE_EXTENSIONS = {".pdf", ".docx", ".xlsx", ".xls", ".csv", ".zip", ".rar", ".7z", ".txt"}
YEAR_PATTERN = re.compile(r"(?<!\d)(19\d{2}|20[0-2]\d)(?!\d)")


def _encode_id(path: Path) -> str:
    rel = path.resolve().relative_to(PROJECT_ROOT.resolve()).as_posix()
    return base64.urlsafe_b64encode(rel.encode("utf-8")).decode("ascii").rstrip("=")


def _decode_id(resource_id: str) -> Path:
    padding = "=" * (-len(resource_id) % 4)
    try:
        rel = base64.urlsafe_b64decode((resource_id + padding).encode("ascii")).decode("utf-8")
    except Exception as exc:
        raise HTTPException(status_code=400, detail="invalid_resource_id") from exc

    path = (PROJECT_ROOT / rel).resolve()
    if not path.is_file():
        raise HTTPException(status_code=404, detail="resource_not_found")
    if not any(_is_relative_to(path, root["path"].resolve()) for root in RESOURCE_ROOTS):
        raise HTTPException(status_code=403, detail="resource_not_allowed")
    return path


def _is_relative_to(path: Path, root: Path) -> bool:
    try:
        path.relative_to(root)
        return True
    except ValueError:
        return False


def _year_from_path(path: Path) -> str:
    for part in reversed(path.parts):
        matches = YEAR_PATTERN.findall(part)
        if matches:
            return matches[-1]
    return "未知"


def _resource_row(path: Path, root: dict) -> dict:
    stat = path.stat()
    rel_to_root = path.relative_to(root["path"]).as_posix()
    return {
        "id": _encode_id(path),
        "name": path.name,
        "title": path.stem,
        "kind": root["kind"],
        "group": root["title"],
        "year": _year_from_path(path),
        "extension": path.suffix.lower(),
        "size": stat.st_size,
        "relative_path": rel_to_root,
        "download_url": f"/api/resources/{_encode_id(path)}/download",
    }


def _require_trial_access(provided_code: str) -> None:
    expected_code = settings.trial_access_code.strip()
    if not expected_code:
        return
    if not secrets.compare_digest(provided_code.strip(), expected_code):
        raise HTTPException(status_code=403, detail="trial_access_required")


def _iter_resources() -> list[dict]:
    rows: list[dict] = []
    for root in RESOURCE_ROOTS:
        root_path = root["path"]
        if not root_path.is_dir():
            continue
        for path in root_path.rglob("*"):
            if path.is_file() and path.suffix.lower() in DOWNLOADABLE_EXTENSIONS:
                rows.append(_resource_row(path, root))
    rows.sort(key=lambda item: (item["kind"], item["year"], item["name"]), reverse=True)
    return rows


@router.get("/resources")
def list_resources(
    q: str = Query(default="", max_length=120),
    kind: str = Query(default="全部", max_length=40),
    limit: int = Query(default=120, ge=1, le=500),
) -> dict:
    rows = _iter_resources()
    query = q.strip().lower()
    if kind and kind != "全部":
        rows = [row for row in rows if row["kind"] == kind]
    if query:
        rows = [
            row
            for row in rows
            if query in row["name"].lower()
            or query in row["title"].lower()
            or query in row["relative_path"].lower()
            or query in row["year"].lower()
        ]
    summary = {
        "total": len(rows),
        "groups": [
            {
                "key": root["key"],
                "title": root["title"],
                "kind": root["kind"],
                "exists": root["path"].is_dir(),
                "path": str(root["path"]),
            }
            for root in RESOURCE_ROOTS
        ],
    }
    return {"summary": summary, "items": rows[:limit]}


@router.get("/resources/{resource_id}/download")
def download_resource(resource_id: str, trial_code: str = Query(default="", max_length=120)) -> FileResponse:
    _require_trial_access(trial_code)
    path = _decode_id(resource_id)
    return FileResponse(path, filename=path.name)
