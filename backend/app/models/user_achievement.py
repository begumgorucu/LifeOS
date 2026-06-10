"""UserAchievement — sparse, append-only table of unlocks."""

import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, UUIDPrimaryKeyMixin


class UserAchievement(UUIDPrimaryKeyMixin, Base):
    """One row per (user, achievement_key). Insert-only; never updated."""

    __tablename__ = "user_achievements"
    __table_args__ = (
        UniqueConstraint(
            "user_id", "achievement_key", name="uq_user_achievements_user_key"
        ),
    )

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    achievement_key: Mapped[str] = mapped_column(String(50), nullable=False)
    unlocked_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
