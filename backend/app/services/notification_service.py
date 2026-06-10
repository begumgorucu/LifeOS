"""Notification feed — emit, list, mark-read.

`emit` is the only function call sites need. It checks the user's
preferences before inserting; suppressed events return None silently so
callers don't have to wrap with conditionals.

Caller is responsible for `db.commit()` so emit composes inside larger
transactions (the entire `complete_task` runs under one commit).
"""

import uuid
from datetime import UTC, datetime

from sqlalchemy import func, select, update
from sqlalchemy.orm import Session

from app.models.enums import NotificationType
from app.models.notification import Notification
from app.models.user import User
from app.schemas.notification import NotificationList, NotificationRead


def _utcnow() -> datetime:
    return datetime.now(UTC)


# ---- preference gating -----------------------------------------------------


def _is_allowed(user: User, ntype: NotificationType) -> bool:
    """Map a notification type to the user's matching toggle.

    Types that don't have a dedicated toggle (achievement, dependency,
    streak success) are always allowed when push is on — they're the
    "celebrations" the spec calls out as never noisy.
    """
    if not user.notif_push_enabled:
        return False
    if ntype is NotificationType.daily_reminder:
        return user.notif_daily_reminder_enabled
    if ntype is NotificationType.neglect_warning:
        return user.notif_neglect_warnings_enabled
    if ntype is NotificationType.score_critical:
        # Spec names the toggle "streak_risk_enabled"; it maps to the
        # broader "your progress is at risk" alert family.
        return user.notif_streak_risk_enabled
    return True


# ---- public service API ----------------------------------------------------


def emit(  # noqa: PLR0913 — explicit kwargs read better at the call site
    db: Session,
    user_id: uuid.UUID,
    notification_type: NotificationType,
    title: str,
    *,
    body: str | None = None,
    icon: str | None = None,
    area_id: uuid.UUID | None = None,
    task_id: uuid.UUID | None = None,
    link_to: str | None = None,
) -> Notification | None:
    user = db.scalar(select(User).where(User.id == user_id))
    if user is None or not _is_allowed(user, notification_type):
        return None
    notif = Notification(
        user_id=user_id,
        notification_type=notification_type,
        title=title,
        body=body,
        icon=icon,
        area_id=area_id,
        task_id=task_id,
        link_to=link_to,
    )
    db.add(notif)
    return notif


def list_for_user(
    db: Session,
    user_id: uuid.UUID,
    limit: int,
    offset: int,
    unread_only: bool = False,
) -> NotificationList:
    base = select(Notification).where(Notification.user_id == user_id)
    if unread_only:
        base = base.where(Notification.is_read.is_(False))

    total_stmt = select(func.count(Notification.id)).where(
        Notification.user_id == user_id
    )
    if unread_only:
        total_stmt = total_stmt.where(Notification.is_read.is_(False))
    total = db.scalar(total_stmt) or 0

    unread_count = (
        db.scalar(
            select(func.count(Notification.id)).where(
                Notification.user_id == user_id, Notification.is_read.is_(False)
            )
        )
        or 0
    )

    items = list(
        db.scalars(
            base.order_by(Notification.created_at.desc()).limit(limit).offset(offset)
        )
    )
    return NotificationList(
        items=[NotificationRead.model_validate(n) for n in items],
        total=total,
        unread_count=unread_count,
        limit=limit,
        offset=offset,
    )


def unread_count(db: Session, user_id: uuid.UUID) -> int:
    return (
        db.scalar(
            select(func.count(Notification.id)).where(
                Notification.user_id == user_id, Notification.is_read.is_(False)
            )
        )
        or 0
    )


def mark_read(
    db: Session, user_id: uuid.UUID, notification_id: uuid.UUID
) -> Notification | None:
    notif = db.scalar(
        select(Notification).where(
            Notification.id == notification_id, Notification.user_id == user_id
        )
    )
    if notif is None:
        return None
    if not notif.is_read:
        notif.is_read = True
        notif.read_at = _utcnow()
        db.commit()
    return notif


def mark_all_read(db: Session, user_id: uuid.UUID) -> int:
    """Mark every unread notification read. Returns the number updated."""
    result = db.execute(
        update(Notification)
        .where(Notification.user_id == user_id, Notification.is_read.is_(False))
        .values(is_read=True, read_at=_utcnow())
    )
    db.commit()
    return result.rowcount or 0
