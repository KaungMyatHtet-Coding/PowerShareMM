"""Regression coverage for the API contracts fixed after independent review."""

from __future__ import annotations

import copy
import json
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from backend.app.main import create_app


ROOT = Path(__file__).resolve().parents[3]
DEMO_SCENARIO = json.loads((ROOT / "sample-data" / "demo-scenario.json").read_text(encoding="utf-8"))
MOCK_FULL = json.loads((ROOT / "sample-data" / "mock-full-analysis-response.json").read_text(encoding="utf-8"))["data"]


def client() -> TestClient:
    return TestClient(create_app())


def assert_error(response, status: int, code: str, field: str | None = None) -> None:
    assert response.status_code == status
    assert response.headers["content-type"].startswith("application/json")
    body = response.json()
    assert set(body) == {"error"}
    assert set(body["error"]) == {"code", "message", "field", "correction"}
    assert body["error"]["code"] == code
    assert body["error"]["field"] == field
    assert body["error"]["message"]
    assert body["error"]["correction"]


@pytest.mark.parametrize(
    ("label", "mutate", "code", "field"),
    [
        ("capacity", lambda value: value["resource"].update(capacity_kwh=0), "INVALID_CAPACITY", "scenario.resource.capacity_kwh"),
        ("hours", lambda value: value["resource"].update(available_hours=-1), "INVALID_HOURS", "scenario.resource.available_hours"),
        ("demand", lambda value: value["players"][0].update(demand_kwh=0), "INVALID_DEMAND", "scenario.players.0.demand_kwh"),
        ("essential", lambda value: value["players"][0].update(essential_kwh=7), "INVALID_ESSENTIAL_DEMAND", "scenario.players.0.essential_kwh"),
        ("loss", lambda value: value["players"][0].update(outage_loss_mmk=-1), "INVALID_OUTAGE_LOSS", "scenario.players.0.outage_loss_mmk"),
        ("urgency", lambda value: value["players"][0].update(urgency=6), "INVALID_URGENCY", "scenario.players.0.urgency"),
        ("risk", lambda value: value["players"][0].update(risk_preference=2), "INVALID_RISK_PREFERENCE", "scenario.players.0.risk_preference"),
        ("probability_total", lambda value: value["uncertainty_fixture"]["nature_states"][0].update(probability=0.8), "INVALID_PROBABILITY", "scenario.uncertainty_fixture.nature_states"),
    ],
)
def test_scenario_validation_errors_are_field_aware(label, mutate, code, field) -> None:
    scenario = copy.deepcopy(DEMO_SCENARIO)
    mutate(scenario)
    with client() as api:
        assert_error(api.post("/api/scenarios", json={"scenario": scenario}), 422, code, field)


@pytest.mark.parametrize(
    ("players", "field"),
    [
        ([DEMO_SCENARIO["players"][0]], "scenario"),
        (DEMO_SCENARIO["players"] + [DEMO_SCENARIO["players"][0]], "scenario.players.2.id"),
    ],
)
def test_player_count_errors_are_not_used_for_other_fields(players, field) -> None:
    scenario = copy.deepcopy(DEMO_SCENARIO)
    scenario["players"] = players
    with client() as api:
        assert_error(api.post("/api/scenarios", json={"scenario": scenario}), 422, "INVALID_PLAYER_COUNT", field)


@pytest.mark.parametrize("replacement", ["P1", "P3"])
def test_duplicate_or_unknown_player_identity_is_rejected(replacement) -> None:
    scenario = copy.deepcopy(DEMO_SCENARIO)
    scenario["players"][1]["id"] = replacement
    with client() as api:
        assert_error(api.post("/api/scenarios", json={"scenario": scenario}), 422, "INVALID_PLAYER_COUNT", "scenario.players.1.id")


