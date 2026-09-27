"""
Audit Log model for tracking system actions and actor activity.
"""

from datetime import datetime, timezone
from typing import Optional

from beanie import Document, PydanticObjectId
from pydantic import Field


class AuditLog(Document):
    """
    Represents an audit log entry recording who did what, when, and on which entity.
    Maps to the 'auditlogs' MongoDB collection.
    """

    actor_id: Optional[PydanticObjectId] = Field(
        default=None,
        description="ID of the user who performed the action. None for system-generated actions.",
    )
    actor_role: str = Field(
        default="SYSTEM",
        description="Role of the actor at the time of the action.",
    )
    actor_name: str = Field(
        default="System",
        description="Display name of the actor.",
    )
    action: str = Field(
        ...,
        description="The action performed, e.g. 'USER_LOGIN', 'PROJECT_CREATED'.",
    )
    target_entity: str = Field(
        default="",
        description="The type of entity that was acted upon, e.g. 'Project', 'User'.",
    )
    target_id: str = Field(
        default="",
        description="String representation of the target entity's ID.",
    )
    details: dict = Field(
        default_factory=dict,
        description="Arbitrary key-value metadata providing context about the action.",
    )
    ip_address: str = Field(
        default="",
        description="IP address from which the action originated.",
    )
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        description="Timestamp of when the audit event occurred.",
    )

    class Settings:
        name = "auditlogs"
