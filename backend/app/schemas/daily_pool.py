"""Pydantic schemas for the Daily Pool endpoints."""

import uuid
from datetime import date, datetime

from pydantic import BaseModel, ConfigDict

from app.models.enums import PoolReason
from app.schemas.common import AreaSummary
from app.schemas.task import TaskRead


class DailyPoolItemRead(BaseModel):
    """One slot in today's pool, with the underlying task fully embedded
    so the frontend doesn't need a separate /tasks/{id} round-trip."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    user_id: uuid.UUID
    date: date
    ordering: int
    reason: PoolReason
    approved: bool
    skipped: bool
    created_at: datetime
    updated_at: datetime

    task: TaskRead


class DailyPoolBundle(BaseModel):
    """Today's pool — the entire morning ritual in one payload."""

    date: date
    items: list[DailyPoolItemRead]
    # Quick rollups for the UI's progress chip.
    total_slots: int
    approved_count: int
    skipped_count: int
    # True iff a pool already existed when the client called generate;
    # false the first time we created it for this day.
    pre_existing: bool = False


class DailyPoolReplace(BaseModel):
    """PATCH body for /daily-pool/{id}/replace — swap to a different task
    the user already owns."""

    task_id: uuid.UUID


class AreaCompletionPoint(BaseModel):
    """Single sample inside a trend series."""

    date: date
    health_score: int


class AreaTrendSeries(BaseModel):
    """One area's score over time. `data_points` may be sparse; UI
    interpolates between."""

    area: AreaSummary
    data_points: list[AreaCompletionPoint]