def test_framework_and_cors_failures_use_the_standard_error_envelope() -> None:
    with client() as api:
        assert_error(api.get("/api/does-not-exist"), 404, "NOT_FOUND", "path")
        assert_error(api.post("/api/health"), 405, "METHOD_NOT_ALLOWED", "method")
        assert_error(api.post("/api/scenarios", content="{", headers={"content-type": "application/json"}), 422, "INVALID_REQUEST", "body")

        allowed = api.options("/api/health", headers={"Origin": "http://localhost:5173", "Access-Control-Request-Method": "GET"})
        assert allowed.status_code == 200
        assert allowed.headers["access-control-allow-origin"] == "http://localhost:5173"

        normal_allowed = api.get("/api/health", headers={"Origin": "http://localhost:5173"})
        assert normal_allowed.headers["access-control-allow-origin"] == "http://localhost:5173"

        rejected = api.options("/api/health", headers={"Origin": "http://evil.example", "Access-Control-Request-Method": "GET"})
        assert_error(rejected, 400, "CORS_ORIGIN_NOT_ALLOWED", "origin")
        assert "access-control-allow-origin" not in rejected.headers


def canonical_generation() -> dict:
    return {
        "p1_energy_kwh": {"min": 0, "max": 6, "step": 0.5},
        "p2_energy_kwh": {"min": 0, "max": 7, "step": 0.5},
        "p1_hours": {"min": 0, "max": 5, "integer": True},
        "p2_hours": {"min": 0, "max": 4, "integer": True},
        "total_energy_kwh_max": 10,
        "total_exclusive_hours_max": 5,
        "p1_cost_shares": [0.4, 0.5, 0.6],
    }


def test_arbitration_generation_is_canonical_or_explicitly_rejected() -> None:
    with client() as api:
        base = {"scenario_id": "demo-shared-power-001", "disagreement": [0, 0]}
        omitted = api.post("/api/analysis/arbitration", json=base)
        canonical = api.post("/api/analysis/arbitration", json={**base, "generation": canonical_generation()})
        assert omitted.status_code == canonical.status_code == 200
        assert canonical.json()["data"]["qualifying_candidates_count"] == 10440
        assert canonical.json()["data"]["selected"]["energy_kwh"] == [5.5, 4.5]

        altered = canonical_generation()
        altered["p1_energy_kwh"]["step"] = 1
        assert_error(api.post("/api/analysis/arbitration", json={**base, "generation": altered}), 422, "UNSUPPORTED_GENERATION_OVERRIDE", "generation.p1_energy_kwh.step")

        zero_step = canonical_generation()
        zero_step["p1_energy_kwh"]["step"] = 0
        assert_error(api.post("/api/analysis/arbitration", json={**base, "generation": zero_step}), 422, "UNSUPPORTED_GENERATION_OVERRIDE", "generation.p1_energy_kwh.step")

        negative_step = canonical_generation()
        negative_step["p1_energy_kwh"]["step"] = -0.5
        assert_error(api.post("/api/analysis/arbitration", json={**base, "generation": negative_step}), 422, "UNSUPPORTED_GENERATION_OVERRIDE", "generation.p1_energy_kwh.step")

        impossible_bounds = canonical_generation()
        impossible_bounds["p2_energy_kwh"] = {"min": 7, "max": 0, "step": 0.5}
        assert_error(api.post("/api/analysis/arbitration", json={**base, "generation": impossible_bounds}), 422, "UNSUPPORTED_GENERATION_OVERRIDE", "generation.p2_energy_kwh")

        excessive_hours = canonical_generation()
        excessive_hours["p1_hours"]["max"] = 6
        assert_error(api.post("/api/analysis/arbitration", json={**base, "generation": excessive_hours}), 422, "UNSUPPORTED_GENERATION_OVERRIDE", "generation.p1_hours.max")

        invalid_shares = canonical_generation()
        invalid_shares["p1_cost_shares"] = [0.4, 1.2]
        assert_error(api.post("/api/analysis/arbitration", json={**base, "generation": invalid_shares}), 422, "UNSUPPORTED_GENERATION_OVERRIDE", "generation.p1_cost_shares")


