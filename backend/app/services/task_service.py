"""Task CRUD with dependency management, completion side-effects, and
cycle prevention.

Side-effects of `complete_task`:
  * status → done, completed_at → now
  * area.health_score bumped by priority (via health_score.bump_score_for_task)
  * area.last_activity_at → now (drives neglect detection)
  * Parent project's progress recomputed
  * User streak updated (Grup 2): may advance, restart, or stay the same
  * User XP increased — priority bonus + extra on streak-advance days
  * User level recomputed from new XP
  * DailyActivityLog row for today incremented (upsert)

Side-effects of `reopen_task`:
  * status → todo, completed_at cleared
  * Project progress recomputed
  * DailyActivityLog row for the original completion day decremented
    (deletes the row when it hits zero)
  * XP and streak are NOT refunded — "history shouldn't lie".

TODO (Grup 3+): emit a Notification on milestone events (streak >= 7,
achievement unlock, etc.).
"""

import uuid
from collections import deque
from datetime import UTC, datetime

from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.api.errors import APIError
from app.models.area import Area
from app.models.associations import task_dependencies
from app.models.enums import NotificationType, TaskStatus
from app.models.project import Project
from app.models.task import Task
from app.models.user import User
from app.schemas.common import AreaSummary, ProjectSummary, TaskSummary
from app.schemas.task import TaskCreate, TaskRead, TaskUpdate
from app.services import (
    achievement_service,
    activity_log_service,
    health_score,
    notification_service,
    project_service,
    snapshot_service,
    streak_service,
    xp_service,
)


def _utcnow() -> datetime:
    return datetime.now(UTC)


# ---------- internal helpers ------------------------------------------------


def _verify_area(db: Session, user_id: uuid.UUID, area_id: uuid.UUID) -> Area | None:
    return db.scalar(select(Area).where(Area.id == area_id, Area.user_id == user_id))


def _verify_project(
    db: Session, user_id: uuid.UUID, project_id: uuid.UUID
) -> Project | None:
    return db.scalar(
        select(Project).where(Project.id == project_id, Project.user_id == user_id)
    )


def _load_task_with_relations(
    db: Session, user_id: uuid.UUID, task_id: uuid.UUID
) -> Task | None:
    """Load a task with all relationships needed for TaskRead in one round-trip."""
    return db.scalar(
        select(Task)
        .where(Task.id == task_id, Task.user_id == user_id)
        .options(
            selectinload(Task.area),
            selectinload(Task.project),
            selectinload(Task.depends_on),
        )
    )


def detect_cycle(db: Session, task_id: uuid.UUID, new_dep_id: uuid.UUID) -> bool:
    """Return True iff adding edge `task_id -> new_dep_id` (task depends on
    new_dep) would create a cycle in the dependency DAG.

    Walks the existing dependency graph starting from new_dep_id, following
    each node's own dependencies. If we reach task_id, the new edge closes
    a loop: task_id → new_dep_id → ... → task_id.
    """
    if task_id == new_dep_id:
        return True

    visited: set[uuid.UUID] = set()
    queue: deque[uuid.UUID] = deque([new_dep_id])
    while queue:
        node = queue.popleft()
        if node in visited:
            continue
        visited.add(node)
        if node == task_id:
            return True
        # Fetch this node's own dependencies.
        deps = db.scalars(
            select(task_dependencies.c.depends_on_task_id).where(
                task_dependencies.c.task_id == node
            )
        ).all()
        queue.extend(deps)
    return False


def _apply_dependencies(
    db: Session, task: Task, dep_ids: list[uuid.UUID], user_id: uuid.UUID
) -> None:
    """Replace this task's depends_on list with `dep_ids`.

    Validates: ownership, no self-ref, no cycles, no duplicates. Raises APIError.
    """
    unique_ids = list(dict.fromkeys(dep_ids))  # dedupe, preserve order

    if task.id in unique_ids:
        raise APIError(
            code="SELF_DEPENDENCY",
            message="A task cannot depend on itself.",
            status_code=400,
        )

    if not unique_ids:
        task.depends_on = []
        return

    # All candidate deps must exist and belong to the same user.
    candidates = list(
        db.scalars(
            select(Task).where(Task.id.in_(unique_ids), Task.user_id == user_id)
        )
    )
    if len(candidates) != len(unique_ids):
        raise APIError(
            code="DEPENDENCY_NOT_FOUND",
            message="One or more dependency tasks were not found.",
            status_code=400,
        )

    # Cycle check against the *current* graph plus each new edge.
    for dep_id in unique_ids:
        if detect_cycle(db, task.id, dep_id):
            raise APIError(
                code="DEPENDENCY_CYCLE",
                message="Adding this dependency would create a cycle.",
                status_code=400,
            )

    task.depends_on = candidates


