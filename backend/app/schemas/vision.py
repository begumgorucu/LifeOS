"""Pydantic schemas for Vision endpoints."""

import uuid
from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.common import AreaSummary, ProjectSummary


class VisionBase(BaseModel):
    """Common writable fields."""

    title: str = Field(min_length=1, max_length=200)
    description: str | None = None
    image_url: str | None = Field(default=None, max_length=500)
    target_date: date | None = None


class VisionCreate(VisionBase):
    """Areas and projects to link at create time; either list may be empty."""

    area_ids: list[uuid.UUID] = Field(default_factory=list)
    project_ids: list[uuid.UUID] = Field(default_factory=list)


class VisionUpdate(BaseModel):
    """PATCH payload. For each link list: `None` = leave alone,
    `[]` = clear, `[...]` = replace entirely."""

    title: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = None
    image_url: str | None = Field(default=None, max_length=500)
    target_date: date | None = None
    area_ids: list[uuid.UUID] | None = None
    project_ids: list[uuid.UUID] | None = None


class VisionRead(BaseModel):
    """Vision response — includes linked areas, linked backing projects,
    and a derived `vibrance` (0..100). Vibrance drives the fade effect on
    the pin: as you make progress on a linked project (or keep its area
    healthy), the pin gets visibly brighter."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    user_id: uuid.UUID
    title: str
    description: str | None
    image_url: str | None
    target_date: date | None
    created_at: datetime
    updated_at: datetime

    # Enrichment
    areas: list[AreaSummary]
    projects: list[ProjectSummary]
    # Combined score: avg(area health) + avg(linked project progress).
    # Defaults to 70 when nothing is linked — feels neutral, not alarming.
    vibrance: int


class PaginatedVisions(BaseModel):
    items: list[VisionRead]
    total: int
    limit: int
    offset: int
