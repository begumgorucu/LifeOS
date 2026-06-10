"""Achievements endpoint — the unlocked + locked catalog for the user."""

import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_user_id
from app.core.db import get_db
from app.schemas.achievement import AchievementList
from app.services import achievement_service

router = APIRouter(prefix="/achievements", tags=["achievements"])


@router.get("", response_model=AchievementList)
def list_achievements(
    db: Session = Depends(get_db),
    user_id: uuid.UUID = Depends(get_current_user_id),
) -> AchievementList:
    return achievement_service.list_for_user(db, user_id)
