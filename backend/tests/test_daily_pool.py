"""Unit tests for the Daily Pool slot orchestration.

We pin the per-rule finders so we can hand-craft the candidate set and
assert dedup + MAX_SLOTS truncation behavior. The integration test for
real DB queries lives in the manual API run.
"""

import uuid
from datetime import date
from unittest.mock import MagicMock

import pytest

from app.models.enums import PoolReason, TaskStatus
from app.services import daily_pool_service


class _StubTask:
    """Tiny test double matching the Task attributes the orchestrator reads."""

    def __init__(self, name: str = "x"):
        self.id = uuid.uuid4()
        self.name = name


class _StubUser:
    def __init__(self, streak_last_active_date=None):
        self.streak_last_active_date = streak_last_active_date


TODAY = date(2026, 6, 3)


def _patch_rules(
    monkeypatch,
    *,
    neglected=None,
    deadline=None,
    streak=None,
    dependency=None,
    flow=None,
    user=None,
):
    """Replace every finder with a constant; let the orchestrator decide
    which to call and in what order."""
    monkeypatch.setattr(
        daily_pool_service, "_find_neglected", lambda *_a, **_k: neglected
    )
    monkeypatch.setattr(
        daily_pool_service, "_find_deadline", lambda *_a, **_k: list(deadline or [])
    )
    monkeypatch.setattr(
        daily_pool_service, "_find_streak_keeper", lambda *_a, **_k: streak
    )
    monkeypatch.setattr(
        daily_pool_service, "_find_dependency_ready", lambda *_a, **_k: dependency
    )
    monkeypatch.setattr(
        daily_pool_service, "_find_flow", lambda *_a, **_k: flow
    )

    db = MagicMock()
    db.scalar.return_value = user or _StubUser(streak_last_active_date=None)
    return db


def test_all_rules_contribute(monkeypatch):
    a, b, c, d, e = (_StubTask("a"), _StubTask("b"), _StubTask("c"), _StubTask("d"), _StubTask("e"))
    db = _patch_rules(
        monkeypatch,
        neglected=a,
        deadline=[b],
        streak=c,
        dependency=d,
        flow=e,
    )

    result = daily_pool_service._build_candidates(db, uuid.uuid4(), TODAY)

    reasons = [r for r, _ in result]
    assert reasons == [
        PoolReason.neglected,
        PoolReason.deadline,
        PoolReason.streak,
        PoolReason.dependency_ready,
        PoolReason.flow,
    ]


def test_dedup_when_same_task_returned_by_multiple_rules(monkeypatch):
    shared = _StubTask("shared")
    db = _patch_rules(
        monkeypatch,
        neglected=shared,
        deadline=[shared],   # would duplicate slot 1
        flow=shared,         # would also duplicate
    )

    result = daily_pool_service._build_candidates(db, uuid.uuid4(), TODAY)

    # Only the first occurrence survives.
    assert len(result) == 1
    assert result[0] == (PoolReason.neglected, shared)


def test_streak_skipped_when_already_active_today(monkeypatch):
    db = _patch_rules(
        monkeypatch,
        streak=_StubTask("would-be-streak"),
        user=_StubUser(streak_last_active_date=TODAY),
    )

    result = daily_pool_service._build_candidates(db, uuid.uuid4(), TODAY)

    assert PoolReason.streak not in [r for r, _ in result]


def test_max_slots_caps_output(monkeypatch):
    # Both deadlines + neglected + streak + dependency + flow = 6 candidates;
    # MAX_SLOTS clamps to 5.
    tasks = [_StubTask(f"t{i}") for i in range(6)]
    db = _patch_rules(
        monkeypatch,
        neglected=tasks[0],
        deadline=tasks[1:3],   # 2 entries
        streak=tasks[3],
        dependency=tasks[4],
        flow=tasks[5],
    )

    result = daily_pool_service._build_candidates(db, uuid.uuid4(), TODAY)

    assert len(result) == daily_pool_service.MAX_SLOTS


def test_empty_when_nothing_matches(monkeypatch):
    db = _patch_rules(monkeypatch)
    result = daily_pool_service._build_candidates(db, uuid.uuid4(), TODAY)
    assert result == []
