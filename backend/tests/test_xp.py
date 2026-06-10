"""Unit tests for XP and level math."""

import pytest

from app.models.enums import TaskPriority
from app.services import xp_service


@pytest.mark.parametrize(
    "priority,bumped,expected",
    [
        (TaskPriority.low, False, 20),
        (TaskPriority.medium, False, 50),
        (TaskPriority.high, False, 100),
        # Streak-day bonus stacks once per completion, regardless of priority.
        (TaskPriority.low, True, 20 + 50),
        (TaskPriority.medium, True, 50 + 50),
        (TaskPriority.high, True, 100 + 50),
    ],
)
def test_xp_for_completion(priority, bumped, expected):
    assert xp_service.xp_for_completion(priority, bumped) == expected


@pytest.mark.parametrize(
    "xp,expected_level",
    [
        (0, 1),
        (1, 1),
        (599, 1),
        (600, 2),
        (1199, 2),
        (1200, 3),
        (2450, 5),   # Begüm's seed in the design data
        (3000, 6),
        (4799, 8),
        (4800, 9),   # past the named tier — caps cosmetically only
    ],
)
def test_level_for_xp(xp, expected_level):
    assert xp_service.level_for_xp(xp) == expected_level


def test_level_names_known_titles():
    assert xp_service.level_name(1) == "Çırak"
    assert xp_service.level_name(3) == "Kâşif"
    assert xp_service.level_name(8) == "Efsane"
    # Cosmetic cap — beyond the named tiers we stick to "Efsane".
    assert xp_service.level_name(99) == "Efsane"


def test_xp_to_next_level_boundary_math():
    # Exact level boundary → distance to the *next* boundary is XP_PER_LEVEL.
    assert xp_service.xp_to_next_level(0) == 600
    assert xp_service.xp_to_next_level(599) == 1
    assert xp_service.xp_to_next_level(600) == 600
    assert xp_service.xp_to_next_level(2450) == 550  # design data: "550 XP kaldı"
