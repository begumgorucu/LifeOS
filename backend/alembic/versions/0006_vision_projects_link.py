"""Add vision_projects junction table.

Revision ID: 0006
Revises: 0005
Create Date: 2026-06-09

Lets a Vision be linked directly to one or more Projects. Used to compute
`vibrance` so that progress on a backing project visibly brightens the
vision pin in the UI.
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0006"
down_revision: Union[str, None] = "0005"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "vision_projects",
        sa.Column(
            "vision_id",
            sa.dialects.postgresql.UUID(as_uuid=True),
            sa.ForeignKey("visions.id", ondelete="CASCADE"),
            primary_key=True,
            nullable=False,
        ),
        sa.Column(
            "project_id",
            sa.dialects.postgresql.UUID(as_uuid=True),
            sa.ForeignKey("projects.id", ondelete="CASCADE"),
            primary_key=True,
            nullable=False,
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )
    op.create_index(
        "ix_vision_projects_project_id",
        "vision_projects",
        ["project_id"],
    )


def downgrade() -> None:
    op.drop_index("ix_vision_projects_project_id", table_name="vision_projects")
    op.drop_table("vision_projects")
