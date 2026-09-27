"""
Bug model for tracking defects found within a project.
"""

from datetime import datetime, timezone
from enum import Enum
from typing import Optional

from beanie import Document, PydanticObjectId
from pydantic import Field


class BugSeverity(str, Enum):
    """Severity levels indicating the impact of a bug."""

    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class BugStatus(str, Enum):
    """Lifecycle states of a bug report."""

    OPEN = "OPEN"
    IN_PROGRESS = "IN_PROGRESS"
    RESOLVED = "RESOLVED"
    CLOSED = "CLOSED"


class Bug(Document):
    """
    Represents a bug or defect discovered within a project.
    Maps to the 'bugs' MongoDB collection.
    """

    project_id: PydanticObjectId = Field(
        ...,
        description="Reference to the parent project.",
    )
    title: str = Field(
        ...,
        description="Short, descriptive title of the bug.",
    )
    description: str = Field(
        default="",
        description="Full description of the bug.",
    )
    steps_to_reproduce: str = Field(
        default="",
        description="Step-by-step instructions to reproduce the bug.",
    )
    expected_behaviour: str = Field(
        default="",
        description="What the correct, expected behaviour should be.",
    )
    actual_behaviour: str = Field(
        default="",
        description="What actually happens when the bug is triggered.",
    )
    severity: BugSeverity = Field(
        default=BugSeverity.MEDIUM,
        description="Severity level indicating the impact of the bug.",
    )
    status: BugStatus = Field(
        default=BugStatus.OPEN,
        description="Current lifecycle status of the bug.",
    )
    reported_by: PydanticObjectId = Field(
        ...,
        description="ID of the user who reported the bug.",
    )
    assigned_to: Optional[PydanticObjectId] = Field(
        default=None,
        description="ID of the user assigned to fix the bug.",
    )
    sprint_id: Optional[PydanticObjectId] = Field(
        default=None,
        description="Reference to the sprint in which this bug is being addressed.",
    )
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        description="Timestamp of when the bug report was created.",
    )
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        description="Timestamp of the last update to the bug report.",
    )

    class Settings:
        name = "bugs"
