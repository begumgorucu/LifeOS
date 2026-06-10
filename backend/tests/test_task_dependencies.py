"""Unit tests for the dependency cycle detector.

`detect_cycle` walks the depends_on graph starting from the candidate
dependency and looks for a path back to the task we're updating. We stub
`db.scalars(...).all()` so the BFS exercises the topology we choose, not
actual SQL.
"""

import uuid
from unittest.mock import MagicMock

from app.services import task_service


def _stub_db(edges: dict[uuid.UUID, list[uuid.UUID]]):
    """Build a fake DB whose `scalars(...).all()` returns the neighbors of
    whichever node detect_cycle is currently asking about.

    detect_cycle calls:
        db.scalars(select(task_dependencies.c.depends_on_task_id)
                   .where(task_dependencies.c.task_id == node)).all()

    The .where clause carries a BinaryExpression whose `.right.value` is the
    node UUID. We extract that to return the right neighbors.
    """
    db = MagicMock()

    def scalars(stmt):
        # Pull the bound parameter from the WHERE clause.
        where_clauses = list(stmt.whereclause.get_children())
        node_value = where_clauses[1].value  # right side of the equality
        result = MagicMock()
        result.all.return_value = edges.get(node_value, [])
        return result

    db.scalars.side_effect = scalars
    return db


def test_self_dependency_is_a_cycle():
    db = MagicMock()
    a = uuid.uuid4()
    assert task_service.detect_cycle(db, a, a) is True


def test_no_cycle_in_linear_chain():
    """A -> B -> C  : adding A->B is fine (B doesn't reach A)."""
    a, b, c = uuid.uuid4(), uuid.uuid4(), uuid.uuid4()
    db = _stub_db({b: [c], c: []})
    assert task_service.detect_cycle(db, a, b) is False


def test_two_node_cycle_detected():
    """B already depends on A. Adding A->B would close A->B->A."""
    a, b = uuid.uuid4(), uuid.uuid4()
    db = _stub_db({b: [a]})
    assert task_service.detect_cycle(db, a, b) is True


def test_three_node_cycle_detected():
    """C->A, B->C; adding A->B closes A->B->C->A."""
    a, b, c = uuid.uuid4(), uuid.uuid4(), uuid.uuid4()
    db = _stub_db({b: [c], c: [a]})
    assert task_service.detect_cycle(db, a, b) is True


def test_diamond_graph_no_false_positive():
    """B and C both depend on D. Adding A->B doesn't cycle through D."""
    a, b, c, d = uuid.uuid4(), uuid.uuid4(), uuid.uuid4(), uuid.uuid4()
    db = _stub_db({b: [d], c: [d], d: []})
    assert task_service.detect_cycle(db, a, b) is False
