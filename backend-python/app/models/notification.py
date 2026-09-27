"""
Notification model for delivering in-app messages to users.
"""

from datetime import datetime, timezone

from beanie import Document, PydanticObjectId
from pydantic import Field


class Notification(Document):
    """
    Represents an in-app notification directed at a specific user.
    Maps to the 'notifications' MongoDB collection.
    """

    user_id: PydanticObjectId = Field(
        ...,
        description="ID of the user who should receive this notification.",
    )
    title: str = Field(
        ...,
        description="Short heading of the notification.",
    )
    message: str = Field(
        ...,
        description="Full notification message body.",
    )
    type: str = Field(
        default="GENERAL",
        description="Category of the notification, e.g. 'GENERAL', 'TASK', 'REVIEW'.",
    )
    is_read: bool = Field(
        default=False,
        description="Whether the user has read this notification.",
    )
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        description="Timestamp of when the notification was created.",
    )

    class Settings:
        name = "notifications"
