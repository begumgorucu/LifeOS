"""Pytest fixtures shared across the test suite."""

from datetime import UTC, datetime

import pytest


@pytest.fixture
def now() -> datetime:
    """A fixed reference 'now' so date math in tests is deterministic."""
    return datetime(2026, 6, 1, 12, 0, 0, tzinfo=UTC)
