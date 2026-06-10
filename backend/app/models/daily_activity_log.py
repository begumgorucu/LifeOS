"""DailyActivityLog — one row per (user, date) capturing completion volume."""

import uuid
from datetime import date

from sqlalchemy import Date, ForeignKey, Integer, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin, UUIDPrimaryKeyMixin


class DailyActivityLog(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "daily_activity_logs"
    __table_args__ = (
        UniqueConstraint("user_id", "date", name="uq_daily_activity_logs_user_date"),
    )

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    tasks_completed: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
