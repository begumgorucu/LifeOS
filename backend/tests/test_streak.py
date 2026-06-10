"""Unit tests for streak calculation.

All edge cases the spec calls out:
  * First-ever completion (NULL last_active_date) → streak = 1, bumped
  * Same day repeat → no change, not bumped
  * Yesterday → streak + 1, bumped
  * Gap ≥ 2 days → restart at 1, bumped
  * longest_streak never regresses
"""

from datetime import date, timedelta

from app.services import streak_service


TODAY = date(2026, 6, 3)
YESTERDAY = TODAY - timedelta(days=1)
TWO_DAYS_AGO = TODAY - timedelta(days=2)
A_WEEK_AGO = TODAY - timedelta(days=7)


def test_first_ever_completion_starts_at_one():
    result = streak_service.apply_completion(0, None, TODAY)
    assert result.new_streak == 1
    assert result.new_last_active_date == TODAY
    assert result.bumped is True


def test_same_day_repeat_is_no_op():
    result = streak_service.apply_completion(5, TODAY, TODAY)
    assert result.new_streak == 5
    assert result.new_last_active_date == TODAY
    assert result.bumped is False


def test_yesterday_increments_streak():
    result = streak_service.apply_completion(5, YESTERDAY, TODAY)
    assert result.new_streak == 6
    assert result.new_last_active_date == TODAY
    assert result.bumped is True


def test_two_day_gap_resets_streak():
    result = streak_service.apply_completion(12, TWO_DAYS_AGO, TODAY)
    assert result.new_streak == 1
    assert result.new_last_active_date == TODAY
    assert result.bumped is True


def test_long_gap_resets_streak():
    result = streak_service.apply_completion(30, A_WEEK_AGO, TODAY)
    assert result.new_streak == 1
    assert result.bumped is True


def test_updated_longest_tracks_max():
    assert streak_service.updated_longest(10, 7) == 10  # never regresses
    assert streak_service.updated_longest(10, 11) == 11  # advances
    assert streak_service.updated_longest(0, 1) == 1   # first-ever streak day
