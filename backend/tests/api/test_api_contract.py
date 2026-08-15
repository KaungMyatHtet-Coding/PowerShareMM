"""Contract tests for the V1.1 FastAPI layer."""

from __future__ import annotations

import copy
import json
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from backend.app.main import create_app


ROOT = Path(__file__).resolve().parents[3]
DEMO_SCENARIO = json.loads((ROOT / "sample-data" / "demo-scenario.json").read_text(encoding="utf-8"))


def client() -> TestClient:
    return TestClient(create_app())


def assert_success_envelope(body: dict, method: str) -> None:
    assert set(body) == {"data", "warnings", "meta"}
    assert body["meta"]["method"] == method
    assert body["meta"]["version"] == "v1.1"


def test_health_and_demo_scenario_are_available() -> None:
    with client() as api:
        health = api.get("/api/health")
        assert health.status_code == 200
        assert_success_envelope(health.json(), "HEALTH_CHECK")

        response = api.get("/api/scenarios/demo-shared-power-001")
        assert response.status_code == 200
        assert_success_envelope(response.json(), "GET_SCENARIO")
        assert response.json()["data"]["scenario"]["players"][0]["id"] == "P1"


def test_payoffs_matrix_and_full_analysis_match_v1_1_oracle() -> None:
    with client() as api:
        payoff_response = api.post("/api/analysis/payoffs", json={"scenario_id": "demo-shared-power-001"})
        assert payoff_response.status_code == 200
        payoff = payoff_response.json()
        assert_success_envelope(payoff, "FROZEN_UTILITY_MODEL")
        expected_utilities = [[76.5, 61.5], [66.0, 71.39285714285714], [82.0, 57.5], [66.73076923076923, 60.875]]
        for actual, expected in zip([item["utilities"] for item in payoff["data"]["outcomes"]], expected_utilities):
            assert actual == pytest.approx(expected)

        matrix_response = api.post("/api/analysis/matrix", json={"payoff_matrix": payoff["data"]["payoff_matrix"]})
        assert matrix_response.status_code == 200
        matrix = matrix_response.json()
        assert_success_envelope(matrix, "BIMATRIX_ANALYSIS")
        assert matrix["data"]["pure_nash_equilibria"] == ["MM"]
        assert matrix["data"]["pareto_optimal_outcomes"] == ["CC", "CM", "MC"]
        assert matrix["data"]["prisoners_dilemma"]["detected"] is True

        full_response = api.post("/api/analysis/full", json={"scenario_id": "demo-shared-power-001"})
        assert full_response.status_code == 200
        full = full_response.json()
        assert full["meta"]["method"] == "FULL_ANALYSIS"
        assert full["data"]["arbitration_result"]["selected"]["allocation"]["energy_kwh"] == [5.5, 4.5]
        assert full["data"]["final_recommendation"]["outcome_id"] == "MM"

        result = api.get(f"/api/results/{full['meta']['result_id']}")
        assert result.status_code == 200
        assert_success_envelope(result.json(), "GET_RESULT")


def test_uncertainty_arbitration_and_repeated_contract_results() -> None:
    with client() as api:
        uncertainty = api.post(
            "/api/analysis/uncertainty",
            json={
                "nature_states": [
                    {"id": "SHORT", "probability": 0.3},
                    {"id": "MEDIUM", "probability": 0.5},
                    {"id": "LONG", "probability": 0.2},
                ],
                "decisions": [
                    {"id": "BATTERY_ONLY", "utilities": {"SHORT": 80, "MEDIUM": 55, "LONG": 20}},
                    {"id": "GENERATOR_ONLY", "utilities": {"SHORT": 45, "MEDIUM": 70, "LONG": 75}},
                    {"id": "HYBRID", "utilities": {"SHORT": 65, "MEDIUM": 85, "LONG": 90}},
                ],
                "hurwicz_alpha": 0.6,
            },
        )
        assert uncertainty.status_code == 200
        assert all(method["recommended"] == ["HYBRID"] for method in uncertainty.json()["data"]["methods"])

        arbitration = api.post("/api/analysis/arbitration", json={"scenario_id": "demo-shared-power-001", "disagreement": [0, 0]})
        assert arbitration.status_code == 200
        assert arbitration.json()["data"]["qualifying_candidates_count"] == 10440
        assert arbitration.json()["data"]["selected"]["nash_product"] == 4771.071428571428

        repeated = api.post(
            "/api/simulations/repeated",
            json={"fixture_id": "educational-pd-001", "player_strategies": ["TIT_FOR_TAT", "ALWAYS_CLAIM_MORE"], "rounds": 30, "seed": 42},
        )
        assert repeated.status_code == 200
        assert repeated.json()["data"]["total_payoffs"] == [29.0, 34.0]


def test_invalid_capacity_player_count_and_probability_use_error_envelope() -> None:
    with client() as api:
        invalid_capacity = copy.deepcopy(DEMO_SCENARIO)
        invalid_capacity["resource"]["capacity_kwh"] = 0
        response = api.post("/api/scenarios", json={"scenario": invalid_capacity})
        assert response.status_code == 422
        assert response.json()["error"]["code"] == "INVALID_CAPACITY"
        assert response.json()["error"]["field"] == "scenario.resource.capacity_kwh"

        invalid_players = copy.deepcopy(DEMO_SCENARIO)
        invalid_players["players"] = invalid_players["players"][:1]
        response = api.post("/api/scenarios", json={"scenario": invalid_players})
        assert response.status_code == 422
        assert response.json()["error"]["code"] == "INVALID_PLAYER_COUNT"

        invalid_probabilities = copy.deepcopy(DEMO_SCENARIO)
        invalid_probabilities["uncertainty_fixture"]["nature_states"][0]["probability"] = 0.8
        response = api.post("/api/scenarios", json={"scenario": invalid_probabilities})
        assert response.status_code == 422
        assert response.json()["error"]["code"] == "INVALID_PROBABILITY"


def test_create_conflict_and_not_found_have_stable_errors() -> None:
    with client() as api:
        created = copy.deepcopy(DEMO_SCENARIO)
        created["id"] = "team-created-001"
        response = api.post("/api/scenarios", json={"scenario": created})
        assert response.status_code == 201
        assert_success_envelope(response.json(), "CREATE_SCENARIO")

        conflict = api.post("/api/scenarios", json={"scenario": created})
        assert conflict.status_code == 409
        assert conflict.json()["error"]["code"] == "SCENARIO_ID_CONFLICT"

        missing = api.get("/api/scenarios/no-such-scenario")
        assert missing.status_code == 404
        assert missing.json()["error"]["code"] == "NOT_FOUND"
