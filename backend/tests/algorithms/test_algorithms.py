import pytest
from backend.app.algorithms.domain import Player, SharedResource, Scenario, UncertaintyFixture, NatureState, Decision
from backend.app.algorithms.utility import score_outcome
from backend.app.algorithms.payoffs import build_bimatrix
from backend.app.algorithms.matrix import find_dominance
from backend.app.algorithms.bimatrix import best_responses, pure_nash, detect_prisoners_dilemma
from backend.app.algorithms.efficiency import pareto_front
from backend.app.algorithms.zero_sum import maximin_minimax, find_saddles, solve_mixed_2x2
from backend.app.algorithms.nature import solve_nature
from backend.app.algorithms.arbitration import nash_arbitration
from backend.app.algorithms.repeated import simulate_repeated
from backend.app.algorithms.game_tree import backward_induction

# --- 1. Utility Scoring and Payoff matrix Tests ---

def test_utility_calculation(demo_scenario):
    p1, p2 = demo_scenario.players[0], demo_scenario.players[1]
    max_loss = max(p1.outage_loss_mmk, p2.outage_loss_mmk)
    eps = 1e-9
    
    # CC case P1
    res_cc_p1 = score_outcome(p1, 5.0, 3.0, 0.5, max_loss, 0.0, 0.0)
    assert abs(res_cc_p1["service_score"] - 83.33333333333333) < eps
    assert abs(res_cc_p1["essential_score"] - 100.0) < eps
    assert abs(res_cc_p1["time_score"] - 60.0) < eps
    assert abs(res_cc_p1["avoided_loss_score"] - 50.0) < eps
    assert abs(res_cc_p1["urgency_score"] - 100.0) < eps
    assert abs(res_cc_p1["cost_burden_score"] - 50.0) < eps
    assert abs(res_cc_p1["utility"] - 76.5) < eps

    # CC case P2
    res_cc_p2 = score_outcome(p2, 5.0, 2.0, 0.5, max_loss, 0.0, 0.0)
    assert abs(res_cc_p2["service_score"] - 71.42857142857143) < eps
    assert abs(res_cc_p2["essential_score"] - 100.0) < eps
    assert abs(res_cc_p2["time_score"] - 50.0) < eps
    assert abs(res_cc_p2["avoided_loss_score"] - 23.80952380952381) < eps
    assert abs(res_cc_p2["urgency_score"] - 60.0) < eps
    assert abs(res_cc_p2["cost_burden_score"] - 50.0) < eps
    assert abs(res_cc_p2["utility"] - 61.5) < eps

    # CM case
    res_cm_p1 = score_outcome(p1, 4.0, 2.0, 0.4, max_loss, 0.0, 0.0)
    assert abs(res_cm_p1["utility"] - 66.0) < eps
    res_cm_p2 = score_outcome(p2, 6.0, 3.0, 0.6, max_loss, 0.0, 0.0)
    assert abs(res_cm_p2["utility"] - 71.39285714285714) < eps

    # MC case
    res_mc_p1 = score_outcome(p1, 6.0, 3.0, 0.6, max_loss, 0.0, 0.0)
    assert abs(res_mc_p1["utility"] - 82.0) < eps
    res_mc_p2 = score_outcome(p2, 4.0, 2.0, 0.4, max_loss, 0.0, 0.0)
    assert abs(res_mc_p2["utility"] - 57.5) < eps

    # MM case
    res_mm_p1 = score_outcome(p1, 60.0/13.0, 2.5, 6.0/13.0, max_loss, 5.0, 0.0)
    assert abs(res_mm_p1["utility"] - 66.73076923076923) < eps
    res_mm_p2 = score_outcome(p2, 70.0/13.0, 2.5, 7.0/13.0, max_loss, 5.0, 0.0)
    assert abs(res_mm_p2["utility"] - 60.875) < eps

