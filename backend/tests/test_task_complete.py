"""Unit tests for task completion side-effects.

We isolate complete_task by stubbing the DB load helpers and downstream
services. Streak / XP / activity-log math is exercised by their own
test files; here we only assert that the task-completion entry point
fires the right calls in the right order.
"""

import uuid
from dataclasses import dataclass, field
from datetime import UTC, date, datetime, timedelta
from unittest.mock import MagicMock

import pytest

from app.models.enums import TaskPriority, TaskStatus
from app.services import (
    achievement_service,
    activity_log_service,
    notification_service,
    project_service,
    snapshot_service,
    streak_service,
    task_service,
    xp_service,
)


@dataclass
class _StubArea:
    id: uuid.UUID = field(default_factory=uuid.uuid4)
    health_score: int = 60
    last_activity_at: datetime | None = None


@dataclass
class _StubProject:
    id: uuid.UUID = field(default_factory=uuid.uuid4)
    progress: int = 0


@dataclass
class _StubTask:
    id: uuid.UUID = field(default_factory=uuid.uuid4)
    user_id: uuid.UUID = field(default_factory=uuid.uuid4)
    priority: TaskPriority = TaskPriority.medium
    status: TaskStatus = TaskStatus.todo
    completed_at: datetime | None = None
    area: _StubArea = field(default_factory=_StubArea)
    project: _StubProject | None = None


@dataclass
class _StubUser:
    streak_count: int = 0
    streak_last_active_date: date | None = None
    longest_streak: int = 0
    xp: int = 0
    level: int = 1


@pytest.fixture
def stub_task(monkeypatch):
    task = _StubTask()
    user = _StubUser()

    def fake_load(_db, _user_id, _task_id):
        return task

    monkeypatch.setattr(task_service, "_load_task_with_relations", fake_load)
    monkeypatch.setattr(
        project_service, "recompute_progress", MagicMock(name="recompute_progress")
    )
    monkeypatch.setattr(
        activity_log_service, "increment", MagicMock(name="activity_log.increment")
    )
    monkeypatch.setattr(
        snapshot_service, "record", MagicMock(name="snapshot.record")
    )
    # check_after_task_complete must return a list — complete_task iterates it.
    monkeypatch.setattr(
        achievement_service,
        "check_after_task_complete",
        MagicMock(name="achievement.check", return_value=[]),
    )
    monkeypatch.setattr(
        notification_service, "emit", MagicMock(name="notification.emit")
    )
    # Streak & XP services keep their real implementations — we want to
    # confirm complete_task plumbs them through. The DB's User row is the
    # only thing we mock; everything operates on the in-memory user object.
    return task, user


def _make_db(user):
    """Build a MagicMock db whose scalar returns the user and whose
    scalars(...) yields an empty iterable. complete_task makes both calls."""
    db = MagicMock()
    db.scalar.return_value = user
    # Fresh iterator per call so list(...) inside complete_task works repeatedly.
    db.scalars.side_effect = lambda *_a, **_k: iter([])
    return db


def test_complete_flips_status_and_stamps_time(stub_task):
    task, user = stub_task
    db = _make_db(user)
    before = datetime.now(UTC) - timedelta(seconds=1)

    result = task_service.complete_task(db, task.user_id, task.id)

    assert result is task
    assert task.status is TaskStatus.done
    assert task.completed_at is not None
    assert task.completed_at >= before


def test_complete_bumps_area_score_by_priority(stub_task):
    task, user = stub_task
    db = _make_db(user)
    task.priority = TaskPriority.high
    task.area.health_score = 60

    task_service.complete_task(db, task.user_id, task.id)

    # High priority bonus is +10 (services/health_score.PRIORITY_BONUS).
    assert task.area.health_score == 70


def test_complete_updates_area_last_activity(stub_task):
    task, user = stub_task
    db = _make_db(user)
    before = datetime.now(UTC) - timedelta(seconds=1)

    task_service.complete_task(db, task.user_id, task.id)

    assert task.area.last_activity_at is not None
    assert task.area.last_activity_at >= before


def test_complete_recomputes_project_progress_when_project_present(stub_task):
    task, user = stub_task
    db = _make_db(user)
    task.project = _StubProject()

    task_service.complete_task(db, task.user_id, task.id)

    project_service.recompute_progress.assert_called_once_with(db, task.project)


def test_complete_no_project_skips_progress_call(stub_task):
    task, user = stub_task
    db = _make_db(user)
    task.project = None

    task_service.complete_task(db, task.user_id, task.id)

    project_service.recompute_progress.assert_not_called()


# ---------- Gamification integration ---------------------------------------


def test_complete_advances_streak_and_awards_xp(stub_task):
    """First-ever completion: streak 0→1 with bumped=True, XP gets bonus."""
    task, user = stub_task
    db = _make_db(user)
    task.priority = TaskPriority.medium

    task_service.complete_task(db, task.user_id, task.id)

    assert user.streak_count == 1
    assert user.streak_last_active_date is not None
    assert user.longest_streak == 1
    # Medium (+50) + streak-day bonus (+50) = 100, brings level past 0 only.
    assert user.xp == xp_service.PRIORITY_XP[TaskPriority.medium] + xp_service.STREAK_DAY_BONUS
    assert user.level == xp_service.level_for_xp(user.xp)


def test_complete_writes_activity_log(stub_task):
    task, user = stub_task
    db = _make_db(user)

    task_service.complete_task(db, task.user_id, task.id)

    activity_log_service.increment.assert_called_once()
    args = activity_log_service.increment.call_args.args
    assert args[1] == task.user_id  # second positional arg is user_id
    assert isinstance(args[2], date)  # third positional arg is today's date
