"""Vision model — the long-term aspirations."""

import uuid
from datetime import date
from typing import TYPE_CHECKING

from sqlalchemy import Date, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.associations import vision_areas, vision_projects
from app.models.base import Base, TimestampMixin, UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    from app.models.area import Area
    from app.models.project import Project


class Vision(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "visions"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    image_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    target_date: Mapped[date | None] = mapped_column(Date, nullable=True)

    areas: Mapped[list["Area"]] = relationship(
        secondary=vision_areas,
        back_populates="visions",
    )
    # Directly-linked backing projects. Vibrance is pulled toward the avg
    # progress of these so the pin physically reacts to forward motion.
    projects: Mapped[list["Project"]] = relationship(
        secondary=vision_projects,
    )
