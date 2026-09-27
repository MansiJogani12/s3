from enum import Enum
from typing import Optional
from datetime import datetime, timezone
from beanie import Document, PydanticObjectId
from pydantic import Field
from pymongo import IndexModel, ASCENDING


class MemberRole(str, Enum):
    LEADER = "LEADER"
    MEMBER = "MEMBER"


class InviteStatus(str, Enum):
    INVITED = "INVITED"
    ACCEPTED = "ACCEPTED"
    REJECTED = "REJECTED"


class GroupMember(Document):
    group_id: PydanticObjectId
    user_id: PydanticObjectId
    role: MemberRole = MemberRole.MEMBER
    status: InviteStatus = InviteStatus.ACCEPTED
    invited_by: Optional[PydanticObjectId] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "groupmembers"
        indexes = [
            IndexModel([("group_id", ASCENDING), ("user_id", ASCENDING)], unique=True),
        ]
