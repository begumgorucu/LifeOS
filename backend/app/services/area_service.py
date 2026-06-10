"""Area CRUD operations and health-score integration."""

import uuid
from datetime import UTC, datetime

from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.models.area import Area
from app.models.enums import NotificationType, ProjectStatus, TaskStatus
from app.models.project import Project
from app.models.task import Task
from app.schemas.area import AreaCreate, AreaRead, AreaUpdate
from app.schemas.common import VisionSummary
from app.services import health_score, notification_service


def _utcnow() -> datetime:
    return datetime.now(UTC)


# ---------- enrichment helpers ---------------------------------------------


def _open_tasks_count(db: Session, area_id: uuid.UUID) -> int:
    return (
        db.scalar(
            select(func.count(Task.id)).where(
                Task.area_id == area_id,
                Task.status.in_([TaskStatus.todo, TaskStatus.in_progress]),
            )
        )
        or 0
    )


def _active_projects_count(db: Session, area_id: uuid.UUID) -> int:
    return (
        db.scalar(
            select(func.count(Project.id)).where(
                Project.area_id == area_id,
                Project.status == ProjectStatus.active,
            )
        )
        or 0
    )


def to_area_read(
    db: Session, area: Area, now: datetime | None = None
) -> AreaRead:
    """Convert an Area ORM object into an AreaRead with full enrichment.

    Note: this runs 2 COUNT queries per area + relies on `area.visions` being
    eagerly loaded (or accepts a lazy load). For list endpoints, callers
    should use `selectinload(Area.visions)` to keep query count bounded.

    TODO (post-MVP): replace COUNTs with a single grouped subquery joined to
    the main areas query, eliminating N+1 entirely. Acceptable until area
    counts exceed ~50.
    """
    moment = now or _utcnow()
    return AreaRead(
        id=area.id,
        name=area.name,
        description=area.description,
        icon=area.icon,
        color=area.color,
        health_score=area.health_score,
        last_activity_at=area.last_activity_at,
        is_neglected=health_score.is_neglected(
            area.health_score, area.last_activity_at, moment
        ),
        created_at=area.created_at,
        updated_at=area.updated_at,
        tasks_count=_open_tasks_count(db, area.id),
        projects_count=_active_projects_count(db, area.id),
        visions=[VisionSummary.model_validate(v) for v in area.visions],
    )


# ---------- public service API ---------------------------------------------


def list_areas(
    db: Session,
    user_id: uuid.UUID,
    limit: int,
    offset: int,
) -> tuple[list[Area], int]:
    total = db.scalar(select(func.count(Area.id)).where(Area.user_id == user_id)) or 0
    items = list(
        db.scalars(
            select(Area)
            .where(Area.user_id == user_id)
            .options(selectinload(Area.visions))
            .order_by(Area.created_at.desc())
            .limit(limit)
            .offset(offset)
        )
    )
    return items, total


def get_area(db: Session, user_id: uuid.UUID, area_id: uuid.UUID) -> Area | None:
    return db.scalar(
        select(Area)
        .where(Area.id == area_id, Area.user_id == user_id)
        .options(selectinload(Area.visions))
    )


def create_area(db: Session, user_id: uuid.UUID, payload: AreaCreate) -> Area:
    now = _utcnow()
    area = Area(
        user_id=user_id,
        name=payload.name,
        description=payload.description,
        icon=payload.icon,
        color=payload.color,
        health_score=health_score.SCORE_DEFAULT,
        # Start with "fresh" activity so a brand-new area isn't immediately neglected.
        last_activity_at=now,
    )
    db.add(area)
    db.commit()
    db.refresh(area)
    return area


def update_area(
    db: Session,
    user_id: uuid.UUID,
    area_id: uuid.UUID,
    payload: AreaUpdate,
) -> Area | None:
    area = get_area(db, user_id, area_id)
    if area is None:
        return None

    # Only assign fields the client actually sent — preserves existing values.
    data = payload.model_dump(exclude_unset=True)
    for field, value in data.items():
        setattr(area, field, value)

    db.commit()
    db.refresh(area)
    return area


def delete_area(db: Session, user_id: uuid.UUID, area_id: uuid.UUID) -> bool:
    area = get_area(db, user_id, area_id)
    if area is None:
        return False
    db.delete(area)
    db.commit()
    return True


def recompute_health(
    db: Session,
    user_id: uuid.UUID,
    area_id: uuid.UUID,
) -> Area | None:
    """Apply inactivity decay to a single area's score and persist the result.

    This will eventually be triggered by a scheduled job (Step 9); for now we
    expose it as an endpoint so it can be tested by hand.

    Emits notifications when the decay drops the score into the critical
    band or pushes the area past the neglect-day threshold.
    """
    area = get_area(db, user_id, area_id)
    if area is None:
        return None

    now = _utcnow()
    old_score = area.health_score
    was_neglected = health_score.is_neglected(old_score, area.last_activity_at, now)
    new_score = health_score.compute_decayed_score(
        area.health_score, area.last_activity_at, now
    )
    area.health_score = new_score

    # Score crossed below the critical threshold for the first time.
    if old_score >= health_score.NEGLECT_SCORE_THRESHOLD > new_score:
        notification_service.emit(
            db,
            user_id,
            NotificationType.score_critical,
            title=f"{area.name} skorun kritik seviyede ({new_score})",
            body="İhmal sürerse skor sıfıra inecek. Küçük bir görev yeter.",
            icon="alert-triangle",
            area_id=area.id,
        )
    # Area was not neglected before but is now (days-idle threshold crossed).
    is_neglected_now = health_score.is_neglected(
        new_score, area.last_activity_at, now
    )
    if not was_neglected and is_neglected_now:
        notification_service.emit(
            db,
            user_id,
            NotificationType.neglect_warning,
            title=f"{area.name} alanını ihmal ediyorsun",
            body="7 gündür bu alana dokunmadın. Şimdi ilgilen.",
            icon="flame",
            area_id=area.id,
        )

    db.commit()
    db.refresh(area)
    return area
