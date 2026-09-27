"""
Guidance Log model for recording faculty-student project guidance meetings.
"""

from datetime import datetime, timezone
from typing import List, Optional

from beanie import Document, PydanticObjectId
from pydantic import Field


class GuidanceLog(Document):
    """
    Records a guidance/mentoring meeting between a faculty member and a project team.
    Maps to the 'guidancelogs' MongoDB collection.
    """

    project_id: PydanticObjectId = Field(
        ...,
        description="Reference to the project this guidance session relates to.",
    )
    faculty_id: PydanticObjectId = Field(
        ...,
        description="Reference to the faculty member who conducted the session.",
    )
    meeting_date: datetime = Field(
        ...,
        description="Date and time of the guidance meeting (UTC).",
    )
    summary: str = Field(
        ...,
        description="Summary of topics discussed during the meeting.",
    )
    action_items: List[str] = Field(
        default_factory=list,
        description="List of action items assigned during the meeting.",
    )
    next_meeting_date: Optional[datetime] = Field(
        default=None,
        description="Tentative date for the next guidance session (UTC).",
    )
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        description="Timestamp of when the guidance log was created.",
    )
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        description="Timestamp of the last update to the guidance log.",
    )

    class Settings:
        name = "guidancelogs"
