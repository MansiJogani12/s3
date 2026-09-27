from app.core.schemas import CamelModel
"""
FastAPI router for GitHub Integration and related features.
Converted from integrationController.js + integrationRoutes.js.

Covers:
  - GitHub Integration config (FR-1201 & FR-1202)
  - Simulated commit & PR feeds
  - Releases within integration context (FR-1203)
  - Unified project calendar events (FR-1204)

Prefix: /api/integration
"""

import random
import string
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional

from beanie import PydanticObjectId
from fastapi import APIRouter, Depends, HTTPException, Request, status

from app.core.security import get_current_user, require_roles
from app.models.github_integration import GithubIntegration
from app.models.release import Release
from app.models.milestone import Milestone
from app.models.task import Task
from app.models.sprint import Sprint
from app.models.project import Project
from app.models.group_member import GroupMember
from app.models.notification import Notification
from app.utils.notification_utils import notify_project_members

router = APIRouter(prefix="/api/integration", tags=["Integration"])


def now_utc() -> datetime:
    return datetime.now(timezone.utc)


def _random_commit_hash(length: int = 7) -> str:
    return "".join(random.choices(string.ascii_lowercase + string.digits, k=length))


# ============================================================
# HELPER: resolve active project ID
# ============================================================

async def resolve_project_id(request: Request, current_user: dict) -> Optional[PydanticObjectId]:
    """
    STUDENT: auto-resolve via GroupMember → Project.
    Others: read projectId from query params.
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
    if not project_id_str:
        try:
            body = await request.json()
            project_id_str = body.get("projectId")
        except Exception:
            pass
    if project_id_str:
        try:
            return PydanticObjectId(project_id_str)
        except Exception:
            return None
    return None


# ============================================================
# REQUEST BODY SCHEMAS
# ============================================================

class ConnectGithubBody(CamelModel):
    repoUrl: Optional[str] = None
    action: Optional[str] = None  # 'disconnect' or None (connect)
    projectId: Optional[str] = None  # for non-student roles


class IntegrationReleaseCreate(CamelModel):
    version: str
    title: str
    releaseNotes: Optional[str] = ""
    tag: Optional[str] = None
    artifactUrl: Optional[str] = ""


class IntegrationReleaseUpdate(CamelModel):
    version: Optional[str] = None
    title: Optional[str] = None
    releaseNotes: Optional[str] = None
    tag: Optional[str] = None
    artifactUrl: Optional[str] = None
    status: Optional[str] = None


# ============================================================
# GITHUB INTEGRATION (FR-1201 & FR-1202)
# ============================================================

@router.get("/github", summary="Get GitHub integration config for the active project")
async def get_github_config(
    request: Request,
    current_user: dict = Depends(get_current_user),
) -> Dict[str, Any]:
    """
    Return the GitHub integration record for the project.
    Auto-creates a default integration entry if none exists yet.
    """
    project_id = await resolve_project_id(request, current_user)
    if not project_id:
        return {"success": True, "integration": None}

    integration = await GithubIntegration.find_one(
        GithubIntegration.project_id == project_id
    )

    if not integration:
        project = await Project.get(project_id)
        project_key = getattr(project, "project_key", None) if project else None
        repo_name = (
            f"teamsync-{project_key.lower()}-portal"
            if project_key
            else "teamsync-student-project"
        )
        integration = GithubIntegration(
            project_id=project_id,
            repo_url=f"https://github.com/teamsync-org/{repo_name}",
            repo_name=repo_name,
            is_connected=True,
        )
        await integration.insert()

    return {"success": True, "integration": integration.dict()}


@router.post(
    "/github/connect",
    summary="Connect, change, or disconnect a GitHub repository",
    dependencies=[Depends(require_roles(["STUDENT", "FACULTY", "ADMIN"]))],
)
async def connect_github_repo(
    body: ConnectGithubBody,
    request: Request,
    current_user: dict = Depends(get_current_user),
) -> Dict[str, Any]:
    """
    For STUDENTs: if a repo is already connected, routes the change request
    through the faculty guide (creates a GITHUB_REPO_CHANGE notification).
    Faculty/Admin can connect or disconnect directly.
    """
    role = current_user.get("role", "")
    user_id = PydanticObjectId(current_user.id)

    if role == "STUDENT":
        project_id = await resolve_project_id(request, current_user)
    else:
        pid_str = body.projectId
        if not pid_str:
            raise HTTPException(status_code=400, detail="Project ID required.")
        project_id = PydanticObjectId(pid_str)

    if not project_id:
        raise HTTPException(status_code=400, detail="Active project required.")

    existing = await GithubIntegration.find_one(
        GithubIntegration.project_id == project_id
    )

    # Student with existing connected repo → send approval request to faculty
    if existing and existing.is_connected and role == "STUDENT":
        project = await Project.get(project_id)
        if project and project.faculty_guide_id:
            notif = Notification(
                user_id=project.faculty_guide_id,
                title="GitHub Repo Change Request",
                message=(
                    f"Group {getattr(project, 'project_key', '')} wants to disconnect their GitHub repository."
                    if body.action == "disconnect"
                    else f"Group {getattr(project, 'project_key', '')} wants to change their GitHub repo to {body.repoUrl}."
                ),
                type="WARNING",
                link_url=f"/faculty/group/{project.group_id}",
                action_type="GITHUB_REPO_CHANGE",
                action_payload={
                    "projectId": str(project_id),
                    "groupId": str(project.group_id) if project.group_id else None,
                    "repoUrl": body.repoUrl,
                    "action": body.action,
                },
                action_status="PENDING",
            )
            await notif.insert()
            return {
                "success": True,
                "requestSent": True,
                "message": "Change request sent to your faculty guide.",
            }
        else:
            raise HTTPException(
                status_code=400,
                detail="Cannot change repo directly. You have no faculty guide assigned.",
            )

    # Disconnect
    if body.action == "disconnect":
        if existing:
            existing.repo_url = ""
            existing.repo_name = ""
            existing.is_connected = False
            await existing.save()
        return {"success": True, "message": "Repository disconnected."}

    # Connect / update
    if not body.repoUrl:
        raise HTTPException(status_code=400, detail="Repository URL is required.")

    repo_name = body.repoUrl.split("/")[-1].replace(".git", "")

    if existing:
        existing.repo_url = body.repoUrl
        existing.repo_name = repo_name
        existing.is_connected = True
        existing.last_synced_at = now_utc()
        await existing.save()
        integration = existing
    else:
        integration = GithubIntegration(
            project_id=project_id,
            repo_url=body.repoUrl,
            repo_name=repo_name,
            is_connected=True,
            last_synced_at=now_utc(),
        )
        await integration.insert()

    return {"success": True, "integration": integration.dict()}


@router.get("/github/commits", summary="Get simulated GitHub commit history")
async def get_github_commits(
    request: Request,
    current_user: dict = Depends(get_current_user),
) -> Dict[str, Any]:
    """Return a simulated list of recent commits referencing project task keys."""
    project_id = await resolve_project_id(request, current_user)
    if not project_id:
        return {"success": True, "commits": []}

    project = await Project.get(project_id)
    key = getattr(project, "project_key", "ASCGS") if project else "ASCGS"
    _now = now_utc()

    commits = [
        {
            "hash": "7f9a2bc",
            "author": "Rahul Sharma",
            "message": f"feat({key}-001): implement mobile web camera QR scanner modal",
            "timestamp": (_now - timedelta(hours=1)).isoformat(),
            "branch": "main",
        },
        {
            "hash": "a1e84df",
            "author": "Priya Patel",
            "message": f"fix({key}-BUG-001): request camera permission explicitly on iOS Safari",
            "timestamp": (_now - timedelta(hours=4)).isoformat(),
            "branch": "fix/ios-camera-perm",
        },
        {
            "hash": "c83d91e",
            "author": "Amit Kumar",
            "message": f"docs({key}): update SRS requirement specs for 2048-bit RSA encryption",
            "timestamp": (_now - timedelta(hours=24)).isoformat(),
            "branch": "main",
        },
        {
            "hash": "e410a5b",
            "author": "Rahul Sharma",
            "message": "chore: setup initial Vite React frontend and Express MongoDB API",
            "timestamp": (_now - timedelta(hours=48)).isoformat(),
            "branch": "main",
        },
    ]
    return {"success": True, "commits": commits}


@router.get("/github/pulls", summary="Get simulated GitHub pull requests")
async def get_github_pull_requests(
    request: Request,
    current_user: dict = Depends(get_current_user),
) -> Dict[str, Any]:
    """Return a simulated list of open and merged pull requests."""
    project_id = await resolve_project_id(request, current_user)
    if not project_id:
        return {"success": True, "pullRequests": []}

    project = await Project.get(project_id)
    key = getattr(project, "project_key", "ASCGS") if project else "ASCGS"
    _now = now_utc()

    pull_requests = [
        {
            "id": 1,
            "title": f"PR #1: Implement QR Scanner Modal ({key}-001)",
            "author": "Rahul Sharma",
            "status": "MERGED",
            "createdAt": (_now - timedelta(hours=2)).isoformat(),
            "additions": 142,
            "deletions": 12,
        },
        {
            "id": 2,
            "title": f"PR #2: Fix iOS Safari Camera Permissions ({key}-BUG-001)",
            "author": "Priya Patel",
            "status": "OPEN",
            "createdAt": (_now - timedelta(hours=1)).isoformat(),
            "additions": 24,
            "deletions": 5,
        },
    ]
    return {"success": True, "pullRequests": pull_requests}


# ============================================================
# RELEASES within Integration context (FR-1203)
# ============================================================

@router.get("/releases", summary="Get releases for the active project (integration view)")
async def get_releases(
    request: Request,
    current_user: dict = Depends(get_current_user),
) -> Dict[str, Any]:
    """
    Return releases sorted by releasedAt descending.
    Seeds an initial alpha release record if none exist.
    """
    project_id = await resolve_project_id(request, current_user)
    if not project_id:
        return {"success": True, "releases": []}

    releases = await Release.find(
        Release.project_id == project_id
    ).sort(-Release.released_at).to_list()

    if not releases:
        seed = Release(
            project_id=project_id,
            version="v1.0.0-alpha",
            title="Sprint 1 MVP Build - Smart Campus Gatepass",
            release_notes="Initial release featuring QR code generation, mobile scanner integration, and task tracking.",
            tag="v1.0.0-alpha",
            status="RELEASED",
        )
        await seed.insert()
        releases = [seed]

    return {"success": True, "releases": [r.dict() for r in releases]}


@router.post(
    "/releases",
    status_code=status.HTTP_201_CREATED,
    summary="Create a release (integration context)",
    dependencies=[Depends(require_roles(["STUDENT", "ADMIN"]))],
)
async def create_release(
    body: IntegrationReleaseCreate,
    request: Request,
    current_user: dict = Depends(get_current_user),
) -> Dict[str, Any]:
    """Create a new released version record and notify project members."""
    project_id = await resolve_project_id(request, current_user)
    if not project_id:
        raise HTTPException(status_code=400, detail="Active project required.")

    user_name = current_user.get("name", "Someone")
    release = Release(
        project_id=project_id,
        version=body.version,
        title=body.title,
        release_notes=body.releaseNotes or "",
        tag=body.tag or body.version,
        artifact_url=body.artifactUrl or "",
        status="RELEASED",
    )
    await release.insert()

    await notify_project_members(
        project_id,
        current_user,
        "RELEASE",
        "New Release Created",
        f"{user_name} created release {release.version}",
    )

    return {"success": True, "release": release.dict()}


@router.put(
    "/releases/{id}",
    summary="Update a release (integration context)",
    dependencies=[Depends(require_roles(["STUDENT", "ADMIN"]))],
)
async def update_release(
    id: str,
    body: IntegrationReleaseUpdate,
    request: Request,
    current_user: dict = Depends(get_current_user),
) -> Dict[str, Any]:
    """Update a release scoped to the active project."""
    project_id = await resolve_project_id(request, current_user)
    try:
        oid = PydanticObjectId(id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid release ID.")

    release = await Release.find_one(
        Release.id == oid,
        Release.project_id == project_id,
    )
    if not release:
        raise HTTPException(status_code=404, detail="Release not found or unauthorized.")

    if body.version is not None:
        release.version = body.version
    if body.title is not None:
        release.title = body.title
    if body.releaseNotes is not None:
        release.release_notes = body.releaseNotes
    if body.tag is not None:
        release.tag = body.tag
    if body.artifactUrl is not None:
        release.artifact_url = body.artifactUrl
    if body.status is not None:
        release.status = body.status

    await release.save()

    user_name = current_user.get("name", "Someone")
    await notify_project_members(
        project_id,
        current_user,
        "RELEASE",
        "Release Updated",
        f"{user_name} updated release {release.version}",
    )

    return {"success": True, "release": release.dict()}


@router.delete(
    "/releases/{id}",
    summary="Delete a release (integration context)",
    dependencies=[Depends(require_roles(["STUDENT", "ADMIN"]))],
)
async def delete_release(
    id: str,
    request: Request,
    current_user: dict = Depends(get_current_user),
) -> Dict[str, Any]:
    """Delete a release scoped to the active project and notify members."""
    project_id = await resolve_project_id(request, current_user)
    try:
        oid = PydanticObjectId(id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid release ID.")

    release = await Release.find_one(
        Release.id == oid,
        Release.project_id == project_id,
    )
    if not release:
        raise HTTPException(status_code=404, detail="Release not found or unauthorized.")

    version = release.version
    await release.delete()

    user_name = current_user.get("name", "Someone")
    await notify_project_members(
        project_id,
        current_user,
        "RELEASE",
        "Release Deleted",
        f"{user_name} deleted release {version}",
    )

    return {"success": True, "message": "Release deleted successfully."}


# ============================================================
# UNIFIED PROJECT CALENDAR (FR-1204)
# ============================================================

@router.get("/calendar", summary="Get project calendar events (milestones, tasks, sprints)")
async def get_calendar_events(
    request: Request,
    current_user: dict = Depends(get_current_user),
) -> Dict[str, Any]:
    """
    Aggregate milestones, tasks with due dates, and sprint end dates
    into a unified calendar event list for the active project.
    """
    project_id = await resolve_project_id(request, current_user)
    if not project_id:
        return {"success": True, "events": []}

    milestones = await Milestone.find(Milestone.project_id == project_id).to_list()
    tasks = await Task.find(
        Task.project_id == project_id,
        {"dueDate": {"$ne": None}},
    ).to_list()
    sprints = await Sprint.find(Sprint.project_id == project_id).to_list()

    events: List[Dict[str, Any]] = []

    for m in milestones:
        deadline = getattr(m, "deadline", None) or getattr(m, "target_date", None)
        events.append(
            {
                "id": f"milestone-{m.id}",
                "title": f"[Milestone] {m.title}",
                "date": deadline.isoformat() if deadline else None,
                "type": "MILESTONE",
                "color": "#8b5cf6",
            }
        )

    for t in tasks:
        task_key = getattr(t, "task_key", str(t.id))
        events.append(
            {
                "id": f"task-{t.id}",
                "title": f"[Task Due] {task_key}: {t.title}",
                "date": t.due_date.isoformat() if t.due_date else None,
                "type": "TASK",
                "color": "#3b82f6",
            }
        )

    for s in sprints:
        end_date = getattr(s, "end_date", None)
        events.append(
            {
                "id": f"sprint-end-{s.id}",
                "title": f"[Sprint Deadline] {s.name}",
                "date": end_date.isoformat() if end_date else None,
                "type": "SPRINT",
                "color": "#10b981",
            }
        )

    return {"success": True, "events": events}
