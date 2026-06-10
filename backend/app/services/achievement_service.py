"""Achievement progress tracking and unlock detection."""

import uuid
from datetime import UTC, datetime, timedelta

from sqlalchemy import distinct, extract, func, select
from sqlalchemy.orm import Session

from app.models.area import Area
from app.models.daily_activity_log import DailyActivityLog
from app.models.enums import TaskStatus
from app.models.task import Task
from app.models.user import User
from app.models.user_achievement import UserAchievement
from app.schemas.achievement import AchievementList, AchievementRead
from app.services.achievements_catalog import (
    ACHIEVEMENTS,
    AchievementDef,
    AchievementType,
)


def _utcnow() -> datetime:
    return datetime.now(UTC)


# ---------- progress queries (one per type) ---------------------------------


def _progress_counter(db: Session, user_id: uuid.UUID) -> int:
    """How many tasks the user has completed lifetime."""
    return (
        db.scalar(
            select(func.count(Task.id)).where(
                Task.user_id == user_id, Task.status == TaskStatus.done
            )
        )
        or 0
    )


def _progress_streak(db: Session, user_id: uuid.UUID) -> int:
    """Longest streak ever — once you hit it, it's banked."""
    user = db.scalar(select(User).where(User.id == user_id))
    return user.longest_streak if user is not None else 0


def _progress_area_score(db: Session, user_id: uuid.UUID) -> int:
    """Highest current health_score across all the user's areas."""
    return (
        db.scalar(
            select(func.max(Area.health_score)).where(Area.user_id == user_id)
        )
        or 0
    )


def _progress_early_completions(db: Session, user_id: uuid.UUID) -> int:
    """Tasks completed where the UTC hour is < 9."""
    return (
        db.scalar(
            select(func.count(Task.id)).where(
                Task.user_id == user_id,
                Task.status == TaskStatus.done,
                Task.completed_at.isnot(None),
                extract("hour", Task.completed_at) < 9,
            )
        )
        or 0
    )


def _progress_perfect_week(db: Session, user_id: uuid.UUID) -> int:
    """Distinct active days in the last 7 calendar days (today inclusive)."""
    today = _utcnow().date()
    earliest = today - timedelta(days=6)  # 7-day inclusive window
    return (
        db.scalar(
            select(func.count(distinct(DailyActivityLog.date))).where(
                DailyActivityLog.user_id == user_id,
                DailyActivityLog.date >= earliest,
                DailyActivityLog.date <= today,
                DailyActivityLog.tasks_completed >= 1,
            )
        )
        or 0
    )


_PROGRESS_BY_TYPE = {
    AchievementType.counter: _progress_counter,
    AchievementType.streak: _progress_streak,
    AchievementType.area_score: _progress_area_score,
    AchievementType.early_completions: _progress_early_completions,
    AchievementType.perfect_week: _progress_perfect_week,
}


def compute_progress(db: Session, user_id: uuid.UUID, defn: AchievementDef) -> int:
    return _PROGRESS_BY_TYPE[defn.achievement_type](db, user_id)


# ---------- unlock check ---------------------------------------------------


def _existing_keys(db: Session, user_id: uuid.UUID) -> set[str]:
    rows = db.scalars(
        select(UserAchievement.achievement_key).where(
            UserAchievement.user_id == user_id
        )
    ).all()
    return set(rows)


def check_after_task_complete(
    db: Session, user_id: uuid.UUID
) -> list[AchievementDef]:
    """Run every catalog entry's check; insert UserAchievement rows for any
    new unlocks. Returns the catalog entries that were just unlocked
    (handy for emitting notifications later).

    Caller is expected to commit. The function does not commit itself so
    it composes cleanly inside `complete_task`'s transaction.
    """
    already = _existing_keys(db, user_id)
    new_unlocks: list[AchievementDef] = []

    for defn in ACHIEVEMENTS:
        if defn.key in already:
            continue
        progress = compute_progress(db, user_id, defn)
        if progress >= defn.target:
            db.add(
                UserAchievement(
                    user_id=user_id,
                    achievement_key=defn.key,
                )
            )
            new_unlocks.append(defn)

    return new_unlocks


# ---------- read endpoint --------------------------------------------------


def list_for_user(db: Session, user_id: uuid.UUID) -> AchievementList:
    """Build the full achievement list with progress + unlocked status."""
    unlocked_rows = list(
        db.scalars(
            select(UserAchievement).where(UserAchievement.user_id == user_id)
        )
    )
    unlocked_map = {r.achievement_key: r for r in unlocked_rows}

    items: list[AchievementRead] = []
    for defn in ACHIEVEMENTS:
        row = unlocked_map.get(defn.key)
        progress = (
            defn.target if row is not None else compute_progress(db, user_id, defn)
        )
        items.append(
            AchievementRead(
                key=defn.key,
                name=defn.name,
                description=defn.description,
                icon=defn.icon,
                achievement_type=defn.achievement_type,
                target=defn.target,
                progress=min(progress, defn.target),
                unlocked=row is not None,
                unlocked_at=row.unlocked_at if row is not None else None,
            )
        )
    return AchievementList(
        items=items, unlocked_count=len(unlocked_rows), total=len(ACHIEVEMENTS)
    )
