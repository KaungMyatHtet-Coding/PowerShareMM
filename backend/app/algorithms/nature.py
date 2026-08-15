"""Games Against Nature criteria for the frozen educational fixture."""

import math
from numbers import Real
from typing import Any, Dict, List, Sequence

TOLERANCE = 1e-9


def _finite_number(value: object, field: str) -> float:
    if isinstance(value, bool) or not isinstance(value, Real):
        raise ValueError(f"{field} must be a finite real number")
    numeric_value = float(value)
    if not math.isfinite(numeric_value):
        raise ValueError(f"{field} must be finite")
    return numeric_value


def solve_nature(
    nature_states: Sequence[Dict[str, Any]],
    decisions: Sequence[Dict[str, Any]],
    hurwicz_alpha: float,
) -> Dict[str, Any]:
    """Calculate six deterministic decision-under-nature criteria.

    Ties retain the caller's decision order, which is the documented stable
    ordering used by the UI and tests.
    """
    alpha = _finite_number(hurwicz_alpha, "hurwicz_alpha")
    if not 0.0 <= alpha <= 1.0:
        raise ValueError("Hurwicz alpha must be between 0 and 1")
    if not nature_states:
        raise ValueError("Nature states list cannot be empty")
    if not decisions:
        raise ValueError("Decisions list cannot be empty")

    state_ids: List[str] = []
    probabilities: Dict[str, float] = {}
    for state in nature_states:
        state_id = state.get("id")
        if not isinstance(state_id, str) or not state_id:
            raise ValueError("Each nature state must have a non-empty id")
        if state_id in probabilities:
            raise ValueError("Nature state IDs must be unique")
        probability = _finite_number(state.get("probability"), f"probability for {state_id}")
        if probability < 0.0:
            raise ValueError("Probability cannot be negative")
        state_ids.append(state_id)
        probabilities[state_id] = probability
    if abs(sum(probabilities.values()) - 1.0) > TOLERANCE:
        raise ValueError(f"Probabilities must sum to 1.0 (found sum={sum(probabilities.values())})")

    decision_values: Dict[str, Dict[str, float]] = {}
    for decision in decisions:
        decision_id = decision.get("id")
        if not isinstance(decision_id, str) or not decision_id:
            raise ValueError("Each decision must have a non-empty id")
        if decision_id in decision_values:
            raise ValueError("Decision IDs must be unique")
        utilities = decision.get("utilities")
        if not isinstance(utilities, dict):
            raise ValueError(f"Decision {decision_id} must have a utilities mapping")
        decision_values[decision_id] = {
            state_id: _finite_number(utilities.get(state_id), f"utility for {decision_id}/{state_id}")
            for state_id in state_ids
        }

    def maxima(scores: Dict[str, float]) -> List[str]:
        best_score = max(scores.values())
        return [decision_id for decision_id, score in scores.items() if score >= best_score - TOLERANCE]

    expected_values = {
        decision_id: sum(probabilities[state_id] * values[state_id] for state_id in state_ids)
        for decision_id, values in decision_values.items()
    }
    wald_scores = {decision_id: min(values.values()) for decision_id, values in decision_values.items()}
    maximax_scores = {decision_id: max(values.values()) for decision_id, values in decision_values.items()}
    laplace_scores = {
        decision_id: sum(values.values()) / len(state_ids)
        for decision_id, values in decision_values.items()
    }
    state_maximums = {
        state_id: max(values[state_id] for values in decision_values.values()) for state_id in state_ids
    }
    regret_matrix = {
        decision_id: [state_maximums[state_id] - values[state_id] for state_id in state_ids]
        for decision_id, values in decision_values.items()
    }
    regret_scores = {decision_id: max(regrets) for decision_id, regrets in regret_matrix.items()}
    minimum_regret = min(regret_scores.values())
    regret_recommendations = [
        decision_id for decision_id, score in regret_scores.items() if score <= minimum_regret + TOLERANCE
    ]
    hurwicz_scores = {
        decision_id: alpha * max(values.values()) + (1.0 - alpha) * min(values.values())
        for decision_id, values in decision_values.items()
    }

    def method(method_id: str, scores: Dict[str, float], recommendations: List[str], explanation: str) -> Dict[str, Any]:
        return {
            "id": method_id,
            "scores": scores,
            "recommended": recommendations,
            "ties": recommendations[1:],
            "explanation": explanation,
        }

    return {
        "methods": [
            method("EXPECTED_VALUE", expected_values, maxima(expected_values), "Highest probability-weighted utility."),
            method("WALD_MAXIMIN", wald_scores, maxima(wald_scores), "Highest worst-case utility."),
            method("MAXIMAX", maximax_scores, maxima(maximax_scores), "Highest best-case utility."),
            method("LAPLACE", laplace_scores, maxima(laplace_scores), "Highest equal-probability average utility."),
            method("MINIMAX_REGRET", regret_scores, regret_recommendations, "Lowest maximum regret."),
            method("HURWICZ", hurwicz_scores, maxima(hurwicz_scores), f"Hurwicz alpha={alpha}."),
        ],
        "regret_matrix": regret_matrix,
    }
