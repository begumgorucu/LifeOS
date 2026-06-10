"""Pydantic schemas for the Achievements endpoint."""

from datetime import datetime

from pydantic import BaseModel

from app.services.achievements_catalog import AchievementType


class AchievementRead(BaseModel):
    """One row per catalog entry — locked or unlocked. UI shows progress
    bar for locked, medal/date for unlocked."""

    key: str
    name: str
    description: str
    icon: str
    achievement_type: AchievementType
    target: int

    progress: int           # current value toward target
    unlocked: bool
    unlocked_at: datetime | None


class AchievementList(BaseModel):
    items: list[AchievementRead]
    unlocked_count: int
    total: int
