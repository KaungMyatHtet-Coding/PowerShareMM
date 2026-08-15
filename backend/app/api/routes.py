"""V1.1 JSON API routes."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Path, Request

from backend.app.schemas.contracts import (
    ArbitrationRequest,
    CreateScenarioRequest,
    FullAnalysisRequest,
    MatrixRequest,
    RepeatedSimulationRequest,
    ScenarioReferenceRequest,
    UncertaintyRequest,
)
from backend.app.services.analysis_service import AnalysisService, envelope
from backend.app.services.errors import ApiError

router = APIRouter(prefix="/api")


def get_service(request: Request) -> AnalysisService:
    return request.app.state.analysis_service


@router.get("/health")
def health() -> dict:
    return envelope({"status": "OK", "service": "POWERSHARE_MM", "offline_ready": True}, "HEALTH_CHECK")


@router.post("/scenarios", status_code=201)
def create_scenario(request: CreateScenarioRequest, service: AnalysisService = Depends(get_service)) -> dict:
    scenario = service.create_scenario(request.scenario)
    return envelope({"scenario_id": scenario["id"], "scenario": scenario}, "CREATE_SCENARIO")


@router.get("/scenarios/{scenario_id}")
def get_scenario(scenario_id: str = Path(min_length=1), service: AnalysisService = Depends(get_service)) -> dict:
    scenario = service.get_scenario_payload(scenario_id)
    return envelope({"scenario": scenario.model_dump(mode="json")}, "GET_SCENARIO")


@router.post("/analysis/payoffs")
def payoffs(request: ScenarioReferenceRequest, service: AnalysisService = Depends(get_service)) -> dict:
    scenario = service.resolve_scenario(request.scenario_id, request.scenario)
    return envelope(service.payoffs(scenario), "FROZEN_UTILITY_MODEL")


@router.post("/analysis/matrix")
def matrix(request: MatrixRequest, service: AnalysisService = Depends(get_service)) -> dict:
    return envelope(service.matrix_analysis(request.payoff_matrix), "BIMATRIX_ANALYSIS")


@router.post("/analysis/uncertainty")
def uncertainty(request: UncertaintyRequest, service: AnalysisService = Depends(get_service)) -> dict:
    return envelope(service.uncertainty(request.nature_states, request.decisions, request.hurwicz_alpha), "GAMES_AGAINST_NATURE")


@router.post("/analysis/arbitration")
def arbitration(request: ArbitrationRequest, service: AnalysisService = Depends(get_service)) -> dict:
    scenario = service.resolve_scenario(request.scenario_id, request.scenario)
    return envelope(
        service.arbitration(scenario, request.disagreement),
        "NASH_ARBITRATION",
        ["The [0,0] baseline represents shared-arrangement benefits, not complete business financial condition."],
    )


@router.post("/simulations/repeated")
def repeated(request: RepeatedSimulationRequest, service: AnalysisService = Depends(get_service)) -> dict:
    return envelope(
        service.repeated(request.fixture_id, request.player_strategies, request.rounds, request.seed),
        "REPEATED_GAME_SIMULATION",
    )


@router.post("/analysis/full")
def full_analysis(request: FullAnalysisRequest, service: AnalysisService = Depends(get_service)) -> dict:
    scenario = service.resolve_scenario(request.scenario_id, request.scenario)
    data, result_id = service.full_analysis(scenario, request.include_repeated_game, request.repeated_settings)
    response = envelope(
        data,
        "FULL_ANALYSIS",
        ["Utility weights are disclosed prototype assumptions; authoritative values come from the backend engine."],
    )
    response["meta"]["result_id"] = result_id
    return response


@router.get("/results/{result_id}")
def get_result(result_id: str = Path(min_length=1), service: AnalysisService = Depends(get_service)) -> dict:
    result = service.repository.get_result(result_id)
    if result is None:
        raise ApiError("NOT_FOUND", f"Result '{result_id}' was not found.", "result_id", "Run an analysis first.", 404)
    return envelope(result, "GET_RESULT")
