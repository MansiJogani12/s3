from typing import Optional
from datetime import datetime, timezone
from enum import Enum

from beanie import Document, Indexed
from pydantic import Field


class UserRole(str, Enum):
    ADMIN = "ADMIN"
    COORDINATOR = "COORDINATOR"
    FACULTY = "FACULTY"
    STUDENT = "STUDENT"


class User(Document):
    name: str
    email: Optional[Indexed(str, unique=True)] = None  # type: ignore[valid-type]
    enrollment_number: Optional[Indexed(str, unique=True)] = None  # type: ignore[valid-type]
    password_hash: str
    role: UserRole = UserRole.STUDENT
    is_active: bool = True
    last_login: Optional[datetime] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "users"

    def dict_safe(self) -> dict:
        """Return user dict without password_hash."""
        d = self.model_dump(by_alias=False)
        d.pop("password_hash", None)
        d["id"] = str(self.id)
        d.pop("_id", None)
        return d
