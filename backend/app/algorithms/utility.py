"""Utility scoring for the frozen PowerShare MM V1.1 model."""

import math
from numbers import Real
from typing import Dict

from .domain import Player

TOLERANCE = 1e-9


def _finite_number(value: object, field: str) -> float:
    """Return a finite real number, rejecting bools and ambiguous inputs."""
    if isinstance(value, bool) or not isinstance(value, Real):
        raise ValueError(f"{field} must be a finite real number")
    numeric_value = float(value)
    if not math.isfinite(numeric_value):
        raise ValueError(f"{field} must be finite")
    return numeric_value


def validate_player(player: Player) -> None:
    """Validate the player fields used by every authoritative calculation."""
    demand = _finite_number(player.demand_kwh, "player.demand_kwh")
    essential = _finite_number(player.essential_kwh, "player.essential_kwh")
    desired_hours = _finite_number(player.desired_hours, "player.desired_hours")
    outage_loss = _finite_number(player.outage_loss_mmk, "player.outage_loss_mmk")
    urgency = _finite_number(player.urgency, "player.urgency")
    risk_preference = _finite_number(player.risk_preference, "player.risk_preference")
    preferred_cost_share = _finite_number(player.preferred_cost_share, "player.preferred_cost_share")
    if demand <= 0:
        raise ValueError("player.demand_kwh must be greater than zero")
    if not 0 <= essential <= demand + TOLERANCE:
        raise ValueError("player.essential_kwh must be between 0 and demand_kwh")
    if desired_hours <= 0:
        raise ValueError("player.desired_hours must be greater than zero")
    if outage_loss < 0:
        raise ValueError("player.outage_loss_mmk must be non-negative")
    if not urgency.is_integer() or not 1 <= urgency <= 5:
        raise ValueError("player.urgency must be an integer between 1 and 5")
    if not 0.0 <= risk_preference <= 1.0 + TOLERANCE:
        raise ValueError("player.risk_preference must be between 0 and 1")
    if not 0.0 <= preferred_cost_share <= 1.0 + TOLERANCE:
        raise ValueError("player.preferred_cost_share must be between 0 and 1")


def score_outcome(
    player: Player,
    allocated_energy: float,
    allocated_hours: float,
    cost_share: float,
    max_loss: float,
    overload_penalty: float,
    violation_penalty: float,
) -> Dict[str, float]:
    """Calculate one player's V1.1 component scores and clamped utility.

    This is a pure calculation. All values use the frozen shared-contract
    weights; callers must not add or retune penalties outside this function.
    """
    allocated_energy = _finite_number(allocated_energy, "allocated_energy")
    allocated_hours = _finite_number(allocated_hours, "allocated_hours")
    cost_share = _finite_number(cost_share, "cost_share")
    max_loss = _finite_number(max_loss, "max_loss")
    overload_penalty = _finite_number(overload_penalty, "overload_penalty")
    violation_penalty = _finite_number(violation_penalty, "violation_penalty")

    validate_player(player)
    demand = float(player.demand_kwh)
    essential = float(player.essential_kwh)
    desired_hours = float(player.desired_hours)
    outage_loss = float(player.outage_loss_mmk)
    urgency = float(player.urgency)

    if allocated_energy < 0:
        raise ValueError("allocated_energy must be non-negative")
    if allocated_hours < 0:
        raise ValueError("allocated_hours must be non-negative")
    if not 0.0 <= cost_share <= 1.0 + TOLERANCE:
        raise ValueError("cost_share must be between 0 and 1")
    if max_loss < 0:
        raise ValueError("max_loss must be non-negative")
    if overload_penalty < 0:
        raise ValueError("overload_penalty must be non-negative")
    if violation_penalty < 0:
        raise ValueError("violation_penalty must be non-negative")
    service_score = 100.0 * min(allocated_energy / demand, 1.0)
    essential_score = (
        100.0
        if essential == 0
        else 100.0 * min(allocated_energy / essential, 1.0)
    )
    time_score = 100.0 * min(allocated_hours / desired_hours, 1.0)
    avoided_loss_score = (
        0.0
        if max_loss == 0
        else 100.0
        * (outage_loss / max_loss)
        * (service_score / 100.0)
        * (time_score / 100.0)
    )
    urgency_score = 100.0 * (urgency / 5.0) * (essential_score / 100.0)
    cost_burden_score = 100.0 * cost_share
    raw_utility = (
        0.30 * service_score
        + 0.25 * essential_score
        + 0.15 * time_score
        + 0.15 * avoided_loss_score
        + 0.15 * urgency_score
        - 0.10 * cost_burden_score
        - overload_penalty
        - violation_penalty
    )

    return {
        "service_score": service_score,
        "essential_score": essential_score,
        "time_score": time_score,
        "avoided_loss_score": avoided_loss_score,
        "urgency_score": urgency_score,
        "cost_burden_score": cost_burden_score,
        "utility": max(0.0, min(raw_utility, 100.0)),
    }
