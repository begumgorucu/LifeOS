"""Pydantic schemas for the Stats endpoints."""

from datetime import date

from pydantic import BaseModel

from app.schemas.common import AreaSummary
from app.schemas.daily_pool import AreaTrendSeries


class StatsSummary(BaseModel):
    """Headline numbers shown on the Dashboard and Stats pages."""

    completed_this_month: int
    current_streak: int
    longest_streak: int
    # 0..1 — fraction of tasks created in the last 30 days that were completed.
    completion_rate: float
    most_active_area: AreaSummary | None
    most_active_area_completions: int


class StatsTrend(BaseModel):
    """One series per area for the requested window."""

    days: int
    series: list[AreaTrendSeries]


class HeatmapCell(BaseModel):
    date: date
    tasks_completed: int


class StatsHeatmap(BaseModel):
    """Flat list of (date, count) for the requested window. The frontend
    arranges them into the 16×7 grid."""

    weeks: int
    cells: list[HeatmapCell]


class TopPerformerEntry(BaseModel):
    area: AreaSummary
    # Change in health score from `from_date` to today (positive = improved).
    delta: int
    # Tasks completed in the window (used as a tiebreaker / UI subtitle).
    tasks_completed: int


class StatsTopPerformers(BaseModel):
    days: int
    items: list[TopPerformerEntry]
