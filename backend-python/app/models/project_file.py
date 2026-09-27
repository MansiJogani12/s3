"""
Project File model for tracking files uploaded to a project.
"""

from datetime import datetime, timezone

from beanie import Document, PydanticObjectId
from pydantic import Field


class ProjectFile(Document):
    """
    Represents a file uploaded and associated with a project.
    Maps to the 'projectfiles' MongoDB collection.
    """

    project_id: PydanticObjectId = Field(
        ...,
        description="Reference to the project this file belongs to.",
    )
    uploaded_by: PydanticObjectId = Field(
        ...,
        description="ID of the user who uploaded the file.",
    )
    file_name: str = Field(
        ...,
        description="Original file name including extension.",
    )
    file_url: str = Field(
        ...,
        description="URL or storage path to access the uploaded file.",
    )
    file_type: str = Field(
        default="",
        description="MIME type or category of the file, e.g. 'application/pdf'.",
    )
    file_size: int = Field(
        default=0,
        description="Size of the file in bytes.",
    )
    description: str = Field(
        default="",
        description="Optional description or notes about the file.",
    )
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        description="Timestamp of when the file was uploaded.",
    )

    class Settings:
        name = "projectfiles"
