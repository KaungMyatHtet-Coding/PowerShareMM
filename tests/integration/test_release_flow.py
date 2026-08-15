"""Person 4 release-boundary checks for the frozen V1.1 demo.

These tests assert transport boundaries and the published oracle. They do not
reimplement any game-theory calculation.
"""

from __future__ import annotations

import copy
import json
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from backend.app.database.repository import LocalRepository
from backend.app.main import create_app


ROOT = Path(__file__).resolve().parents[2]
SCENARIO = json.loads((ROOT / "sample-data" / "demo-scenario.json").read_text(encoding="utf-8"))


def error_shape(response, status: int, code: str, field: str) -> None:
    assert response.status_code == status
    body = response.json()
    assert set(body) == {"error"}
    assert set(body["error"]) == {"code", "message", "field", "correction"}
    assert body["error"]["code"] == code
    assert body["error"]["field"] == field
    assert body["error"]["message"]
    assert body["error"]["correction"]


def test_health_openapi_and_framework_errors_are_release_ready() -> None:
    with TestClient(create_app()) as api:
        health = api.get("/api/health")
        assert health.status_code == 200
        assert health.json()["data"] == {"status": "OK", "service": "POWERSHARE_MM", "offline_ready": True}
        assert health.json()["meta"] == {"method": "HEALTH_CHECK", "version": "v1.1"}

        paths = api.get("/openapi.json").json()["paths"]
        assert len(paths) == 10
        assert {
            "/api/health",
            "/api/scenarios",
            "/api/scenarios/{scenario_id}",
            "/api/analysis/payoffs",
            "/api/analysis/matrix",
            "/api/analysis/uncertainty",
            "/api/analysis/arbitration",
            "/api/simulations/repeated",
            "/api/analysis/full",
            "/api/results/{result_id}",
        } == set(paths)

        error_shape(api.get("/api/not-a-real-path"), 404, "NOT_FOUND", "path")
        error_shape(api.post("/api/health"), 405, "METHOD_NOT_ALLOWED", "method")


def test_full_analysis_matches_frozen_release_oracle() -> None:
    with TestClient(create_app()) as api:
        response = api.post("/api/analysis/full", json={"scenario": SCENARIO, "include_repeated_game": True})
        assert response.status_code == 200
        body = response.json()
        assert set(body) == {"data", "warnings", "meta"}
        assert body["meta"]["method"] == "FULL_ANALYSIS"
        assert body["meta"]["version"] == "v1.1"
        data = body["data"]

        expected = {
            "CC": [76.5, 61.5],
            "CM": [66.0, 71.39285714285714],
            "MC": [82.0, 57.5],
            "MM": [66.73076923076923, 60.875],
        }
        actual = {cell["outcome_id"]: cell["utilities"] for cell in data["payoff_matrix"]["cells"]}
        for outcome_id, utilities in expected.items():
            assert actual[outcome_id] == pytest.approx(utilities, abs=1e-9)

        assert [item["strategy"] for item in data["dominated_strategies"]] == ["COOPERATE", "COOPERATE"]
        assert {item["dominated_by"] for item in data["dominated_strategies"]} == {"CLAIM_MORE"}
        assert [item["outcome_id"] for item in data["pure_nash_equilibria"]] == ["MM"]
        assert [item["outcome_id"] for item in data["pareto_optimal_outcomes"]] == ["CC", "CM", "MC"]
        assert data["prisoners_dilemma"]["detected"] is True
        assert data["prisoners_dilemma"]["type"] == "ASYMMETRIC"
        assert all(method["recommended"] == ["HYBRID"] for method in data["uncertainty_analysis"]["methods"])

        arbitration = data["arbitration_result"]
        selected = arbitration["selected"]
        assert arbitration["qualifying_candidates_count"] == 10440
        assert selected["allocation"]["energy_kwh"] == [5.5, 4.5]
        assert selected["allocation"]["hours"] == [2, 3]
        assert selected["cost_shares"] == [0.6, 0.4]
        assert selected["utilities"] == pytest.approx([73.0, 65.35714285714286], abs=1e-9)
        assert selected["nash_product"] == pytest.approx(4771.071428571428, abs=1e-9)
        assert arbitration["ties"] == []
        assert data["final_recommendation"]["outcome_id"] is None
        assert data["repeated_game_result"] is not None


