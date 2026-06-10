"""Notifications endpoints."""

import uuid

from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user_id
from app.api.errors import APIError
from app.core.db import get_db
from app.schemas.notification import (
    NotificationList,
    NotificationRead,
    UnreadCount,
)
from app.services import notification_service

router = APIRouter(prefix="/notifications", tags=["notifications"])


def _not_found() -> APIError:
    return APIError(
        code="NOTIFICATION_NOT_FOUND",
        message="Notification not found.",
        status_code=status.HTTP_404_NOT_FOUND,
    )


@router.get("", response_model=NotificationList)
def list_notifications(
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    unread_only: bool = Query(default=False),
    db: Session = Depends(get_db),
    user_id: uuid.UUID = Depends(get_current_user_id),
) -> NotificationList:
    return notification_service.list_for_user(
        db, user_id, limit, offset, unread_only=unread_only
    )


@router.get("/unread-count", response_model=UnreadCount)
def get_unread_count(
    db: Session = Depends(get_db),
    user_id: uuid.UUID = Depends(get_current_user_id),
) -> UnreadCount:
    return UnreadCount(unread_count=notification_service.unread_count(db, user_id))


@router.post("/{notification_id}/read", response_model=NotificationRead)
def mark_one_read(
    notification_id: uuid.UUID,
    db: Session = Depends(get_db),
    user_id: uuid.UUID = Depends(get_current_user_id),
) -> NotificationRead:
    notif = notification_service.mark_read(db, user_id, notification_id)
    if notif is None:
        raise _not_found()
    return NotificationRead.model_validate(notif)


@router.post("/read-all", status_code=status.HTTP_204_NO_CONTENT)
def mark_all_read(
    db: Session = Depends(get_db),
    user_id: uuid.UUID = Depends(get_current_user_id),
) -> Response:
    notification_service.mark_all_read(db, user_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
