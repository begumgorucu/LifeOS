"""Daily Pool — the morning ritual generator.

Five slot rules (in this order, dedup'd):
  1. Neglected   — most-ignored area with a high-priority open task.
  2. Deadline    — up to 2 tasks due today (sorted by due_at asc).
  3. Streak      — easy task in a healthy area to keep momentum (only when
                   user hasn't already advanced the streak today).
  4. Dependency  — a task whose blockers are all done, ready to start.
  5. Flow        — task in the most-recently-active area.

The algorithm is deterministic for a given DB state: same inputs → same
output. We dedupe via a `seen` set across all rules.

`generate` is idempotent within a day: if rows already exist for
(user_id, today), they're returned untouched. Use `regenerate` to wipe
and recompute.
"""

import uuid
from datetime import UTC, date, datetime

from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.api.errors import APIError
from app.models.area import Area
from app.models.associations import task_dependencies
from app.models.daily_pool_item import DailyPoolItem
from app.models.enums import PoolReason, TaskPriority, TaskStatus
from app.models.task import Task
from app.models.user import User
from app.schemas.daily_pool import DailyPoolBundle, DailyPoolItemRead
from app.services import health_score, task_service

# Mirrors health_score.NEGLECT_SCORE_THRESHOLD to keep "kritik" semantics aligned.
NEGLECTED_THRESHOLD = health_score.NEGLECT_SCORE_THRESHOLD
HEALTHY_THRESHOLD = 70
MAX_SLOTS = 5


def _utcnow() -> datetime:
    return datetime.now(UTC)


# ---------- candidate finders (each rule) -----------------------------------


_OPEN_STATUSES = (TaskStatus.todo, TaskStatus.in_progress)


def _find_neglected(
    db: Session, user_id: uuid.UUID, seen: set[uuid.UUID]
) -> Task | None:
    """Pick the highest-priority open task in the most-neglected area."""
    return db.scalar(
        select(Task)
        .join(Area, Task.area_id == Area.id)
        .where(
            Task.user_id == user_id,
            Task.status.in_(_OPEN_STATUSES),
            Area.health_score < NEGLECTED_THRESHOLD,
            Task.id.notin_(seen) if seen else True,
        )
        .order_by(Area.health_score.asc(), Task.priority.desc(), Task.created_at.asc())
        .limit(1)
    )


def _find_deadline(
    db: Session, user_id: uuid.UUID, today: date, seen: set[uuid.UUID]
) -> list[Task]:
    """Up to 2 tasks whose due_at falls on today (UTC). Earliest first."""
    start = datetime.combine(today, datetime.min.time(), tzinfo=UTC)
    end = datetime.combine(today, datetime.max.time(), tzinfo=UTC)
    return list(
        db.scalars(
            select(Task)
            .where(
                Task.user_id == user_id,
                Task.status.in_(_OPEN_STATUSES),
                Task.due_at.between(start, end),
                Task.id.notin_(seen) if seen else True,
            )
            .order_by(Task.due_at.asc())
            .limit(2)
        )
    )


def _find_streak_keeper(
    db: Session, user_id: uuid.UUID, seen: set[uuid.UUID]
) -> Task | None:
    """Easy win — lowest-priority open task in a healthy area."""
    return db.scalar(
        select(Task)
        .join(Area, Task.area_id == Area.id)
        .where(
            Task.user_id == user_id,
            Task.status.in_(_OPEN_STATUSES),
            Area.health_score >= HEALTHY_THRESHOLD,
            Task.id.notin_(seen) if seen else True,
        )
        .order_by(Task.priority.asc(), Task.created_at.asc())
        .limit(1)
    )


def _find_dependency_ready(
    db: Session, user_id: uuid.UUID, seen: set[uuid.UUID]
) -> Task | None:
    """Open task that DOES have dependencies, AND all of them are done."""
    candidates = list(
        db.scalars(
            select(Task)
            .where(
                Task.user_id == user_id,
                Task.status.in_(_OPEN_STATUSES),
                Task.id.notin_(seen) if seen else True,
            )
            .options(selectinload(Task.depends_on))
            .order_by(Task.priority.desc(), Task.created_at.asc())
        )
    )
    for t in candidates:
        if not t.depends_on:
            continue
        if all(d.status == TaskStatus.done for d in t.depends_on):
            return t
    return None


def _find_flow(
    db: Session, user_id: uuid.UUID, seen: set[uuid.UUID]
) -> Task | None:
    """Open task in the area with the most recent activity."""
    most_recent_area = db.scalar(
        select(Area)
        .where(Area.user_id == user_id, Area.last_activity_at.isnot(None))
        .order_by(Area.last_activity_at.desc())
        .limit(1)
    )
    if most_recent_area is None:
        return None
    return db.scalar(
        select(Task)
        .where(
            Task.area_id == most_recent_area.id,
            Task.status.in_(_OPEN_STATUSES),
            Task.id.notin_(seen) if seen else True,
        )
        .order_by(Task.created_at.desc())
        .limit(1)
    )


# ---------- orchestration ---------------------------------------------------


