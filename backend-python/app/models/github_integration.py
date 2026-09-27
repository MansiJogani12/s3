"""
GitHub Integration model for linking a project to a GitHub repository.
"""

from datetime import datetime, timezone
from typing import Optional

from beanie import Document, Indexed, PydanticObjectId
from pydantic import Field


class GithubIntegration(Document):
    """
    Stores the GitHub repository connection details for a project.
    One integration document per project (project_id is unique).
    Maps to the 'githubintegrations' MongoDB collection.
    """

    project_id: Indexed(PydanticObjectId, unique=True) = Field(  # type: ignore[valid-type]
        ...,
        description="Reference to the project. Enforced unique — one integration per project.",
    )
    repo_url: str = Field(
        default="",
        description="Full HTTPS URL of the linked GitHub repository.",
    )
    repo_name: str = Field(
        default="",
        description="Repository name as it appears on GitHub.",
    )
    owner: str = Field(
        default="",
        description="GitHub username or organisation that owns the repository.",
    )
    access_token_encrypted: str = Field(
        default="",
        description="Encrypted GitHub personal access token for API calls.",
    )
    is_connected: bool = Field(
        default=False,
        description="Whether the integration is currently active and authorised.",
    )
    last_synced_at: Optional[datetime] = Field(
        default=None,
        description="Timestamp of the most recent successful sync with GitHub (UTC).",
    )
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        description="Timestamp of when the integration document was created.",
    )
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        description="Timestamp of the last update to the integration document.",
    )

    class Settings:
        name = "githubintegrations"
