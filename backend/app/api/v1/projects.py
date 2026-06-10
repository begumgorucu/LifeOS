"""Projects endpoints."""

import uuid

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user_id
from app.api.errors import APIError
from app.core.db import get_db
from app.models.enums import ProjectStatus
from app.schemas.project import (
    PaginatedProjects,
    ProjectCreate,
    ProjectRead,
    ProjectUpdate,
)
from app.services import project_service

router = APIRouter(prefix="/projects", tags=["projects"])


def _not_found() -> APIError:
    return APIError(
        code="PROJECT_NOT_FOUND",
        message="Project not found.",
        status_code=status.HTTP_404_NOT_FOUND,
    )


def _area_not_found() -> APIError:
    return APIError(
        code="AREA_NOT_FOUND",
        message="Area not found.",
        status_code=status.HTTP_400_BAD_REQUEST,
    )


@router.get("", response_model=PaginatedProjects)
def list_projects(
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    status_filter: ProjectStatus | None = Query(default=None, alias="status"),
    area_id: uuid.UUID | None = Query(default=None),
    db: Session = Depends(get_db),
    user_id: uuid.UUID = Depends(get_current_user_id),
) -> PaginatedProjects:
    items, total = project_service.list_projects(
        db, user_id, limit, offset, status=status_filter, area_id=area_id
    )
    return PaginatedProjects(
        items=[project_service.to_project_read(db, p) for p in items],
        total=total,
        limit=limit,
        offset=offset,
    )


@router.get("/{project_id}", response_model=ProjectRead)
def get_project(
    project_id: uuid.UUID,
    db: Session = Depends(get_db),
    user_id: uuid.UUID = Depends(get_current_user_id),
) -> ProjectRead:
    project = project_service.get_project(db, user_id, project_id)
    if project is None:
        raise _not_found()
    return project_service.to_project_read(db, project)


@router.post("", response_model=ProjectRead, status_code=status.HTTP_201_CREATED)
def create_project(
    payload: ProjectCreate,
    db: Session = Depends(get_db),
    user_id: uuid.UUID = Depends(get_current_user_id),
) -> ProjectRead:
    project = project_service.create_project(db, user_id, payload)
    if project is None:
        raise _area_not_found()
    return project_service.to_project_read(db, project)


@router.patch("/{project_id}", response_model=ProjectRead)
def update_project(
    project_id: uuid.UUID,
    payload: ProjectUpdate,
    db: Session = Depends(get_db),
    user_id: uuid.UUID = Depends(get_current_user_id),
) -> ProjectRead:
    project = project_service.update_project(db, user_id, project_id, payload)
    if project is None:
        raise _not_found()
    return project_service.to_project_read(db, project)


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(
    project_id: uuid.UUID,
    db: Session = Depends(get_db),
    user_id: uuid.UUID = Depends(get_current_user_id),
) -> None:
    if not project_service.delete_project(db, user_id, project_id):
        raise _not_found()
