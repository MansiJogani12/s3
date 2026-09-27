from typing import Optional, List
from datetime import datetime, timezone
from beanie import Document, PydanticObjectId
from pydantic import Field


class FacultyProfile(Document):
    user_id: PydanticObjectId
    department_id: Optional[PydanticObjectId] = None
    designation: str = "Assistant Professor"
    expertise: List[str] = []
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "facultyprofiles"
