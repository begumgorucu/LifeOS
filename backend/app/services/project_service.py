"""Project CRUD with automatic progress recomputation."""

import uuid
from datetime import UTC, datetime

from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.models.area import Area
from app.models.enums import ProjectStatus, TaskStatus
from app.models.project import Project
from app.models.task import Task
from app.schemas.common import AreaSummary
from app.schemas.project import ProjectCreate, ProjectRead, ProjectUpdate


def _utcnow() -> datetime:
    return datetime.now(UTC)


# ---------- internal helpers ------------------------------------------------


def _verify_area(db: Session, user_id: uuid.UUID, area_id: uuid.UUID) -> Area | None:
    """Confirm an area exists AND belongs to this user before linking."""
    return db.scalar(select(Area).where(Area.id == area_id, Area.user_id == user_id))


def _task_counts(db: Session, project_id: uuid.UUID) -> tuple[int, int]:
    """Return (total_tasks, done_tasks) for a project."""
    total = (
        db.scalar(select(func.count(Task.id)).where(Task.project_id == project_id)) or 0
    )
    done = (
        db.scalar(
            select(func.count(Task.id)).where(
                Task.project_id == project_id, Task.status == TaskStatus.done
            )
        )
        or 0
    )
    return total, done


def recompute_progress(db: Session, project: Project) -> None:
    """Update `project.progress` from current task completion ratio.

    Called by task_service after complete/reopen/delete to keep progress
    aligned with reality. Empty projects stay at 0 (not error).
    """
    total, done = _task_counts(db, project.id)
    project.progress = round(done / total * 100) if total > 0 else 0


def to_project_read(db: Session, project: Project) -> ProjectRead:
    """Build a ProjectRead with enrichment (area summary + task counts)."""
    total, done = _task_counts(db, project.id)
    return ProjectRead(
        id=project.id,
        user_id=project.user_id,
        area_id=project.area_id,
        title=project.title,
        description=project.description,
        status=project.status,
        progress=project.progress,
        target_date=project.target_date,
        completed_at=project.completed_at,
        created_at=project.created_at,
        updated_at=project.updated_at,
        area=AreaSummary.model_validate(project.area),
        tasks_total=total,
        tasks_done=done,
    )


# ---------- public service API ---------------------------------------------


def list_projects(
    db: Session,
    user_id: uuid.UUID,
    limit: int,
    offset: int,
    status: ProjectStatus | None = None,
    area_id: uuid.UUID | None = None,
) -> tuple[list[Project], int]:
    conditions = [Project.user_id == user_id]
    if status is not None:
        conditions.append(Project.status == status)
    if area_id is not None:
        conditions.append(Project.area_id == area_id)

    total = db.scalar(select(func.count(Project.id)).where(*conditions)) or 0
    items = list(
        db.scalars(
            select(Project)
            .where(*conditions)
            .options(selectinload(Project.area))
            .order_by(Project.created_at.desc())
            .limit(limit)
            .offset(offset)
        )
    )
    return items, total


def get_project(db: Session, user_id: uuid.UUID, project_id: uuid.UUID) -> Project | None:
    return db.scalar(
        select(Project)
        .where(Project.id == project_id, Project.user_id == user_id)
        .options(selectinload(Project.area))
    )


def create_project(db: Session, user_id: uuid.UUID, payload: ProjectCreate) -> Project | None:
    if _verify_area(db, user_id, payload.area_id) is None:
        return None
    project = Project(
        user_id=user_id,
        area_id=payload.area_id,
        title=payload.title,
        description=payload.description,
        target_date=payload.target_date,
        status=ProjectStatus.active,
        progress=0,
    )
    db.add(project)
    db.commit()
    db.refresh(project)
    return project


def update_project(
    db: Session,
    user_id: uuid.UUID,
    project_id: uuid.UUID,
    payload: ProjectUpdate,
) -> Project | None:
    project = get_project(db, user_id, project_id)
    if project is None:
        return None

    data = payload.model_dump(exclude_unset=True)

    # If moving to a different area, verify ownership first.
    new_area_id = data.get("area_id")
    if new_area_id is not None and new_area_id != project.area_id:
        if _verify_area(db, user_id, new_area_id) is None:
            return None

    # If status flips to completed, stamp completed_at; if leaving completed, clear it.
    new_status = data.get("status")
    if new_status is ProjectStatus.completed and project.status != ProjectStatus.completed:
        project.completed_at = _utcnow()
    elif new_status is not None and new_status != ProjectStatus.completed:
        project.completed_at = None

    for field, value in data.items():
        setattr(project, field, value)

    db.commit()
    db.refresh(project)
    return project


def delete_project(db: Session, user_id: uuid.UUID, project_id: uuid.UUID) -> bool:
    project = get_project(db, user_id, project_id)
    if project is None:
        return False
    db.delete(project)
    db.commit()
    return True