def test_nature_repeated_and_disagreement_validation_codes() -> None:
    with client() as api:
        uncertainty = {
            "nature_states": [{"id": "SHORT", "probability": 0.8}, {"id": "LONG", "probability": 0.2}],
            "decisions": [{"id": "A", "utilities": {"SHORT": 1, "LONG": 2}}],
            "hurwicz_alpha": 0.6,
        }
        assert_error(api.post("/api/analysis/uncertainty", json={**uncertainty, "hurwicz_alpha": 1.1}), 422, "INVALID_HURWICZ_ALPHA", "hurwicz_alpha")
        uncertainty["nature_states"][0]["probability"] = -0.1
        assert_error(api.post("/api/analysis/uncertainty", json=uncertainty), 422, "INVALID_PROBABILITY", "uncertainty_fixture.nature_states")
        assert_error(api.post("/api/analysis/arbitration", json={"scenario_id": "demo-shared-power-001", "disagreement": [0]}), 422, "INVALID_DISAGREEMENT", "disagreement.1")
        assert_error(api.post("/api/simulations/repeated", json={"player_strategies": ["TIT_FOR_TAT", "ALWAYS_COOPERATE"], "rounds": 0}), 422, "INVALID_ROUNDS", "rounds")


def test_full_analysis_preserves_mock_contract_paths_and_openapi_models() -> None:
    with client() as api:
        response = api.post("/api/analysis/full", json={"scenario_id": "demo-shared-power-001"})
        assert response.status_code == 200
        actual = response.json()["data"]
        for key in ("scenario_id", "outcomes", "payoff_matrix", "dominated_strategies", "best_responses", "pure_nash_equilibria", "pareto_optimal_outcomes", "prisoners_dilemma", "uncertainty_analysis", "arbitration_result", "repeated_game_result", "final_recommendation", "explanations"):
            assert key in actual
        for key in ("allocation", "cost", "penalties", "display_utilities", "feasible"):
            assert key in actual["outcomes"][0]
        for key in ("fixture_type", "probability_total", "hurwicz_alpha", "regret_matrix", "methods"):
            assert key in actual["uncertainty_analysis"]
        assert set(MOCK_FULL["prisoners_dilemma"]).issubset(actual["prisoners_dilemma"])
        assert actual["final_recommendation"]["outcome_id"] is None

        schema = api.get("/openapi.json").json()
        assert len(schema["paths"]) == 10
        assert "$ref" in schema["paths"]["/api/analysis/full"]["post"]["responses"]["200"]["content"]["application/json"]["schema"]
        assert "$ref" in schema["paths"]["/api/results/{result_id}"]["get"]["responses"]["200"]["content"]["application/json"]["schema"]
        assert "$ref" in schema["paths"]["/api/health"]["get"]["responses"]["200"]["content"]["application/json"]["schema"]


def test_repository_lifecycle_closes_sqlite_and_in_memory(monkeypatch, tmp_path) -> None:
    sqlite_path = tmp_path / "nested" / "powershare-review.db"
    monkeypatch.setenv("POWERSHARE_DATABASE_URL", str(sqlite_path))
    app = create_app()
    with TestClient(app) as api:
        full = api.post("/api/analysis/full", json={"scenario_id": "demo-shared-power-001"})
        assert full.status_code == 200
        result_id = full.json()["meta"]["result_id"]
        assert api.get(f"/api/results/{result_id}").status_code == 200
        repository = app.state.analysis_service.repository
        assert repository.closed is False
    assert repository.closed is True
    repository.close()
    sqlite_path.rename(sqlite_path.with_suffix(".renamed"))
    sqlite_path.with_suffix(".renamed").unlink()

    monkeypatch.delenv("POWERSHARE_DATABASE_URL", raising=False)
    memory_app = create_app()
    with TestClient(memory_app) as api:
        assert api.get("/api/health").status_code == 200
        memory_repository = memory_app.state.analysis_service.repository
    assert memory_repository.closed is True
    memory_repository.close()
