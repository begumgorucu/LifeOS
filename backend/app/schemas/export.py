"""Pydantic schema for the data export bundle.

The export is intentionally read-as-JSON-and-archive — no fancy structure,
no normalization. A future "import" endpoint can round-trip this payload
exactly. Achievements are included as keys + unlock dates so a re-import
on a new install can replay them.
"""

from datetime import datetime

from pydantic import BaseModel

from app.schemas.area import AreaRead
from app.schemas.project import ProjectRead
from app.schemas.task import TaskRead
from app.schemas.user import UserRead
from app.schemas.vision import VisionRead


class ExportedAchievement(BaseModel):
    key: str
    unlocked_at: datetime


class ExportBundle(BaseModel):
    """Full snapshot for backup / migration."""

    exported_at: datetime
    schema_version: str  # bump when ExportBundle's shape changes meaningfully
    user: UserRead
    areas: list[AreaRead]
    projects: list[ProjectRead]
    tasks: list[TaskRead]
    visions: list[VisionRead]
    achievements: list[ExportedAchievement]
