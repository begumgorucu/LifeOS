"""Stats endpoints."""

import uuid

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.deps import get_current_user_id
from app.core.db import get_db
from app.schemas.stats import (
    StatsHeatmap,
    StatsSummary,
    StatsTopPerformers,
    StatsTrend,
)
from app.services import stats_service

router = APIRouter(prefix="/stats", tags=["stats"])


@router.get("/summary", response_model=StatsSummary)
def get_summary(
    db: Session = Depends(get_db),
    user_id: uuid.UUID = Depends(get_current_user_id),
) -> StatsSummary:
    return stats_service.summary(db, user_id)


@router.get("/trend", response_model=StatsTrend)
def get_trend(
    days: int = Query(default=30, ge=7, le=365),
    db: Session = Depends(get_db),
    user_id: uuid.UUID = Depends(get_current_user_id),
) -> StatsTrend:
    return stats_service.trend(db, user_id, days)


@router.get("/heatmap", response_model=StatsHeatmap)
def get_heatmap(
    weeks: int = Query(default=16, ge=1, le=52),
    db: Session = Depends(get_db),
    user_id: uuid.UUID = Depends(get_current_user_id),
) -> StatsHeatmap:
    return stats_service.heatmap(db, user_id, weeks)


@router.get("/top-performers", response_model=StatsTopPerformers)
def get_top_performers(
    days: int = Query(default=30, ge=7, le=365),
    limit: int = Query(default=3, ge=1, le=10),
    db: Session = Depends(get_db),
    user_id: uuid.UUID = Depends(get_current_user_id),
) -> StatsTopPerformers:
    return stats_service.top_performers(db, user_id, days, limit)
