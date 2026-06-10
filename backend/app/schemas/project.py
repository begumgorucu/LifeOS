"""Pydantic schemas for Project endpoints."""

import uuid
from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import ProjectStatus
from app.schemas.common import AreaSummary


class ProjectBase(BaseModel):
    """Common writable fields."""

    title: str = Field(min_length=1, max_length=200)
    description: str | None = None
    target_date: date | None = None


class ProjectCreate(ProjectBase):
    """Payload accepted on POST /projects. Area must already exist and belong
    to the current user — verified in the service layer."""

    area_id: uuid.UUID


class ProjectUpdate(BaseModel):
    """PATCH payload — all optional. `progress` is excluded on purpose (auto-
    computed from task completions), but `status` IS accepted so the user can
    archive or mark complete."""

    title: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = None
    target_date: date | None = None
    area_id: uuid.UUID | None = None  # rare: moving a project to a different area
    status: ProjectStatus | None = None


class ProjectRead(BaseModel):
    """Project response shape. Includes computed task counts and the parent
    area summary so the UI doesn't have to make a second request."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    user_id: uuid.UUID
    area_id: uuid.UUID
    title: str
    description: str | None
    status: ProjectStatus
    progress: int
    target_date: date | None
    completed_at: datetime | None
    created_at: datetime
    updated_at: datetime

    # Enrichment
    area: AreaSummary
    tasks_total: int
    tasks_done: int


class PaginatedProjects(BaseModel):
    items: list[ProjectRead]
    total: int
    limit: int
    offset: int
