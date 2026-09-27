from app.core.schemas import CamelModel
"""
FastAPI router for Student-specific endpoints.
Converted from: studentController.js + studentRoutes.js
Prefix: /api/student
"""

from __future__ import annotations

from datetime import datetime, timezone, timedelta
from typing import List, Optional

from beanie import PydanticObjectId
from fastapi import APIRouter, Depends, HTTPException, Request, status

from app.core.security import get_current_user, require_roles
from app.models.group_member import GroupMember
from app.models.notification import Notification
from app.models.project import Project
from app.models.project_group import ProjectGroup
from app.models.student_profile import StudentProfile
from app.models.task import Task
from app.models.user import User

router = APIRouter(prefix="/api/student", tags=["student"])


# ---------------------------------------------------------------------------
# Request schemas
# ---------------------------------------------------------------------------


class UpdateProfileBody(CamelModel):
    """Request body for updating a student's profile."""

    skills: Optional[List[str]] = None
    interests: Optional[List[str]] = None
    bio: Optional[str] = None
    preferred_roles: Optional[List[str]] = None
    github_url: Optional[str] = None
    linkedin_url: Optional[str] = None
    portfolio_url: Optional[str] = None


# ---------------------------------------------------------------------------
# GET /api/student/dashboard
# ---------------------------------------------------------------------------


@router.get(
    "/dashboard",
    summary="Get student dashboard summary",
)
async def get_student_dashboard(
    current_user: User = Depends(require_roles("STUDENT", "ADMIN")),
):
    """
    Return a rich dashboard payload for the calling student, including:
    group info, active project status, task summary, notifications count,
    progress percentages, upcoming deadlines and recent activity feed.
    """
    user_id = current_user.id

    membership = await GroupMember.find_one(
        GroupMember.user_id == user_id,
        GroupMember.status == "ACCEPTED",
    )

    if not membership:
        # Student without a group – minimal response
        unread_notifications = await Notification.find(
            Notification.recipient_id == user_id,
            Notification.is_read == False,  # noqa: E712
        ).count()

        return {
            "success": True,
            "hasGroup": False,
            "group": None,
            "project": None,
            "tasks": {"pending": 0, "inProgress": 0, "dueSoon": 0},
            "notificationsCount": unread_notifications,
            "progress": None,
            "deadlines": [],
            "activity": [
                {
                    "id": 1,
                    "text": "Welcome to TeamSync! Form or join a group in My Group tab to get started.",
                    "type": "comment",
                    "time": "Just now",
                }
            ],
        }

    # Fetch group
    group = await ProjectGroup.get(membership.group_id)
    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Group not found.",
        )

    members_count = await GroupMember.find(
        GroupMember.group_id == group.id,
        GroupMember.status == "ACCEPTED",
    ).count()

    # Fetch active project
    project = await Project.find_one(Project.group_id == group.id)

    tasks_summary = {"pending": 0, "inProgress": 0, "dueSoon": 0}
    project_progress = {"overall": 0, "features": 0, "tasks": 0, "milestones": 0}
    deadlines: list = []

    if project:
        my_tasks = await Task.find(
            Task.project_id == project.id,
            Task.assignee_id == user_id,
        ).to_list()

        pending_count = sum(1 for t in my_tasks if t.status == "TODO")
        in_progress_count = sum(
            1 for t in my_tasks if t.status in ("IN_PROGRESS", "IN_REVIEW")
        )
        done_count = sum(1 for t in my_tasks if t.status == "DONE")

        total_tasks = len(my_tasks)
        task_pct = round((done_count / total_tasks) * 100) if total_tasks > 0 else 0

        soon_threshold = datetime.now(timezone.utc) + timedelta(days=2)
        due_soon_count = sum(
            1
            for t in my_tasks
            if t.due_date and t.due_date <= soon_threshold
        )

        tasks_summary = {
            "pending": pending_count,
            "inProgress": in_progress_count,
            "dueSoon": due_soon_count,
        }
        project_progress = {
            "overall": task_pct,
            "features": 0,
            "tasks": task_pct,
            "milestones": 0,
        }

        deadlines = [
            {
                "id": str(t.id),
                "type": "TASK",
                "title": t.title,
                "due": t.due_date.strftime("%m/%d/%Y") if t.due_date else "No date",
                "urgency": "high" if getattr(t, "priority", "MEDIUM") == "HIGH" else "medium",
            }
            for t in my_tasks[:3]
        ]

    unread_notifications = await Notification.find(
        Notification.recipient_id == user_id,
        Notification.is_read == False,  # noqa: E712
    ).count()

    return {
        "success": True,
        "hasGroup": True,
        "group": {
            "_id": str(group.id),
            "name": group.name,
            "code": group.code,
            "status": group.status,
            "membersCount": members_count,
        },
        "project": (
            {
                "_id": str(project.id),
                "title": project.title,
                "status": project.status,
            }
            if project
            else None
        ),
        "tasks": tasks_summary,
        "notificationsCount": unread_notifications,
        "progress": project_progress,
        "deadlines": deadlines,
        "activity": [
            {
                "id": 1,
                "text": f"Active in group {group.name or group.code}",
                "type": "feature",
                "time": "Recently",
            }
        ],
    }


# ---------------------------------------------------------------------------
# GET /api/student/profile
# ---------------------------------------------------------------------------


@router.get(
    "/profile",
    summary="Get student profile",
)
async def get_student_profile(
    current_user: User = Depends(require_roles("STUDENT", "ADMIN")),
):
    """
    Return the student's own profile.
    Auto-creates the profile document if it does not yet exist.
    """
    profile = await StudentProfile.find_one(
        StudentProfile.user_id == current_user.id
    )

    if not profile:
        profile = StudentProfile(
            user_id=current_user.id,
            enrollment_number=getattr(current_user, "enrollment_number", "UNKNOWN"),
        )
        await profile.insert()

    return {
        "success": True,
        "user": current_user.model_dump(by_alias=True),
        "profile": profile.model_dump(by_alias=True),
    }


# ---------------------------------------------------------------------------
# PUT /api/student/profile
# ---------------------------------------------------------------------------


@router.put(
    "/profile",
    summary="Update student profile",
)
async def update_student_profile(
    body: UpdateProfileBody,
    current_user: User = Depends(require_roles("STUDENT", "ADMIN")),
):
    """
    Upsert the student's own profile with whichever fields are provided.
    Only non-None fields are applied.
    """
    existing = await StudentProfile.find_one(
        StudentProfile.user_id == current_user.id
    )

    if not existing:
        existing = StudentProfile(
            user_id=current_user.id,
            enrollment_number=getattr(current_user, "enrollment_number", "UNKNOWN"),
        )
        await existing.insert()

    if body.skills is not None:
        existing.skills = body.skills
    if body.interests is not None:
        existing.interests = body.interests
    if body.bio is not None:
        existing.bio = body.bio
    if body.preferred_roles is not None:
        existing.preferred_roles = body.preferred_roles
    if body.github_url is not None:
        existing.github_url = body.github_url
    if body.linkedin_url is not None:
        existing.linkedin_url = body.linkedin_url
    if body.portfolio_url is not None:
        existing.portfolio_url = body.portfolio_url

    await existing.save()

    return {
        "success": True,
        "message": "Profile updated successfully.",
        "profile": existing.model_dump(by_alias=True),
    }
