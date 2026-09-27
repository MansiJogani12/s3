"""
Student Mark model for recording marks given to a student for a specific criteria.
"""

from datetime import datetime, timezone
from typing import Optional

from beanie import Document, PydanticObjectId
from pydantic import Field


class StudentMark(Document):
    """
    Stores a single mark entry for a student, optionally tied to a review session.
    Maps to the 'studentmarks' MongoDB collection.
    """

    student_id: PydanticObjectId = Field(
        ...,
        description="Reference to the student receiving the mark.",
    )
    project_id: PydanticObjectId = Field(
        ...,
        description="Reference to the project context in which the mark was awarded.",
    )
    review_id: Optional[PydanticObjectId] = Field(
        default=None,
        description="Reference to the review session associated with this mark, if any.",
    )
    criteria: str = Field(
        default="",
        description="Name or description of the evaluation criteria.",
    )
    marks_obtained: float = Field(
        default=0,
        description="Marks scored by the student.",
    )
    max_marks: float = Field(
        default=100,
        description="Maximum possible marks for this criteria.",
    )
    given_by: PydanticObjectId = Field(
        ...,
        description="ID of the faculty or evaluator who awarded the marks.",
    )
    remarks: str = Field(
        default="",
        description="Optional remarks from the evaluator.",
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
        name = "studentmarks"