def test_build_bimatrix(demo_scenario):
    res = build_bimatrix(demo_scenario)
    assert res["scenario_id"] == "demo-shared-power-001"
    
    # Assert matrix cells
    cells = {c["outcome_id"]: c["utilities"] for c in res["payoff_matrix"]["cells"]}
    eps = 1e-9
    assert abs(cells["CC"][0] - 76.5) < eps
    assert abs(cells["CC"][1] - 61.5) < eps
    assert abs(cells["CM"][0] - 66.0) < eps
    assert abs(cells["CM"][1] - 71.39285714285714) < eps
    assert abs(cells["MC"][0] - 82.0) < eps
    assert abs(cells["MC"][1] - 57.5) < eps
    assert abs(cells["MM"][0] - 66.73076923076923) < eps
    assert abs(cells["MM"][1] - 60.875) < eps

# --- 2. Dominance, Nash, Pareto, and PD Tests ---

def test_dominance_and_nash(demo_scenario):
    matrix_res = build_bimatrix(demo_scenario)
    payoff_matrix = matrix_res["payoff_matrix"]
    
    # 1. Dominance
    dominated = find_dominance(payoff_matrix)
    assert len(dominated) == 2
    # P1 COOPERATE dominated by CLAIM_MORE strictly
    p1_dom = [d for d in dominated if d["player_id"] == "P1"][0]
    assert p1_dom["strategy"] == "COOPERATE"
    assert p1_dom["dominated_by"] == "CLAIM_MORE"
    assert p1_dom["kind"] == "STRICT"

    # P2 COOPERATE dominated by CLAIM_MORE strictly
    p2_dom = [d for d in dominated if d["player_id"] == "P2"][0]
    assert p2_dom["strategy"] == "COOPERATE"
    assert p2_dom["dominated_by"] == "CLAIM_MORE"
    assert p2_dom["kind"] == "STRICT"

    # 2. Pure Nash
    nash = pure_nash(payoff_matrix)
    assert nash == ["MM"]

    # 3. Prisoner's Dilemma
    pd_res = detect_prisoners_dilemma(payoff_matrix)
    assert pd_res["detected"] is True
    assert pd_res["type"] == "ASYMMETRIC"
    assert len(pd_res["failed_conditions"]) == 0

    # 4. Pareto Optimal
    outcomes = matrix_res["outcomes"]
    pareto = pareto_front(outcomes)
    assert set(pareto) == {"CC", "CM", "MC"}
    assert "MM" not in pareto  # CC Pareto-dominates MM

# --- 3. Zero-Sum Subproblem Tests ---

def test_zero_sum_saddle_point():
    # Matrix with saddle point
    # Row Maximin = 1, Col Minimax = 1. Saddle point at (0, 1) with value 1
    m1 = [
        [3.0, 1.0],
        [2.0, 0.0]
    ]
    analysis = maximin_minimax(m1)
    assert analysis["row_maximin"] == 1.0
    assert analysis["column_minimax"] == 1.0
    
    saddles = find_saddles(m1)
    assert saddles == [(0, 1)]
    
    # solve_mixed_2x2 should raise error because saddle point exists
    with pytest.raises(ValueError, match="Saddle point exists"):
        solve_mixed_2x2(m1)

def test_zero_sum_mixed_strategy():
    # Matrix without saddle point
    m2 = [
        [2.0, -1.0],
        [-2.0, 1.0]
    ]
    analysis = maximin_minimax(m2)
    assert analysis["row_maximin"] == -1.0
    assert analysis["column_minimax"] == 1.0
    assert find_saddles(m2) == []
    
    mixed = solve_mixed_2x2(m2)
    eps = 1e-9
    assert abs(mixed["row_probabilities"][0] - 0.5) < eps
    assert abs(mixed["row_probabilities"][1] - 0.5) < eps
    assert abs(mixed["column_probabilities"][0] - 1/3) < eps
    assert abs(mixed["column_probabilities"][1] - 2/3) < eps
    assert abs(mixed["game_value"] - 0.0) < eps

# --- 4. Games Against Nature Tests ---

