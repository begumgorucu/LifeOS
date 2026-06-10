"""Enumerations used across domain models."""

import enum


class TaskStatus(str, enum.Enum):
    todo = "todo"
    in_progress = "in_progress"
    done = "done"
    skipped = "skipped"


class TaskPriority(str, enum.Enum):
    low = "low"
    medium = "medium"
    high = "high"


class ProjectStatus(str, enum.Enum):
    active = "active"
    completed = "completed"
    archived = "archived"


class PoolReason(str, enum.Enum):
    """Why an item ended up in today's pool — drives the UI reason chip."""

    neglected = "neglected"
    deadline = "deadline"
    streak = "streak"
    dependency_ready = "dependency_ready"
    flow = "flow"


class NotificationType(str, enum.Enum):
    """Event taxonomy for the notification feed."""

    neglect_warning = "neglect_warning"
    streak_success = "streak_success"
    daily_reminder = "daily_reminder"
    dependency_unblocked = "dependency_unblocked"
    achievement_unlocked = "achievement_unlocked"
    score_critical = "score_critical"
