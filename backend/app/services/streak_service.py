"""Streak calculation — pure functions, no DB access.

Streak rules (CLAUDE.md and Grup 2 spec):
  * Same calendar day, already active → no change.
  * Previous calendar day → streak increments by one.
  * Older or never → streak resets to 1.
  * Date math uses UTC for the MVP single-user case. When multi-tenant
    arrives, pass the user's timezone-adjusted date instead.
"""

from dataclasses import dataclass
from datetime import date, timedelta


@dataclass(frozen=True)
class StreakResult:
    """Outcome of running a completion through the streak rules."""

    new_streak: int
    new_last_active_date: date
    # True iff the streak just incremented (so XP gets the streak-day bonus).
    bumped: bool


def apply_completion(
    current_streak: int,
    last_active_date: date | None,
    today: date,
) -> StreakResult:
    """Compute the updated streak after completing a task on `today`.

    The function is total and idempotent for same-day repeats: completing a
    second task on a day where the streak already advanced is a no-op.
    """
    if last_active_date is None:
        return StreakResult(new_streak=1, new_last_active_date=today, bumped=True)

    if last_active_date == today:
        return StreakResult(
            new_streak=current_streak,
            new_last_active_date=today,
            bumped=False,
        )

    if last_active_date == today - timedelta(days=1):
        return StreakResult(
            new_streak=current_streak + 1,
            new_last_active_date=today,
            bumped=True,
        )

    # Gap >= 2 days — streak broken, restart at 1.
    return StreakResult(new_streak=1, new_last_active_date=today, bumped=True)


def updated_longest(current_longest: int, new_streak: int) -> int:
    """Tracks the user's all-time best; never regresses."""
    return max(current_longest, new_streak)
