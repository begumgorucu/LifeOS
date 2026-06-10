"""Schema hardening: CHECK constraints, indexes, updated_at trigger.

Revision ID: 0002
Revises: 0001
Create Date: 2026-06-02

Adds:
  * Range CHECK constraints on health_score and progress (0..100)
  * Self-dependency CHECK on task_dependencies
  * Indexes on hot filter columns (tasks.status/due_at/completed_at, projects.status)
  * Trailing-column indexes on junction tables for reverse lookups
  * A `set_updated_at` PL/pgSQL function + BEFORE UPDATE triggers on the five
    timestamped tables. This guarantees updated_at correctness even when rows
    are modified via raw SQL (bypassing SQLAlchemy's `onupdate=func.now()`).
"""

from typing import Sequence, Union

from alembic import op

revision: str = "0002"
down_revision: Union[str, None] = "0001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


TIMESTAMPED_TABLES = ("users", "areas", "visions", "projects", "tasks")


def upgrade() -> None:
    # ---- CHECK constraints (DB-level data integrity) -----------------------
    op.create_check_constraint(
        "ck_areas_health_score_range",
        "areas",
        "health_score BETWEEN 0 AND 100",
    )
    op.create_check_constraint(
        "ck_projects_progress_range",
        "projects",
        "progress BETWEEN 0 AND 100",
    )
    op.create_check_constraint(
        "ck_task_dependencies_no_self",
        "task_dependencies",
        "task_id <> depends_on_task_id",
    )

    # ---- Indexes for common filter / order-by columns ----------------------
    op.create_index("ix_tasks_status", "tasks", ["status"])
    op.create_index("ix_tasks_due_at", "tasks", ["due_at"])
    op.create_index("ix_tasks_completed_at", "tasks", ["completed_at"])
    op.create_index("ix_projects_status", "projects", ["status"])

    # Trailing-column indexes on M:N tables — the composite PK indexes the
    # leading column only, so reverse lookups (e.g. "all visions for area X")
    # would otherwise scan the whole junction table.
    op.create_index("ix_vision_areas_area_id", "vision_areas", ["area_id"])
    op.create_index(
        "ix_task_dependencies_depends_on_task_id",
        "task_dependencies",
        ["depends_on_task_id"],
    )

    # ---- updated_at auto-bump trigger --------------------------------------
    # One reusable function, then BEFORE UPDATE trigger per timestamped table.
    op.execute(
        """
        CREATE OR REPLACE FUNCTION set_updated_at()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = now();
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
        """
    )
    for table in TIMESTAMPED_TABLES:
        op.execute(
            f"""
            CREATE TRIGGER trg_{table}_set_updated_at
            BEFORE UPDATE ON {table}
            FOR EACH ROW
            EXECUTE FUNCTION set_updated_at();
            """
        )


def downgrade() -> None:
    for table in TIMESTAMPED_TABLES:
        op.execute(f"DROP TRIGGER IF EXISTS trg_{table}_set_updated_at ON {table};")
    op.execute("DROP FUNCTION IF EXISTS set_updated_at();")

    op.drop_index("ix_task_dependencies_depends_on_task_id", table_name="task_dependencies")
    op.drop_index("ix_vision_areas_area_id", table_name="vision_areas")
    op.drop_index("ix_projects_status", table_name="projects")
    op.drop_index("ix_tasks_completed_at", table_name="tasks")
    op.drop_index("ix_tasks_due_at", table_name="tasks")
    op.drop_index("ix_tasks_status", table_name="tasks")

    op.drop_constraint("ck_task_dependencies_no_self", "task_dependencies", type_="check")
    op.drop_constraint("ck_projects_progress_range", "projects", type_="check")
    op.drop_constraint("ck_areas_health_score_range", "areas", type_="check")
