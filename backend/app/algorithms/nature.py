from typing import List, Dict, Any

def solve_nature(
    nature_states: List[Dict[str, Any]],
    decisions: List[Dict[str, Any]],
    hurwicz_alpha: float
) -> Dict[str, Any]:
    # Input validations
    if not (0.0 <= hurwicz_alpha <= 1.0 + 1e-9):
        raise ValueError("Hurwicz alpha must be between 0.0 and 1.0")

    if not nature_states:
        raise ValueError("Nature states list cannot be empty")
    if not decisions:
        raise ValueError("Decisions list cannot be empty")

    # Validate probabilities
    total_prob = 0.0
    for state in nature_states:
        p = state.get("probability")
        if p is None:
            raise ValueError(f"Nature state {state.get('id')} has no probability")
        if p < 0.0:
            raise ValueError("Probability cannot be negative")
        total_prob += p

    eps = 1e-9
    if abs(total_prob - 1.0) > eps:
        raise ValueError(f"Probabilities must sum to 1.0 (found sum={total_prob})")

    # Validate decision utilities
    state_ids = [state["id"] for state in nature_states]
    for dec in decisions:
        utils = dec.get("utilities")
        if utils is None:
            raise ValueError(f"Decision {dec.get('id')} has no utilities mapping")
        for s_id in state_ids:
            if s_id not in utils:
                raise ValueError(f"Decision {dec.get('id')} is missing utility for state {s_id}")

    # 1. Expected Value
    ev_scores = {}
    for dec in decisions:
        ev_scores[dec["id"]] = sum(
            state["probability"] * dec["utilities"][state["id"]]
            for state in nature_states
        )
    max_ev = max(ev_scores.values())
    ev_rec = [d_id for d_id, score in ev_scores.items() if score >= max_ev - eps]

    # 2. Wald / Maximin
    wald_scores = {}
    for dec in decisions:
        wald_scores[dec["id"]] = min(dec["utilities"][s_id] for s_id in state_ids)
    max_wald = max(wald_scores.values())
    wald_rec = [d_id for d_id, score in wald_scores.items() if score >= max_wald - eps]

    # 3. Maximax
    maximax_scores = {}
    for dec in decisions:
        maximax_scores[dec["id"]] = max(dec["utilities"][s_id] for s_id in state_ids)
    max_maximax = max(maximax_scores.values())
    maximax_rec = [d_id for d_id, score in maximax_scores.items() if score >= max_maximax - eps]

    # 4. Laplace
    laplace_scores = {}
    n_states = len(state_ids)
    for dec in decisions:
        laplace_scores[dec["id"]] = sum(dec["utilities"][s_id] for s_id in state_ids) / n_states
    max_laplace = max(laplace_scores.values())
    laplace_rec = [d_id for d_id, score in laplace_scores.items() if score >= max_laplace - eps]

    # 5. Minimax Regret
    # Step A: find max utility for each state
    state_max = {}
    for s_id in state_ids:
        state_max[s_id] = max(dec["utilities"][s_id] for dec in decisions)

    # Step B: build regret matrix
    regret_matrix = {}
    for dec in decisions:
        regret_matrix[dec["id"]] = [
            state_max[s_id] - dec["utilities"][s_id] for s_id in state_ids
        ]

    # Step C: minimax regret score (maximum regret for each decision)
    regret_scores = {}
    for dec_id, regrets in regret_matrix.items():
        regret_scores[dec_id] = max(regrets)
    min_regret = min(regret_scores.values())
    regret_rec = [d_id for d_id, score in regret_scores.items() if score <= min_regret + eps]

    # 6. Hurwicz
    hurwicz_scores = {}
    for dec in decisions:
        min_u = min(dec["utilities"][s_id] for s_id in state_ids)
        max_u = max(dec["utilities"][s_id] for s_id in state_ids)
        hurwicz_scores[dec["id"]] = hurwicz_alpha * max_u + (1.0 - hurwicz_alpha) * min_u
    max_hurwicz = max(hurwicz_scores.values())
    hurwicz_rec = [d_id for d_id, score in hurwicz_scores.items() if score >= max_hurwicz - eps]

    # Helper function to find ties (excluding the main recommendation if no ties exist)
    def get_ties(rec_list):
        return rec_list[1:] if len(rec_list) > 1 else []

    methods = [
        {
            "id": "EXPECTED_VALUE",
            "scores": ev_scores,
            "recommended": ev_rec,
            "ties": get_ties(ev_rec),
            "explanation": f"{ev_rec[0]} has the greatest probability-weighted utility."
        },
        {
            "id": "WALD_MAXIMIN",
            "scores": wald_scores,
            "recommended": wald_rec,
            "ties": get_ties(wald_rec),
            "explanation": f"{wald_rec[0]} maximizes the minimum payoff (worst-case scenario)."
        },
        {
            "id": "MAXIMAX",
            "scores": maximax_scores,
            "recommended": maximax_rec,
            "ties": get_ties(maximax_rec),
            "explanation": f"{maximax_rec[0]} maximizes the maximum payoff (best-case scenario)."
        },
        {
            "id": "LAPLACE",
            "scores": laplace_scores,
            "recommended": laplace_rec,
            "ties": get_ties(laplace_rec),
            "explanation": f"{laplace_rec[0]} maximizes the average payoff assuming equal probabilities."
        },
        {
            "id": "MINIMAX_REGRET",
            "scores": regret_scores,
            "recommended": regret_rec,
            "ties": get_ties(regret_rec),
            "explanation": f"{regret_rec[0]} minimizes the maximum regret (opportunistic loss)."
        },
        {
            "id": "HURWICZ",
            "scores": hurwicz_scores,
            "recommended": hurwicz_rec,
            "ties": get_ties(hurwicz_rec),
            "explanation": f"{hurwicz_rec[0]} maximizes the weighted average of best and worst payoffs (alpha={hurwicz_alpha})."
        }
    ]

    return {
        "methods": methods,
        "regret_matrix": regret_matrix
    }
