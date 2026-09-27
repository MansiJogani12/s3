from app.core.schemas import CamelModel
"""
FastAPI router for Platform / Admin features.
Converted from platformController.js + platformRoutes.js.

Covers:
  - Institutional Analytics (FR-1701 & FR-1702)
  - Audit Logs (FR-1801)
  - Notifications (FR-1901)
  - Platform Settings & AI Config (FR-1902)

Prefix: /api/platform
"""

from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional

from beanie import PydanticObjectId
from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.core.security import get_current_user, require_roles
from app.models.user import User
from app.models.project_group import ProjectGroup
from app.models.project import Project
from app.models.task import Task
from app.models.bug import Bug
from app.models.student_mark import StudentMark
from app.models.audit_log import AuditLog
from app.models.notification import Notification
from app.models.system_config import SystemConfig
from app.models.github_integration import GithubIntegration

router = APIRouter(prefix="/api/platform", tags=["Platform"])


def now_utc() -> datetime:
    return datetime.now(timezone.utc)


# ============================================================
# REQUEST BODY SCHEMAS
# ============================================================

class NotificationActionBody(CamelModel):
    action: str  # 'APPROVE' or 'REJECT'


class SystemConfigBody(CamelModel):
    key: str
    value: str
    description: Optional[str] = ""


# ============================================================
# INSTITUTIONAL ANALYTICS (FR-1701 & FR-1702)
# ============================================================

@router.get(
    "/analytics",
    summary="Get institutional analytics dashboard KPIs",
    dependencies=[Depends(require_roles(["ADMIN", "COORDINATOR"]))],
)
async def get_analytics_dashboard(
    current_user: dict = Depends(get_current_user),
) -> Dict[str, Any]:
    """Aggregate platform-wide KPIs: users, groups, projects, tasks, bugs, and grade distribution."""
    total_students = await User.find(User.role == "STUDENT").count()
    total_faculty = await User.find(User.role == "FACULTY").count()
    total_groups = await ProjectGroup.find_all().count()
    approved_projects = await Project.find(
        {"status": {"$in": ["APPROVED", "COMPLETED"]}}
    ).count()
    pending_proposals = await Project.find(Project.status == "PENDING_APPROVAL").count()

    total_tasks = await Task.find_all().count()
    completed_tasks = await Task.find(Task.status == "DONE").count()
    avg_task_completion_rate = (
        round((completed_tasks / total_tasks) * 100) if total_tasks > 0 else 0
    )

    total_bugs = await Bug.find_all().count()
    resolved_bugs = await Bug.find({"status": {"$in": ["FIXED", "CLOSED"]}}).count()
    defect_resolution_rate = (
        round((resolved_bugs / total_bugs) * 100) if total_bugs > 0 else 100
    )

    # Grade distribution across all StudentMark records
    marks = await StudentMark.find_all().to_list()
    grade_dist: Dict[str, int] = {"A+": 0, "A": 0, "B+": 0, "B": 0, "C": 0, "F": 0}
    for m in marks:
        if m.grade in grade_dist:
            grade_dist[m.grade] += 1

    return {
        "success": True,
        "kpis": {
            "totalStudents": total_students,
            "totalFaculty": total_faculty,
            "totalGroups": total_groups,
            "approvedProjects": approved_projects,
            "pendingProposals": pending_proposals,
            "totalTasks": total_tasks,
            "completedTasks": completed_tasks,
            "avgTaskCompletionRate": avg_task_completion_rate,
            "totalBugs": total_bugs,
            "resolvedBugs": resolved_bugs,
            "defectResolutionRate": defect_resolution_rate,
            "gradeDistribution": grade_dist,
        },
    }


# ============================================================
# AUDIT LOGS (FR-1801)
# ============================================================

