from app.core.schemas import CamelModel
"""
FastAPI router for QA / CI Pipeline features.
Converted from qaController.js + qaRoutes.js.

Covers:
  - CI Pipeline Runs (FR-1501 & FR-1503)
  - Code Quality & Linting Summary (FR-1502)

Prefix: /api/qa
"""

import random
import string
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from beanie import PydanticObjectId
from fastapi import APIRouter, Depends, HTTPException, Request, status

from app.core.security import get_current_user, require_roles
from app.models.ci_pipeline_run import CiPipelineRun
from app.models.project import Project
from app.models.group_member import GroupMember

router = APIRouter(prefix="/api/qa", tags=["QA / CI"])


def now_utc() -> datetime:
    return datetime.now(timezone.utc)


def _random_commit_hash(length: int = 7) -> str:
    return "".join(random.choices(string.ascii_lowercase + string.digits, k=length))


# ============================================================
# HELPER: resolve active project ID
# ============================================================

async def resolve_project_id(request: Request, current_user: dict) -> Optional[PydanticObjectId]:
    """
    For STUDENT: look up GroupMember → Project.
    For others: read projectId from query params.
    """
    role = current_user.get("role", "")
    user_id = PydanticObjectId(current_user.id)

    if role == "STUDENT":
        membership = await GroupMember.find_one(GroupMember.user_id == user_id)
        if not membership:
            return None
        project = await Project.find_one(Project.group_id == membership.group_id)
        return project.id if project else None

    project_id_str = request.query_params.get("projectId")
    if project_id_str:
        try:
            return PydanticObjectId(project_id_str)
        except Exception:
            return None
    return None


# ============================================================
# REQUEST BODY SCHEMAS
# ============================================================

class TriggerPipelineBody(CamelModel):
    branch: Optional[str] = "main"
    trigger: Optional[str] = "MANUAL"


# ============================================================
# PIPELINE RUNS (FR-1501 & FR-1503)
# ============================================================

@router.get("/pipelines", summary="Get CI pipeline runs for the active project")
async def get_pipeline_runs(
    request: Request,
    current_user: dict = Depends(get_current_user),
) -> Dict[str, Any]:
    """
    Return pipeline run history sorted newest first.
    Seeds an initial successful run if none exist.
    """
    project_id = await resolve_project_id(request, current_user)
    if not project_id:
        return {"success": True, "pipelineRuns": []}

    runs = await CiPipelineRun.find(
        CiPipelineRun.project_id == project_id
    ).sort(-CiPipelineRun.created_at).to_list()

    if not runs:
        seed = CiPipelineRun(
            project_id=project_id,
            run_number=1,
            commit_hash="7f9a2bc",
            branch="main",
            trigger="PUSH",
            status="SUCCESS",
            duration_seconds=42,
            unit_tests_passed=24,
            unit_tests_failed=0,
            code_coverage_percent=92,
            lint_errors=0,
            security_vulnerabilities=0,
            quality_grade="A",
            logs=(
                "[CI Pipeline Step 1]: Checkout repository\n"
                "[CI Pipeline Step 2]: Install npm packages\n"
                "[CI Pipeline Step 3]: Run ESLint scan - 0 errors\n"
                "[CI Pipeline Step 4]: Execute Jest test suites - 24/24 passed\n"
                "[CI Pipeline Step 5]: Build production bundle - OK"
            ),
        )
        await seed.insert()
        runs = [seed]

    return {"success": True, "pipelineRuns": [r.dict() for r in runs]}


@router.post(
    "/pipelines/trigger",
    status_code=status.HTTP_201_CREATED,
    summary="Trigger a new CI pipeline run",
    dependencies=[Depends(require_roles(["STUDENT", "ADMIN"]))],
)
async def trigger_pipeline_run(
    body: TriggerPipelineBody,
    request: Request,
    current_user: dict = Depends(get_current_user),
) -> Dict[str, Any]:
    """Simulate triggering a new CI pipeline run for the active project."""
    project_id = await resolve_project_id(request, current_user)
    if not project_id:
        raise HTTPException(status_code=400, detail="Active project required.")

    count = await CiPipelineRun.find(CiPipelineRun.project_id == project_id).count()
    run_number = count + 1
    user_name = current_user.get("name", "Unknown User")

    run = CiPipelineRun(
        project_id=project_id,
        run_number=run_number,
        commit_hash=_random_commit_hash(),
        branch=body.branch or "main",
        trigger=body.trigger or "MANUAL",
        status="SUCCESS",
        duration_seconds=random.randint(35, 55),
        unit_tests_passed=26,
        unit_tests_failed=0,
        code_coverage_percent=random.randint(90, 95),
        lint_errors=0,
        security_vulnerabilities=0,
        quality_grade="A",
        logs=(
            f"[CI Pipeline Run #{run_number}]: Manual trigger initiated by {user_name}\n"
            "[Step 1]: Static analysis & ESLint - PASS\n"
            "[Step 2]: Execute Jest & Supertest test suites - 26/26 passed\n"
            "[Step 3]: SonarQube quality gate - GRADE A"
        ),
    )
    await run.insert()
    return {"success": True, "pipelineRun": run.dict()}


# ============================================================
# CODE QUALITY & LINTING SUMMARY (FR-1502)
# ============================================================

@router.get("/quality-summary", summary="Get latest code quality summary")
async def get_quality_summary(
    request: Request,
    current_user: dict = Depends(get_current_user),
) -> Dict[str, Any]:
    """Return the latest pipeline run's quality metrics as a summary object."""
    project_id = await resolve_project_id(request, current_user)
    if not project_id:
        return {"success": True, "summary": None}

    latest_run = await CiPipelineRun.find(
        CiPipelineRun.project_id == project_id
    ).sort(-CiPipelineRun.created_at).first_or_none()

    summary: Dict[str, Any] = {
        "codeCoveragePercent": getattr(latest_run, "code_coverage_percent", 92) if latest_run else 92,
        "qualityGrade": getattr(latest_run, "quality_grade", "A") if latest_run else "A",
        "securityVulnerabilities": getattr(latest_run, "security_vulnerabilities", 0) if latest_run else 0,
        "lintErrors": getattr(latest_run, "lint_errors", 0) if latest_run else 0,
        "unitTestsPassed": getattr(latest_run, "unit_tests_passed", 26) if latest_run else 26,
        "unitTestsFailed": getattr(latest_run, "unit_tests_failed", 0) if latest_run else 0,
        "lastRunAt": latest_run.created_at.isoformat() if latest_run and latest_run.created_at else now_utc().isoformat(),
    }
    return {"success": True, "summary": summary}
