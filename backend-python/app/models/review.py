"""
Review model for academic or project review sessions.
"""

from datetime import datetime, timezone
from enum import Enum
from typing import Optional

from beanie import Document, PydanticObjectId
from pydantic import Field


class ReviewStatus(str, Enum):
    """Lifecycle states of a review session."""

    SCHEDULED = "SCHEDULED"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"


class Review(Document):
    """
    Represents a review session (e.g. academic panel review) for a project.
    Maps to the 'reviews' MongoDB collection.
    """

    project_id: PydanticObjectId = Field(
        ...,
        description="Reference to the project being reviewed.",
    )
    schedule_id: Optional[PydanticObjectId] = Field(
        default=None,
        description="Reference to the review schedule that spawned this review, if any.",
    )
    review_number: int = Field(
        default=1,
        description="Sequential review number (e.g. 1 for first review, 2 for second).",
    )
    status: ReviewStatus = Field(
        default=ReviewStatus.SCHEDULED,
        description="Current lifecycle status of the review session.",
    )
    held_on: Optional[datetime] = Field(
        default=None,
        description="Actual date and time when the review was held (UTC).",
    )
    venue: str = Field(
        default="",
        description="Physical or virtual location where the review took place.",
    )
    remarks: str = Field(
        default="",
        description="General remarks or notes recorded during the review.",
    )
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        description="Timestamp of when the review record was created.",
    )
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        description="Timestamp of the last update to the review record.",
    )

    class Settings:
        name = "reviews"
