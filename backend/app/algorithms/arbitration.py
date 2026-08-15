"""Deterministic Nash-arbitration enumeration for the frozen V1.1 scenario."""

import math
from numbers import Real
from typing import Any, Dict, List, Sequence, Tuple

from .domain import Scenario
from .payoffs import _players_by_id, _validate_resource
from .utility import TOLERANCE, score_outcome, validate_player


def _finite_number(value: object, field: str) -> float:
    if isinstance(value, bool) or not isinstance(value, Real):
        raise ValueError(f"{field} must be a finite real number")
    numeric_value = float(value)
    if not math.isfinite(numeric_value):
        raise ValueError(f"{field} must be finite")
    return numeric_value


def _validated_disagreement(point: Sequence[object]) -> Tuple[float, float]:
    if (
        isinstance(point, (str, bytes))
        or not isinstance(point, Sequence)
        or len(point) != 2
    ):
        raise ValueError("disagreement_point must contain exactly two utilities")
    return (
        _finite_number(point[0], "disagreement_point[0]"),
        _finite_number(point[1], "disagreement_point[1]"),
    )


def _float_str(value: float) -> str:
    if abs(value - int(value)) < TOLERANCE:
        return str(int(value))
    return str(value).replace(".", "_")


def make_candidate_id(energy1: float, energy2: float, hours1: float, hours2: float, cost_share1: float) -> str:
    return (
        f"V1_1_ARBITRATION_E{_float_str(energy1)}_E{_float_str(energy2)}"
        f"_H{_float_str(hours1)}_H{_float_str(hours2)}_S{_float_str(cost_share1)}"
    )


def nash_arbitration(
    scenario: Scenario,
    disagreement_point: Tuple[float, float] = (0.0, 0.0),
) -> Dict[str, Any]:
    """Enumerate feasible V1.1 candidates and maximize the Nash product.

    Valid negotiated candidates have no one-shot overload or violation penalty.
    Candidate and tie order are deterministic because each domain is traversed in
    ascending order.
    """
    p1, p2 = _players_by_id(scenario)
    _validate_resource(scenario)
    validate_player(p1)
    validate_player(p2)
    disagreement1, disagreement2 = _validated_disagreement(disagreement_point)
    capacity = float(scenario.resource.capacity_kwh)
    available_hours = float(scenario.resource.available_hours)
    max_loss = max(float(p1.outage_loss_mmk), float(p2.outage_loss_mmk))

    energy1_values = [round(index * 0.5, 2) for index in range(int(float(p1.demand_kwh) * 2) + 1)]
    energy2_values = [round(index * 0.5, 2) for index in range(int(float(p2.demand_kwh) * 2) + 1)]
    hours1_values = list(range(int(float(p1.desired_hours)) + 1))
    hours2_values = list(range(int(float(p2.desired_hours)) + 1))
    cost_share1_values = [0.4, 0.5, 0.6]

    qualifying_count = 0
    maximum_product = -math.inf
    best_candidates: List[Dict[str, Any]] = []
    for energy1 in energy1_values:
        for energy2 in energy2_values:
            if energy1 + energy2 > capacity + TOLERANCE:
                continue
            for hours1 in hours1_values:
                for hours2 in hours2_values:
                    if hours1 + hours2 > available_hours + TOLERANCE:
                        continue
                    for cost_share1 in cost_share1_values:
                        cost_share2 = 1.0 - cost_share1
                        score1 = score_outcome(p1, energy1, hours1, cost_share1, max_loss, 0.0, 0.0)
                        score2 = score_outcome(p2, energy2, hours2, cost_share2, max_loss, 0.0, 0.0)
                        utility1, utility2 = score1["utility"], score2["utility"]
                        if utility1 < disagreement1 - TOLERANCE or utility2 < disagreement2 - TOLERANCE:
                            continue
                        qualifying_count += 1
                        product = (utility1 - disagreement1) * (utility2 - disagreement2)
                        candidate = {
                            "candidate_id": make_candidate_id(energy1, energy2, hours1, hours2, cost_share1),
                            "energy_kwh": [energy1, energy2],
                            "hours": [hours1, hours2],
                            "cost_shares": [cost_share1, cost_share2],
                            "utilities": [utility1, utility2],
                            "gains": [utility1 - disagreement1, utility2 - disagreement2],
                            "nash_product": product,
                        }
                        if product > maximum_product + TOLERANCE:
                            maximum_product = product
                            best_candidates = [candidate]
                        elif abs(product - maximum_product) <= TOLERANCE:
                            best_candidates.append(candidate)

    if not best_candidates:
        return {
            "disagreement": [disagreement1, disagreement2],
            "selected": None,
            "ties": [],
            "qualifying_candidates_count": qualifying_count,
            "no_solution": True,
            "verification_status": "CANONICAL_V1_1_EXHAUSTIVE",
            "explanations": ["No qualifying agreement found above the disagreement point."],
        }

    return {
        "disagreement": [disagreement1, disagreement2],
        "selected": best_candidates[0],
        "ties": best_candidates[1:],
        "qualifying_candidates_count": qualifying_count,
        "no_solution": False,
        "verification_status": "CANONICAL_V1_1_EXHAUSTIVE",
        "explanations": ["The no-agreement baseline [0,0] is verified on the same utility scale."],
    }
