"""DailyPoolItem — one slot in a user's morning ritual pool."""

import uuid
from datetime import date
from typing import TYPE_CHECKING

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    Date,
    Enum,
    ForeignKey,
    Integer,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDPrimaryKeyMixin
from app.models.enums import PoolReason

if TYPE_CHECKING:
    from app.models.task import Task


class DailyPoolItem(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "daily_pool_items"
    __table_args__ = (
        UniqueConstraint("user_id", "date", "ordering", name="uq_daily_pool_items_slot"),
        CheckConstraint("ordering BETWEEN 1 AND 5", name="ck_daily_pool_items_slot_range"),
    )

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    date: Mapped[date] = mapped_column(Date, nullable=False)
    ordering: Mapped[int] = mapped_column(Integer, nullable=False)
    reason: Mapped[PoolReason] = mapped_column(
        Enum(PoolReason, name="pool_reason"), nullable=False
    )
    task_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("tasks.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    approved: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    skipped: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    task: Mapped["Task"] = relationship()
