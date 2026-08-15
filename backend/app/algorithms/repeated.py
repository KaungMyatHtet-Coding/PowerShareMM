import random
from typing import Dict, Any, List, Tuple

def simulate_repeated(
    payoff_matrix: Dict[str, List[float]],
    p1_strategy: str,
    p2_strategy: str,
    rounds: int = 30,
    seed: int = 42,
    fixture_id: str = "educational-pd-001",
    is_educational: bool = True
) -> Dict[str, Any]:
    if rounds <= 0:
        raise ValueError("Rounds must be positive")
        
    supported_strats = {"ALWAYS_COOPERATE", "ALWAYS_CLAIM_MORE", "TIT_FOR_TAT", "FORGIVING_TIT_FOR_TAT", "RANDOM"}
    if p1_strategy not in supported_strats or p2_strategy not in supported_strats:
        raise ValueError("Unsupported repeated game strategy")

    rng = random.Random(seed)
    history = []
    
    cum_p1 = 0.0
    cum_p2 = 0.0
    p1_coop_count = 0
    p2_coop_count = 0
    
    # Run round-by-round simulation
    for t in range(1, rounds + 1):
        # 1. P1 Decision
        p1_action = "COOPERATE"
        if p1_strategy == "ALWAYS_COOPERATE":
            p1_action = "COOPERATE"
        elif p1_strategy == "ALWAYS_CLAIM_MORE":
            p1_action = "CLAIM_MORE"
        elif p1_strategy == "TIT_FOR_TAT":
            if t == 1:
                p1_action = "COOPERATE"
            else:
                p1_action = history[-1]["actions"][1] # mirror P2's last action
        elif p1_strategy == "FORGIVING_TIT_FOR_TAT":
            if t == 1:
                p1_action = "COOPERATE"
            else:
                p2_last_action = history[-1]["actions"][1]
                if p2_last_action == "COOPERATE":
                    p1_action = "COOPERATE"
                else:
                    # Defected last round: forgive with 20% probability
                    if rng.random() < 0.2:
                        p1_action = "COOPERATE"
                    else:
                        p1_action = "CLAIM_MORE"
        elif p1_strategy == "RANDOM":
            p1_action = rng.choice(["COOPERATE", "CLAIM_MORE"])

        # 2. P2 Decision
        p2_action = "COOPERATE"
        if p2_strategy == "ALWAYS_COOPERATE":
            p2_action = "COOPERATE"
        elif p2_strategy == "ALWAYS_CLAIM_MORE":
            p2_action = "CLAIM_MORE"
        elif p2_strategy == "TIT_FOR_TAT":
            if t == 1:
                p2_action = "COOPERATE"
            else:
                p2_action = history[-1]["actions"][0] # mirror P1's last action
        elif p2_strategy == "FORGIVING_TIT_FOR_TAT":
            if t == 1:
                p2_action = "COOPERATE"
            else:
                p1_last_action = history[-1]["actions"][0]
                if p1_last_action == "COOPERATE":
                    p2_action = "COOPERATE"
                else:
                    # Defected last round: forgive with 20% probability
                    if rng.random() < 0.2:
                        p2_action = "COOPERATE"
                    else:
                        p2_action = "CLAIM_MORE"
        elif p2_strategy == "RANDOM":
            p2_action = rng.choice(["COOPERATE", "CLAIM_MORE"])

        # 3. Lookup payoff
        # Map actions to matrix outcome ID
        # CC, CM, MC, MM
        outcome_id = ""
        if p1_action == "COOPERATE" and p2_action == "COOPERATE":
            outcome_id = "CC"
        elif p1_action == "COOPERATE" and p2_action == "CLAIM_MORE":
            outcome_id = "CM"
        elif p1_action == "CLAIM_MORE" and p2_action == "COOPERATE":
            outcome_id = "MC"
        elif p1_action == "CLAIM_MORE" and p2_action == "CLAIM_MORE":
            outcome_id = "MM"
            
        payoff = payoff_matrix.get(outcome_id)
        if payoff is None:
            raise ValueError(f"Payoff matrix is missing outcome {outcome_id}")
            
        p1_payoff, p2_payoff = payoff
        
        cum_p1 += p1_payoff
        cum_p2 += p2_payoff
        
        if p1_action == "COOPERATE":
            p1_coop_count += 1
        if p2_action == "COOPERATE":
            p2_coop_count += 1
            
        history.append({
            "round": t,
            "actions": [p1_action, p2_action],
            "payoffs": [p1_payoff, p2_payoff],
            "cumulative_payoffs": [cum_p1, cum_p2]
        })

    return {
        "fixture_id": fixture_id,
        "rounds": rounds,
        "seed": seed,
        "player_strategies": [p1_strategy, p2_strategy],
        "history": history,
        "total_payoffs": [cum_p1, cum_p2],
        "average_payoffs": [cum_p1 / rounds, cum_p2 / rounds],
        "cooperation_rates": [p1_coop_count / rounds, p2_coop_count / rounds],
        "educational_fixture": is_educational
    }
