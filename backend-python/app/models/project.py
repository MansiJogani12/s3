from enum import Enum
from typing import Optional, List
from datetime import datetime, timezone
from beanie import Document, PydanticObjectId
from pydantic import BaseModel, Field


class ProjectStatus(str, Enum):
    DRAFT = "DRAFT"
    SUBMITTED = "SUBMITTED"
    UNDER_REVIEW = "UNDER_REVIEW"
    REVISION_REQUIRED = "REVISION_REQUIRED"
    RESUBMITTED = "RESUBMITTED"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    EDIT_REQUESTED = "EDIT_REQUESTED"
    CHANGE_REQUESTED = "CHANGE_REQUESTED"
    CHANGE_APPROVED = "CHANGE_APPROVED"


class StatusHistoryEntry(BaseModel):
    status: ProjectStatus
    changed_by: PydanticObjectId
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    feedback: str = ""


class SimilarProject(BaseModel):
    project_id: Optional[PydanticObjectId] = None
    title: str = ""
    similarity_percentage: float = 0
    reason: str = ""


class ChangeRequest(BaseModel):
    fields: List[str] = []
    reason: str = ""
    status: str = "PENDING"
    requested_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    feedback: str = ""


class Project(Document):
    group_id: PydanticObjectId
    sgp_cycle_id: Optional[PydanticObjectId] = None
    department_id: Optional[PydanticObjectId] = None
    faculty_guide_id: Optional[PydanticObjectId] = None
    title: str
    project_key: Optional[str] = None
    description: str = ""
    github_repository_url: str = ""
    domain: str = "Web Development"
    tech_stack: List[str] = []
    problem_statement: str = ""
    objectives: List[str] = []
    scope: str = ""
    expected_outcome: str = ""
    innovation: str = ""
    status: ProjectStatus = ProjectStatus.DRAFT
    similarity_score: float = 0
    submission_count: int = 0
    similar_projects: List[SimilarProject] = []
    status_history: List[StatusHistoryEntry] = []
    is_archived: bool = False
    change_requests: List[ChangeRequest] = []
    unlocked_fields: List[str] = []
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "projects"
