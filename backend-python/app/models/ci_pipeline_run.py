"""
CI Pipeline Run model for tracking continuous integration build/test executions.
"""

from datetime import datetime, timezone
from enum import Enum
from typing import Optional

from beanie import Document, PydanticObjectId
from pydantic import Field


class PipelineRunStatus(str, Enum):
    """Execution states of a CI pipeline run."""

    PENDING = "PENDING"
    RUNNING = "RUNNING"
    SUCCESS = "SUCCESS"
    FAILED = "FAILED"


class CiPipelineRun(Document):
    """
    Records a single execution of a CI pipeline for a project's repository.
    Maps to the 'cipipelineruns' MongoDB collection.
    """

    project_id: PydanticObjectId = Field(
        ...,
        description="Reference to the project whose pipeline was triggered.",
    )
    run_id: str = Field(
        default="",
        description="External run identifier from the CI provider (e.g. GitHub Actions run ID).",
    )
    status: PipelineRunStatus = Field(
        default=PipelineRunStatus.PENDING,
        description="Current execution status of the pipeline run.",
    )
    branch: str = Field(
        default="main",
        description="Git branch against which the pipeline was triggered.",
    )
    triggered_by: str = Field(
        default="",
        description="Username or event that triggered the pipeline run.",
    )
    logs: str = Field(
        default="",
        description="Captured log output from the pipeline execution.",
    )
    started_at: Optional[datetime] = Field(
        default=None,
        description="Timestamp of when the pipeline run started (UTC).",
    )
    finished_at: Optional[datetime] = Field(
        default=None,
        description="Timestamp of when the pipeline run completed (UTC).",
    )
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        description="Timestamp of when this run document was created.",
    )

    class Settings:
        name = "cipipelineruns"
