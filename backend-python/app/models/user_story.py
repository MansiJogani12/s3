"""
User Story model capturing requirements in the standard agile narrative format.
"""

from datetime import datetime, timezone
from enum import Enum
from typing import List, Optional

from beanie import Document, PydanticObjectId
from pydantic import Field


class UserStoryPriority(str, Enum):
    """Priority levels for a user story."""

    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"


class UserStoryStatus(str, Enum):
    """Workflow states a user story can occupy."""

    TODO = "TODO"
    IN_PROGRESS = "IN_PROGRESS"
    DONE = "DONE"


class UserStory(Document):
    """
    Represents an agile user story belonging to a project, optionally linked to
    an epic and a sprint.
    Maps to the 'userstories' MongoDB collection.
    """

    project_id: PydanticObjectId = Field(
        ...,
        description="Reference to the parent project.",
    )
    epic_id: Optional[PydanticObjectId] = Field(
        default=None,
        description="Reference to the parent epic, if any.",
    )
    sprint_id: Optional[PydanticObjectId] = Field(
        default=None,
        description="Reference to the sprint this story is included in, if any.",
    )
    title: str = Field(
        ...,
        description="Concise title summarising the user story.",
    )
    as_a: str = Field(
        default="",
        description="The role or persona making the request, e.g. 'student'.",
    )
    i_want: str = Field(
        default="",
        description="The capability or feature desired by the persona.",
    )
    so_that: str = Field(
        default="",
        description="The benefit or motivation behind the request.",
    )
    acceptance_criteria: List[str] = Field(
        default_factory=list,
        description="List of conditions that must be met for the story to be accepted.",
    )
    story_points: int = Field(
        default=0,
        description="Effort estimate in story points.",
    )
    priority: UserStoryPriority = Field(
        default=UserStoryPriority.MEDIUM,
        description="Priority level of the user story.",
    )
    status: UserStoryStatus = Field(
        default=UserStoryStatus.TODO,
        description="Current workflow status of the user story.",
    )
    created_by: PydanticObjectId = Field(
        ...,
        description="ID of the user who created the story.",
    )
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        description="Timestamp of when the user story was created.",
    )
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        description="Timestamp of the last update to the user story.",
    )

    class Settings:
        name = "userstories"
