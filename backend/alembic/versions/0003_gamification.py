"""Gamification: user streak/xp/level + daily_activity_logs.

Revision ID: 0003
Revises: 0002
Create Date: 2026-06-03

Adds:
  * users: streak_count, streak_last_active_date, longest_streak, xp, level
    columns. All non-negative; xp/streak start at 0, level starts at 1.
  * daily_activity_logs table: one row per (user_id, date) recording how
    many tasks were completed that day. Drives the heatmap, weekly chart,
    streak detection.
  * `set_updated_at` trigger on the new table (consistency with the rest).
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "0003"
down_revision: Union[str, None] = "0002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ---- Users: gamification fields ----------------------------------------
    op.add_column(
        "users",
        sa.Column("streak_count", sa.Integer(), nullable=False, server_default="0"),
    )
    op.add_column(
        "users",
        sa.Column("streak_last_active_date", sa.Date(), nullable=True),
    )
    op.add_column(
        "users",
        sa.Column("longest_streak", sa.Integer(), nullable=False, server_default="0"),
    )
    op.add_column(
        "users",
        sa.Column("xp", sa.Integer(), nullable=False, server_default="0"),
    )
    op.add_column(
        "users",
        sa.Column("level", sa.Integer(), nullable=False, server_default="1"),
    )

    op.create_check_constraint(
        "ck_users_streak_count_nonneg", "users", "streak_count >= 0"
    )
    op.create_check_constraint(
        "ck_users_longest_streak_nonneg", "users", "longest_streak >= 0"
    )
    op.create_check_constraint("ck_users_xp_nonneg", "users", "xp >= 0")
    op.create_check_constraint("ck_users_level_min1", "users", "level >= 1")

    # ---- Daily activity logs -----------------------------------------------
    op.create_table(
        "daily_activity_logs",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("date", sa.Date(), nullable=False),
        sa.Column(
            "tasks_completed", sa.Integer(), nullable=False, server_default="0"
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.UniqueConstraint("user_id", "date", name="uq_daily_activity_logs_user_date"),
        sa.CheckConstraint("tasks_completed >= 0", name="ck_daily_activity_logs_nonneg"),
    )
    op.create_index(
        "ix_daily_activity_logs_user_id", "daily_activity_logs", ["user_id"]
    )
    op.create_index("ix_daily_activity_logs_date", "daily_activity_logs", ["date"])

    # Attach the shared updated_at trigger.
    op.execute(
        """
        CREATE TRIGGER trg_daily_activity_logs_set_updated_at
        BEFORE UPDATE ON daily_activity_logs
        FOR EACH ROW
        EXECUTE FUNCTION set_updated_at();
        """
    )


def downgrade() -> None:
    op.execute(
        "DROP TRIGGER IF EXISTS trg_daily_activity_logs_set_updated_at"
        " ON daily_activity_logs;"
    )
    op.drop_index("ix_daily_activity_logs_date", table_name="daily_activity_logs")
    op.drop_index("ix_daily_activity_logs_user_id", table_name="daily_activity_logs")
    op.drop_table("daily_activity_logs")

    op.drop_constraint("ck_users_level_min1", "users", type_="check")
    op.drop_constraint("ck_users_xp_nonneg", "users", type_="check")
    op.drop_constraint("ck_users_longest_streak_nonneg", "users", type_="check")
    op.drop_constraint("ck_users_streak_count_nonneg", "users", type_="check")

    op.drop_column("users", "level")
    op.drop_column("users", "xp")
    op.drop_column("users", "longest_streak")
    op.drop_column("users", "streak_last_active_date")
    op.drop_column("users", "streak_count")
