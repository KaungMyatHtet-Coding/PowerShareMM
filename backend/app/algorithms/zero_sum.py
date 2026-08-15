"""Validated solvers for the explicitly scoped competitive zero-sum subproblem.

The scalar matrix convention is deliberate: each entry is the row player's
payoff and the column player's payoff is its negative.  The non-zero-sum
electricity-sharing bimatrix must never be passed to these functions.
"""

import math
from numbers import Real
from typing import Any, Dict, List, Sequence, Tuple

TOLERANCE = 1e-9


def _finite_number(value: object, field: str) -> float:
    if isinstance(value, bool) or not isinstance(value, Real):
        raise ValueError(f"{field} must be a finite real number")
    numeric_value = float(value)
    if not math.isfinite(numeric_value):
        raise ValueError(f"{field} must be finite")
    return numeric_value


def validate_scalar_zero_sum_matrix(matrix: Sequence[Sequence[object]]) -> List[List[float]]:
    """Validate/copy a scalar row-payoff matrix for a zero-sum game."""
    if isinstance(matrix, (str, bytes)) or not isinstance(matrix, Sequence) or not matrix:
        raise ValueError("Zero-sum payoff matrix must be non-empty")
    if isinstance(matrix[0], (str, bytes)) or not isinstance(matrix[0], Sequence) or not matrix[0]:
        raise ValueError("Zero-sum payoff matrix must contain at least one column")

    column_count = len(matrix[0])
    validated: List[List[float]] = []
    for row_index, row in enumerate(matrix):
        if isinstance(row, (str, bytes)) or not isinstance(row, Sequence):
            raise ValueError(f"Matrix row {row_index} must be a sequence")
        if len(row) != column_count:
            raise ValueError("Zero-sum payoff matrix must be rectangular")
        validated.append(
            [_finite_number(value, f"matrix[{row_index}][{column_index}]") for column_index, value in enumerate(row)]
        )
    return validated


def validate_paired_zero_sum_matrices(
    row_payoffs: Sequence[Sequence[object]],
    column_payoffs: Sequence[Sequence[object]],
    tolerance: float = TOLERANCE,
) -> Tuple[List[List[float]], List[List[float]]]:
    """Validate paired payoffs when a caller explicitly supplies both sides."""
    tolerance = _finite_number(tolerance, "tolerance")
    if tolerance < 0:
        raise ValueError("tolerance must be non-negative")
    validated_rows = validate_scalar_zero_sum_matrix(row_payoffs)
    validated_columns = validate_scalar_zero_sum_matrix(column_payoffs)
    if len(validated_rows) != len(validated_columns) or any(
        len(row) != len(column_row)
        for row, column_row in zip(validated_rows, validated_columns)
    ):
        raise ValueError("Paired zero-sum payoff matrices must have identical shapes")
    for row_index, row in enumerate(validated_rows):
        for column_index, value in enumerate(row):
            if abs(value + validated_columns[row_index][column_index]) > tolerance:
                raise ValueError("Paired payoff matrices are not zero-sum within tolerance")
    return validated_rows, validated_columns


def maximin_minimax(matrix: Sequence[Sequence[object]]) -> Dict[str, Any]:
    validated = validate_scalar_zero_sum_matrix(matrix)
    row_mins = [min(row) for row in validated]
    column_maximums = [max(row[column] for row in validated) for column in range(len(validated[0]))]
    return {
        "row_minimums": row_mins,
        "column_maximums": column_maximums,
        "row_maximin": max(row_mins),
        "column_minimax": min(column_maximums),
    }


def find_saddles(matrix: Sequence[Sequence[object]]) -> List[Tuple[int, int]]:
    validated = validate_scalar_zero_sum_matrix(matrix)
    saddles: List[Tuple[int, int]] = []
    for row_index, row in enumerate(validated):
        row_minimum = min(row)
        for column_index, value in enumerate(row):
            column_maximum = max(candidate[column_index] for candidate in validated)
            if (
                abs(value - row_minimum) <= TOLERANCE
                and abs(value - column_maximum) <= TOLERANCE
            ):
                saddles.append((row_index, column_index))
    return saddles


def solve_mixed_2x2(matrix: Sequence[Sequence[object]]) -> Dict[str, Any]:
    """Solve a non-degenerate 2x2 scalar zero-sum game without a saddle point."""
    validated = validate_scalar_zero_sum_matrix(matrix)
    if len(validated) != 2 or any(len(row) != 2 for row in validated):
        raise ValueError("Mixed strategy calculation is restricted to a 2x2 matrix")

    saddles = find_saddles(validated)
    if saddles:
        raise ValueError("Saddle point exists; a pure strategy is optimal")

    a11, a12 = validated[0]
    a21, a22 = validated[1]
    denominator = a11 - a21 - a12 + a22
    if abs(denominator) <= TOLERANCE:
        raise ValueError("Mixed-strategy denominator is zero; no unique equilibrium exists")

    row_first_probability = (a22 - a21) / denominator
    column_first_probability = (a22 - a12) / denominator
    if not (
        -TOLERANCE <= row_first_probability <= 1.0 + TOLERANCE
        and -TOLERANCE <= column_first_probability <= 1.0 + TOLERANCE
    ):
        raise ValueError("Calculated mixed-strategy probabilities are outside [0, 1]")

    row_first_probability = min(1.0, max(0.0, row_first_probability))
    column_first_probability = min(1.0, max(0.0, column_first_probability))
    row_probabilities = [row_first_probability, 1.0 - row_first_probability]
    column_probabilities = [column_first_probability, 1.0 - column_first_probability]
    if (
        abs(sum(row_probabilities) - 1.0) > TOLERANCE
        or abs(sum(column_probabilities) - 1.0) > TOLERANCE
    ):
        raise ValueError("Mixed-strategy probabilities must total 1")

    return {
        "row_probabilities": row_probabilities,
        "column_probabilities": column_probabilities,
        "game_value": row_first_probability * a11 + (1.0 - row_first_probability) * a21,
    }
