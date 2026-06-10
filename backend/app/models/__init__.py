"""SQLAlchemy models. Import here so Alembic discovers every table."""

from app.models.area import Area
from app.models.area_health_snapshot import AreaHealthSnapshot
from app.models.associations import task_dependencies, vision_areas
from app.models.base import Base
from app.models.daily_activity_log import DailyActivityLog
from app.models.daily_pool_item import DailyPoolItem
from app.models.enums import (
    NotificationType,
    PoolReason,
    ProjectStatus,
    TaskPriority,
    TaskStatus,
)
from app.models.notification import Notification
from app.models.project import Project
from app.models.task import Task
from app.models.user import User
from app.models.user_achievement import UserAchievement
from app.models.vision import Vision

__all__ = [
    "Area",
    "AreaHealthSnapshot",
    "Base",
    "DailyActivityLog",
    "DailyPoolItem",
    "Notification",
    "NotificationType",
    "PoolReason",
    "Project",
    "ProjectStatus",
    "Task",
    "TaskPriority",
    "TaskStatus",
    "User",
    "UserAchievement",
    "Vision",
    "task_dependencies",
    "vision_areas",
]
