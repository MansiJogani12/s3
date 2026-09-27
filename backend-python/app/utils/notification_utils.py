from typing import Optional
from beanie import PydanticObjectId

from app.models.notification import Notification
from app.models.group_member import GroupMember
from app.models.project import Project
from app.models.project_group import ProjectGroup
from app.models.user import User


async def notify_project_members(
    project_id: PydanticObjectId,
    initiator: User,
    notif_type: str,
    title: str,
    message: str,
) -> None:
    """Create notifications for all accepted group members and assigned faculty, excluding the initiator."""
    try:
        project = await Project.get(project_id)
        if not project:
            return

        members = await GroupMember.find(
            GroupMember.group_id == project.group_id,
            GroupMember.status == "ACCEPTED",
        ).to_list()

        group = await ProjectGroup.get(project.group_id)

        notify_user_ids = {str(m.user_id) for m in members}
        if group and group.guide_id:
            notify_user_ids.add(str(group.guide_id))
        if group and group.co_guide_id:
            notify_user_ids.add(str(group.co_guide_id))

        # Exclude the initiator
        notify_user_ids.discard(str(initiator.id))

        notifications = [
            Notification(
                user_id=PydanticObjectId(uid),
                title=title,
                message=message,
                type=notif_type,
            )
            for uid in notify_user_ids
        ]

        if notifications:
            await Notification.insert_many(notifications)
    except Exception as e:
        print(f"Error generating project notifications: {e}")
