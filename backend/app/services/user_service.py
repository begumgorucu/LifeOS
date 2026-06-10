"""User /me operations + read-side enrichment with gamification math."""

import uuid

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.user import User
from app.schemas.user import UserRead, UserUpdate
from app.services import xp_service


def get_user(db: Session, user_id: uuid.UUID) -> User | None:
    return db.scalar(select(User).where(User.id == user_id))


def update_user(
    db: Session, user_id: uuid.UUID, payload: UserUpdate
) -> User | None:
    user = get_user(db, user_id)
    if user is None:
        return None
    data = payload.model_dump(exclude_unset=True)
    for field, value in data.items():
        setattr(user, field, value)
    db.commit()
    db.refresh(user)
    return user


def to_user_read(user: User) -> UserRead:
    """Convert a User ORM object into a UserRead, computing the level title
    and remaining XP for the UI's progress chip."""
    return UserRead(
        id=user.id,
        email=user.email,
        name=user.name,
        locale=user.locale,
        theme=user.theme,
        created_at=user.created_at,
        updated_at=user.updated_at,
        streak_count=user.streak_count,
        streak_last_active_date=user.streak_last_active_date,
        longest_streak=user.longest_streak,
        xp=user.xp,
        level=user.level,
        level_name=xp_service.level_name(user.level),
        xp_to_next_level=xp_service.xp_to_next_level(user.xp),
        notif_daily_reminder_enabled=user.notif_daily_reminder_enabled,
        notif_daily_reminder_time=user.notif_daily_reminder_time,
        notif_neglect_warnings_enabled=user.notif_neglect_warnings_enabled,
        notif_streak_risk_enabled=user.notif_streak_risk_enabled,
        notif_email_weekly_enabled=user.notif_email_weekly_enabled,
        notif_push_enabled=user.notif_push_enabled,
    )
