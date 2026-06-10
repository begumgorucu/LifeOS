"""Vision CRUD with M:N area + project links and computed vibrance."""

import uuid

from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.api.errors import APIError
from app.models.area import Area
from app.models.associations import vision_areas
from app.models.enums import ProjectStatus
from app.models.project import Project
from app.models.vision import Vision
from app.schemas.common import AreaSummary, ProjectSummary
from app.schemas.vision import VisionCreate, VisionRead, VisionUpdate
from app.services import health_score


def _verify_areas(
    db: Session, user_id: uuid.UUID, area_ids: list[uuid.UUID]
) -> list[Area]:
    if not area_ids:
        return []
    unique_ids = list(dict.fromkeys(area_ids))
    areas = list(
        db.scalars(
            select(Area).where(Area.id.in_(unique_ids), Area.user_id == user_id)
        )
    )
    if len(areas) != len(unique_ids):
        raise APIError(
            code="AREA_NOT_FOUND",
            message="One or more areas were not found.",
            status_code=400,
        )
    return areas


def _verify_projects(
    db: Session, user_id: uuid.UUID, project_ids: list[uuid.UUID]
) -> list[Project]:
    if not project_ids:
        return []
    unique_ids = list(dict.fromkeys(project_ids))
    projects = list(
        db.scalars(
            select(Project).where(
                Project.id.in_(unique_ids), Project.user_id == user_id
            )
        )
    )
    if len(projects) != len(unique_ids):
        raise APIError(
            code="PROJECT_NOT_FOUND",
            message="One or more projects were not found.",
            status_code=400,
        )
    return projects


def compute_vibrance(vision: Vision) -> int:
    """Vibrance (0..100) — how alive a vision feels. Drives the image fade
    in the UI: high values → vivid, low → washed out / black-and-white.

    Sources combined (each contributes if it has data):
      - Average health score of directly-linked areas.
      - Average progress of directly-linked projects.

    Behaviour:
      - Both empty                  → 70 (neutral default; not alarming).
      - Only one source has data    → use that source's average directly.
      - Both have data              → simple mean of the two averages.

    This makes the link causal: complete tasks on a backing project and
    the vision visibly brightens; ignore the area entirely and it fades.
    """
    area_avg: float | None = None
    if vision.areas:
        area_avg = sum(a.health_score for a in vision.areas) / len(vision.areas)

    project_avg: float | None = None
    if vision.projects:
        project_avg = sum(p.progress for p in vision.projects) / len(vision.projects)

    if area_avg is None and project_avg is None:
        return health_score.SCORE_DEFAULT
    if area_avg is None:
        return round(project_avg or 0)
    if project_avg is None:
        return round(area_avg)
    return round((area_avg + project_avg) / 2)


def to_vision_read(vision: Vision) -> VisionRead:
    return VisionRead(
        id=vision.id,
        user_id=vision.user_id,
        title=vision.title,
        description=vision.description,
        image_url=vision.image_url,
        target_date=vision.target_date,
        created_at=vision.created_at,
        updated_at=vision.updated_at,
        areas=[AreaSummary.model_validate(a) for a in vision.areas],
        projects=[ProjectSummary.model_validate(p) for p in vision.projects],
        vibrance=compute_vibrance(vision),
    )


def list_visions(
    db: Session,
    user_id: uuid.UUID,
    limit: int,
    offset: int,
    area_id: uuid.UUID | None = None,
) -> tuple[list[Vision], int]:
    base = select(Vision).where(Vision.user_id == user_id)
    count_base = select(func.count(Vision.id)).where(Vision.user_id == user_id)
    if area_id is not None:
        base = base.join(vision_areas, vision_areas.c.vision_id == Vision.id).where(
            vision_areas.c.area_id == area_id
        )
        count_base = count_base.join(
            vision_areas, vision_areas.c.vision_id == Vision.id
        ).where(vision_areas.c.area_id == area_id)

    total = db.scalar(count_base) or 0
    items = list(
        db.scalars(
            base.options(
                selectinload(Vision.areas),
                selectinload(Vision.projects),
            )
            .order_by(Vision.created_at.desc())
            .limit(limit)
            .offset(offset)
        )
    )
    return items, total


def get_vision(db: Session, user_id: uuid.UUID, vision_id: uuid.UUID) -> Vision | None:
    return db.scalar(
        select(Vision)
        .where(Vision.id == vision_id, Vision.user_id == user_id)
        .options(
            selectinload(Vision.areas),
            selectinload(Vision.projects),
        )
    )


def create_vision(db: Session, user_id: uuid.UUID, payload: VisionCreate) -> Vision:
    areas = _verify_areas(db, user_id, payload.area_ids)
    projects = _verify_projects(db, user_id, payload.project_ids)
    vision = Vision(
        user_id=user_id,
        title=payload.title,
        description=payload.description,
        image_url=payload.image_url,
        target_date=payload.target_date,
        areas=areas,
        projects=projects,
    )
    db.add(vision)
    db.commit()
    db.refresh(vision)
    return vision


def update_vision(
    db: Session,
    user_id: uuid.UUID,
    vision_id: uuid.UUID,
    payload: VisionUpdate,
) -> Vision | None:
    vision = get_vision(db, user_id, vision_id)
    if vision is None:
        return None

    data = payload.model_dump(exclude_unset=True)
    for field, value in data.items():
        if field in ("area_ids", "project_ids"):
            continue
        setattr(vision, field, value)

    if payload.area_ids is not None:
        vision.areas = _verify_areas(db, user_id, payload.area_ids)
    if payload.project_ids is not None:
        vision.projects = _verify_projects(db, user_id, payload.project_ids)

    db.commit()
    db.refresh(vision)
    return vision


def delete_vision(db: Session, user_id: uuid.UUID, vision_id: uuid.UUID) -> bool:
    vision = get_vision(db, user_id, vision_id)
    if vision is None:
        return False
    db.delete(vision)
    db.commit()
    return True
