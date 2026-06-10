"""Shared summary schemas used inside multiple read responses.

These exist as a separate module to avoid circular imports between
Area, Vision, Task and Project schemas — each can pull from `common`
without importing the others.
"""

import uuid

from pydantic import BaseModel, ConfigDict

from app.models.enums import TaskStatus


class AreaSummary(BaseModel):
    """Minimal area reference embedded inside VisionRead, TaskRead, ProjectRead."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    icon: str | None
    health_score: int


class VisionSummary(BaseModel):
    """Minimal vision reference embedded inside AreaRead."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    title: str


class TaskSummary(BaseModel):
    """Minimal task reference used in dependency lists."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    title: str
    status: TaskStatus


class ProjectSummary(BaseModel):
    """Minimal project reference embedded inside TaskRead."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    title: str
