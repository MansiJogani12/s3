from datetime import datetime, timezone
from beanie import Document, Indexed
from pydantic import Field


class AcademicYear(Document):
    year_label: Indexed(str, unique=True)  # type: ignore[valid-type]
    start_date: datetime
    end_date: datetime
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "academicyears"
