"""
Task model representing a discrete unit of work within a sprint or project.
"""

from datetime import datetime, timezone
from enum import Enum
from typing import List, Optional

from beanie import Document, PydanticObjectId
from pydantic import Field


class TaskStatus(str, Enum):
    """Workflow states a task can occupy."""

    TODO = "TODO"
    IN_PROGRESS = "IN_PROGRESS"
    IN_REVIEW = "IN_REVIEW"
    DONE = "DONE"


class TaskPriority(str, Enum):
    """Priority levels for a task."""

    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class Task(Document):
    """
    Represents an individual task assigned to a team member.
    Maps to the 'tasks' MongoDB collection.
    """

    project_id: PydanticObjectId = Field(
        ...,
        description="Reference to the parent project.",
    )
    sprint_id: Optional[PydanticObjectId] = Field(
        default=None,
        description="Reference to the sprint this task belongs to, if any.",
    )
    user_story_id: Optional[PydanticObjectId] = Field(
        default=None,
        description="Reference to the parent user story, if any.",
    )
    title: str = Field(
        ...,
        description="Short, descriptive title of the task.",
    )
    description: str = Field(
        default="",
        description="Detailed description of what needs to be done.",
    )
    assigned_to: Optional[PydanticObjectId] = Field(
        default=None,
        description="ID of the user the task is assigned to.",
    )
    created_by: PydanticObjectId = Field(
        ...,
        description="ID of the user who created the task.",
    )
    status: TaskStatus = Field(
        default=TaskStatus.TODO,
        description="Current workflow status of the task.",
    )
    priority: TaskPriority = Field(
        default=TaskPriority.MEDIUM,
        description="Priority level of the task.",
    )
    story_points: int = Field(
        default=0,
        description="Effort estimate in story points.",
    )
    labels: List[str] = Field(
        default_factory=list,
        description="List of label/tag strings attached to the task.",
    )
    due_date: Optional[datetime] = Field(
        default=None,
        description="Optional deadline for the task (UTC).",
    )
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        description="Timestamp of when the task was created.",
    )
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        description="Timestamp of the last update to the task.",
    )

    class Settings:
        name = "tasks"