def test_games_against_nature(demo_scenario):
    unc_fix = demo_scenario.uncertainty_fixture
    
    # Convert dataclasses to dict list for solver
    states = [{"id": s.id, "probability": s.probability} for s in unc_fix.nature_states]
    decisions = [{"id": d.id, "utilities": d.utilities} for d in unc_fix.decisions]
    
    res = solve_nature(states, decisions, unc_fix.hurwicz_alpha)
    eps = 1e-9
    
    # Map method ID to scores & recommendations
    methods = {m["id"]: m for m in res["methods"]}
    
    # Expected Value
    assert abs(methods["EXPECTED_VALUE"]["scores"]["BATTERY_ONLY"] - 55.5) < eps
    assert abs(methods["EXPECTED_VALUE"]["scores"]["GENERATOR_ONLY"] - 63.5) < eps
    assert abs(methods["EXPECTED_VALUE"]["scores"]["HYBRID"] - 80.0) < eps
    assert methods["EXPECTED_VALUE"]["recommended"] == ["HYBRID"]

    # Wald
    assert abs(methods["WALD_MAXIMIN"]["scores"]["BATTERY_ONLY"] - 20.0) < eps
    assert abs(methods["WALD_MAXIMIN"]["scores"]["GENERATOR_ONLY"] - 45.0) < eps
    assert abs(methods["WALD_MAXIMIN"]["scores"]["HYBRID"] - 65.0) < eps
    assert methods["WALD_MAXIMIN"]["recommended"] == ["HYBRID"]

    # Maximax
    assert abs(methods["MAXIMAX"]["scores"]["BATTERY_ONLY"] - 80.0) < eps
    assert abs(methods["MAXIMAX"]["scores"]["GENERATOR_ONLY"] - 75.0) < eps
    assert abs(methods["MAXIMAX"]["scores"]["HYBRID"] - 90.0) < eps
    assert methods["MAXIMAX"]["recommended"] == ["HYBRID"]

    # Laplace
    assert abs(methods["LAPLACE"]["scores"]["BATTERY_ONLY"] - 51.666666666666664) < eps
    assert abs(methods["LAPLACE"]["scores"]["GENERATOR_ONLY"] - 63.333333333333336) < eps
    assert abs(methods["LAPLACE"]["scores"]["HYBRID"] - 80.0) < eps
    assert methods["LAPLACE"]["recommended"] == ["HYBRID"]

    # Minimax Regret (lower is recommended)
    assert abs(methods["MINIMAX_REGRET"]["scores"]["BATTERY_ONLY"] - 70.0) < eps
    assert abs(methods["MINIMAX_REGRET"]["scores"]["GENERATOR_ONLY"] - 35.0) < eps
    assert abs(methods["MINIMAX_REGRET"]["scores"]["HYBRID"] - 15.0) < eps
    assert methods["MINIMAX_REGRET"]["recommended"] == ["HYBRID"]
    
    # Regret Matrix rows check
    assert res["regret_matrix"]["BATTERY_ONLY"] == [0.0, 30.0, 70.0]
    assert res["regret_matrix"]["GENERATOR_ONLY"] == [35.0, 15.0, 15.0]
    assert res["regret_matrix"]["HYBRID"] == [15.0, 0.0, 0.0]

    # Hurwicz alpha=0.6
    assert abs(methods["HURWICZ"]["scores"]["BATTERY_ONLY"] - 56.0) < eps
    assert abs(methods["HURWICZ"]["scores"]["GENERATOR_ONLY"] - 63.0) < eps
    assert abs(methods["HURWICZ"]["scores"]["HYBRID"] - 80.0) < eps
    assert methods["HURWICZ"]["recommended"] == ["HYBRID"]

# --- 5. Nash Arbitration Tests ---

def test_nash_arbitration(demo_scenario):
    res = nash_arbitration(demo_scenario, (0.0, 0.0))
    
    assert res["qualifying_candidates_count"] == 10440
    assert res["no_solution"] is False
    
    selected = res["selected"]
    assert selected is not None
    assert selected["energy_kwh"] == [5.5, 4.5]
    assert selected["hours"] == [2, 3]
    assert selected["cost_shares"] == [0.6, 0.4]
    
    eps = 1e-9
    assert abs(selected["utilities"][0] - 73.0) < eps
    assert abs(selected["utilities"][1] - 65.35714285714286) < eps
    assert abs(selected["nash_product"] - 4771.071428571428) < eps
    assert res["ties"] == []

# --- 6. Repeated Game Tests ---

