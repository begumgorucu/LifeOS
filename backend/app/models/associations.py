"""Association tables for many-to-many relationships."""

from sqlalchemy import Column, DateTime, ForeignKey, Table, func
from sqlalchemy.dialects.postgresql import UUID

from app.models.base import Base

# Vision <-> Area (a vision can inspire many areas; an area can belong to many visions)
vision_areas = Table(
    "vision_areas",
    Base.metadata,
    Column(
        "vision_id",
        UUID(as_uuid=True),
        ForeignKey("visions.id", ondelete="CASCADE"),
        primary_key=True,
    ),
    Column(
        "area_id",
        UUID(as_uuid=True),
        ForeignKey("areas.id", ondelete="CASCADE"),
        primary_key=True,
    ),
    Column("created_at", DateTime(timezone=True), server_default=func.now(), nullable=False),
)

# Vision <-> Project (a vision can be backed by several concrete projects;
# a project can serve more than one vision). Drives vibrance: a vision's
# vibrance is pulled directly toward the average progress of its linked
# projects, so completing work on a linked project visibly brightens the
# vision pin in the UI.
vision_projects = Table(
    "vision_projects",
    Base.metadata,
    Column(
        "vision_id",
        UUID(as_uuid=True),
        ForeignKey("visions.id", ondelete="CASCADE"),
        primary_key=True,
    ),
    Column(
        "project_id",
        UUID(as_uuid=True),
        ForeignKey("projects.id", ondelete="CASCADE"),
        primary_key=True,
    ),
    Column("created_at", DateTime(timezone=True), server_default=func.now(), nullable=False),
)

# Task -> Task dependencies (DAG: a task can depend on multiple other tasks)
task_dependencies = Table(
    "task_dependencies",
    Base.metadata,
    Column(
        "task_id",
        UUID(as_uuid=True),
        ForeignKey("tasks.id", ondelete="CASCADE"),
        primary_key=True,
    ),
    Column(
        "depends_on_task_id",
        UUID(as_uuid=True),
        ForeignKey("tasks.id", ondelete="CASCADE"),
        primary_key=True,
    ),
    Column("created_at", DateTime(timezone=True), server_default=func.now(), nullable=False),
)
