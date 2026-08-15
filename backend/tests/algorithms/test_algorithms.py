import copy
import math

import pytest
from backend.app.algorithms.domain import Player, SharedResource, Scenario, UncertaintyFixture, NatureState, Decision
from backend.app.algorithms.utility import score_outcome
from backend.app.algorithms.payoffs import build_bimatrix
from backend.app.algorithms.matrix import find_dominance
from backend.app.algorithms.bimatrix import best_responses, pure_nash, detect_prisoners_dilemma
from backend.app.algorithms.efficiency import pareto_front
from backend.app.algorithms.zero_sum import (
    find_saddles,
    maximin_minimax,
    solve_mixed_2x2,
    validate_paired_zero_sum_matrices,
    validate_scalar_zero_sum_matrix,
)
from backend.app.algorithms.nature import solve_nature
from backend.app.algorithms.arbitration import nash_arbitration
from backend.app.algorithms.repeated import simulate_repeated
from backend.app.algorithms.game_tree import backward_induction
import backend.app.algorithms.arbitration as arbitration_module
import backend.app.algorithms.zero_sum as zero_sum_module

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


def test_payoff_outcome_contract_shape_and_player_input_is_not_mutated(demo_scenario):
    before = copy.deepcopy(demo_scenario)
    outcomes = build_bimatrix(demo_scenario)["outcomes"]
    expected_strategies = {
        "CC": ["COOPERATE", "COOPERATE"],
        "CM": ["COOPERATE", "CLAIM_MORE"],
        "MC": ["CLAIM_MORE", "COOPERATE"],
        "MM": ["CLAIM_MORE", "CLAIM_MORE"],
    }
    expected_keys = {"id", "strategies", "allocation", "cost", "penalties", "utilities", "components"}
    assert [outcome["id"] for outcome in outcomes] == ["CC", "CM", "MC", "MM"]
    for outcome in outcomes:
        assert set(outcome) == expected_keys
        assert outcome["strategies"] == expected_strategies[outcome["id"]]
        assert "actions" not in outcome
    assert demo_scenario == before


@pytest.mark.parametrize(
    ("field", "value", "message"),
    [
        ("outage_loss_mmk", -1.0, "outage_loss_mmk"),
        ("demand_kwh", 0.0, "demand_kwh"),
        ("essential_kwh", 7.0, "essential_kwh"),
        ("desired_hours", 0.0, "desired_hours"),
        ("urgency", 6, "urgency"),
        ("risk_preference", 1.1, "risk_preference"),
        ("preferred_cost_share", -0.1, "preferred_cost_share"),
    ],
)
def test_utility_rejects_invalid_player_fields(demo_scenario, field, value, message):
    player = copy.deepcopy(demo_scenario.players[0])
    setattr(player, field, value)
    with pytest.raises(ValueError, match=message):
        score_outcome(player, 0.0, 0.0, 0.5, 30000.0, 0.0, 0.0)


def test_utility_accepts_zero_outage_loss_and_rejects_nonfinite_values(demo_scenario):
    player = copy.deepcopy(demo_scenario.players[0])
    player.outage_loss_mmk = 0.0
    result = score_outcome(player, 0.0, 0.0, 0.5, 30000.0, 0.0, 0.0)
    assert result["avoided_loss_score"] == 0.0
    with pytest.raises(ValueError, match="allocated_energy"):
        score_outcome(player, math.nan, 0.0, 0.5, 30000.0, 0.0, 0.0)
    with pytest.raises(ValueError, match="cost_share"):
        score_outcome(player, 0.0, 0.0, math.inf, 30000.0, 0.0, 0.0)


def test_payoff_generation_rejects_invalid_ids_without_mutation(demo_scenario):
    invalid = copy.deepcopy(demo_scenario)
    invalid.players[0].id = "MARKET"
    before = copy.deepcopy(invalid)
    with pytest.raises(ValueError, match="player IDs"):
        build_bimatrix(invalid)
    assert invalid == before

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


def _payoff_matrix(cells):
    return {
        "row_player": "P1",
        "column_player": "P2",
        "row_strategies": ["COOPERATE", "CLAIM_MORE"],
        "column_strategies": ["COOPERATE", "CLAIM_MORE"],
        "cells": [{"outcome_id": outcome_id, "utilities": utilities} for outcome_id, utilities in cells.items()],
    }


def test_matrix_analysis_handles_multiple_no_equilibria_ties_and_validation():
    coordination = _payoff_matrix({"CC": [2, 2], "CM": [0, 0], "MC": [0, 0], "MM": [1, 1]})
    assert pure_nash(coordination) == ["CC", "MM"]
    matching_pennies = _payoff_matrix({"CC": [1, -1], "CM": [-1, 1], "MC": [-1, 1], "MM": [1, -1]})
    assert pure_nash(matching_pennies) == []
    ties = _payoff_matrix({"CC": [1, 1], "CM": [1, 0], "MC": [1, 1], "MM": [0, 0]})
    assert best_responses(ties)["P1"]["COOPERATE"] == ["COOPERATE", "CLAIM_MORE"]
    weak = _payoff_matrix({"CC": [1, 0], "CM": [1, 1], "MC": [1, 0], "MM": [2, 1]})
    assert {entry["kind"] for entry in find_dominance(weak)} == {"WEAK", "STRICT"}
    with pytest.raises(ValueError, match="row_player"):
        find_dominance({})
    with pytest.raises(ValueError, match="CC, CM, MC, and MM"):
        pure_nash(_payoff_matrix({"CC": [1, 1]}))


