"""
Release model for versioned software releases within a project.
"""

from datetime import datetime, timezone
from enum import Enum
from typing import Optional

from beanie import Document, PydanticObjectId
from pydantic import Field


class ReleaseStatus(str, Enum):
    """Publication states of a release."""

    DRAFT = "DRAFT"
    RELEASED = "RELEASED"
    ARCHIVED = "ARCHIVED"


class Release(Document):
    """
    Represents a versioned software release associated with a project.
    Maps to the 'releases' MongoDB collection.
    """

    project_id: PydanticObjectId = Field(
        ...,
        description="Reference to the parent project.",
    )
    version: str = Field(
        ...,
        description="Semantic version string, e.g. '1.0.0'.",
    )
    title: str = Field(
        ...,
        description="Human-readable title for the release.",
    )
    description: str = Field(
        default="",
        description="Summary description of what this release contains.",
    )
    release_notes: str = Field(
        default="",
        description="Detailed changelog or release notes for this version.",
    )
    status: ReleaseStatus = Field(
        default=ReleaseStatus.DRAFT,
        description="Current publication status of the release.",
    )
    released_by: PydanticObjectId = Field(
        ...,
        description="ID of the user who published or is responsible for the release.",
    )
    released_at: Optional[datetime] = Field(
        default=None,
        description="Timestamp of when the release was officially published (UTC).",
    )
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        description="Timestamp of when the release document was created.",
    )
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        description="Timestamp of the last update to the release document.",
    )

    class Settings:
        name = "releases"