def test_repeated_game_simulation():
    matrix = {
        "CC": [3.0, 3.0],
        "CM": [0.0, 5.0],
        "MC": [5.0, 0.0],
        "MM": [1.0, 1.0]
    }
    
    # 1. Coop vs Coop
    res_cc = simulate_repeated(matrix, "ALWAYS_COOPERATE", "ALWAYS_COOPERATE", 30)
    assert res_cc["total_payoffs"] == [90.0, 90.0]
    
    # 2. Def vs Def
    res_mm = simulate_repeated(matrix, "ALWAYS_CLAIM_MORE", "ALWAYS_CLAIM_MORE", 30)
    assert res_mm["total_payoffs"] == [30.0, 30.0]
    
    # 3. TFT vs Coop
    res_tft_c = simulate_repeated(matrix, "TIT_FOR_TAT", "ALWAYS_COOPERATE", 30)
    assert res_tft_c["total_payoffs"] == [90.0, 90.0]
    
    # 4. TFT vs Def
    res_tft_m = simulate_repeated(matrix, "TIT_FOR_TAT", "ALWAYS_CLAIM_MORE", 30)
    assert res_tft_m["total_payoffs"] == [29.0, 34.0]
    
    # 5. TFT vs TFT
    res_tft_tft = simulate_repeated(matrix, "TIT_FOR_TAT", "TIT_FOR_TAT", 30)
    assert res_tft_tft["total_payoffs"] == [90.0, 90.0]

    # 6. Seed determinism (Random and Forgiving TFT)
    res_r1 = simulate_repeated(matrix, "RANDOM", "FORGIVING_TIT_FOR_TAT", 30, seed=42)
    res_r2 = simulate_repeated(matrix, "RANDOM", "FORGIVING_TIT_FOR_TAT", 30, seed=42)
    assert res_r1["total_payoffs"] == res_r2["total_payoffs"]
    assert res_r1["history"] == res_r2["history"]

# --- 7. Game Tree Backward Induction ---

def test_backward_induction():
    # small sequential tree:
    # A (P1 choice): Cooperate -> B, Claim -> C
    # B (P2 choice): Accept -> Terminal (76.5, 61.5), Reject -> Terminal (0, 0)
    # C (P2 choice): Accept -> Terminal (82.0, 57.5), Reject -> Terminal (0, 0)
    
    terminal_b1 = {"player_id": "TERMINAL", "id": "term_b1", "payoffs": [76.5, 61.5]}
    terminal_b2 = {"player_id": "TERMINAL", "id": "term_b2", "payoffs": [0.0, 0.0]}
    terminal_c1 = {"player_id": "TERMINAL", "id": "term_c1", "payoffs": [82.0, 57.5]}
    terminal_c2 = {"player_id": "TERMINAL", "id": "term_c2", "payoffs": [0.0, 0.0]}
    
    node_b = {
        "player_id": "P2",
        "id": "node_b",
        "choices": [
            {"action": "ACCEPT", "child": terminal_b1},
            {"action": "REJECT", "child": terminal_b2}
        ]
    }
    
    node_c = {
        "player_id": "P2",
        "id": "node_c",
        "choices": [
            {"action": "ACCEPT", "child": terminal_c1},
            {"action": "REJECT", "child": terminal_c2}
        ]
    }
    
    node_a = {
        "player_id": "P1",
        "id": "node_a",
        "choices": [
            {"action": "COOPERATE", "child": node_b},
            {"action": "CLAIM_MORE", "child": node_c}
        ]
    }
    
    result = backward_induction(node_a)
    
    eps = 1e-9
    # P1 should choose CLAIM_MORE because P2 will choose ACCEPT at both B and C,
    # giving P1 82.0 (at C) vs 76.5 (at B).
    assert result["selected_action"] == "CLAIM_MORE"
    assert abs(result["payoffs"][0] - 82.0) < eps
    assert abs(result["payoffs"][1] - 57.5) < eps
    assert result["path"] == ["node_a", "node_c", "term_c1"]
    
    # Check that node_b choice at node_a was pruned, and REJECT choice at node_c was pruned
    choices_a = {c["action"]: c for c in result["choices"]}
    assert choices_a["COOPERATE"]["status"] == "PRUNED"
    assert choices_a["CLAIM_MORE"]["status"] == "SELECTED"
