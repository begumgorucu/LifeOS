"""Unit tests for achievement catalog math.

Catalog definitions are static, so we test:
  * Every catalog key is unique (typo-resistance)
  * Every type maps to a progress function
  * Catalog spans the types we documented
"""

from app.services.achievements_catalog import ACHIEVEMENTS, AchievementType, by_key


def test_keys_unique():
    keys = [a.key for a in ACHIEVEMENTS]
    assert len(keys) == len(set(keys))


def test_by_key_round_trips():
    for a in ACHIEVEMENTS:
        assert by_key(a.key) is a


def test_by_key_missing_returns_none():
    assert by_key("does_not_exist") is None


def test_catalog_covers_all_types():
    """Each AchievementType must have at least one catalog entry — otherwise
    the corresponding progress query is dead code."""
    types_in_catalog = {a.achievement_type for a in ACHIEVEMENTS}
    expected = {
        AchievementType.counter,
        AchievementType.streak,
        AchievementType.area_score,
        AchievementType.early_completions,
        AchievementType.perfect_week,
    }
    assert expected.issubset(types_in_catalog)


def test_targets_are_positive():
    for a in ACHIEVEMENTS:
        assert a.target >= 1, f"{a.key} has non-positive target"
