"""Best-response, equilibrium, and Prisoner's-Dilemma analysis."""

from typing import Any, Dict, List

from .bimatrix_validation import validate_standard_bimatrix
from .utility import TOLERANCE


def _coordinates(payoff_matrix: Dict[str, Any]):
    row_player, column_player, row_strategies, column_strategies, utilities = validate_standard_bimatrix(payoff_matrix)
    return (
        row_player,
        column_player,
        row_strategies,
        column_strategies,
        {
            (row_strategies[0], column_strategies[0]): utilities["CC"],
            (row_strategies[0], column_strategies[1]): utilities["CM"],
            (row_strategies[1], column_strategies[0]): utilities["MC"],
            (row_strategies[1], column_strategies[1]): utilities["MM"],
        },
        utilities,
    )


def best_responses(payoff_matrix: Dict[str, Any]) -> Dict[str, Any]:
    row_player, column_player, row_strategies, column_strategies, coordinates, _ = _coordinates(payoff_matrix)
    row_best = {
        column: [
            row for row in row_strategies
            if coordinates[(row, column)][0]
            >= max(coordinates[(candidate, column)][0] for candidate in row_strategies) - TOLERANCE
        ]
        for column in column_strategies
    }
    column_best = {
        row: [
            column for column in column_strategies
            if coordinates[(row, column)][1]
            >= max(coordinates[(row, candidate)][1] for candidate in column_strategies) - TOLERANCE
        ]
        for row in row_strategies
    }
    return {row_player: row_best, column_player: column_best}


def pure_nash(payoff_matrix: Dict[str, Any]) -> List[str]:
    row_player, column_player, row_strategies, column_strategies, _, _ = _coordinates(payoff_matrix)
    responses = best_responses(payoff_matrix)
    outcome_coordinates = (
        ("CC", row_strategies[0], column_strategies[0]),
        ("CM", row_strategies[0], column_strategies[1]),
        ("MC", row_strategies[1], column_strategies[0]),
        ("MM", row_strategies[1], column_strategies[1]),
    )
    return [
        outcome_id
        for outcome_id, row, column in outcome_coordinates
        if row in responses[row_player][column] and column in responses[column_player][row]
    ]


def detect_prisoners_dilemma(payoff_matrix: Dict[str, Any]) -> Dict[str, Any]:
    _, _, _, _, _, utilities = _coordinates(payoff_matrix)
    cc, cm, mc, mm = utilities["CC"], utilities["CM"], utilities["MC"], utilities["MM"]
    conditions = (
        (mc[0], cc[0], mm[0], cm[0], "P1"),
        (cm[1], cc[1], mm[1], mc[1], "P2"),
    )
    failures: List[str] = []
    for temptation, reward, punishment, sucker, player_id in conditions:
        if not temptation > reward + TOLERANCE:
            failures.append(f"{player_id}: temptation is not greater than reward")
        if not reward > punishment + TOLERANCE:
            failures.append(f"{player_id}: reward is not greater than punishment")
        if not punishment > sucker + TOLERANCE:
            failures.append(f"{player_id}: punishment is not greater than sucker payoff")
    if not (cc[0] > mm[0] + TOLERANCE and cc[1] > mm[1] + TOLERANCE):
        failures.append("CC does not strictly Pareto-dominate MM")
    return {"detected": not failures, "type": "ASYMMETRIC" if not failures else None, "failed_conditions": failures}
