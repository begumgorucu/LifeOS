"""Data export — full snapshot for backup or migration.

Loads everything the user owns, runs each entity through its public Read
schema (so the export shape mirrors the API exactly), and stamps a
schema_version that future importers can branch on.
"""

import uuid
from datetime import UTC, datetime

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.models.area import Area
from app.models.project import Project
from app.models.task import Task
from app.models.user_achievement import UserAchievement
from app.models.vision import Vision
from app.schemas.export import ExportBundle, ExportedAchievement
from app.services import (
    area_service,
    project_service,
    task_service,
    user_service,
    vision_service,
)

SCHEMA_VERSION = "1.0"


def _utcnow() -> datetime:
    return datetime.now(UTC)


def build(db: Session, user_id: uuid.UUID) -> ExportBundle:
    user = user_service.get_user(db, user_id)

    areas = list(
        db.scalars(
            select(Area)
            .where(Area.user_id == user_id)
            .options(selectinload(Area.visions))
            .order_by(Area.created_at)
        )
    )
    projects = list(
        db.scalars(
            select(Project)
            .where(Project.user_id == user_id)
            .options(selectinload(Project.area))
            .order_by(Project.created_at)
        )
    )
    tasks = list(
        db.scalars(
            select(Task)
            .where(Task.user_id == user_id)
            .options(
                selectinload(Task.area),
                selectinload(Task.project),
                selectinload(Task.depends_on),
            )
            .order_by(Task.created_at)
        )
    )
    visions = list(
        db.scalars(
            select(Vision)
            .where(Vision.user_id == user_id)
            .options(selectinload(Vision.areas))
            .order_by(Vision.created_at)
        )
    )
    achievements = list(
        db.scalars(
            select(UserAchievement)
            .where(UserAchievement.user_id == user_id)
            .order_by(UserAchievement.unlocked_at)
        )
    )

    return ExportBundle(
        exported_at=_utcnow(),
        schema_version=SCHEMA_VERSION,
        user=user_service.to_user_read(user),
        areas=[area_service.to_area_read(db, a) for a in areas],
        projects=[project_service.to_project_read(db, p) for p in projects],
        tasks=[task_service.to_task_read(t) for t in tasks],
        visions=[vision_service.to_vision_read(v) for v in visions],
        achievements=[
            ExportedAchievement(key=a.achievement_key, unlocked_at=a.unlocked_at)
            for a in achievements
        ],
    )
