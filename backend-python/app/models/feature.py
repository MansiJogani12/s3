"""
Feature model for managing product features within a project or epic.
"""

from datetime import datetime, timezone
from enum import Enum
from typing import Optional

from beanie import Document, PydanticObjectId
from pydantic import Field


class FeatureStatus(str, Enum):
    """Lifecycle states of a product feature."""

    PLANNED = "PLANNED"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"


class FeaturePriority(str, Enum):
    """Priority levels for a feature."""

    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"


class Feature(Document):
    """
    Represents a product feature, optionally grouped under an epic.
    Maps to the 'features' MongoDB collection.
    """

    project_id: PydanticObjectId = Field(
        ...,
        description="Reference to the parent project.",
    )
    epic_id: Optional[PydanticObjectId] = Field(
        default=None,
        description="Reference to the parent epic, if this feature belongs to one.",
    )
    title: str = Field(
        ...,
        description="Title of the feature.",
    )
    description: str = Field(
        default="",
        description="Detailed description of the feature.",
    )
    status: FeatureStatus = Field(
        default=FeatureStatus.PLANNED,
        description="Current lifecycle status of the feature.",
    )
    priority: FeaturePriority = Field(
        default=FeaturePriority.MEDIUM,
        description="Priority level of the feature.",
    )
    created_by: PydanticObjectId = Field(
        ...,
        description="ID of the user who created the feature.",
    )
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        description="Timestamp of when the feature was created.",
    )
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        description="Timestamp of the last update to the feature.",
    )

    class Settings:
        name = "features"
