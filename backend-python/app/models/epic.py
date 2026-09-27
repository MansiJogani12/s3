"""
Epic model representing a large body of work that groups related user stories and features.
"""

from datetime import datetime, timezone
from enum import Enum

from beanie import Document, PydanticObjectId
from pydantic import Field


class EpicStatus(str, Enum):
    """Lifecycle states of an epic."""

    PLANNED = "PLANNED"
    IN_PROGRESS = "IN_PROGRESS"
    DONE = "DONE"


class Epic(Document):
    """
    Represents a high-level epic that groups related user stories and features.
    Maps to the 'epics' MongoDB collection.
    """

    project_id: PydanticObjectId = Field(
        ...,
        description="Reference to the parent project.",
    )
    title: str = Field(
        ...,
        description="Title of the epic.",
    )
    description: str = Field(
        default="",
        description="Detailed description of the epic's scope and goals.",
    )
    status: EpicStatus = Field(
        default=EpicStatus.PLANNED,
        description="Current lifecycle status of the epic.",
    )
    created_by: PydanticObjectId = Field(
        ...,
        description="ID of the user who created the epic.",
    )
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        description="Timestamp of when the epic was created.",
    )
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        description="Timestamp of the last update to the epic.",
    )

    class Settings:
        name = "epics"
