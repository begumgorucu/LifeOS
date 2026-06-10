"""Unit tests for notification preference gating.

The full DB path is covered by the manual API run; here we lock down the
preference-to-type mapping so it can't silently drift.
"""

from dataclasses import dataclass

from app.models.enums import NotificationType
from app.services.notification_service import _is_allowed


@dataclass
class _StubPrefs:
    notif_push_enabled: bool = True
    notif_daily_reminder_enabled: bool = True
    notif_neglect_warnings_enabled: bool = True
    notif_streak_risk_enabled: bool = True


def test_master_switch_blocks_everything():
    user = _StubPrefs(notif_push_enabled=False)
    for t in NotificationType:
        assert _is_allowed(user, t) is False


def test_daily_reminder_respects_its_toggle():
    user = _StubPrefs(notif_daily_reminder_enabled=False)
    assert _is_allowed(user, NotificationType.daily_reminder) is False


def test_neglect_warning_respects_its_toggle():
    user = _StubPrefs(notif_neglect_warnings_enabled=False)
    assert _is_allowed(user, NotificationType.neglect_warning) is False


def test_score_critical_uses_streak_risk_toggle():
    """The spec wires SCORE_CRITICAL to the 'streak_risk' user preference."""
    user = _StubPrefs(notif_streak_risk_enabled=False)
    assert _is_allowed(user, NotificationType.score_critical) is False


def test_celebrations_always_pass_when_push_on():
    """Achievements, dependency unblocks, streak successes have no dedicated
    toggle — only the master switch can mute them."""
    user = _StubPrefs()
    for t in (
        NotificationType.achievement_unlocked,
        NotificationType.dependency_unblocked,
        NotificationType.streak_success,
    ):
        assert _is_allowed(user, t) is True


def test_with_default_prefs_all_types_allowed():
    user = _StubPrefs()
    for t in NotificationType:
        assert _is_allowed(user, t) is True