@router.get(
    "/audit-logs",
    summary="Get paginated audit logs",
    dependencies=[Depends(require_roles(["ADMIN"]))],
)
async def get_audit_logs(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=200),
    current_user: dict = Depends(get_current_user),
) -> Dict[str, Any]:
    """Return paginated audit log entries, newest first. Seeds a default entry if empty."""
    skip = (page - 1) * limit

    logs = await AuditLog.find().sort(-AuditLog.created_at).skip(skip).limit(limit).to_list()

    if not logs:
        seed = AuditLog(
            action="USER_LOGIN",
            actor_name="System Admin",
            actor_role="ADMIN",
            target_entity="Session",
            target_id="AUTH_001",
            ip_address="127.0.0.1",
        )
        await seed.insert()
        logs = [seed]

    total = await AuditLog.find_all().count() or 1

    return {
        "success": True,
        "logs": [lg.dict() for lg in logs],
        "pagination": {
            "page": page,
            "limit": limit,
            "total": total,
            "pages": -(-total // limit),  # ceiling division
        },
    }


# ============================================================
# NOTIFICATIONS (FR-1901)
# ============================================================

@router.get("/notifications", summary="Get notifications for the current user")
async def get_notifications(
    current_user: dict = Depends(get_current_user),
) -> Dict[str, Any]:
    """
    Fetch user notifications. Before returning, auto-generates deadline reminders
    for tasks due tomorrow that have not already been notified.
    Seeds a welcome notification if the user has never received any.
    """
    user_id = PydanticObjectId(current_user.id)

    # Auto-generate deadline notifications for tasks due tomorrow
    _now = now_utc()
    tomorrow_start = (_now + timedelta(days=1)).replace(hour=0, minute=0, second=0, microsecond=0)
    tomorrow_end = tomorrow_start.replace(hour=23, minute=59, second=59, microsecond=999999)

    tasks_due = await Task.find(
        Task.assignee_id == user_id,
        Task.due_date >= tomorrow_start,
        Task.due_date <= tomorrow_end,
        Task.status != "DONE",
    ).to_list()

    for task in tasks_due:
        task_key = getattr(task, "task_key", str(task.id))
        exists = await Notification.find_one(
            Notification.user_id == user_id,
            Notification.title == "Deadline Tomorrow",
            {"message": {"$regex": task_key}},
        )
        if not exists:
            notif = Notification(
                user_id=user_id,
                title="Deadline Tomorrow",
                message=(
                    f"You have a task due tomorrow:\n"
                    f"📋 [{task_key}] {task.title}\n"
                    f"⏰ Please make sure it is completed."
                ),
                type="TASK",
            )
            await notif.insert()

    notifications = await Notification.find(
        Notification.user_id == user_id
    ).sort(-Notification.created_at).to_list()

    if not notifications:
        welcome = Notification(
            user_id=user_id,
            title="Welcome to TeamSync",
            message="Your institutional account is active. Explore your dashboard to start collaborating!",
            type="SUCCESS",
        )
        await welcome.insert()
        notifications = [welcome]

    unread_count = sum(1 for n in notifications if not n.is_read)
    return {
        "success": True,
        "notifications": [n.dict() for n in notifications],
        "unreadCount": unread_count,
    }


@router.put(
    "/notifications/read-all",
    summary="Mark all notifications as read",
    dependencies=[Depends(require_roles(["STUDENT", "FACULTY", "COORDINATOR", "ADMIN"]))],
)
async def mark_all_notifications_read(
    current_user: dict = Depends(get_current_user),
) -> Dict[str, Any]:
    """Bulk-mark every unread notification for the current user as read."""
    user_id = PydanticObjectId(current_user.id)

    unread_notifs = await Notification.find(
        Notification.user_id == user_id,
        Notification.is_read == False,
    ).to_list()

    for n in unread_notifs:
        n.is_read = True
        await n.save()

    return {"success": True, "message": "All notifications marked as read."}


@router.put(
    "/notifications/{id}/read",
    summary="Mark a single notification as read",
    dependencies=[Depends(require_roles(["STUDENT", "FACULTY", "COORDINATOR", "ADMIN"]))],
)
async def mark_notification_read(
    id: str,
    current_user: dict = Depends(get_current_user),
) -> Dict[str, Any]:
    """Mark a specific notification as read for the current user."""
    user_id = PydanticObjectId(current_user.id)
    try:
        oid = PydanticObjectId(id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid notification ID.")

    notification = await Notification.find_one(
        Notification.id == oid,
        Notification.user_id == user_id,
    )
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found.")

    notification.is_read = True
    await notification.save()
    return {"success": True, "notification": notification.dict()}


@router.put(
    "/notifications/{id}/action",
    summary="Handle an actionable notification (approve/reject)",
    dependencies=[Depends(require_roles(["STUDENT", "FACULTY", "COORDINATOR", "ADMIN"]))],
)
async def handle_notification_action(
    id: str,
    body: NotificationActionBody,
    current_user: dict = Depends(get_current_user),
) -> Dict[str, Any]:
    """
    Process an actionable notification (e.g. GITHUB_REPO_CHANGE).
    Accepts action='APPROVE' or 'REJECT'.
    """
    user_id = PydanticObjectId(current_user.id)
    try:
        oid = PydanticObjectId(id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid notification ID.")

    notification = await Notification.find_one(
        Notification.id == oid,
        Notification.user_id == user_id,
    )
    if not notification or not notification.action_type:
        raise HTTPException(status_code=404, detail="Actionable notification not found.")

    if notification.action_status != "PENDING":
        raise HTTPException(status_code=400, detail="Notification already processed.")

    if notification.action_type == "GITHUB_REPO_CHANGE":
        payload = notification.action_payload or {}
        if body.action == "APPROVE":
            if payload.get("action") == "disconnect":
                integration = await GithubIntegration.find_one(
                    GithubIntegration.project_id == PydanticObjectId(payload["projectId"])
                )
                if integration:
                    integration.repo_url = ""
                    integration.repo_name = ""
                    integration.is_connected = False
                    await integration.save()
            else:
                repo_url = payload.get("repoUrl", "")
                repo_name = repo_url.split("/")[-1].replace(".git", "") if repo_url else ""
                project_oid = PydanticObjectId(payload["projectId"])
                integration = await GithubIntegration.find_one(
                    GithubIntegration.project_id == project_oid
                )
                if integration:
                    integration.repo_url = repo_url
                    integration.repo_name = repo_name
                    integration.is_connected = True
                    integration.last_synced_at = now_utc()
                    await integration.save()
                else:
                    new_int = GithubIntegration(
                        project_id=project_oid,
                        repo_url=repo_url,
                        repo_name=repo_name,
                        is_connected=True,
                        last_synced_at=now_utc(),
                    )
                    await new_int.insert()
            notification.action_status = "APPROVED"
            notification.message += " (Approved)"
        else:
            notification.action_status = "REJECTED"
            notification.message += " (Rejected)"

    notification.is_read = True
    await notification.save()
    return {"success": True, "notification": notification.dict()}


# ============================================================
# PLATFORM SETTINGS & AI CONFIG (FR-1902)
# ============================================================

@router.get(
    "/settings",
    summary="Get system configuration keys",
    dependencies=[Depends(require_roles(["ADMIN"]))],
)
async def get_system_configs(
    current_user: dict = Depends(get_current_user),
) -> Dict[str, Any]:
    """Return all system configuration entries. Seeds defaults if none exist."""
    configs = await SystemConfig.find_all().to_list()

    if not configs:
        defaults = [
            SystemConfig(
                key="GEMINI_API_KEY",
                value="AIzaSy_CONFIGURED_PROD_KEY",
                description="Google Gemini Pro LLM API Key for recommendation engine",
            ),
            SystemConfig(
                key="SIMILARITY_THRESHOLD_PERCENT",
                value="35",
                description="Plagiarism / historical similarity flag threshold percentage",
            ),
            SystemConfig(
                key="MAX_GROUP_SIZE",
                value="4",
                description="Maximum allowed student group members per SGP cycle",
            ),
        ]
        for d in defaults:
            await d.insert()
        configs = defaults

    return {"success": True, "configs": [c.dict() for c in configs]}


@router.post(
    "/settings",
    summary="Create or update a system config key",
    dependencies=[Depends(require_roles(["ADMIN"]))],
)
async def update_system_config(
    body: SystemConfigBody,
    current_user: dict = Depends(get_current_user),
) -> Dict[str, Any]:
    """Upsert a system configuration entry by key."""
    if not body.key or body.value is None:
        raise HTTPException(status_code=400, detail="Config key and value are required.")

    config = await SystemConfig.find_one(SystemConfig.key == body.key)
    if config:
        config.value = body.value
        config.description = body.description or ""
        await config.save()
    else:
        config = SystemConfig(
            key=body.key,
            value=body.value,
            description=body.description or "",
        )
        await config.insert()

    return {"success": True, "config": config.dict()}
