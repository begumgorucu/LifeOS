"""Area health snapshots — sparse, written only when scores change."""

import uuid
from datetime import date

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.area import Area
from app.models.area_health_snapshot import AreaHealthSnapshot


def record(db: Session, area: Area, day: date) -> None:
    """Upsert today's snapshot for an area to its current health_score.

    Caller is expected to commit. Idempotent within a single day —
    repeated calls just overwrite today's row.
    """
    existing = db.scalar(
        select(AreaHealthSnapshot).where(
            AreaHealthSnapshot.area_id == area.id,
            AreaHealthSnapshot.date == day,
        )
    )
    if existing is not None:
        existing.health_score = area.health_score
        return
    db.add(
        AreaHealthSnapshot(
            user_id=area.user_id,
            area_id=area.id,
            date=day,
            health_score=area.health_score,
        )
    )
