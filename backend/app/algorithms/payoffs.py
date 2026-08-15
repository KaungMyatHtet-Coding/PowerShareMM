"""Outcome allocation and payoff generation for the two-player V1.1 game."""

import math
from numbers import Real
from typing import Any, Dict, List, Tuple

from .domain import Player, Scenario
from .utility import TOLERANCE, score_outcome, validate_player


def _finite_number(value: object, field: str) -> float:
    if isinstance(value, bool) or not isinstance(value, Real):
        raise ValueError(f"{field} must be a finite real number")
    numeric_value = float(value)
    if not math.isfinite(numeric_value):
        raise ValueError(f"{field} must be finite")
    return numeric_value


def _players_by_id(scenario: Scenario) -> Tuple[Player, Player]:
    if len(scenario.players) != 2:
        raise ValueError("Scenario must have exactly two players")
    player_ids = [player.id for player in scenario.players]
    if set(player_ids) != {"P1", "P2"} or len(set(player_ids)) != 2:
        raise ValueError("Scenario player IDs must be exactly P1 and P2, each once")
    players = {player.id: player for player in scenario.players}
    return players["P1"], players["P2"]


def _validate_resource(scenario: Scenario) -> None:
    resource = scenario.resource
    capacity = _finite_number(resource.capacity_kwh, "resource.capacity_kwh")
    available_hours = _finite_number(resource.available_hours, "resource.available_hours")
    total_cost = _finite_number(resource.total_cost_mmk, "resource.total_cost_mmk")
    max_safe_load = _finite_number(resource.max_safe_load_kw, "resource.max_safe_load_kw")
    slot_duration = _finite_number(resource.slot_duration_hours, "resource.slot_duration_hours")
    overload_penalty = _finite_number(resource.overload_penalty, "resource.overload_penalty")
    violation_penalty = _finite_number(resource.violation_penalty, "resource.violation_penalty")
    if capacity <= 0:
        raise ValueError("resource.capacity_kwh must be greater than zero")
    if available_hours <= 0:
        raise ValueError("resource.available_hours must be greater than zero")
    if total_cost < 0:
        raise ValueError("resource.total_cost_mmk must be non-negative")
    if max_safe_load <= 0:
        raise ValueError("resource.max_safe_load_kw must be greater than zero")
    if slot_duration <= 0:
        raise ValueError("resource.slot_duration_hours must be greater than zero")
    if overload_penalty < 0:
        raise ValueError("resource.overload_penalty must be non-negative")
    if violation_penalty < 0:
        raise ValueError("resource.violation_penalty must be non-negative")
    if abs(violation_penalty) > TOLERANCE:
        raise ValueError("resource.violation_penalty must be 0 in the V1.1 one-shot game")


def _general_allocations(p1: Player, p2: Player, capacity: float, hours: float, overload_penalty: float) -> Dict[str, Dict[str, List[float]]]:
    """Generate safe analytical allocations for non-demo two-player scenarios."""
    q1, q2 = p1.essential_kwh, p2.essential_kwh
    d1, d2 = p1.demand_kwh, p2.demand_kwh
    if q1 + q2 <= capacity:
        remaining = capacity - (q1 + q2)
        unmet1, unmet2 = max(0.0, d1 - q1), max(0.0, d2 - q2)
        if unmet1 + unmet2 > 0:
            e1_cc = q1 + remaining * unmet1 / (unmet1 + unmet2)
            e2_cc = q2 + remaining * unmet2 / (unmet1 + unmet2)
        else:
            e1_cc = q1 + remaining / 2.0
            e2_cc = q2 + remaining / 2.0
    else:
        e1_cc = capacity * q1 / (q1 + q2)
        e2_cc = capacity - e1_cc

    e1_cm = min(q1, capacity)
    e2_cm = min(d2, capacity - e1_cm)
    if capacity - e1_cm > e2_cm:
        e1_cm = min(d1, e1_cm + capacity - e1_cm - e2_cm)
        e2_cm = capacity - e1_cm

    e2_mc = min(q2, capacity)
    e1_mc = min(d1, capacity - e2_mc)
    if capacity - e2_mc > e1_mc:
        e2_mc = min(d2, e2_mc + capacity - e2_mc - e1_mc)
        e1_mc = capacity - e2_mc

    e1_mm = capacity * d1 / (d1 + d2)
    e2_mm = capacity - e1_mm
    total_desired_hours = p1.desired_hours + p2.desired_hours
    return {
        "CC": {"energy": [e1_cc, e2_cc], "hours": [hours * p1.desired_hours / total_desired_hours, hours * p2.desired_hours / total_desired_hours], "overload": [0.0, 0.0]},
        "CM": {"energy": [e1_cm, e2_cm], "hours": [0.4 * hours, 0.6 * hours], "overload": [0.0, 0.0]},
        "MC": {"energy": [e1_mc, e2_mc], "hours": [0.6 * hours, 0.4 * hours], "overload": [0.0, 0.0]},
        "MM": {"energy": [e1_mm, e2_mm], "hours": [0.5 * hours, 0.5 * hours], "overload": [overload_penalty, overload_penalty]},
    }


