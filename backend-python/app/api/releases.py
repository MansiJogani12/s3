from app.core.schemas import CamelModel
"""
FastAPI router for Releases (project version management).
Converted from releaseController.js + releaseRoutes.js.

Covers:
  - Create, read, update, delete project releases
  - Notifications triggered on release events

Prefix: /api/releases
"""

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from beanie import PydanticObjectId
from fastapi import APIRouter, Depends, HTTPException, Request, status

from app.core.security import get_current_user, require_roles
from app.models.release import Release
from app.models.group_member import GroupMember
from app.models.project import Project
from app.utils.notification_utils import notify_project_members

router = APIRouter(prefix="/api/releases", tags=["Releases"])


def now_utc() -> datetime:
    return datetime.now(timezone.utc)


# ============================================================
# HELPER: resolve active project ID
# ============================================================

async def resolve_project_id(request: Request, current_user: dict) -> Optional[PydanticObjectId]:
    """Mirror resolveAndVerifyProjectId: student auto-resolves, others use query/body."""
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

class ReleaseCreate(CamelModel):
    version: str
    title: str
    description: Optional[str] = ""
    releaseDate: Optional[datetime] = None
    milestoneId: Optional[str] = None
    includedFeatures: Optional[List[str]] = []
    status: Optional[str] = "DRAFT"
    githubReleaseUrl: Optional[str] = ""


class ReleaseUpdate(CamelModel):
    version: Optional[str] = None
    title: Optional[str] = None
    description: Optional[str] = None
    releaseDate: Optional[datetime] = None
    milestoneId: Optional[str] = None
    includedFeatures: Optional[List[str]] = None
    status: Optional[str] = None
    githubReleaseUrl: Optional[str] = None


# ============================================================
# RELEASE ROUTES
# ============================================================

@router.post(
    "/",
    status_code=status.HTTP_201_CREATED,
    summary="Create a new release",
    dependencies=[Depends(require_roles(["STUDENT", "FACULTY", "ADMIN"]))],
)
async def create_release(
    body: ReleaseCreate,
    request: Request,
    current_user: dict = Depends(get_current_user),
) -> Dict[str, Any]:
    """Create a release for the active project and notify project members."""
    project_id = await resolve_project_id(request, current_user)
    if not project_id:
        raise HTTPException(status_code=400, detail="Project ID required.")

    milestone_id = PydanticObjectId(body.milestoneId) if body.milestoneId else None
    included_features = [PydanticObjectId(fid) for fid in (body.includedFeatures or [])]

    release = Release(
        project_id=project_id,
        version=body.version,
        title=body.title,
        description=body.description or "",
        release_date=body.releaseDate,
        milestone_id=milestone_id,
        included_features=included_features,
        status=body.status or "DRAFT",
        github_release_url=body.githubReleaseUrl or "",
    )
    await release.insert()

    user_name = current_user.get("name", "Someone")
    await notify_project_members(
        project_id,
        current_user,
        "RELEASE",
        "New Release Scheduled",
        f"{user_name} created a new release: {body.version} - {body.title}",
    )

    return {"success": True, "release": release.dict()}


@router.get("/", summary="Get releases for the active project")
async def get_releases_by_project(
    request: Request,
    current_user: dict = Depends(get_current_user),
) -> Dict[str, Any]:
    """Return all releases for the active project sorted by releaseDate descending."""
    project_id = await resolve_project_id(request, current_user)
    if not project_id:
        return {"success": True, "releases": []}

    releases = await Release.find(
        Release.project_id == project_id
    ).sort(-Release.release_date).to_list()

    return {"success": True, "releases": [r.dict() for r in releases]}


@router.put(
    "/{id}",
    summary="Update a release",
    dependencies=[Depends(require_roles(["STUDENT", "FACULTY", "ADMIN"]))],
)
async def update_release(
    id: str,
    body: ReleaseUpdate,
    request: Request,
    current_user: dict = Depends(get_current_user),
) -> Dict[str, Any]:
    """Update a release. Sends a special 'deployed' notification if status changes to RELEASED."""
    try:
        oid = PydanticObjectId(id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid release ID.")

    old_release = await Release.get(oid)
    if not old_release:
        raise HTTPException(status_code=404, detail="Release not found.")

    old_status = old_release.status

    # Apply updates
    update_data = body.dict(exclude_none=True)
    for field, value in update_data.items():
        if field == "milestoneId":
            old_release.milestone_id = PydanticObjectId(value) if value else None
        elif field == "includedFeatures":
            old_release.included_features = [PydanticObjectId(fid) for fid in value]
        elif field == "releaseDate":
            old_release.release_date = value
        elif field == "githubReleaseUrl":
            old_release.github_release_url = value
        else:
            snake = _to_snake(field)
            if hasattr(old_release, snake):
                setattr(old_release, snake, value)
            elif hasattr(old_release, field):
                setattr(old_release, field, value)

    await old_release.save()

    project_id = await resolve_project_id(request, current_user)
    user_name = current_user.get("name", "Someone")

    if body.status == "RELEASED" and old_status != "RELEASED":
        await notify_project_members(
            project_id,
            current_user,
            "RELEASE",
            "Release Deployed",
            f"Release {old_release.version} ({old_release.title}) has been officially released!",
        )
    else:
        await notify_project_members(
            project_id,
            current_user,
            "RELEASE",
            "Release Updated",
            f"{user_name} updated the release: {old_release.version}",
        )

    return {"success": True, "release": old_release.dict()}


@router.delete(
    "/{id}",
    summary="Delete a release",
    dependencies=[Depends(require_roles(["STUDENT", "FACULTY", "ADMIN"]))],
)
async def delete_release(
    id: str,
    request: Request,
    current_user: dict = Depends(get_current_user),
) -> Dict[str, Any]:
    """Delete a release and notify project members."""
    try:
        oid = PydanticObjectId(id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid release ID.")

    release = await Release.get(oid)
    if release:
        project_id = await resolve_project_id(request, current_user)
        user_name = current_user.get("name", "Someone")
        await release.delete()
        await notify_project_members(
            project_id,
            current_user,
            "RELEASE",
            "Release Deleted",
            f"{user_name} deleted the release: {release.version}",
        )

    return {"success": True, "message": "Release deleted successfully."}


# ============================================================
# UTILITY
# ============================================================

def _to_snake(name: str) -> str:
    """Convert camelCase to snake_case."""
    import re
    s1 = re.sub("(.)([A-Z][a-z]+)", r"\1_\2", name)
    return re.sub("([a-z0-9])([A-Z])", r"\1_\2", s1).lower()
