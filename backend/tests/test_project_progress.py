"""Unit tests for project progress recomputation.

These exercise the pure ratio math through a minimal stub session so we don't
need a database. The arithmetic is the entire surface we care about.
"""

from dataclasses import dataclass, field
from unittest.mock import MagicMock

import pytest

from app.services import project_service


@dataclass
class _StubProject:
    id: str = "p1"
    progress: int = 0


@pytest.mark.parametrize(
    "done,total,expected",
    [
        (0, 0, 0),     # empty project — no division by zero
        (0, 4, 0),     # nothing done yet
        (1, 4, 25),
        (2, 4, 50),
        (3, 4, 75),    # exact division
        (4, 4, 100),   # all done
        (1, 3, 33),    # rounding (33.33...) → 33
        (2, 3, 67),    # rounding (66.66...) → 67
    ],
)
def test_recompute_progress_ratio(done, total, expected, monkeypatch):
    db = MagicMock()
    project = _StubProject()

    monkeypatch.setattr(project_service, "_task_counts", lambda d, pid: (total, done))

    project_service.recompute_progress(db, project)

    assert project.progress == expected
