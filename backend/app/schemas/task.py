"""Pydantic schemas for Task endpoints."""

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import TaskPriority, TaskStatus
from app.schemas.common import AreaSummary, ProjectSummary, TaskSummary


class TaskBase(BaseModel):
    """Common writable fields."""

    title: str = Field(min_length=1, max_length=200)
    description: str | None = None
    due_at: datetime | None = None
    priority: TaskPriority = TaskPriority.medium


class TaskCreate(TaskBase):
    """Payload for POST /tasks. Area is required; project optional.
    Initial dependencies can be supplied in one shot."""

    area_id: uuid.UUID
    project_id: uuid.UUID | None = None
    depends_on_ids: list[uuid.UUID] = Field(default_factory=list)


class TaskUpdate(BaseModel):
    """PATCH payload. `status` is excluded — use /complete /skip /reopen.
    `depends_on_ids = None` means "don't touch dependencies"; `[]` clears them."""

    title: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = None
    due_at: datetime | None = None
    priority: TaskPriority | None = None
    area_id: uuid.UUID | None = None
    project_id: uuid.UUID | None = None
    depends_on_ids: list[uuid.UUID] | None = None


class TaskRead(BaseModel):
    """Task response shape — enriched with relationships so UI can render
    without follow-up requests."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    user_id: uuid.UUID
    area_id: uuid.UUID
    project_id: uuid.UUID | None
    title: str
    description: str | None
    status: TaskStatus
    priority: TaskPriority
    due_at: datetime | None
    completed_at: datetime | None
    created_at: datetime
    updated_at: datetime

    # Enrichment
    area: AreaSummary
    project: ProjectSummary | None
    depends_on: list[TaskSummary]
    # True iff any dependency is not yet done — UI uses this to dim/disable.
    is_blocked: bool


class PaginatedTasks(BaseModel):
    items: list[TaskRead]
    total: int
    limit: int
    offset: int