def to_task_read(task: Task) -> TaskRead:
    """Build a TaskRead. Expects task already has area/project/depends_on
    eagerly loaded (use _load_task_with_relations or selectinload in list)."""
    is_blocked = any(d.status != TaskStatus.done for d in task.depends_on)
    return TaskRead(
        id=task.id,
        user_id=task.user_id,
        area_id=task.area_id,
        project_id=task.project_id,
        title=task.title,
        description=task.description,
        status=task.status,
        priority=task.priority,
        due_at=task.due_at,
        completed_at=task.completed_at,
        created_at=task.created_at,
        updated_at=task.updated_at,
        area=AreaSummary.model_validate(task.area),
        project=ProjectSummary.model_validate(task.project) if task.project else None,
        depends_on=[TaskSummary.model_validate(d) for d in task.depends_on],
        is_blocked=is_blocked,
    )


# ---------- public service API ---------------------------------------------


def list_tasks(  # noqa: PLR0913 — every filter is genuinely useful at this seam
    db: Session,
    user_id: uuid.UUID,
    limit: int,
    offset: int,
    status: TaskStatus | None = None,
    area_id: uuid.UUID | None = None,
    project_id: uuid.UUID | None = None,
    due_before: datetime | None = None,
    due_after: datetime | None = None,
) -> tuple[list[Task], int]:
    conditions = [Task.user_id == user_id]
    if status is not None:
        conditions.append(Task.status == status)
    if area_id is not None:
        conditions.append(Task.area_id == area_id)
    if project_id is not None:
        conditions.append(Task.project_id == project_id)
    if due_before is not None:
        conditions.append(Task.due_at <= due_before)
    if due_after is not None:
        conditions.append(Task.due_at >= due_after)

    total = db.scalar(select(func.count(Task.id)).where(*conditions)) or 0
    items = list(
        db.scalars(
            select(Task)
            .where(*conditions)
            .options(
                selectinload(Task.area),
                selectinload(Task.project),
                selectinload(Task.depends_on),
            )
            # Order: not-yet-due first by due_at asc nulls last, then created desc.
            .order_by(Task.due_at.asc().nullslast(), Task.created_at.desc())
            .limit(limit)
            .offset(offset)
        )
    )
    return items, total


def get_task(db: Session, user_id: uuid.UUID, task_id: uuid.UUID) -> Task | None:
    return _load_task_with_relations(db, user_id, task_id)


def create_task(
    db: Session, user_id: uuid.UUID, payload: TaskCreate
) -> Task | None:
    if _verify_area(db, user_id, payload.area_id) is None:
        return None
    if payload.project_id is not None:
        project = _verify_project(db, user_id, payload.project_id)
        if project is None:
            return None
        # If project lives in a different area, the task's area must match
        # the project's area (a task belongs to one area, transitively).
        if project.area_id != payload.area_id:
            raise APIError(
                code="AREA_PROJECT_MISMATCH",
                message="Task area must match project area.",
                status_code=400,
            )

    task = Task(
        user_id=user_id,
        area_id=payload.area_id,
        project_id=payload.project_id,
        title=payload.title,
        description=payload.description,
        priority=payload.priority,
        due_at=payload.due_at,
        status=TaskStatus.todo,
    )
    db.add(task)
    db.flush()  # need task.id before applying deps

    if payload.depends_on_ids:
        _apply_dependencies(db, task, payload.depends_on_ids, user_id)

    db.commit()
    # Re-load with eager relationships for the response.
    return _load_task_with_relations(db, user_id, task.id)


def update_task(
    db: Session, user_id: uuid.UUID, task_id: uuid.UUID, payload: TaskUpdate
) -> Task | None:
    task = _load_task_with_relations(db, user_id, task_id)
    if task is None:
        return None

    data = payload.model_dump(exclude_unset=True)

    new_area_id = data.get("area_id")
    if new_area_id is not None and new_area_id != task.area_id:
        if _verify_area(db, user_id, new_area_id) is None:
            return None

    new_project_id = data.get("project_id")
    if new_project_id is not None:
        proj = _verify_project(db, user_id, new_project_id)
        if proj is None:
            return None
        target_area = new_area_id or task.area_id
        if proj.area_id != target_area:
            raise APIError(
                code="AREA_PROJECT_MISMATCH",
                message="Task area must match project area.",
                status_code=400,
            )

    # Apply scalar fields (deps handled separately).
    for field, value in data.items():
        if field == "depends_on_ids":
            continue
        setattr(task, field, value)

    if payload.depends_on_ids is not None:
        _apply_dependencies(db, task, payload.depends_on_ids, user_id)

    db.commit()
    return _load_task_with_relations(db, user_id, task.id)


def delete_task(db: Session, user_id: uuid.UUID, task_id: uuid.UUID) -> bool:
    task = db.scalar(
        select(Task).where(Task.id == task_id, Task.user_id == user_id)
    )
    if task is None:
        return False
    parent_project_id = task.project_id
    db.delete(task)
    db.commit()
    # Project progress changes when a task is removed.
    if parent_project_id is not None:
        proj = db.scalar(select(Project).where(Project.id == parent_project_id))
        if proj is not None:
            project_service.recompute_progress(db, proj)
            db.commit()
    return True


