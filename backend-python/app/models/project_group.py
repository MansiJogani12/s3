from enum import Enum
from typing import Optional
from datetime import datetime, timezone
from beanie import Document, Indexed, PydanticObjectId
from pydantic import Field


class GroupStatus(str, Enum):
    FORMING = "FORMING"
    ACTIVE = "ACTIVE"
    LOCKED = "LOCKED"
    DISBANDED = "DISBANDED"


class ProjectGroup(Document):
    name: str
    code: Indexed(str, unique=True)  # type: ignore[valid-type]
    sgp_cycle_id: Optional[PydanticObjectId] = None
    department_id: Optional[PydanticObjectId] = None
    leader_id: PydanticObjectId
    status: GroupStatus = GroupStatus.FORMING
    guide_id: Optional[PydanticObjectId] = None
    co_guide_id: Optional[PydanticObjectId] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "projectgroups"
