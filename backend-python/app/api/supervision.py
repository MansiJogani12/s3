from app.core.schemas import CamelModel
"""
FastAPI router for Supervision (Guidance Logs, Supervision Summary, Peer Evaluations).
Converted from: supervisionController.js + supervisionRoutes.js
Prefix: /api/supervision
"""

from __future__ import annotations

from typing import List, Optional

from beanie import PydanticObjectId
from fastapi import APIRouter, Depends, HTTPException, Request, status

from app.core.security import get_current_user, require_roles
from app.models.bug import Bug
from app.models.group_member import GroupMember
from app.models.guidance_log import GuidanceLog
from app.models.peer_evaluation import PeerEvaluation
from app.models.project import Project
from app.models.project_group import ProjectGroup
from app.models.task import Task
from app.models.user import User
from app.utils.project_access import resolve_and_verify_project_id

router = APIRouter(prefix="/api/supervision", tags=["supervision"])


# ---------------------------------------------------------------------------
# Request body schemas
# ---------------------------------------------------------------------------


class CreateGuidanceLogBody(CamelModel):
    """Request body for creating a faculty guidance log entry."""

    project_id: PydanticObjectId
    topic: str
    discussion_summary: str
    actionable_items: Optional[List[str]] = []
    rating: Optional[int] = 4
    next_meeting_date: Optional[str] = None  # ISO date string or None


class SubmitPeerEvaluationBody(CamelModel):
    """Request body for submitting / updating a peer evaluation."""

    evaluatee_id: PydanticObjectId
    contribution_score: float
    teamwork_score: float
    technical_score: float
    communication_score: float
    comments: Optional[str] = ""


# ---------------------------------------------------------------------------
# Internal helper: get the project id for a student (not using request-based resolver)
# ---------------------------------------------------------------------------


async def _get_student_project_id(
    user_id: PydanticObjectId,
) -> Optional[PydanticObjectId]:
    """
    Return the active project's id for the given student,
    or None if the student is not in an accepted group with a project.
    """
    membership = await GroupMember.find_one(
        GroupMember.user_id == user_id,
        GroupMember.status == "ACCEPTED",
    )
    if not membership:
        return None
    project = await Project.find_one(Project.group_id == membership.group_id)
    return project.id if project else None


# ===========================================================================
# FACULTY LOGBOOK (FR-1303)
# ===========================================================================


@router.get("/guidance", summary="Get guidance log entries for the active project")
async def get_guidance_logs(
    request: Request,
    current_user: User = Depends(get_current_user),
):
    """
    Return all guidance log entries for the project that the calling user
    is associated with (student's group project or faculty-guided project).
    """
    project_id = await resolve_and_verify_project_id(request, current_user)
    if not project_id:
        return {"success": True, "logs": []}

    logs = (
        await GuidanceLog.find(GuidanceLog.project_id == project_id)
        .sort("-meeting_date")
        .to_list()
    )

    log_list = []
    for log in logs:
        log_dict = log.model_dump(by_alias=True)
        faculty_doc = await User.get(log.faculty_id)
        if faculty_doc:
            log_dict["faculty"] = {
                "name": faculty_doc.name,
                "email": faculty_doc.email,
                "designation": getattr(faculty_doc, "designation", None),
            }
        log_list.append(log_dict)

    return {"success": True, "logs": log_list}


@router.post(
    "/guidance",
    status_code=status.HTTP_201_CREATED,
    summary="Create a guidance log entry",
)
async def create_guidance_log(
    body: CreateGuidanceLogBody,
    current_user: User = Depends(require_roles("FACULTY", "ADMIN", "COORDINATOR")),
):
    """
    Faculty creates a structured record of a supervision meeting with
    a student group: topic, discussion summary, actionable items, rating,
    and optional next meeting date.
    """
    if not body.topic or not body.discussion_summary:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Project ID, topic, and discussion summary are required.",
        )

    log_doc = GuidanceLog(
        project_id=body.project_id,
        faculty_id=current_user.id,
        topic=body.topic,
        discussion_summary=body.discussion_summary,
        actionable_items=body.actionable_items or [],
        rating=body.rating if body.rating is not None else 4,
        next_meeting_date=body.next_meeting_date,
    )
    await log_doc.insert()

    log_dict = log_doc.model_dump(by_alias=True)
    log_dict["faculty"] = {
        "name": current_user.name,
        "email": current_user.email,
        "designation": getattr(current_user, "designation", None),
    }

    return {"success": True, "log": log_dict}


