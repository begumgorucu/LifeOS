"""Pydantic schemas for User (/me) endpoints."""

import uuid
from datetime import date, datetime, time

from pydantic import BaseModel, ConfigDict, Field


class UserUpdate(BaseModel):
    """PATCH /me — only fields the user is allowed to edit.

    Gamification state (streak, xp, level, etc.) is system-managed and
    deliberately excluded from this schema; clients can't tamper with it.
    Notification preferences ARE editable.
    """

    name: str | None = Field(default=None, min_length=1, max_length=120)
    locale: str | None = Field(default=None, min_length=2, max_length=10)
    theme: str | None = Field(default=None, min_length=1, max_length=20)

    notif_daily_reminder_enabled: bool | None = None
    notif_daily_reminder_time: time | None = None
    notif_neglect_warnings_enabled: bool | None = None
    notif_streak_risk_enabled: bool | None = None
    notif_email_weekly_enabled: bool | None = None
    notif_push_enabled: bool | None = None


class UserRead(BaseModel):
    """Full user payload returned from /me. Includes computed level metadata
    so the UI doesn't need to mirror the XP curve."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    email: str
    name: str
    locale: str
    theme: str
    created_at: datetime
    updated_at: datetime

    # Gamification — system-managed.
    streak_count: int
    streak_last_active_date: date | None
    longest_streak: int
    xp: int
    level: int

    # Derived for the UI (sidebar chip + dashboard progress bar).
    level_name: str
    xp_to_next_level: int

    # Notification preferences — surfaced on the Settings page.
    notif_daily_reminder_enabled: bool
    notif_daily_reminder_time: time
    notif_neglect_warnings_enabled: bool
    notif_streak_risk_enabled: bool
    notif_email_weekly_enabled: bool
    notif_push_enabled: bool
