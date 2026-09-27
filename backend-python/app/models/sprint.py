"""
Sprint model for managing time-boxed iteration cycles within a project.
"""

from datetime import datetime, timezone
from enum import Enum
from typing import Optional

from beanie import Document, PydanticObjectId
from pydantic import Field


class SprintStatus(str, Enum):
    """Lifecycle states of a sprint."""

    PLANNED = "PLANNED"
    ACTIVE = "ACTIVE"
    COMPLETED = "COMPLETED"


class Sprint(Document):
    """
    Represents a sprint (iteration) belonging to a project.
    Maps to the 'sprints' MongoDB collection.
    """

    project_id: PydanticObjectId = Field(
        ...,
        description="Reference to the parent project.",
    )
    name: str = Field(
        ...,
        description="Human-readable name of the sprint, e.g. 'Sprint 1'.",
    )
    goal: str = Field(
        default="",
        description="High-level objective the team aims to achieve during this sprint.",
    )
    start_date: Optional[datetime] = Field(
        default=None,
        description="Planned or actual start date of the sprint (UTC).",
    )
    end_date: Optional[datetime] = Field(
        default=None,
        description="Planned or actual end date of the sprint (UTC).",
    )
    status: SprintStatus = Field(
        default=SprintStatus.PLANNED,
        description="Current lifecycle status of the sprint.",
    )
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        description="Timestamp of when the sprint document was created.",
    )
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        description="Timestamp of the last update to the sprint document.",
    )

    class Settings:
        name = "sprints"
