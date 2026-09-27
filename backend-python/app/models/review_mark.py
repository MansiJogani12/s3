"""
Review Mark model for storing per-student marks awarded during a review session.
"""

from datetime import datetime, timezone
from typing import Optional

from beanie import Document, PydanticObjectId
from pydantic import Field


class ReviewMark(Document):
    """
    Stores marks awarded to a student for a specific review session and evaluation criteria.
    Maps to the 'reviewmarks' MongoDB collection.
    """

    review_id: PydanticObjectId = Field(
        ...,
        description="Reference to the review session in which the marks were awarded.",
    )
    project_id: PydanticObjectId = Field(
        ...,
        description="Reference to the project being evaluated.",
    )
    student_id: PydanticObjectId = Field(
        ...,
        description="Reference to the student who received these marks.",
    )
    criteria_id: Optional[PydanticObjectId] = Field(
        default=None,
        description="Reference to the evaluation criteria used, if any.",
    )
    marks_obtained: float = Field(
        default=0,
        description="Marks scored by the student.",
    )
    max_marks: float = Field(
        default=100,
        description="Maximum possible marks for this criterion.",
    )
    remarks: str = Field(
        default="",
        description="Evaluator remarks specific to this mark entry.",
    )
    given_by: PydanticObjectId = Field(
        ...,
        description="ID of the faculty member or evaluator who awarded the marks.",
    )
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        description="Timestamp of when the mark was recorded.",
    )
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        description="Timestamp of the last update to this mark entry.",
    )

    class Settings:
        name = "reviewmarks"
