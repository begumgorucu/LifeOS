"""User model."""

from datetime import date, time

from sqlalchemy import Boolean, Date, Integer, String, Time
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin, UUIDPrimaryKeyMixin


class User(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "users"

    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    locale: Mapped[str] = mapped_column(String(10), nullable=False, default="tr")
    theme: Mapped[str] = mapped_column(String(20), nullable=False, default="system")
    password_hash: Mapped[str | None] = mapped_column(String(255), nullable=True)

    # Gamification — all system-managed, never set directly by the user via API.
    streak_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    streak_last_active_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    longest_streak: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    xp: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    level: Mapped[int] = mapped_column(Integer, nullable=False, default=1)

    # Notification preferences — user-controllable via PATCH /me.
    notif_daily_reminder_enabled: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=True
    )
    notif_daily_reminder_time: Mapped[time] = mapped_column(
        Time, nullable=False, default=time(7, 30)
    )
    notif_neglect_warnings_enabled: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=True
    )
    notif_streak_risk_enabled: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=True
    )
    notif_email_weekly_enabled: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False
    )
    notif_push_enabled: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=True
    )