# ---------- status transitions with side effects ----------------------------


def complete_task(
    db: Session, user_id: uuid.UUID, task_id: uuid.UUID
) -> Task | None:
    """Mark a task done and propagate side-effects.

    Soft rule: completing a task whose dependencies aren't done is allowed
    (karar #2). UI decides whether to disable the button.
    """
    task = _load_task_with_relations(db, user_id, task_id)
    if task is None:
        return None

    now = _utcnow()
    today = now.date()
    task.status = TaskStatus.done
    task.completed_at = now

    # Bump area score using the existing pure function.
    area = task.area
    area.health_score = health_score.bump_score_for_task(area.health_score, task.priority)
    area.last_activity_at = now

    # ---- Gamification: streak + XP + activity log (Grup 2 wiring) ---------
    user = db.scalar(select(User).where(User.id == user_id))
    streak_bumped = False
    new_streak_count = 0
    if user is not None:
        streak = streak_service.apply_completion(
            user.streak_count, user.streak_last_active_date, today
        )
        user.streak_count = streak.new_streak
        user.streak_last_active_date = streak.new_last_active_date
        user.longest_streak = streak_service.updated_longest(
            user.longest_streak, streak.new_streak
        )
        user.xp += xp_service.xp_for_completion(task.priority, streak.bumped)
        user.level = xp_service.level_for_xp(user.xp)
        streak_bumped = streak.bumped
        new_streak_count = streak.new_streak

    activity_log_service.increment(db, user_id, today)

    # Snapshot the area's NEW score for today (sparse — only on activity).
    snapshot_service.record(db, area, today)

    # Project progress recomputes from the new done/total ratio. We must
    # flush first — our session uses autoflush=False, so the pending
    # status change wouldn't be visible to the COUNT inside recompute.
    if task.project is not None:
        db.flush()
        project_service.recompute_progress(db, task.project)

    # Run achievement detection AFTER all gamification state is settled.
    # Flush so the queries inside achievement_service see the new
    # status / xp / streak / area score / activity log values.
    db.flush()
    new_unlocks = achievement_service.check_after_task_complete(db, user_id)

    # ---- Notifications (Grup 4 event hooks) --------------------------------
    if streak_bumped and new_streak_count > 1:
        notification_service.emit(
            db,
            user_id,
            NotificationType.streak_success,
            title=f"{new_streak_count} günlük streak'ini sürdürdün!",
            body="Aynen devam — momentum hayata akıyor.",
            icon="flame",
        )
    for unlock in new_unlocks:
        notification_service.emit(
            db,
            user_id,
            NotificationType.achievement_unlocked,
            title=f"Rozet kazandın: {unlock.name}",
            body=unlock.description,
            icon=unlock.icon,
        )
    # Dependency: any task that was waiting on this one and now has all
    # blockers done gets a "ready to start" ping.
    dependents = list(
        db.scalars(
            select(Task)
            .where(
                Task.id.in_(
                    select(task_dependencies.c.task_id).where(
                        task_dependencies.c.depends_on_task_id == task.id
                    )
                ),
                Task.user_id == user_id,
            )
            .options(selectinload(Task.depends_on))
        )
    )
    for dep_task in dependents:
        if all(d.status == TaskStatus.done for d in dep_task.depends_on):
            notification_service.emit(
                db,
                user_id,
                NotificationType.dependency_unblocked,
                title=f'"{dep_task.title}" artık başlayabilir',
                body="Bağımlı olduğu tüm görevler tamamlandı.",
                icon="link",
                task_id=dep_task.id,
            )

    db.commit()
    return _load_task_with_relations(db, user_id, task.id)


def skip_task(db: Session, user_id: uuid.UUID, task_id: uuid.UUID) -> Task | None:
    """Mark a task as skipped — no score change, no activity bump."""
    task = _load_task_with_relations(db, user_id, task_id)
    if task is None:
        return None
    task.status = TaskStatus.skipped
    task.completed_at = None
    db.commit()
    return _load_task_with_relations(db, user_id, task.id)


def reopen_task(db: Session, user_id: uuid.UUID, task_id: uuid.UUID) -> Task | None:
    """Send a task back to `todo`. Does NOT refund area score, XP, or
    streak (intentional — history shouldn't lie). Decrements the activity
    log for the original completion day; recomputes project progress."""
    task = _load_task_with_relations(db, user_id, task_id)
    if task is None:
        return None

    # Capture the original completion day BEFORE clearing the field, so we
    # can drop the right activity-log row (not today's, which may not exist).
    original_completion_day = (
        task.completed_at.date() if task.completed_at is not None else None
    )

    task.status = TaskStatus.todo
    task.completed_at = None

    if original_completion_day is not None:
        activity_log_service.decrement(db, user_id, original_completion_day)

    if task.project is not None:
        # autoflush=False → make the status change visible to the COUNT.
        db.flush()
        project_service.recompute_progress(db, task.project)
    db.commit()
    return _load_task_with_relations(db, user_id, task.id)
