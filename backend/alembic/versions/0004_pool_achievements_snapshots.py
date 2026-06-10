"""Pool, achievements, and area health snapshots.

Revision ID: 0004
Revises: 0003
Create Date: 2026-06-03

Adds:
  * `pool_reason` enum (neglected, deadline, streak, dependency_ready, flow)
  * `daily_pool_items` — one row per slot in today's morning ritual
  * `user_achievements` — sparse table; only inserted on unlock
  * `area_health_snapshots` — per-area daily score samples for trend/top-performer
    queries (sparse: only written on activity, never backfilled)
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "0004"
down_revision: Union[str, None] = "0003"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ---- daily_pool_items --------------------------------------------------
    op.create_table(
        "daily_pool_items",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("date", sa.Date(), nullable=False),
        sa.Column("ordering", sa.Integer(), nullable=False),
        sa.Column(
            "reason",
            sa.Enum(
                "neglected",
                "deadline",
                "streak",
                "dependency_ready",
                "flow",
                name="pool_reason",
            ),
            nullable=False,
        ),
        sa.Column(
            "task_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("tasks.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "approved", sa.Boolean(), nullable=False, server_default=sa.text("false")
        ),
        sa.Column(
            "skipped", sa.Boolean(), nullable=False, server_default=sa.text("false")
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
        sa.UniqueConstraint(
            "user_id", "date", "ordering", name="uq_daily_pool_items_slot"
        ),
        sa.CheckConstraint(
            "ordering BETWEEN 1 AND 5", name="ck_daily_pool_items_slot_range"
        ),
    )
    op.create_index(
        "ix_daily_pool_items_user_date", "daily_pool_items", ["user_id", "date"]
    )
    op.create_index("ix_daily_pool_items_task_id", "daily_pool_items", ["task_id"])
    op.execute(
        """
        CREATE TRIGGER trg_daily_pool_items_set_updated_at
        BEFORE UPDATE ON daily_pool_items
        FOR EACH ROW
        EXECUTE FUNCTION set_updated_at();
        """
    )

    # ---- user_achievements -------------------------------------------------
    op.create_table(
        "user_achievements",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("achievement_key", sa.String(length=50), nullable=False),
        sa.Column(
            "unlocked_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.UniqueConstraint(
            "user_id", "achievement_key", name="uq_user_achievements_user_key"
        ),
    )
    op.create_index(
        "ix_user_achievements_user_id", "user_achievements", ["user_id"]
    )

    # ---- area_health_snapshots --------------------------------------------
    op.create_table(
        "area_health_snapshots",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "area_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("areas.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("date", sa.Date(), nullable=False),
        sa.Column("health_score", sa.Integer(), nullable=False),
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
        sa.UniqueConstraint(
            "area_id", "date", name="uq_area_health_snapshots_area_date"
        ),
        sa.CheckConstraint(
            "health_score BETWEEN 0 AND 100",
            name="ck_area_health_snapshots_score_range",
        ),
    )
    op.create_index(
        "ix_area_health_snapshots_user_id", "area_health_snapshots", ["user_id"]
    )
    op.create_index(
        "ix_area_health_snapshots_date", "area_health_snapshots", ["date"]
    )
    op.execute(
        """
        CREATE TRIGGER trg_area_health_snapshots_set_updated_at
        BEFORE UPDATE ON area_health_snapshots
        FOR EACH ROW
        EXECUTE FUNCTION set_updated_at();
        """
    )


def downgrade() -> None:
    op.execute(
        "DROP TRIGGER IF EXISTS trg_area_health_snapshots_set_updated_at"
        " ON area_health_snapshots;"
    )
    op.drop_index(
        "ix_area_health_snapshots_date", table_name="area_health_snapshots"
    )
    op.drop_index(
        "ix_area_health_snapshots_user_id", table_name="area_health_snapshots"
    )
    op.drop_table("area_health_snapshots")

    op.drop_index("ix_user_achievements_user_id", table_name="user_achievements")
    op.drop_table("user_achievements")

    op.execute(
        "DROP TRIGGER IF EXISTS trg_daily_pool_items_set_updated_at"
        " ON daily_pool_items;"
    )
    op.drop_index("ix_daily_pool_items_task_id", table_name="daily_pool_items")
    op.drop_index("ix_daily_pool_items_user_date", table_name="daily_pool_items")
    op.drop_table("daily_pool_items")

    sa.Enum(name="pool_reason").drop(op.get_bind(), checkfirst=True)
