"""Health score calculation — pure functions, no DB access.

All gameplay numbers live here as module-level constants so they can be tuned
in a single place. The functions take primitives in and return primitives out,
which makes them trivial to unit-test without a database.
"""

from datetime import datetime

from app.models.enums import TaskPriority

# Score range
SCORE_MIN: int = 0
SCORE_MAX: int = 100
SCORE_DEFAULT: int = 70

# Decay (CLAUDE.md §6.3): score drops Y points per day of inactivity.
# 4/day means a fresh area (70) crosses the neglect threshold (30) at day 10.
DAILY_DECAY: int = 4

# Neglect thresholds (CLAUDE.md §6.2)
NEGLECT_SCORE_THRESHOLD: int = 30
NEGLECT_DAYS_THRESHOLD: int = 7

# Task-completion bonuses, applied to the area's score when a task is marked done.
PRIORITY_BONUS: dict[TaskPriority, int] = {
    TaskPriority.low: 2,
    TaskPriority.medium: 5,
    TaskPriority.high: 10,
}


def _clamp(score: int) -> int:
    return max(SCORE_MIN, min(SCORE_MAX, score))


def compute_decayed_score(
    current_score: int,
    last_activity_at: datetime | None,
    now: datetime,
) -> int:
    """Return the score after applying inactivity decay up to `now`.

    If the area has never had any activity, no decay is applied — we don't punish
    a freshly created area.
    """
    if last_activity_at is None:
        return _clamp(current_score)

    days_idle = (now - last_activity_at).days
    if days_idle <= 0:
        return _clamp(current_score)

    return _clamp(current_score - days_idle * DAILY_DECAY)


def bump_score_for_task(current_score: int, priority: TaskPriority) -> int:
    """Return the score after adding the task-completion bonus for `priority`."""
    bonus = PRIORITY_BONUS[priority]
    return _clamp(current_score + bonus)


def is_neglected(
    health_score: int,
    last_activity_at: datetime | None,
    now: datetime,
) -> bool:
    """An area is neglected if its score is too low or it has been idle too long.

    Either condition alone triggers the warning (CLAUDE.md §6.2).
    """
    if health_score < NEGLECT_SCORE_THRESHOLD:
        return True
    if last_activity_at is not None and (now - last_activity_at).days >= NEGLECT_DAYS_THRESHOLD:
        return True
    return False
