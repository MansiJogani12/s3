"""
Evaluation Criteria model defining the rubric used during project reviews.
"""

from datetime import datetime, timezone

from beanie import Document
from beanie import Indexed
from pydantic import Field


class EvaluationCriteria(Document):
    """
    Defines a single evaluation criterion that reviewers use when assessing projects.
    Maps to the 'evaluationcriteria' MongoDB collection.
    """

    name: str = Field(
        ...,
        description="Name of the evaluation criterion, e.g. 'Code Quality'.",
    )
    description: str = Field(
        default="",
        description="Detailed explanation of what this criterion assesses.",
    )
    max_marks: float = Field(
        default=100,
        description="Maximum marks that can be awarded for this criterion.",
    )
    review_number: int = Field(
        default=1,
        description="Which review number this criterion applies to.",
    )
    is_active: bool = Field(
        default=True,
        description="Whether this criterion is currently in use.",
    )
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        description="Timestamp of when the criterion was created.",
    )
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        description="Timestamp of the last update to the criterion.",
    )

    class Settings:
        name = "evaluationcriteria"
