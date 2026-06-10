"""Read-side aggregations for the Stats and Dashboard pages.

All queries are scoped by user_id (multi-tenant ready). Historical-trend
queries lean on `area_health_snapshots`; the heatmap reads
`daily_activity_logs`; everything else derives from current task state.
"""

import uuid
from datetime import UTC, date, datetime, timedelta

from sqlalchemy import distinct, func, select
from sqlalchemy.orm import Session

from app.models.area import Area
from app.models.area_health_snapshot import AreaHealthSnapshot
from app.models.daily_activity_log import DailyActivityLog
from app.models.enums import TaskStatus
from app.models.task import Task
from app.models.user import User
from app.schemas.common import AreaSummary
from app.schemas.daily_pool import AreaCompletionPoint, AreaTrendSeries
from app.schemas.stats import (
    HeatmapCell,
    StatsHeatmap,
    StatsSummary,
    StatsTopPerformers,
    StatsTrend,
    TopPerformerEntry,
)


def _today() -> date:
    return datetime.now(UTC).date()


# ---------- summary --------------------------------------------------------


def summary(db: Session, user_id: uuid.UUID) -> StatsSummary:
    today = _today()
    month_start = today.replace(day=1)
    thirty_days_ago = today - timedelta(days=30)

    completed_this_month = (
        db.scalar(
            select(func.count(Task.id)).where(
                Task.user_id == user_id,
                Task.status == TaskStatus.done,
                Task.completed_at.isnot(None),
                func.date(Task.completed_at) >= month_start,
            )
        )
        or 0
    )

    user = db.scalar(select(User).where(User.id == user_id))
    current_streak = user.streak_count if user else 0
    longest_streak = user.longest_streak if user else 0

    # Completion rate over the trailing 30 days: done / created.
    created_30d = (
        db.scalar(
            select(func.count(Task.id)).where(
                Task.user_id == user_id,
                func.date(Task.created_at) >= thirty_days_ago,
            )
        )
        or 0
    )
    done_30d = (
        db.scalar(
            select(func.count(Task.id)).where(
                Task.user_id == user_id,
                Task.status == TaskStatus.done,
                func.date(Task.created_at) >= thirty_days_ago,
            )
        )
        or 0
    )
    completion_rate = (done_30d / created_30d) if created_30d > 0 else 0.0

    # Most active area: highest count of completions this month.
    active_row = db.execute(
        select(Area, func.count(Task.id).label("c"))
        .join(Task, Task.area_id == Area.id)
        .where(
            Area.user_id == user_id,
            Task.status == TaskStatus.done,
            Task.completed_at.isnot(None),
            func.date(Task.completed_at) >= month_start,
        )
        .group_by(Area.id)
        .order_by(func.count(Task.id).desc())
        .limit(1)
    ).first()

    most_active_area = (
        AreaSummary.model_validate(active_row[0]) if active_row else None
    )
    most_active_completions = int(active_row[1]) if active_row else 0

    return StatsSummary(
        completed_this_month=completed_this_month,
        current_streak=current_streak,
        longest_streak=longest_streak,
        completion_rate=round(completion_rate, 3),
        most_active_area=most_active_area,
        most_active_area_completions=most_active_completions,
    )


# ---------- trend ----------------------------------------------------------


def trend(db: Session, user_id: uuid.UUID, days: int) -> StatsTrend:
    """One series per area, from snapshots within the window. Includes
    today's current value as the rightmost point so a freshly created
    area still shows on the chart even without prior snapshots."""
    today = _today()
    earliest = today - timedelta(days=days - 1)

    areas = list(
        db.scalars(select(Area).where(Area.user_id == user_id).order_by(Area.name))
    )

    series_list: list[AreaTrendSeries] = []
    for area in areas:
        snapshots = list(
            db.scalars(
                select(AreaHealthSnapshot)
                .where(
                    AreaHealthSnapshot.area_id == area.id,
                    AreaHealthSnapshot.date >= earliest,
                )
                .order_by(AreaHealthSnapshot.date)
            )
        )
        points = [
            AreaCompletionPoint(date=s.date, health_score=s.health_score)
            for s in snapshots
        ]
        # Ensure today's current score is always last — frontend assumes the
        # right-edge value is "now".
        if not points or points[-1].date != today:
            points.append(
                AreaCompletionPoint(date=today, health_score=area.health_score)
            )
        series_list.append(
            AreaTrendSeries(
                area=AreaSummary.model_validate(area),
                data_points=points,
            )
        )

    return StatsTrend(days=days, series=series_list)


# ---------- heatmap --------------------------------------------------------


def heatmap(db: Session, user_id: uuid.UUID, weeks: int) -> StatsHeatmap:
    today = _today()
    earliest = today - timedelta(days=weeks * 7 - 1)

    rows = list(
        db.scalars(
            select(DailyActivityLog)
            .where(
                DailyActivityLog.user_id == user_id,
                DailyActivityLog.date >= earliest,
            )
            .order_by(DailyActivityLog.date)
        )
    )
    cells = [
        HeatmapCell(date=r.date, tasks_completed=r.tasks_completed) for r in rows
    ]
    return StatsHeatmap(weeks=weeks, cells=cells)


# ---------- top performers -------------------------------------------------


def top_performers(
    db: Session, user_id: uuid.UUID, days: int, limit: int
) -> StatsTopPerformers:
    """Areas ranked by the biggest health-score improvement vs `days` ago.

    Baseline lookup: most recent snapshot whose date <= the window's earliest
    day. Falls back to the area's current score (delta = 0) if no snapshot
    exists yet — common for users who just joined.
    """
    today = _today()
    earliest = today - timedelta(days=days)

    areas = list(db.scalars(select(Area).where(Area.user_id == user_id)))

    entries: list[TopPerformerEntry] = []
    for area in areas:
        baseline = db.scalar(
            select(AreaHealthSnapshot.health_score)
            .where(
                AreaHealthSnapshot.area_id == area.id,
                AreaHealthSnapshot.date <= earliest,
            )
            .order_by(AreaHealthSnapshot.date.desc())
            .limit(1)
        )
        if baseline is None:
            baseline = area.health_score  # no history → no movement to report

        completions = (
            db.scalar(
                select(func.count(Task.id)).where(
                    Task.area_id == area.id,
                    Task.status == TaskStatus.done,
                    Task.completed_at.isnot(None),
                    func.date(Task.completed_at) >= earliest,
                )
            )
            or 0
        )

        entries.append(
            TopPerformerEntry(
                area=AreaSummary.model_validate(area),
                delta=area.health_score - baseline,
                tasks_completed=completions,
            )
        )

    entries.sort(key=lambda e: (e.delta, e.tasks_completed), reverse=True)
    return StatsTopPerformers(days=days, items=entries[:limit])