# ===========================================================================
# FACULTY SUPERVISION DASHBOARD (FR-1301)
# ===========================================================================


@router.get(
    "/summary",
    summary="Faculty supervision summary dashboard",
)
async def get_faculty_supervision_summary(
    current_user: User = Depends(require_roles("FACULTY", "ADMIN", "COORDINATOR")),
):
    """
    Return a per-group supervision summary for the calling faculty member,
    including task completion rates, bug counts, and guidance log counts.
    Falls back to ALL groups if the faculty has no explicitly assigned groups.
    """
    # Backward compatibility: find projects where this faculty is the guide
    legacy_projects = await Project.find(
        Project.faculty_guide_id == current_user.id
    ).to_list()
    legacy_group_ids = [p.group_id for p in legacy_projects if p.group_id]

    # Find groups where faculty is guide or co-guide (or via legacy projects)
    query = {
        "$or": [
            {"guide_id": current_user.id},
            {"co_guide_id": current_user.id},
            {"_id": {"$in": legacy_group_ids}},
        ]
    }
    groups = await ProjectGroup.find(query).to_list()

    # Fallback: if no groups explicitly assigned, fetch ALL groups
    if not groups:
        groups = await ProjectGroup.find({}).to_list()

    summaries = []
    for group in groups:
        # Find the project for this group
        proj = await Project.find_one(Project.group_id == group.id)
        if not proj:
            # Try legacy
            proj = next(
                (lp for lp in legacy_projects if lp.group_id and lp.group_id == group.id),
                None,
            )
        if not proj:
            # Placeholder
            proj_data = {
                "_id": str(group.id),
                "title": f"Group {group.code}",
                "projectKey": getattr(group, "code", ""),
                "domain": "SGP Project",
                "status": group.status or "ACTIVE",
                "groupId": str(group.id),
            }
            proj_id = None
        else:
            proj_data = proj.model_dump(by_alias=True)
            proj_data["groupId"] = group.model_dump(by_alias=True)
            proj_id = proj.id

        total_tasks = await Task.find(Task.project_id == proj_id).count() if proj_id else 0
        done_tasks = (
            await Task.find(Task.project_id == proj_id, Task.status == "DONE").count()
            if proj_id
            else 0
        )
        total_bugs = await Bug.find(Bug.project_id == proj_id).count() if proj_id else 0
        open_bugs = (
            await Bug.find(
                Bug.project_id == proj_id,
                {"status": {"$in": ["OPEN", "IN_PROGRESS"]}},
            ).count()
            if proj_id
            else 0
        )
        logs_count = (
            await GuidanceLog.find(GuidanceLog.project_id == proj_id).count()
            if proj_id
            else 0
        )

        summaries.append(
            {
                "project": proj_data,
                "metrics": {
                    "totalTasks": total_tasks,
                    "doneTasks": done_tasks,
                    "taskCompletionRate": (
                        round((done_tasks / total_tasks) * 100) if total_tasks > 0 else 0
                    ),
                    "totalBugs": total_bugs,
                    "openBugs": open_bugs,
                    "logsCount": logs_count,
                },
            }
        )

    return {"success": True, "summaries": summaries}


# ===========================================================================
# PEER EVALUATIONS (FR-1401 & FR-1402)
# ===========================================================================


