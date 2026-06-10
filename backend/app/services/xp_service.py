"""XP and level math — pure functions, no DB access."""

from app.models.enums import TaskPriority

# Priority bonuses awarded when a task is marked done.
PRIORITY_XP: dict[TaskPriority, int] = {
    TaskPriority.low: 20,
    TaskPriority.medium: 50,
    TaskPriority.high: 100,
}

# Extra XP added the day the streak advances (any new streak day, including
# the very first one).
STREAK_DAY_BONUS: int = 50

# Distance between levels — kept simple (linear) for MVP. We can swap in a
# curve later (e.g. fibonacci) without touching call sites.
XP_PER_LEVEL: int = 600

# Cosmetic level names. Index 0 = level 1. Beyond the list, "Efsane" sticks.
LEVEL_NAMES: tuple[str, ...] = (
    "Çırak",
    "Gezgin",
    "Kâşif",
    "Yolcu",
    "Usta",
    "Mimar",
    "Bilge",
    "Efsane",
)


def xp_for_completion(priority: TaskPriority, streak_bumped: bool) -> int:
    """Total XP a task is worth, considering streak-day bonus."""
    base = PRIORITY_XP[priority]
    bonus = STREAK_DAY_BONUS if streak_bumped else 0
    return base + bonus


def level_for_xp(xp: int) -> int:
    """Linear curve: level = floor(xp / XP_PER_LEVEL) + 1, minimum 1."""
    return max(1, xp // XP_PER_LEVEL + 1)


def level_name(level: int) -> str:
    """Human-friendly title. Caps at the final entry (no plain numbers shown)."""
    idx = max(0, min(level - 1, len(LEVEL_NAMES) - 1))
    return LEVEL_NAMES[idx]


def xp_to_next_level(xp: int) -> int:
    """How many XP remain until the next level boundary."""
    current_level = level_for_xp(xp)
    next_boundary = current_level * XP_PER_LEVEL
    return max(0, next_boundary - xp)
