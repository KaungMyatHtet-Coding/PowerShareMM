from typing import Dict
from .domain import Player

def score_outcome(
    player: Player,
    allocated_energy: float,
    allocated_hours: float,
    cost_share: float,
    max_loss: float,
    overload_penalty: float,
    violation_penalty: float
) -> Dict[str, float]:
    # Input validation
    if allocated_energy < 0:
        raise ValueError("Allocated energy must be non-negative")
    if allocated_hours < 0:
        raise ValueError("Allocated hours must be non-negative")
    if cost_share < 0 or cost_share > 1.0 + 1e-9:
        raise ValueError("Cost share must be between 0 and 1")
    if max_loss < 0:
        raise ValueError("Max loss must be non-negative")
    if overload_penalty < 0:
        raise ValueError("Overload penalty must be non-negative")
    if violation_penalty < 0:
        raise ValueError("Violation penalty must be non-negative")
    if not (1 <= player.urgency <= 5):
        raise ValueError("Player urgency must be between 1 and 5")
    if not (0.0 <= player.risk_preference <= 1.0 + 1e-9):
        raise ValueError("Player risk preference must be between 0.0 and 1.0")
    if player.demand_kwh <= 0:
        raise ValueError("Player demand must be positive")
    if not (0 <= player.essential_kwh <= player.demand_kwh + 1e-9):
        raise ValueError("Player essential demand must be between 0 and demand")
    if player.desired_hours <= 0:
        raise ValueError("Player desired hours must be positive")

    # Service Score
    service_score = 100.0 * min(allocated_energy / player.demand_kwh, 1.0)

    # Essential Score
    if player.essential_kwh == 0:
        essential_score = 100.0
    else:
        essential_score = 100.0 * min(allocated_energy / player.essential_kwh, 1.0)

    # Time Score
    time_score = 100.0 * min(allocated_hours / player.desired_hours, 1.0)

    # Avoided Loss Score
    if max_loss == 0:
        avoided_loss_score = 0.0
    else:
        avoided_loss_score = 100.0 * (player.outage_loss_mmk / max_loss) * (service_score / 100.0) * (time_score / 100.0)

    # Urgency Score
    urgency_score = 100.0 * (player.urgency / 5.0) * (essential_score / 100.0)

    # Cost Burden Score
    cost_burden_score = 100.0 * cost_share

    # Raw utility calculation
    raw_utility = (
        0.30 * service_score +
        0.25 * essential_score +
        0.15 * time_score +
        0.15 * avoided_loss_score +
        0.15 * urgency_score -
        0.10 * cost_burden_score -
        overload_penalty -
        violation_penalty
    )

    # Clamp utility between 0 and 100
    utility = max(0.0, min(raw_utility, 100.0))

    return {
        "service_score": service_score,
        "essential_score": essential_score,
        "time_score": time_score,
        "avoided_loss_score": avoided_loss_score,
        "urgency_score": urgency_score,
        "cost_burden_score": cost_burden_score,
        "utility": utility
    }
