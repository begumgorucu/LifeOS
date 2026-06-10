"""Achievement catalog — static, code-defined list of unlockable badges.

Each entry has:
  * key: stable string id stored in user_achievements.achievement_key
  * name + description + icon: rendered as-is by the UI
  * achievement_type: which progress query to run
  * target: threshold a numeric progress must hit/exceed

Adding a new achievement = appending here. Removing or renaming the `key`
of an existing one is a data-migration event because user_achievements
references it by string. Treat keys as ABI.
"""

from dataclasses import dataclass
from enum import Enum


class AchievementType(str, Enum):
    counter = "counter"          # total done tasks
    streak = "streak"            # longest_streak >= target
    area_score = "area_score"    # any area's current health_score >= target
    early_completions = "early_completions"  # done tasks with hour(completed_at) < 9
    perfect_week = "perfect_week"  # distinct active days in last 7


@dataclass(frozen=True)
class AchievementDef:
    key: str
    name: str
    description: str
    icon: str
    achievement_type: AchievementType
    target: int


ACHIEVEMENTS: tuple[AchievementDef, ...] = (
    AchievementDef(
        key="first_step",
        name="İlk Adım",
        description="İlk görevini tamamla.",
        icon="star",
        achievement_type=AchievementType.counter,
        target=1,
    ),
    AchievementDef(
        key="persistent",
        name="Sebatkar",
        description="10 görev tamamla.",
        icon="check",
        achievement_type=AchievementType.counter,
        target=10,
    ),
    AchievementDef(
        key="hundred_tasks",
        name="İlk 100 Görev",
        description="100 görev tamamla.",
        icon="medal",
        achievement_type=AchievementType.counter,
        target=100,
    ),
    AchievementDef(
        key="streak_7",
        name="7 Günlük Streak",
        description="7 gün üst üste aktif kal.",
        icon="flame",
        achievement_type=AchievementType.streak,
        target=7,
    ),
    AchievementDef(
        key="streak_30",
        name="30 Günlük Streak",
        description="30 gün üst üste aktif kal.",
        icon="flame",
        achievement_type=AchievementType.streak,
        target=30,
    ),
    AchievementDef(
        key="perfect_area",
        name="Mükemmel Alan",
        description="Bir alanı 90+ skora ulaştır.",
        icon="award",
        achievement_type=AchievementType.area_score,
        target=90,
    ),
    AchievementDef(
        key="early_bird",
        name="Erken Kuş",
        description="10 görevi sabah 09:00 öncesinde tamamla.",
        icon="sunrise",
        achievement_type=AchievementType.early_completions,
        target=10,
    ),
    AchievementDef(
        key="perfect_week",
        name="Mükemmel Hafta",
        description="Son 7 günün 5+ gününde aktif ol.",
        icon="calendar",
        achievement_type=AchievementType.perfect_week,
        target=5,
    ),
)


def by_key(key: str) -> AchievementDef | None:
    """Lookup helper used by the read endpoint when joining unlocks back to
    catalog entries."""
    for a in ACHIEVEMENTS:
        if a.key == key:
            return a
    return None
