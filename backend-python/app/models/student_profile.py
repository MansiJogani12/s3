from typing import Optional, List
from datetime import datetime, timezone
from beanie import Document, Link, PydanticObjectId
from pydantic import Field


class StudentProfile(Document):
    user_id: PydanticObjectId
    enrollment_number: str
    department_id: Optional[PydanticObjectId] = None
    semester: int = 1
    skills: List[str] = []
    interests: List[str] = []
    bio: str = ""
    preferred_roles: List[str] = []
    github_url: str = ""
    linkedin_url: str = ""
    portfolio_url: str = ""
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "studentprofiles"
