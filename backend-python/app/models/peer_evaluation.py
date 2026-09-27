"""
Peer Evaluation model for structured peer-to-peer assessment within a project.
"""

from datetime import datetime, timezone
from typing import Optional

from beanie import Document, PydanticObjectId
from pydantic import Field


class PeerEvaluation(Document):
    """
    Records a peer evaluation submitted by one team member about another.
    Maps to the 'peerevaluations' MongoDB collection.
    """

    project_id: PydanticObjectId = Field(
        ...,
        description="Reference to the project in which the peer evaluation takes place.",
    )
    evaluator_id: PydanticObjectId = Field(
        ...,
        description="ID of the user submitting the evaluation.",
    )
    evaluatee_id: PydanticObjectId = Field(
        ...,
        description="ID of the user being evaluated.",
    )
    ratings: dict = Field(
        default_factory=dict,
        description="Key-value mapping of criteria names to numeric ratings.",
    )
    feedback: str = Field(
        default="",
        description="Free-text qualitative feedback from the evaluator.",
    )
    submitted_at: Optional[datetime] = Field(
        default=None,
        description="Timestamp of when the evaluation was formally submitted (UTC).",
    )
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        description="Timestamp of when the evaluation document was created.",
    )
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        description="Timestamp of the last update to the evaluation document.",
    )

    class Settings:
        name = "peerevaluations"
