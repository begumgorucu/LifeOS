"""Daily activity log upserts.

Per Grup 2 spec: each completed task increments today's row; each reopen
decrements the row for the *original completion day*. Rows whose count
reaches zero are deleted so the heatmap stays sparse.
"""

import uuid
from datetime import date

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.daily_activity_log import DailyActivityLog


def _get_row(
    db: Session, user_id: uuid.UUID, day: date
) -> DailyActivityLog | None:
    return db.scalar(
        select(DailyActivityLog).where(
            DailyActivityLog.user_id == user_id,
            DailyActivityLog.date == day,
        )
    )


def increment(db: Session, user_id: uuid.UUID, day: date) -> None:
    """Add one to today's activity log row, creating it if missing.

    Caller is expected to commit. Function does NOT commit on its own so it
    composes cleanly inside larger transactions (e.g. complete_task).
    """
    row = _get_row(db, user_id, day)
    if row is None:
        row = DailyActivityLog(user_id=user_id, date=day, tasks_completed=1)
        db.add(row)
    else:
        row.tasks_completed += 1


def decrement(db: Session, user_id: uuid.UUID, day: date) -> None:
    """Subtract one from a day's log row; delete it if the count hits zero.

    Silently no-ops when there's nothing to decrement — reopening a task
    whose completion was never logged (e.g. data imported before this
    feature shipped) shouldn't error out.
    """
    row = _get_row(db, user_id, day)
    if row is None:
        return
    if row.tasks_completed <= 1:
        db.delete(row)
    else:
        row.tasks_completed -= 1
