"""AreaHealthSnapshot — sparse per-day health record for trend queries."""

import uuid
from datetime import date

from sqlalchemy import (
    CheckConstraint,
    Date,
    ForeignKey,
    Integer,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin, UUIDPrimaryKeyMixin


class AreaHealthSnapshot(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """One row per (area, date). Written by task_service whenever an area's
    score changes; never backfilled retroactively. Frontend interpolates
    gaps between snapshots."""

    __tablename__ = "area_health_snapshots"
    __table_args__ = (
        UniqueConstraint("area_id", "date", name="uq_area_health_snapshots_area_date"),
        CheckConstraint(
            "health_score BETWEEN 0 AND 100",
            name="ck_area_health_snapshots_score_range",
        ),
    )

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    area_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("areas.id", ondelete="CASCADE"),
        nullable=False,
    )
    date: Mapped[date] = mapped_column(Date, nullable=False)
    health_score: Mapped[int] = mapped_column(Integer, nullable=False)
