from app.core.schemas import CamelModel
"""
FastAPI router for Faculty-specific endpoints.
Converted from: facultyController.js + facultyRoutes.js
Prefix: /api/faculty
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from beanie import PydanticObjectId
from fastapi import APIRouter, Depends, HTTPException, status

from app.core.security import get_current_user, require_roles
from app.models.group_member import GroupMember
from app.models.project import Project
from app.models.project_group import ProjectGroup
from app.models.task import Task
from app.models.user import User

router = APIRouter(prefix="/api/faculty", tags=["faculty"])


# ---------------------------------------------------------------------------
# GET /api/faculty/groups  – get all groups assigned to the calling faculty
# ---------------------------------------------------------------------------


@router.get(
    "/groups",
    summary="Get all project groups assigned to the calling faculty member",
)
async def get_my_assigned_groups(
    current_user: User = Depends(require_roles("FACULTY")),
):
    """
    Return every project group for which the calling faculty is the guide
    (either via the ProjectGroup.guide_id field or via legacy
    Project.faculty_guide_id assignments), along with a per-group summary
    of proposals, tasks, and progress.
    """
    faculty_id = current_user.id

    # Backward compatibility: find projects where this faculty is guide
    legacy_projects = await Project.find(
        Project.faculty_guide_id == faculty_id
    ).to_list()
    legacy_group_ids = [p.group_id for p in legacy_projects if p.group_id]

    # Fetch all groups where the logged-in faculty is the guide
    query: Dict[str, Any] = {
        "$or": [
            {"guide_id": faculty_id},
            {"_id": {"$in": legacy_group_ids}},
        ]
    }
    groups = await ProjectGroup.find(query).to_list()

    # Aggregate summary counters
    summary: Dict[str, Any] = {
        "totalGroups": len(groups),
        "totalStudents": 0,
        "activeProjects": 0,
        "pendingProposals": 0,
        "pendingReviews": 0,
        "overdueTasks": 0,
        "upcomingEvaluations": 0,
    }

    group_details: List[Dict[str, Any]] = []
    now = datetime.now(timezone.utc)

    for group in groups:
        g_dict = group.model_dump(by_alias=True)

        # Student count
        student_count = await GroupMember.find(
            GroupMember.group_id == group.id,
            GroupMember.status == "ACCEPTED",
        ).count()
        summary["totalStudents"] += student_count

        # Fetch leader details
        if group.leader_id:
            leader = await User.get(group.leader_id)
            if leader:
                g_dict["leader"] = {
                    "name": leader.name,
                    "enrollmentNumber": getattr(leader, "enrollment_number", None),
                }

        # Projects for this group
        projects = await Project.find(Project.group_id == group.id).to_list()

        active_project = next(
            (
                p
                for p in projects
                if p.status in ("DEVELOPMENT_ACTIVE", "APPROVED")
            ),
            None,
        )
        if active_project:
            summary["activeProjects"] += 1

        pending_proposals = [
            p for p in projects if p.status in ("SUBMITTED", "CHANGE_REQUESTED")
        ]
        summary["pendingProposals"] += len(pending_proposals)

        # Task-level metrics for the active project
        progress = 0
        overdue_tasks_count = 0

        if active_project:
            total_tasks = await Task.find(
                Task.project_id == active_project.id
            ).count()
            done_tasks = await Task.find(
                Task.project_id == active_project.id,
                Task.status == "DONE",
            ).count()

            if total_tasks > 0:
                progress = round((done_tasks / total_tasks) * 100)

            overdue_tasks_count = await Task.find(
                Task.project_id == active_project.id,
                Task.status != "DONE",
                Task.due_date < now,
            ).count()
            summary["overdueTasks"] += overdue_tasks_count

        group_details.append(
            {
                **g_dict,
                "studentCount": student_count,
                "activeProject": (
                    active_project.model_dump(by_alias=True) if active_project else None
                ),
                "pendingReviewsCount": len(pending_proposals),
                "progress": progress,
                "overdueTasksCount": overdue_tasks_count,
            }
        )

    return {
        "success": True,
        "summary": summary,
        "groups": group_details,
    }


# ---------------------------------------------------------------------------
# GET /api/faculty/groups/{groupId}  – get detailed group context
# ---------------------------------------------------------------------------


@router.get(
    "/groups/{group_id}",
    summary="Get full context for a specific group assigned to the calling faculty",
)
async def get_group_context(
    group_id: PydanticObjectId,
    current_user: User = Depends(require_roles("FACULTY")),
):
    """
    Return the full group context (members + active project) for a group
    that is assigned to the calling faculty.  Returns 403 if the faculty
    is not assigned to that group.
    """
    faculty_id = current_user.id

    # Backward-compatibility: legacy project-level guide assignments
    legacy_projects = await Project.find(
        Project.faculty_guide_id == faculty_id
    ).to_list()
    legacy_group_ids = [str(p.group_id) for p in legacy_projects if p.group_id]

    query: Dict[str, Any] = {
        "_id": group_id,
        "$or": [
            {"guide_id": faculty_id},
            {"_id": {"$in": [PydanticObjectId(gid) for gid in legacy_group_ids]}},
        ],
    }
    group = await ProjectGroup.find_one(query)
    if not group:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access Denied: Not assigned to this group.",
        )

    # Build member list
    member_docs = await GroupMember.find(
        GroupMember.group_id == group.id,
        GroupMember.status == "ACCEPTED",
    ).to_list()

    members: List[Dict[str, Any]] = []
    for m in member_docs:
        m_dict = m.model_dump(by_alias=True)
        user_doc = await User.get(m.user_id)
        if user_doc:
            m_dict["user"] = {
                "name": user_doc.name,
                "email": user_doc.email,
                "enrollmentNumber": getattr(user_doc, "enrollment_number", None),
                "department": getattr(user_doc, "department", None),
            }
        members.append(m_dict)

    # Active project for this group
    projects = await Project.find(Project.group_id == group.id).to_list()
    active_project = next(
        (
            p
            for p in projects
            if p.status in ("DEVELOPMENT_ACTIVE", "APPROVED")
        ),
        None,
    )

    group_dict = group.model_dump(by_alias=True)
    group_dict["members"] = members

    return {
        "success": True,
        "group": group_dict,
        "project": active_project.model_dump(by_alias=True) if active_project else None,
    }
