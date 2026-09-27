from typing import Optional
from beanie import PydanticObjectId
from fastapi import HTTPException, Request, status

from app.models.user import User, UserRole
from app.models.group_member import GroupMember
from app.models.project import Project
from app.models.project_group import ProjectGroup


async def resolve_and_verify_project_id(
    user: User,
    requested_project_id: Optional[str] = None,
) -> Optional[PydanticObjectId]:
    """
    Resolve and verify project access based on user role.
    - ADMIN/COORDINATOR: can access any project (must supply projectId).
    - STUDENT: auto-resolved to their own project; rejected if different projectId provided.
    - FACULTY: must supply projectId; verified to be guide or co-guide.
    Returns the resolved PydanticObjectId, or None if access is denied / not found.
    """
    if user.role in (UserRole.ADMIN, UserRole.COORDINATOR):
        return PydanticObjectId(requested_project_id) if requested_project_id else None

    if user.role == UserRole.STUDENT:
        membership = await GroupMember.find_one(
            GroupMember.user_id == user.id,
            GroupMember.status == "ACCEPTED",
        )
        if not membership:
            return None

        project = await Project.find_one(Project.group_id == membership.group_id)
        if not project:
            return None

        if requested_project_id and str(requested_project_id) != str(project.id):
            return None

        return project.id

    if user.role == UserRole.FACULTY:
        if not requested_project_id:
            return None

        project = await Project.get(PydanticObjectId(requested_project_id))
        if not project:
            return None

        group = await ProjectGroup.find_one(
            ProjectGroup.id == project.group_id,
        )
        is_guide = group and (group.guide_id == user.id or group.co_guide_id == user.id)
        is_legacy_guide = project.faculty_guide_id and project.faculty_guide_id == user.id

        if not is_guide and not is_legacy_guide:
            return None

        return project.id

    return None
