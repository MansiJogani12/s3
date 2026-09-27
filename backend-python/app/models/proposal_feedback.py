"""
Proposal Feedback model for faculty or reviewer feedback on project proposals.
"""

from datetime import datetime, timezone

from beanie import Document, PydanticObjectId
from pydantic import Field


class ProposalFeedback(Document):
    """
    Records feedback provided by a reviewer on a project proposal.
    Maps to the 'proposalfeedbacks' MongoDB collection.
    """

    project_id: PydanticObjectId = Field(
        ...,
        description="Reference to the project whose proposal is being reviewed.",
    )
    given_by: PydanticObjectId = Field(
        ...,
        description="ID of the faculty member or reviewer providing the feedback.",
    )
    feedback: str = Field(
        ...,
        description="The feedback content.",
    )
    status: str = Field(
        default="PENDING",
        description="Status of the proposal at the time of feedback, e.g. 'PENDING', 'APPROVED', 'REJECTED'.",
    )
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        description="Timestamp of when the feedback was submitted.",
    )
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        description="Timestamp of the last update to the feedback entry.",
    )

    class Settings:
        name = "proposalfeedbacks"