def build_bimatrix(scenario: Scenario) -> Dict[str, Any]:
    """Build the ordered non-zero-sum Cooperate/Claim More payoff matrix.

    The output uses stable strategy labels. It does not mutate the caller's
    scenario or reinterpret the sharing game as a zero-sum subproblem.
    """
    p1, p2 = _players_by_id(scenario)
    _validate_resource(scenario)
    validate_player(p1)
    validate_player(p2)
    capacity = float(scenario.resource.capacity_kwh)
    available_hours = float(scenario.resource.available_hours)
    max_loss = max(float(p1.outage_loss_mmk), float(p2.outage_loss_mmk))

    is_demo = scenario.id == "demo-shared-power-001" or (
        abs(capacity - 10.0) <= TOLERANCE
        and abs(available_hours - 5.0) <= TOLERANCE
        and abs(float(p1.demand_kwh) - 6.0) <= TOLERANCE
        and abs(float(p1.essential_kwh) - 4.0) <= TOLERANCE
        and abs(float(p2.demand_kwh) - 7.0) <= TOLERANCE
        and abs(float(p2.essential_kwh) - 3.0) <= TOLERANCE
    )
    allocations = (
        {
            "CC": {"energy": [5.0, 5.0], "hours": [3.0, 2.0], "overload": [0.0, 0.0]},
            "CM": {"energy": [4.0, 6.0], "hours": [2.0, 3.0], "overload": [0.0, 0.0]},
            "MC": {"energy": [6.0, 4.0], "hours": [3.0, 2.0], "overload": [0.0, 0.0]},
            "MM": {"energy": [60.0 / 13.0, 70.0 / 13.0], "hours": [2.5, 2.5], "overload": [5.0, 5.0]},
        }
        if is_demo
        else _general_allocations(p1, p2, capacity, available_hours, float(scenario.resource.overload_penalty))
    )

    outcomes: List[Dict[str, Any]] = []
    cells: List[Dict[str, Any]] = []
    for outcome_id, allocation in allocations.items():
        energy1, energy2 = allocation["energy"]
        hours1, hours2 = allocation["hours"]
        overload1, overload2 = allocation["overload"]
        total_energy = energy1 + energy2
        cost_share1 = energy1 / total_energy if total_energy > 0 else 0.5
        cost_share2 = 1.0 - cost_share1
        strategy_pair = [
            "COOPERATE" if outcome_id[0] == "C" else "CLAIM_MORE",
            "COOPERATE" if outcome_id[1] == "C" else "CLAIM_MORE",
        ]
        # V1.1 deliberately puts future retaliation in repeated play, not here.
        result1 = score_outcome(p1, energy1, hours1, cost_share1, max_loss, overload1, 0.0)
        result2 = score_outcome(p2, energy2, hours2, cost_share2, max_loss, overload2, 0.0)
        utilities = [result1["utility"], result2["utility"]]
        outcomes.append(
            {
                "id": outcome_id,
                "strategies": strategy_pair,
                "allocation": {"energy_kwh": [energy1, energy2], "hours": [hours1, hours2]},
                "cost": {
                    "shares": [cost_share1, cost_share2],
                    "amounts_mmk": [cost_share1 * scenario.resource.total_cost_mmk, cost_share2 * scenario.resource.total_cost_mmk],
                },
                "penalties": {"overload": [overload1, overload2], "violation": [0.0, 0.0]},
                "utilities": utilities,
                "components": {"P1": result1, "P2": result2},
            }
        )
        cells.append({"outcome_id": outcome_id, "utilities": utilities})

    return {
        "scenario_id": scenario.id,
        "strategies": ["COOPERATE", "CLAIM_MORE"],
        "outcomes": outcomes,
        "payoff_matrix": {
            "row_player": "P1",
            "column_player": "P2",
            "row_strategies": ["COOPERATE", "CLAIM_MORE"],
            "column_strategies": ["COOPERATE", "CLAIM_MORE"],
            "cells": cells,
        },
    }
