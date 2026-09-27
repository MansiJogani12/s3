"""
Requirement model for capturing functional and non-functional project requirements.
"""

from datetime import datetime, timezone
from enum import Enum

from beanie import Document, PydanticObjectId
from pydantic import Field


class RequirementType(str, Enum):
    """Classifies a requirement as functional or non-functional."""

    FUNCTIONAL = "FUNCTIONAL"
    NON_FUNCTIONAL = "NON_FUNCTIONAL"


class RequirementPriority(str, Enum):
    """Priority levels for a requirement."""

    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"


class RequirementStatus(str, Enum):
    """Approval workflow states for a requirement."""

    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"


class Requirement(Document):
    """
    Represents a single project requirement, functional or non-functional.
    Maps to the 'requirements' MongoDB collection.
    """

    project_id: PydanticObjectId = Field(
        ...,
        description="Reference to the parent project.",
    )
    title: str = Field(
        ...,
        description="Short title summarising the requirement.",
    )
    description: str = Field(
        default="",
        description="Full description of the requirement.",
    )
    type: RequirementType = Field(
        default=RequirementType.FUNCTIONAL,
        description="Whether this is a functional or non-functional requirement.",
    )
    priority: RequirementPriority = Field(
        default=RequirementPriority.MEDIUM,
        description="Priority level of the requirement.",
    )
    status: RequirementStatus = Field(
        default=RequirementStatus.PENDING,
        description="Current approval status of the requirement.",
    )
    created_by: PydanticObjectId = Field(
        ...,
        description="ID of the user who created the requirement.",
    )
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        description="Timestamp of when the requirement was created.",
    )
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        description="Timestamp of the last update to the requirement.",
    )

    class Settings:
        name = "requirements"
