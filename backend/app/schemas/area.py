"""Pydantic schemas for Area endpoints."""

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.common import VisionSummary


class AreaBase(BaseModel):
    """Fields a user may set when creating or updating an Area."""

    name: str = Field(min_length=1, max_length=120)
    description: str | None = None
    icon: str | None = Field(default=None, max_length=50)
    color: str | None = Field(default=None, max_length=20)


class AreaCreate(AreaBase):
    """Payload accepted on POST /areas. health_score is system-managed."""


class AreaUpdate(BaseModel):
    """Payload for PATCH /areas/{id}. All fields optional; health_score excluded
    on purpose — the score reflects activity, not user input."""

    name: str | None = Field(default=None, min_length=1, max_length=120)
    description: str | None = None
    icon: str | None = Field(default=None, max_length=50)
    color: str | None = Field(default=None, max_length=20)


class AreaRead(BaseModel):
    """Area as returned from any read endpoint."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    description: str | None
    icon: str | None
    color: str | None
    health_score: int
    last_activity_at: datetime | None
    is_neglected: bool
    created_at: datetime
    updated_at: datetime

    # Enrichment populated by area_service.to_area_read
    tasks_count: int
    projects_count: int
    visions: list[VisionSummary]


class PaginatedAreas(BaseModel):
    """Wrapper for list endpoints — includes total for pagination UIs."""

    items: list[AreaRead]
    total: int
    limit: int
    offset: int
