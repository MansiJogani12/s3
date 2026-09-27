"""
Milestone model for tracking major project checkpoints and deadlines.
"""

from datetime import datetime, timezone
from enum import Enum
from typing import Optional

from beanie import Document, PydanticObjectId
from pydantic import Field


class MilestoneStatus(str, Enum):
    """Lifecycle states of a project milestone."""

    PENDING = "PENDING"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    MISSED = "MISSED"


class Milestone(Document):
    """
    Represents a significant project milestone with an optional due date.
    Maps to the 'milestones' MongoDB collection.
    """

    project_id: PydanticObjectId = Field(
        ...,
        description="Reference to the parent project.",
    )
    title: str = Field(
        ...,
        description="Title or name of the milestone.",
    )
    description: str = Field(
        default="",
        description="Detailed description of what this milestone entails.",
    )
    due_date: Optional[datetime] = Field(
        default=None,
        description="Target completion date for the milestone (UTC).",
    )
    status: MilestoneStatus = Field(
        default=MilestoneStatus.PENDING,
        description="Current lifecycle status of the milestone.",
    )
    created_by: PydanticObjectId = Field(
        ...,
        description="ID of the user who created the milestone.",
    )
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        description="Timestamp of when the milestone was created.",
    )
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        description="Timestamp of the last update to the milestone.",
    )

    class Settings:
        name = "milestones"