def _build_candidates(
    db: Session, user_id: uuid.UUID, today: date
) -> list[tuple[PoolReason, Task]]:
    """Run each rule in order; dedupe tasks already picked."""
    seen: set[uuid.UUID] = set()
    picks: list[tuple[PoolReason, Task]] = []

    def take(reason: PoolReason, task: Task | None) -> None:
        if task is None or task.id in seen:
            return
        picks.append((reason, task))
        seen.add(task.id)

    take(PoolReason.neglected, _find_neglected(db, user_id, seen))
    for t in _find_deadline(db, user_id, today, seen):
        take(PoolReason.deadline, t)

    # Only suggest a streak-keeper if today hasn't already advanced the streak.
    user = db.scalar(select(User).where(User.id == user_id))
    if user is not None and user.streak_last_active_date != today:
        take(PoolReason.streak, _find_streak_keeper(db, user_id, seen))

    take(PoolReason.dependency_ready, _find_dependency_ready(db, user_id, seen))
    take(PoolReason.flow, _find_flow(db, user_id, seen))

    return picks[:MAX_SLOTS]


def _items_for_day(
    db: Session, user_id: uuid.UUID, day: date
) -> list[DailyPoolItem]:
    """Today's pool rows in slot order."""
    return list(
        db.scalars(
            select(DailyPoolItem)
            .where(DailyPoolItem.user_id == user_id, DailyPoolItem.date == day)
            .order_by(DailyPoolItem.ordering)
        )
    )


def _to_bundle(
    db: Session, user_id: uuid.UUID, day: date, pre_existing: bool
) -> DailyPoolBundle:
    items = _items_for_day(db, user_id, day)
    # Re-load each task with full enrichment for the response.
    item_reads: list[DailyPoolItemRead] = []
    for it in items:
        task = task_service._load_task_with_relations(db, user_id, it.task_id)
        if task is None:
            # Underlying task got deleted — skip; the pool row will be
            # cleaned up on next regeneration.
            continue
        item_reads.append(
            DailyPoolItemRead(
                id=it.id,
                user_id=it.user_id,
                date=it.date,
                ordering=it.ordering,
                reason=it.reason,
                approved=it.approved,
                skipped=it.skipped,
                created_at=it.created_at,
                updated_at=it.updated_at,
                task=task_service.to_task_read(task),
            )
        )
    return DailyPoolBundle(
        date=day,
        items=item_reads,
        total_slots=len(item_reads),
        approved_count=sum(1 for it in items if it.approved),
        skipped_count=sum(1 for it in items if it.skipped),
        pre_existing=pre_existing,
    )


# ---------- public service API ----------------------------------------------


def get_today(db: Session, user_id: uuid.UUID) -> DailyPoolBundle:
    """Return today's pool — empty bundle if none generated yet."""
    today = _utcnow().date()
    return _to_bundle(db, user_id, today, pre_existing=True)


def generate_today(
    db: Session, user_id: uuid.UUID, force: bool = False
) -> DailyPoolBundle:
    """Idempotent generator. If today already has rows, return them
    untouched unless `force=True`, in which case wipe + recompute."""
    today = _utcnow().date()
    existing = _items_for_day(db, user_id, today)
    if existing and not force:
        return _to_bundle(db, user_id, today, pre_existing=True)

    if existing and force:
        for it in existing:
            db.delete(it)
        db.flush()  # autoflush=False — make sure the delete is visible

    picks = _build_candidates(db, user_id, today)
    for idx, (reason, task) in enumerate(picks, start=1):
        db.add(
            DailyPoolItem(
                user_id=user_id,
                date=today,
                ordering=idx,
                reason=reason,
                task_id=task.id,
            )
        )
    db.commit()
    return _to_bundle(db, user_id, today, pre_existing=False)


def _load_item(
    db: Session, user_id: uuid.UUID, item_id: uuid.UUID
) -> DailyPoolItem | None:
    return db.scalar(
        select(DailyPoolItem).where(
            DailyPoolItem.id == item_id, DailyPoolItem.user_id == user_id
        )
    )


def approve_item(
    db: Session, user_id: uuid.UUID, item_id: uuid.UUID
) -> DailyPoolItemRead | None:
    item = _load_item(db, user_id, item_id)
    if item is None:
        return None
    item.approved = True
    item.skipped = False
    db.commit()
    return _item_read(db, user_id, item)


def skip_item(
    db: Session, user_id: uuid.UUID, item_id: uuid.UUID
) -> DailyPoolItemRead | None:
    item = _load_item(db, user_id, item_id)
    if item is None:
        return None
    item.skipped = True
    item.approved = False
    db.commit()
    return _item_read(db, user_id, item)


def replace_item(
    db: Session,
    user_id: uuid.UUID,
    item_id: uuid.UUID,
    new_task_id: uuid.UUID,
) -> DailyPoolItemRead | None:
    item = _load_item(db, user_id, item_id)
    if item is None:
        return None
    # Verify the replacement task belongs to the same user.
    new_task = db.scalar(
        select(Task).where(Task.id == new_task_id, Task.user_id == user_id)
    )
    if new_task is None:
        raise APIError(
            code="TASK_NOT_FOUND",
            message="Replacement task not found.",
            status_code=400,
        )
    item.task_id = new_task_id
    item.approved = False
    item.skipped = False
    db.commit()
    return _item_read(db, user_id, item)


def _item_read(
    db: Session, user_id: uuid.UUID, item: DailyPoolItem
) -> DailyPoolItemRead:
    task = task_service._load_task_with_relations(db, user_id, item.task_id)
    return DailyPoolItemRead(
        id=item.id,
        user_id=item.user_id,
        date=item.date,
        ordering=item.ordering,
        reason=item.reason,
        approved=item.approved,
        skipped=item.skipped,
        created_at=item.created_at,
        updated_at=item.updated_at,
        task=task_service.to_task_read(task),
    )
