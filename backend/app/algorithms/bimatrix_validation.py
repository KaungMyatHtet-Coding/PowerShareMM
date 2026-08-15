"""Shared validation for the standard two-player Cooperate/Claim More bimatrix."""

import math
from numbers import Real
from typing import Any, Dict, Mapping, Sequence, Tuple

STANDARD_OUTCOMES = ("CC", "CM", "MC", "MM")


def _finite_number(value: object, field: str) -> float:
    if isinstance(value, bool) or not isinstance(value, Real):
        raise ValueError(f"{field} must be a finite real number")
    numeric_value = float(value)
    if not math.isfinite(numeric_value):
        raise ValueError(f"{field} must be finite")
    return numeric_value


def validate_standard_bimatrix(
    payoff_matrix: Mapping[str, Any],
) -> Tuple[str, str, Sequence[str], Sequence[str], Dict[str, Tuple[float, float]]]:
    """Validate and normalize the frozen standard 2x2 payoff-matrix shape."""
    if not isinstance(payoff_matrix, Mapping):
        raise ValueError("payoff_matrix must be a mapping")
    row_player = payoff_matrix.get("row_player")
    column_player = payoff_matrix.get("column_player")
    if not isinstance(row_player, str) or not isinstance(column_player, str) or not row_player or not column_player:
        raise ValueError("payoff_matrix must define non-empty row_player and column_player")
    row_strategies = payoff_matrix.get("row_strategies")
    column_strategies = payoff_matrix.get("column_strategies")
    for field, strategies in (("row_strategies", row_strategies), ("column_strategies", column_strategies)):
        if (
            isinstance(strategies, (str, bytes))
            or not isinstance(strategies, Sequence)
            or len(strategies) != 2
            or any(not isinstance(strategy, str) or not strategy for strategy in strategies)
            or len(set(strategies)) != 2
        ):
            raise ValueError(f"payoff_matrix.{field} must contain exactly two distinct strategy strings")
    cells = payoff_matrix.get("cells")
    if isinstance(cells, (str, bytes)) or not isinstance(cells, Sequence):
        raise ValueError("payoff_matrix.cells must be a sequence")
    utilities: Dict[str, Tuple[float, float]] = {}
    for cell in cells:
        if not isinstance(cell, Mapping):
            raise ValueError("payoff_matrix.cells entries must be mappings")
        outcome_id = cell.get("outcome_id")
        payoff_pair = cell.get("utilities")
        if outcome_id not in STANDARD_OUTCOMES or outcome_id in utilities:
            raise ValueError("payoff_matrix.cells must contain each standard outcome once")
        if (
            isinstance(payoff_pair, (str, bytes))
            or not isinstance(payoff_pair, Sequence)
            or len(payoff_pair) != 2
        ):
            raise ValueError(f"payoff_matrix cell {outcome_id} must contain two utilities")
        utilities[outcome_id] = (
            _finite_number(payoff_pair[0], f"utilities for {outcome_id}/P1"),
            _finite_number(payoff_pair[1], f"utilities for {outcome_id}/P2"),
        )
    if set(utilities) != set(STANDARD_OUTCOMES):
        raise ValueError("payoff_matrix.cells must include CC, CM, MC, and MM")
    return row_player, column_player, row_strategies, column_strategies, utilities
