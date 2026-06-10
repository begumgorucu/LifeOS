"""Tasks endpoints."""

import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user_id
from app.api.errors import APIError
from app.core.db import get_db
from app.models.enums import TaskStatus
from app.schemas.task import PaginatedTasks, TaskCreate, TaskRead, TaskUpdate
from app.services import task_service

router = APIRouter(prefix="/tasks", tags=["tasks"])


def _not_found() -> APIError:
    return APIError(
        code="TASK_NOT_FOUND",
        message="Task not found.",
        status_code=status.HTTP_404_NOT_FOUND,
    )


def _bad_link() -> APIError:
    return APIError(
        code="LINK_NOT_FOUND",
        message="Linked area or project not found.",
        status_code=status.HTTP_400_BAD_REQUEST,
    )


@router.get("", response_model=PaginatedTasks)
def list_tasks(
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    status_filter: TaskStatus | None = Query(default=None, alias="status"),
    area_id: uuid.UUID | None = Query(default=None),
    project_id: uuid.UUID | None = Query(default=None),
    due_before: datetime | None = Query(default=None),
    due_after: datetime | None = Query(default=None),
    db: Session = Depends(get_db),
    user_id: uuid.UUID = Depends(get_current_user_id),
) -> PaginatedTasks:
    items, total = task_service.list_tasks(
        db,
        user_id,
        limit,
        offset,
        status=status_filter,
        area_id=area_id,
        project_id=project_id,
        due_before=due_before,
        due_after=due_after,
    )
    return PaginatedTasks(
        items=[task_service.to_task_read(t) for t in items],
        total=total,
        limit=limit,
        offset=offset,
    )


@router.get("/{task_id}", response_model=TaskRead)
def get_task(
    task_id: uuid.UUID,
    db: Session = Depends(get_db),
    user_id: uuid.UUID = Depends(get_current_user_id),
) -> TaskRead:
    task = task_service.get_task(db, user_id, task_id)
    if task is None:
        raise _not_found()
    return task_service.to_task_read(task)


@router.post("", response_model=TaskRead, status_code=status.HTTP_201_CREATED)
def create_task(
    payload: TaskCreate,
    db: Session = Depends(get_db),
    user_id: uuid.UUID = Depends(get_current_user_id),
) -> TaskRead:
    task = task_service.create_task(db, user_id, payload)
    if task is None:
        raise _bad_link()
    return task_service.to_task_read(task)


@router.patch("/{task_id}", response_model=TaskRead)
def update_task(
    task_id: uuid.UUID,
    payload: TaskUpdate,
    db: Session = Depends(get_db),
    user_id: uuid.UUID = Depends(get_current_user_id),
) -> TaskRead:
    task = task_service.update_task(db, user_id, task_id, payload)
    if task is None:
        raise _not_found()
    return task_service.to_task_read(task)


@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task(
    task_id: uuid.UUID,
    db: Session = Depends(get_db),
    user_id: uuid.UUID = Depends(get_current_user_id),
) -> None:
    if not task_service.delete_task(db, user_id, task_id):
        raise _not_found()


@router.post("/{task_id}/complete", response_model=TaskRead)
def complete_task(
    task_id: uuid.UUID,
    db: Session = Depends(get_db),
    user_id: uuid.UUID = Depends(get_current_user_id),
) -> TaskRead:
    task = task_service.complete_task(db, user_id, task_id)
    if task is None:
        raise _not_found()
    return task_service.to_task_read(task)


@router.post("/{task_id}/skip", response_model=TaskRead)
def skip_task(
    task_id: uuid.UUID,
    db: Session = Depends(get_db),
    user_id: uuid.UUID = Depends(get_current_user_id),
) -> TaskRead:
    task = task_service.skip_task(db, user_id, task_id)
    if task is None:
        raise _not_found()
    return task_service.to_task_read(task)


@router.post("/{task_id}/reopen", response_model=TaskRead)
def reopen_task(
    task_id: uuid.UUID,
    db: Session = Depends(get_db),
    user_id: uuid.UUID = Depends(get_current_user_id),
) -> TaskRead:
    task = task_service.reopen_task(db, user_id, task_id)
    if task is None:
        raise _not_found()
    return task_service.to_task_read(task)
