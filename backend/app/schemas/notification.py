"""Pydantic schemas for the Notifications endpoints."""

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.models.enums import NotificationType


class NotificationRead(BaseModel):
    """One notification row."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    user_id: uuid.UUID
    notification_type: NotificationType
    title: str
    body: str | None
    icon: str | None
    area_id: uuid.UUID | None
    task_id: uuid.UUID | None
    link_to: str | None
    is_read: bool
    read_at: datetime | None
    created_at: datetime


class NotificationList(BaseModel):
    items: list[NotificationRead]
    total: int
    unread_count: int
    limit: int
    offset: int


class UnreadCount(BaseModel):
    unread_count: int