@router.get(
    "/teammates",
    summary="Get teammates available for peer evaluation",
)
async def get_teammates_for_eval(
    current_user: User = Depends(require_roles("STUDENT", "ADMIN")),
):
    """
    Return the list of accepted group members (excluding the calling user)
    who can be peer-evaluated.
    """
    membership = await GroupMember.find_one(
        GroupMember.user_id == current_user.id,
        GroupMember.status == "ACCEPTED",
    )
    if not membership:
        return {"success": True, "teammates": []}

    all_members = await GroupMember.find(
        GroupMember.group_id == membership.group_id,
        GroupMember.status == "ACCEPTED",
    ).to_list()

    teammates = []
    for m in all_members:
        if m.user_id == current_user.id:
            continue
        user_doc = await User.get(m.user_id)
        if user_doc:
            teammates.append(
                {
                    "_id": str(user_doc.id),
                    "name": user_doc.name,
                    "enrollmentNumber": getattr(user_doc, "enrollment_number", None),
                    "email": user_doc.email,
                    "role": user_doc.role,
                }
            )

    return {"success": True, "teammates": teammates}


@router.post(
    "/peer-evaluations",
    summary="Submit or update a peer evaluation",
)
async def submit_peer_evaluation(
    body: SubmitPeerEvaluationBody,
    current_user: User = Depends(require_roles("STUDENT", "ADMIN")),
):
    """
    Submit (or update via upsert) a peer evaluation for a teammate.
    Computes the overall score as the average of the four category scores.
    """
    project_id = await _get_student_project_id(current_user.id)
    if not project_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Active project required.",
        )

    if not body.evaluatee_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Teammate ID is required.",
        )

    overall_score = round(
        (
            float(body.contribution_score)
            + float(body.teamwork_score)
            + float(body.technical_score)
            + float(body.communication_score)
        )
        / 4,
        1,
    )

    # Upsert: one evaluation record per (project, evaluator, evaluatee) pair
    existing = await PeerEvaluation.find_one(
        PeerEvaluation.project_id == project_id,
        PeerEvaluation.evaluator_id == current_user.id,
        PeerEvaluation.evaluatee_id == body.evaluatee_id,
    )

    if existing:
        existing.contribution_score = float(body.contribution_score)
        existing.teamwork_score = float(body.teamwork_score)
        existing.technical_score = float(body.technical_score)
        existing.communication_score = float(body.communication_score)
        existing.overall_score = overall_score
        existing.comments = body.comments or ""
        await existing.save()
        evaluation = existing
    else:
        evaluation = PeerEvaluation(
            project_id=project_id,
            evaluator_id=current_user.id,
            evaluatee_id=body.evaluatee_id,
            contribution_score=float(body.contribution_score),
            teamwork_score=float(body.teamwork_score),
            technical_score=float(body.technical_score),
            communication_score=float(body.communication_score),
            overall_score=overall_score,
            comments=body.comments or "",
        )
        await evaluation.insert()

    return {"success": True, "evaluation": evaluation.model_dump(by_alias=True)}


@router.get(
    "/peer-evaluations",
    summary="Get all peer evaluations for the active project",
)
async def get_peer_evaluations(
    request: Request,
    current_user: User = Depends(get_current_user),
):
    """Return all peer evaluation records for the calling user's project."""
    project_id = await resolve_and_verify_project_id(request, current_user)
    if not project_id:
        return {"success": True, "evaluations": []}

    evaluations = (
        await PeerEvaluation.find(PeerEvaluation.project_id == project_id)
        .sort("-created_at")
        .to_list()
    )

    eval_list = []
    for ev in evaluations:
        ev_dict = ev.model_dump(by_alias=True)
        evaluatee_doc = await User.get(ev.evaluatee_id)
        if evaluatee_doc:
            ev_dict["evaluatee"] = {
                "name": evaluatee_doc.name,
                "enrollmentNumber": getattr(evaluatee_doc, "enrollment_number", None),
            }
        eval_list.append(ev_dict)

    return {"success": True, "evaluations": eval_list}
