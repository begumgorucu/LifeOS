"""Notifications + user notification preferences.

Revision ID: 0005
Revises: 0004
Create Date: 2026-06-03

Adds:
  * `notification_type` enum
  * `notifications` table (event-driven feed; immutable except is_read flips)
  * Six `notif_*` preference columns on users to gate emit() calls
"""

from datetime import time
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "0005"
down_revision: Union[str, None] = "0004"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


NOTIF_TYPES = (
    "neglect_warning",
    "streak_success",
    "daily_reminder",
    "dependency_unblocked",
    "achievement_unlocked",
    "score_critical",
)


def upgrade() -> None:
    # ---- notifications -----------------------------------------------------
    op.create_table(
        "notifications",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "notification_type",
            sa.Enum(*NOTIF_TYPES, name="notification_type"),
            nullable=False,
        ),
        sa.Column("title", sa.String(length=200), nullable=False),
        sa.Column("body", sa.Text(), nullable=True),
        sa.Column("icon", sa.String(length=50), nullable=True),
        sa.Column(
            "area_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("areas.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column(
            "task_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("tasks.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column("link_to", sa.String(length=500), nullable=True),
        sa.Column(
            "is_read", sa.Boolean(), nullable=False, server_default=sa.text("false")
        ),
        sa.Column("read_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )
    op.create_index(
        "ix_notifications_user_id", "notifications", ["user_id"]
    )
    op.create_index(
        "ix_notifications_user_unread_created",
        "notifications",
        ["user_id", "is_read", "created_at"],
    )

    # ---- User notification preferences -------------------------------------
    op.add_column(
        "users",
        sa.Column(
            "notif_daily_reminder_enabled",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("true"),
        ),
    )
    op.add_column(
        "users",
        sa.Column(
            "notif_daily_reminder_time",
            sa.Time(),
            nullable=False,
            server_default=sa.text("'07:30:00'"),
        ),
    )
    op.add_column(
        "users",
        sa.Column(
            "notif_neglect_warnings_enabled",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("true"),
        ),
    )
    op.add_column(
        "users",
        sa.Column(
            "notif_streak_risk_enabled",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("true"),
        ),
    )
    op.add_column(
        "users",
        sa.Column(
            "notif_email_weekly_enabled",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("false"),
        ),
    )
    op.add_column(
        "users",
        sa.Column(
            "notif_push_enabled",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("true"),
        ),
    )


def downgrade() -> None:
    op.drop_column("users", "notif_push_enabled")
    op.drop_column("users", "notif_email_weekly_enabled")
    op.drop_column("users", "notif_streak_risk_enabled")
    op.drop_column("users", "notif_neglect_warnings_enabled")
    op.drop_column("users", "notif_daily_reminder_time")
    op.drop_column("users", "notif_daily_reminder_enabled")

    op.drop_index(
        "ix_notifications_user_unread_created", table_name="notifications"
    )
    op.drop_index("ix_notifications_user_id", table_name="notifications")
    op.drop_table("notifications")

    sa.Enum(name="notification_type").drop(op.get_bind(), checkfirst=True)