def test_release_error_envelopes_cover_required_validation_paths() -> None:
    with TestClient(create_app()) as api:
        invalid = copy.deepcopy(SCENARIO)
        invalid["resource"]["capacity_kwh"] = 0
        error_shape(api.post("/api/scenarios", json={"scenario": invalid}), 422, "INVALID_CAPACITY", "scenario.resource.capacity_kwh")

        invalid = copy.deepcopy(SCENARIO)
        invalid["players"][0]["outage_loss_mmk"] = -1
        error_shape(api.post("/api/scenarios", json={"scenario": invalid}), 422, "INVALID_OUTAGE_LOSS", "scenario.players.0.outage_loss_mmk")

        invalid = copy.deepcopy(SCENARIO)
        invalid["players"][0]["essential_kwh"] = 7
        error_shape(api.post("/api/scenarios", json={"scenario": invalid}), 422, "INVALID_ESSENTIAL_DEMAND", "scenario.players.0.essential_kwh")

        invalid = copy.deepcopy(SCENARIO)
        invalid["uncertainty_fixture"]["nature_states"][0]["probability"] = 0.8
        error_shape(api.post("/api/scenarios", json={"scenario": invalid}), 422, "INVALID_PROBABILITY", "scenario.uncertainty_fixture.nature_states")

        uncertainty = {
            "nature_states": [{"id": "SHORT", "probability": 0.3}, {"id": "LONG", "probability": 0.7}],
            "decisions": [{"id": "A", "utilities": {"SHORT": 1, "LONG": 2}}],
            "hurwicz_alpha": 1.1,
        }
        error_shape(api.post("/api/analysis/uncertainty", json=uncertainty), 422, "INVALID_HURWICZ_ALPHA", "hurwicz_alpha")
        error_shape(api.post("/api/analysis/arbitration", json={"scenario_id": SCENARIO["id"], "disagreement": [0]}), 422, "INVALID_DISAGREEMENT", "disagreement.1")
        error_shape(api.post("/api/simulations/repeated", json={"player_strategies": ["TIT_FOR_TAT", "ALWAYS_COOPERATE"], "rounds": 0}), 422, "INVALID_ROUNDS", "rounds")


def test_cors_contract_rejects_unapproved_origin() -> None:
    with TestClient(create_app()) as api:
        allowed = api.options("/api/health", headers={"Origin": "http://localhost:5173", "Access-Control-Request-Method": "GET"})
        assert allowed.status_code == 200
        assert allowed.headers["access-control-allow-origin"] == "http://localhost:5173"
        rejected = api.options("/api/health", headers={"Origin": "http://evil.example", "Access-Control-Request-Method": "GET"})
        error_shape(rejected, 400, "CORS_ORIGIN_NOT_ALLOWED", "origin")


def test_repository_can_be_reopened_and_removed_after_shutdown(tmp_path: Path) -> None:
    database = tmp_path / "nested" / "demo.db"
    repository = LocalRepository(str(database))
    repository.create_scenario({"id": "demo", "value": "offline"})
    assert repository.get_scenario("demo") == {"id": "demo", "value": "offline"}
    repository.save_result("result", "demo", "FULL_ANALYSIS", {"ok": True})
    assert repository.get_result("result")["result"] == {"ok": True}
    repository.close()
    repository.close()
    renamed = database.with_suffix(".closed.db")
    database.rename(renamed)
    renamed.unlink()


def test_frontend_remains_a_backend_authority_client() -> None:
    client = (ROOT / "frontend" / "src" / "api" / "client.ts").read_text(encoding="utf-8")
    app = (ROOT / "frontend" / "src" / "App.tsx").read_text(encoding="utf-8")
    types = (ROOT / "frontend" / "src" / "types.ts").read_text(encoding="utf-8")
    assert "/api/analysis/full" in client
    assert "method: 'POST'" in client
    assert "AbortController" in app
    assert "never falls back silently" in app
    assert "VITE_DEFAULT_MODE === 'mock'" in app
    assert "outcome_id: string | null" in types
    for forbidden in ("service_score", "nash_product =", "0.30 *", "find_dominance", "pure_nash("):
        assert forbidden not in client + app
