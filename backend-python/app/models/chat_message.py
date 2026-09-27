"""
Chat Message model for real-time project-scoped messaging.
"""

from datetime import datetime, timezone

from beanie import Document, PydanticObjectId
from pydantic import Field


class ChatMessage(Document):
    """
    Represents a single message sent within a project's chat channel.
    Maps to the 'chatmessages' MongoDB collection.
    """

    project_id: PydanticObjectId = Field(
        ...,
        description="Reference to the project channel this message belongs to.",
    )
    sender_id: PydanticObjectId = Field(
        ...,
        description="ID of the user who sent the message.",
    )
    message: str = Field(
        ...,
        description="Text content of the chat message.",
    )
    message_type: str = Field(
        default="TEXT",
        description="Type of message, e.g. 'TEXT', 'FILE', 'SYSTEM'.",
    )
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        description="Timestamp of when the message was sent.",
    )

    class Settings:
        name = "chatmessages"
