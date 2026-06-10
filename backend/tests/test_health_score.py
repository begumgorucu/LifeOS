"""Unit tests for the pure health-score functions."""

from datetime import timedelta

from app.models.enums import TaskPriority
from app.services.health_score import (
    DAILY_DECAY,
    SCORE_DEFAULT,
    bump_score_for_task,
    compute_decayed_score,
    is_neglected,
)


# ---------- Decay -----------------------------------------------------------


def test_decay_no_last_activity_returns_same_score(now):
    assert compute_decayed_score(SCORE_DEFAULT, None, now) == SCORE_DEFAULT


def test_decay_same_day_returns_same_score(now):
    assert compute_decayed_score(SCORE_DEFAULT, now, now) == SCORE_DEFAULT


def test_decay_loses_configured_points_per_day(now):
    last = now - timedelta(days=3)
    expected = SCORE_DEFAULT - 3 * DAILY_DECAY
    assert compute_decayed_score(SCORE_DEFAULT, last, now) == expected


def test_decay_never_goes_below_zero(now):
    last = now - timedelta(days=365)  # very stale
    assert compute_decayed_score(SCORE_DEFAULT, last, now) == 0


def test_decay_does_not_apply_for_future_activity(now):
    # Defensive: if last_activity_at is in the future (clock skew), don't add points.
    last = now + timedelta(days=2)
    assert compute_decayed_score(SCORE_DEFAULT, last, now) == SCORE_DEFAULT


# ---------- Bump ------------------------------------------------------------


def test_bump_low_priority_adds_2():
    assert bump_score_for_task(50, TaskPriority.low) == 52


def test_bump_medium_priority_adds_5():
    assert bump_score_for_task(50, TaskPriority.medium) == 55


def test_bump_high_priority_adds_10():
    assert bump_score_for_task(50, TaskPriority.high) == 60


def test_bump_never_exceeds_100():
    assert bump_score_for_task(95, TaskPriority.high) == 100


# ---------- Neglect ---------------------------------------------------------


def test_is_neglected_when_score_below_threshold(now):
    assert is_neglected(29, now, now) is True


def test_is_neglected_when_idle_seven_or_more_days(now):
    last = now - timedelta(days=7)
    assert is_neglected(80, last, now) is True


def test_is_not_neglected_when_healthy_and_recent(now):
    last = now - timedelta(days=1)
    assert is_neglected(70, last, now) is False


def test_is_not_neglected_when_score_just_at_threshold(now):
    assert is_neglected(30, now, now) is False
