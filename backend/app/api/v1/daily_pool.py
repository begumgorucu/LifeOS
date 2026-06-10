"""Daily Pool endpoints."""

import uuid

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user_id
from app.api.errors import APIError
from app.core.db import get_db
from app.schemas.daily_pool import (
    DailyPoolBundle,
    DailyPoolItemRead,
    DailyPoolReplace,
)
from app.services import daily_pool_service

router = APIRouter(prefix="/daily-pool", tags=["daily-pool"])


def _not_found() -> APIError:
    return APIError(
        code="POOL_ITEM_NOT_FOUND",
        message="Pool item not found.",
        status_code=status.HTTP_404_NOT_FOUND,
    )


@router.get("", response_model=DailyPoolBundle)
def get_today_pool(
    db: Session = Depends(get_db),
    user_id: uuid.UUID = Depends(get_current_user_id),
) -> DailyPoolBundle:
    """Today's pool — empty if nothing has been generated yet."""
    return daily_pool_service.get_today(db, user_id)


@router.post("/generate", response_model=DailyPoolBundle)
def generate_pool(
    force: bool = Query(default=False, description="Wipe and recompute today's slots"),
    db: Session = Depends(get_db),
    user_id: uuid.UUID = Depends(get_current_user_id),
) -> DailyPoolBundle:
    """Idempotent: returns existing pool if present; otherwise creates one.
    Pass `?force=true` to discard the existing pool and regenerate."""
    return daily_pool_service.generate_today(db, user_id, force=force)


@router.post("/{item_id}/approve", response_model=DailyPoolItemRead)
def approve_item(
    item_id: uuid.UUID,
    db: Session = Depends(get_db),
    user_id: uuid.UUID = Depends(get_current_user_id),
) -> DailyPoolItemRead:
    item = daily_pool_service.approve_item(db, user_id, item_id)
    if item is None:
        raise _not_found()
    return item


@router.post("/{item_id}/skip", response_model=DailyPoolItemRead)
def skip_item(
    item_id: uuid.UUID,
    db: Session = Depends(get_db),
    user_id: uuid.UUID = Depends(get_current_user_id),
) -> DailyPoolItemRead:
    item = daily_pool_service.skip_item(db, user_id, item_id)
    if item is None:
        raise _not_found()
    return item


@router.post("/{item_id}/replace", response_model=DailyPoolItemRead)
def replace_item(
    item_id: uuid.UUID,
    payload: DailyPoolReplace,
    db: Session = Depends(get_db),
    user_id: uuid.UUID = Depends(get_current_user_id),
) -> DailyPoolItemRead:
    item = daily_pool_service.replace_item(db, user_id, item_id, payload.task_id)
    if item is None:
        raise _not_found()
    return item
