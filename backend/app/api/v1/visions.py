"""Visions endpoints."""

import uuid

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user_id
from app.api.errors import APIError
from app.core.db import get_db
from app.schemas.vision import (
    PaginatedVisions,
    VisionCreate,
    VisionRead,
    VisionUpdate,
)
from app.services import vision_service

router = APIRouter(prefix="/visions", tags=["visions"])


def _not_found() -> APIError:
    return APIError(
        code="VISION_NOT_FOUND",
        message="Vision not found.",
        status_code=status.HTTP_404_NOT_FOUND,
    )


@router.get("", response_model=PaginatedVisions)
def list_visions(
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    area_id: uuid.UUID | None = Query(default=None),
    db: Session = Depends(get_db),
    user_id: uuid.UUID = Depends(get_current_user_id),
) -> PaginatedVisions:
    items, total = vision_service.list_visions(db, user_id, limit, offset, area_id=area_id)
    return PaginatedVisions(
        items=[vision_service.to_vision_read(v) for v in items],
        total=total,
        limit=limit,
        offset=offset,
    )


@router.get("/{vision_id}", response_model=VisionRead)
def get_vision(
    vision_id: uuid.UUID,
    db: Session = Depends(get_db),
    user_id: uuid.UUID = Depends(get_current_user_id),
) -> VisionRead:
    vision = vision_service.get_vision(db, user_id, vision_id)
    if vision is None:
        raise _not_found()
    return vision_service.to_vision_read(vision)


@router.post("", response_model=VisionRead, status_code=status.HTTP_201_CREATED)
def create_vision(
    payload: VisionCreate,
    db: Session = Depends(get_db),
    user_id: uuid.UUID = Depends(get_current_user_id),
) -> VisionRead:
    vision = vision_service.create_vision(db, user_id, payload)
    return vision_service.to_vision_read(vision)


@router.patch("/{vision_id}", response_model=VisionRead)
def update_vision(
    vision_id: uuid.UUID,
    payload: VisionUpdate,
    db: Session = Depends(get_db),
    user_id: uuid.UUID = Depends(get_current_user_id),
) -> VisionRead:
    vision = vision_service.update_vision(db, user_id, vision_id, payload)
    if vision is None:
        raise _not_found()
    return vision_service.to_vision_read(vision)


@router.delete("/{vision_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_vision(
    vision_id: uuid.UUID,
    db: Session = Depends(get_db),
    user_id: uuid.UUID = Depends(get_current_user_id),
) -> None:
    if not vision_service.delete_vision(db, user_id, vision_id):
        raise _not_found()