def test_pareto_front_retains_equal_and_incomparable_points():
    outcomes = [
        {"id": "A", "utilities": [5.0, 5.0]},
        {"id": "B", "utilities": [5.0, 5.0]},
        {"id": "C", "utilities": [6.0, 4.0]},
        {"id": "D", "utilities": [4.0, 4.0]},
    ]
    assert pareto_front(outcomes) == ["A", "B", "C"]

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


def test_zero_sum_validation_rejects_malformed_and_nonfinite_inputs():
    assert validate_scalar_zero_sum_matrix([[1, -1], [0, 2]]) == [[1.0, -1.0], [0.0, 2.0]]
    assert validate_paired_zero_sum_matrices([[1, -2]], [[-1, 2]]) == ([[1.0, -2.0]], [[-1.0, 2.0]])
    with pytest.raises(ValueError, match="not zero-sum"):
        validate_paired_zero_sum_matrices([[1]], [[1]])
    for matrix in ([], [[]], [[1, 2], [3]], [[1, "x"]], [[math.nan]], [[math.inf]], [[True]]):
        with pytest.raises(ValueError):
            maximin_minimax(matrix)
    with pytest.raises(ValueError, match="2x2"):
        solve_mixed_2x2([[1, 2, 3], [4, 5, 6]])
    with pytest.raises(ValueError, match="rectangular"):
        solve_mixed_2x2([[1, 2], [3]])


def test_zero_sum_mixed_strategy_reports_degenerate_denominator(monkeypatch):
    monkeypatch.setattr(zero_sum_module, "find_saddles", lambda _matrix: [])
    with pytest.raises(ValueError, match="denominator"):
        solve_mixed_2x2([[1.0, 0.0], [0.0, -1.0]])

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


def test_nature_validation_and_deterministic_ties():
    states = [{"id": "S1", "probability": 0.5}, {"id": "S2", "probability": 0.5}]
    tied_decisions = [
        {"id": "FIRST", "utilities": {"S1": 1.0, "S2": 1.0}},
        {"id": "SECOND", "utilities": {"S1": 1.0, "S2": 1.0}},
    ]
    result = solve_nature(states, tied_decisions, 0.6)
    assert result["methods"][0]["recommended"] == ["FIRST", "SECOND"]
    for invalid_states in (
        [{"id": "S", "probability": 0.4}],
        [{"id": "S", "probability": -0.1}, {"id": "T", "probability": 1.1}],
        [{"id": "S", "probability": math.nan}],
    ):
        with pytest.raises(ValueError):
            solve_nature(invalid_states, tied_decisions, 0.6)
    for alpha in (-0.1, 1.1, math.inf):
        with pytest.raises(ValueError, match="[Hh]urwicz"):
            solve_nature(states, tied_decisions, alpha)

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


def test_nash_arbitration_validation_no_solution_and_deterministic_ties(demo_scenario, monkeypatch):
    no_solution = nash_arbitration(demo_scenario, (101.0, 101.0))
    assert no_solution["no_solution"] is True
    assert no_solution["selected"] is None
    with pytest.raises(ValueError, match="exactly two"):
        nash_arbitration(demo_scenario, (0.0,))
    with pytest.raises(ValueError, match="disagreement_point"):
        nash_arbitration(demo_scenario, (0.0, math.nan))

    monkeypatch.setattr(arbitration_module, "score_outcome", lambda *_args: {"utility": 1.0})
    tied = arbitration_module.nash_arbitration(demo_scenario, (0.0, 0.0))
    assert tied["selected"] is not None
    assert len(tied["ties"]) == tied["qualifying_candidates_count"] - 1
    assert tied["selected"]["candidate_id"] < tied["ties"][0]["candidate_id"] or tied["selected"]["candidate_id"] == "V1_1_ARBITRATION_E0_E0_H0_H0_S0_4"

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


def test_repeated_game_validates_inputs_preserves_fixture_and_freezes_random_oracle():
    matrix = {"CC": [3.0, 3.0], "CM": [0.0, 5.0], "MC": [5.0, 0.0], "MM": [1.0, 1.0]}
    before = copy.deepcopy(matrix)
    random_result = simulate_repeated(matrix, "RANDOM", "ALWAYS_COOPERATE", 10, seed=42)
    assert [round_data["actions"][0] for round_data in random_result["history"]] == [
        "CLAIM_MORE", "COOPERATE", "COOPERATE", "COOPERATE", "CLAIM_MORE",
        "CLAIM_MORE", "CLAIM_MORE", "COOPERATE", "COOPERATE", "COOPERATE",
    ]
    assert random_result["total_payoffs"] == [38.0, 18.0]
    assert matrix == before
    for rounds in (0, -1, 1.5, True):
        with pytest.raises(ValueError, match="rounds"):
            simulate_repeated(matrix, "TIT_FOR_TAT", "TIT_FOR_TAT", rounds)
    with pytest.raises(ValueError, match="Unsupported"):
        simulate_repeated(matrix, "UNKNOWN", "TIT_FOR_TAT")
    with pytest.raises(ValueError, match="payoff_matrix\\[MM\\]"):
        simulate_repeated({"CC": [3, 3], "CM": [0, 5], "MC": [5, 0]}, "TIT_FOR_TAT", "TIT_FOR_TAT")

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
