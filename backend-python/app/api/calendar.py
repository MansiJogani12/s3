from app.core.schemas import CamelModel
"""
FastAPI router for the unified Calendar view.
Converted from calendarController.js + calendarRoutes.js.

Aggregates events from Tasks, Features, Bugs, Milestones, Reviews, and Releases
into a single unified calendar event feed.

Prefix: /api/calendar
"""

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from beanie import PydanticObjectId
from fastapi import APIRouter, Depends, Request

from app.core.security import get_current_user
from app.models.task import Task
from app.models.bug import Bug
from app.models.milestone import Milestone
from app.models.review import Review
from app.models.release import Release
from app.models.feature import Feature
from app.models.project_group import ProjectGroup
from app.models.project import Project
from app.models.group_member import GroupMember

router = APIRouter(prefix="/api/calendar", tags=["Calendar"])


def now_utc() -> datetime:
    return datetime.now(timezone.utc)


# ============================================================
# HELPER: resolve active project ID
# ============================================================

async def resolve_project_id(request: Request, current_user: dict) -> Optional[PydanticObjectId]:
    """
    STUDENT: auto-resolve via GroupMember → Project.
    Others: read 'projectId' from query params.
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


def _safe_isoformat(dt: Optional[datetime]) -> Optional[str]:
    """Return ISO string or None."""
    return dt.isoformat() if dt else None


# ============================================================
# CALENDAR EVENTS (Unified endpoint)
# ============================================================

@router.get("/events", summary="Get aggregated calendar events")
async def get_calendar_events(
    request: Request,
    current_user: dict = Depends(get_current_user),
) -> Dict[str, Any]:
    """
    Aggregate events from multiple collections and return as a unified list.

    - COORDINATOR without a projectId: returns only Review events (their remit).
    - FACULTY without a projectId: scopes to their assigned projects.
    - STUDENT: scoped to their active project.
    - ADMIN: sees all events (or scoped if projectId provided).

    Event types: TASK (blue), FEATURE (teal), BUG (red),
                 MILESTONE (amber), REVIEW (purple), RELEASE (emerald).
    """
    role = current_user.get("role", "")
    user_id = PydanticObjectId(current_user.id)

    project_id = await resolve_project_id(request, current_user)
    allowed_project_ids: List[PydanticObjectId] = []

    # ── Faculty without a specific project: resolve all their projects ──────
    if not project_id and role == "FACULTY":
        groups = await ProjectGroup.find(ProjectGroup.guide_id == user_id).to_list()
        group_ids = [g.id for g in groups]

        legacy_projects = await Project.find(Project.faculty_guide_id == user_id).to_list()
        active_projects = await Project.find({"groupId": {"$in": group_ids}}).to_list()

        seen: set = set()
        for p in legacy_projects + active_projects:
            pid_str = str(p.id)
            if pid_str not in seen:
                seen.add(pid_str)
                allowed_project_ids.append(p.id)

        if not allowed_project_ids:
            return {"success": True, "events": []}

    elif not project_id and role not in ("ADMIN", "COORDINATOR"):
        return {"success": True, "events": []}

    # ── Coordinator mode: only Review events ────────────────────────────────
    if role == "COORDINATOR" and not project_id:
        reviews = await Review.find_all().to_list()
        events: List[Dict[str, Any]] = []
        for review in reviews:
            if review.review_date:
                reviewer_names = getattr(review, "faculty_reviewer_names", [])
                events.append(
                    {
                        "id": f"review-{review.id}",
                        "title": f"{review.title} ({review.start_time or 'Scheduled'})",
                        "start": _safe_isoformat(review.review_date),
                        "end": _safe_isoformat(review.review_date),
                        "type": "REVIEW",
                        "color": "#8b5cf6",
                        "responsible": ", ".join(reviewer_names) if reviewer_names else "Department Coordinator",
                        "details": review.dict(),
                    }
                )
        return {"success": True, "events": events}

    # ── Build base project filter ────────────────────────────────────────────
    if project_id:
        base_filter: Dict[str, Any] = {"projectId": project_id}
    elif allowed_project_ids:
        base_filter = {"projectId": {"$in": allowed_project_ids}}
    else:
        base_filter = {}  # ADMIN sees all

    events: List[Dict[str, Any]] = []

    # ── 1. TASKS (blue #3b82f6) ──────────────────────────────────────────────
    tasks = await Task.find(base_filter).to_list()
    for task in tasks:
        start = task.start_date or task.created_at or task.due_date
        if start or task.due_date:
            project_key = getattr(task, "project_key", "")
            prefix = f"[{project_key}] " if project_key else ""
            events.append(
                {
                    "id": f"task-{task.id}",
                    "title": f"{prefix}{task.title}",
                    "start": _safe_isoformat(start),
                    "end": _safe_isoformat(task.due_date or start),
                    "type": "TASK",
                    "color": "#3b82f6",
                    "responsible": getattr(task, "assignee_name", "Unassigned"),
                    "details": task.dict(),
                }
            )

    # ── 1.5 FEATURES (teal #0d9488) ─────────────────────────────────────────
    features = await Feature.find(base_filter).to_list()
    for feature in features:
        start = feature.start_date or feature.target_end_date
        if start:
            project_key = getattr(feature, "project_key", "")
            prefix = f"[{project_key}] " if project_key else ""
            events.append(
                {
                    "id": f"feature-{feature.id}",
                    "title": f"{prefix}{feature.title}",
                    "start": _safe_isoformat(feature.start_date or feature.target_end_date),
                    "end": _safe_isoformat(feature.target_end_date or feature.start_date),
                    "type": "FEATURE",
                    "color": "#0d9488",
                    "responsible": getattr(feature, "created_by_name", "Team"),
                    "details": feature.dict(),
                }
            )

    # ── 2. BUGS (red #ef4444) ────────────────────────────────────────────────
    bugs = await Bug.find(base_filter).to_list()
    for bug in bugs:
        if bug.created_at:
            project_key = getattr(bug, "project_key", "")
            prefix = f"[{project_key}] " if project_key else ""
            events.append(
                {
                    "id": f"bug-{bug.id}",
                    "title": f"{prefix}{bug.title}",
                    "start": _safe_isoformat(bug.created_at),
                    "end": _safe_isoformat(bug.created_at),
                    "type": "BUG",
                    "color": "#ef4444",
                    "responsible": getattr(bug, "assignee_name", "Unassigned"),
                    "details": bug.dict(),
                }
            )

    # ── 3. MILESTONES (amber #f59e0b) ────────────────────────────────────────
    milestones = await Milestone.find(base_filter).to_list()
    for milestone in milestones:
        deadline = getattr(milestone, "deadline", None) or getattr(milestone, "target_date", None)
        if deadline:
            project_key = getattr(milestone, "project_key", "")
            prefix = f"[{project_key}] " if project_key else ""
            events.append(
                {
                    "id": f"milestone-{milestone.id}",
                    "title": f"{prefix}{milestone.title}",
                    "start": _safe_isoformat(deadline),
                    "end": _safe_isoformat(deadline),
                    "type": "MILESTONE",
                    "color": "#f59e0b",
                    "responsible": "Group",
                    "details": milestone.dict(),
                }
            )

    # ── 4. REVIEWS (purple #8b5cf6) ──────────────────────────────────────────
    review_filter: Dict[str, Any] = {}
    if role == "FACULTY":
        review_filter["facultyReviewers"] = user_id
    reviews = await Review.find(review_filter).to_list()
    for review in reviews:
        if review.review_date:
            reviewer_names = getattr(review, "faculty_reviewer_names", [])
            events.append(
                {
                    "id": f"review-{review.id}",
                    "title": review.title,
                    "start": _safe_isoformat(review.review_date),
                    "end": _safe_isoformat(review.review_date),
                    "type": "REVIEW",
                    "color": "#8b5cf6",
                    "responsible": ", ".join(reviewer_names) if reviewer_names else "Unassigned",
                    "details": review.dict(),
                }
            )

    # ── 5. RELEASES (emerald #10b981, exclude DRAFTs) ────────────────────────
    release_filter = {**base_filter, "status": {"$ne": "DRAFT"}}
    releases = await Release.find(release_filter).to_list()
    for release in releases:
        if release.release_date:
            project_key = getattr(release, "project_key", "")
            prefix = f"[{project_key}] " if project_key else ""
            events.append(
                {
                    "id": f"release-{release.id}",
                    "title": f"{prefix}{release.version} - {release.title}",
                    "start": _safe_isoformat(release.release_date),
                    "end": _safe_isoformat(release.release_date),
                    "type": "RELEASE",
                    "color": "#10b981",
                    "responsible": "Team",
                    "details": release.dict(),
                }
            )

    return {"success": True, "events": events}
