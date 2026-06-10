"""Current-user endpoints (/me).

During MVP `current_user_id` is the fixed seed user; in Adım 10 this
endpoint becomes the natural place to read the JWT'd identity.
"""

import uuid

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user_id
from app.api.errors import APIError
from app.core.db import get_db
from app.schemas.export import ExportBundle
from app.schemas.user import UserRead, UserUpdate
from app.services import export_service, user_service

router = APIRouter(prefix="/me", tags=["me"])


def _not_found() -> APIError:
    return APIError(
        code="USER_NOT_FOUND",
        message="Current user not found.",
        status_code=status.HTTP_404_NOT_FOUND,
    )


@router.get("", response_model=UserRead)
def read_me(
    db: Session = Depends(get_db),
    user_id: uuid.UUID = Depends(get_current_user_id),
) -> UserRead:
    user = user_service.get_user(db, user_id)
    if user is None:
        raise _not_found()
    return user_service.to_user_read(user)


@router.patch("", response_model=UserRead)
def update_me(
    payload: UserUpdate,
    db: Session = Depends(get_db),
    user_id: uuid.UUID = Depends(get_current_user_id),
) -> UserRead:
    user = user_service.update_user(db, user_id, payload)
    if user is None:
        raise _not_found()
    return user_service.to_user_read(user)


@router.get("/export", response_model=ExportBundle)
def export_my_data(
    db: Session = Depends(get_db),
    user_id: uuid.UUID = Depends(get_current_user_id),
) -> ExportBundle:
    """Full account snapshot — areas, projects, tasks, visions, achievements."""
    return export_service.build(db, user_id)
