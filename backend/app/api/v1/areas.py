"""Areas endpoints."""

import uuid

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user_id
from app.api.errors import APIError
from app.core.db import get_db
from app.schemas.area import AreaCreate, AreaRead, AreaUpdate, PaginatedAreas
from app.services import area_service

router = APIRouter(prefix="/areas", tags=["areas"])


def _not_found() -> APIError:
    return APIError(
        code="AREA_NOT_FOUND",
        message="Area not found.",
        status_code=status.HTTP_404_NOT_FOUND,
    )


@router.get("", response_model=PaginatedAreas)
def list_areas(
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
    user_id: uuid.UUID = Depends(get_current_user_id),
) -> PaginatedAreas:
    items, total = area_service.list_areas(db, user_id, limit, offset)
    return PaginatedAreas(
        items=[area_service.to_area_read(db, a) for a in items],
        total=total,
        limit=limit,
        offset=offset,
    )


@router.get("/{area_id}", response_model=AreaRead)
def get_area(
    area_id: uuid.UUID,
    db: Session = Depends(get_db),
    user_id: uuid.UUID = Depends(get_current_user_id),
) -> AreaRead:
    area = area_service.get_area(db, user_id, area_id)
    if area is None:
        raise _not_found()
    return area_service.to_area_read(db, area)


@router.post("", response_model=AreaRead, status_code=status.HTTP_201_CREATED)
def create_area(
    payload: AreaCreate,
    db: Session = Depends(get_db),
    user_id: uuid.UUID = Depends(get_current_user_id),
) -> AreaRead:
    area = area_service.create_area(db, user_id, payload)
    return area_service.to_area_read(db, area)


@router.patch("/{area_id}", response_model=AreaRead)
def update_area(
    area_id: uuid.UUID,
    payload: AreaUpdate,
    db: Session = Depends(get_db),
    user_id: uuid.UUID = Depends(get_current_user_id),
) -> AreaRead:
    area = area_service.update_area(db, user_id, area_id, payload)
    if area is None:
        raise _not_found()
    return area_service.to_area_read(db, area)


@router.delete("/{area_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_area(
    area_id: uuid.UUID,
    db: Session = Depends(get_db),
    user_id: uuid.UUID = Depends(get_current_user_id),
) -> None:
    if not area_service.delete_area(db, user_id, area_id):
        raise _not_found()


@router.post("/{area_id}/recompute-health", response_model=AreaRead)
def recompute_health(
    area_id: uuid.UUID,
    db: Session = Depends(get_db),
    user_id: uuid.UUID = Depends(get_current_user_id),
) -> AreaRead:
    """Manually trigger inactivity decay for an area.

    Temporary endpoint — to be replaced by a scheduled job in Adım 9.
    """
    area = area_service.recompute_health(db, user_id, area_id)
    if area is None:
        raise _not_found()
    return area_service.to_area_read(db, area)
