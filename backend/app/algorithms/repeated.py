"""Deterministic repeated two-player games using the educational PD fixture."""

import math
import random
from numbers import Real
from typing import Any, Dict, List, Mapping, Sequence

SUPPORTED_STRATEGIES = {
    "ALWAYS_COOPERATE",
    "ALWAYS_CLAIM_MORE",
    "TIT_FOR_TAT",
    "FORGIVING_TIT_FOR_TAT",
    "RANDOM",
}
_OUTCOME_BY_ACTIONS = {
    ("COOPERATE", "COOPERATE"): "CC",
    ("COOPERATE", "CLAIM_MORE"): "CM",
    ("CLAIM_MORE", "COOPERATE"): "MC",
    ("CLAIM_MORE", "CLAIM_MORE"): "MM",
}


def _finite_number(value: object, field: str) -> float:
    if isinstance(value, bool) or not isinstance(value, Real):
        raise ValueError(f"{field} must be a finite real number")
    numeric_value = float(value)
    if not math.isfinite(numeric_value):
        raise ValueError(f"{field} must be finite")
    return numeric_value


def _validate_payoff_matrix(payoff_matrix: Mapping[str, Sequence[object]]) -> Dict[str, List[float]]:
    if not isinstance(payoff_matrix, Mapping):
        raise ValueError("payoff_matrix must be a mapping")
    validated: Dict[str, List[float]] = {}
    for outcome_id in ("CC", "CM", "MC", "MM"):
        payoffs = payoff_matrix.get(outcome_id)
        if isinstance(payoffs, (str, bytes)) or not isinstance(payoffs, Sequence) or len(payoffs) != 2:
            raise ValueError(f"payoff_matrix[{outcome_id}] must contain exactly two payoffs")
        validated[outcome_id] = [
            _finite_number(payoffs[0], f"payoff_matrix[{outcome_id}][0]"),
            _finite_number(payoffs[1], f"payoff_matrix[{outcome_id}][1]"),
        ]
    return validated


def _next_action(strategy: str, player_index: int, history: List[Dict[str, Any]], rng: random.Random) -> str:
    if strategy == "ALWAYS_COOPERATE":
        return "COOPERATE"
    if strategy == "ALWAYS_CLAIM_MORE":
        return "CLAIM_MORE"
    if strategy == "TIT_FOR_TAT":
        return "COOPERATE" if not history else history[-1]["actions"][1 - player_index]
    if strategy == "FORGIVING_TIT_FOR_TAT":
        if not history or history[-1]["actions"][1 - player_index] == "COOPERATE":
            return "COOPERATE"
        return "COOPERATE" if rng.random() < 0.2 else "CLAIM_MORE"
    # RANDOM uses random() rather than random.choice() so the documented seed-42
    # action sequence is defined by one sequential PRNG draw per RANDOM player.
    return "COOPERATE" if rng.random() < 0.5 else "CLAIM_MORE"


def simulate_repeated(
    payoff_matrix: Mapping[str, Sequence[object]],
    p1_strategy: str,
    p2_strategy: str,
    rounds: int = 30,
    seed: int = 42,
    fixture_id: str = "educational-pd-001",
    is_educational: bool = True,
) -> Dict[str, Any]:
    """Simulate a stage game without mutating its input fixture.

    RNG contract: an isolated ``random.Random(seed)`` instance is used and each
    RANDOM/FORGIVING_TIT_FOR_TAT decision consumes one sequential ``random()``
    draw only when it needs a stochastic choice.
    """
    if isinstance(rounds, bool) or not isinstance(rounds, int) or rounds <= 0:
        raise ValueError("rounds must be a positive integer")
    if isinstance(seed, bool) or not isinstance(seed, int):
        raise ValueError("seed must be an integer")
    if p1_strategy not in SUPPORTED_STRATEGIES or p2_strategy not in SUPPORTED_STRATEGIES:
        raise ValueError("Unsupported repeated game strategy")
    validated_matrix = _validate_payoff_matrix(payoff_matrix)
    rng = random.Random(seed)
    history: List[Dict[str, Any]] = []
    total1 = 0.0
    total2 = 0.0
    cooperation_counts = [0, 0]

    for round_number in range(1, rounds + 1):
        action1 = _next_action(p1_strategy, 0, history, rng)
        action2 = _next_action(p2_strategy, 1, history, rng)
        payoffs = validated_matrix[_OUTCOME_BY_ACTIONS[(action1, action2)]]
        total1 += payoffs[0]
        total2 += payoffs[1]
        cooperation_counts[0] += action1 == "COOPERATE"
        cooperation_counts[1] += action2 == "COOPERATE"
        history.append(
            {
                "round": round_number,
                "actions": [action1, action2],
                "payoffs": list(payoffs),
                "cumulative_payoffs": [total1, total2],
            }
        )

    return {
        "fixture_id": fixture_id,
        "rounds": rounds,
        "seed": seed,
        "player_strategies": [p1_strategy, p2_strategy],
        "history": history,
        "total_payoffs": [total1, total2],
        "average_payoffs": [total1 / rounds, total2 / rounds],
        "cooperation_rates": [cooperation_counts[0] / rounds, cooperation_counts[1] / rounds],
        "educational_fixture": is_educational,
    }
