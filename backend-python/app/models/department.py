from datetime import datetime, timezone
from beanie import Document, Indexed
from pydantic import Field


class Department(Document):
    name: Indexed(str, unique=True)  # type: ignore[valid-type]
    code: Indexed(str, unique=True)  # type: ignore[valid-type]
    description: str = ""
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "departments"
