"""Dominance analysis for the validated standard two-player bimatrix."""

from typing import Any, Dict, List

from .bimatrix_validation import validate_standard_bimatrix
from .utility import TOLERANCE


def find_dominance(payoff_matrix: Dict[str, Any]) -> List[Dict[str, Any]]:
    row_player, column_player, row_strategies, column_strategies, utilities = validate_standard_bimatrix(payoff_matrix)
    coordinates = {
        (row_strategies[0], column_strategies[0]): utilities["CC"],
        (row_strategies[0], column_strategies[1]): utilities["CM"],
        (row_strategies[1], column_strategies[0]): utilities["MC"],
        (row_strategies[1], column_strategies[1]): utilities["MM"],
    }
    dominated: List[Dict[str, Any]] = []
    for strategy in row_strategies:
        alternative = row_strategies[1] if strategy == row_strategies[0] else row_strategies[0]
        differences = [coordinates[(alternative, column)][0] - coordinates[(strategy, column)][0] for column in column_strategies]
        if all(difference > TOLERANCE for difference in differences):
            kind = "STRICT"
        elif all(difference >= -TOLERANCE for difference in differences) and any(difference > TOLERANCE for difference in differences):
            kind = "WEAK"
        else:
            continue
        dominated.append({"player_id": row_player, "strategy": strategy, "dominated_by": alternative, "kind": kind})
    for strategy in column_strategies:
        alternative = column_strategies[1] if strategy == column_strategies[0] else column_strategies[0]
        differences = [coordinates[(row, alternative)][1] - coordinates[(row, strategy)][1] for row in row_strategies]
        if all(difference > TOLERANCE for difference in differences):
            kind = "STRICT"
        elif all(difference >= -TOLERANCE for difference in differences) and any(difference > TOLERANCE for difference in differences):
            kind = "WEAK"
        else:
            continue
        dominated.append({"player_id": column_player, "strategy": strategy, "dominated_by": alternative, "kind": kind})
    return dominated
