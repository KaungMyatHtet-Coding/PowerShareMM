"""Response-envelope models used for runtime documentation and OpenAPI."""

from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, ConfigDict


class ResponseModel(BaseModel):
    model_config = ConfigDict(extra="allow")


class ResponseMeta(ResponseModel):
    method: str
    version: Literal["v1.1"]


class ErrorBody(ResponseModel):
    code: str
    message: str
    field: str | None = None
    correction: str | None = None


class ErrorEnvelope(ResponseModel):
    error: ErrorBody


class SuccessEnvelope(ResponseModel):
    data: dict[str, Any]
    warnings: list[str]
    meta: ResponseMeta


class HealthData(ResponseModel):
    status: Literal["OK"]
    service: Literal["POWERSHARE_MM"]
    offline_ready: bool


class HealthEnvelope(ResponseModel):
    data: HealthData
    warnings: list[str]
    meta: ResponseMeta


class FullAnalysisData(ResponseModel):
    scenario_id: str
    payoff_matrix: dict[str, Any]
    outcomes: list[dict[str, Any]]
    dominated_strategies: list[dict[str, Any]]
    best_responses: dict[str, Any]
    pure_nash_equilibria: list[dict[str, Any]]
    pareto_optimal_outcomes: list[dict[str, Any]]
    prisoners_dilemma: dict[str, Any]
    uncertainty_analysis: dict[str, Any]
    arbitration_result: dict[str, Any]
    repeated_game_result: dict[str, Any] | None
    final_recommendation: dict[str, Any]
    explanations: list[str]


class FullAnalysisEnvelope(ResponseModel):
    data: FullAnalysisData
    warnings: list[str]
    meta: ResponseMeta


class StoredResultData(ResponseModel):
    result_id: str
    scenario_id: str
    result_type: str
    result: dict[str, Any]


class StoredResultEnvelope(ResponseModel):
    data: StoredResultData
    warnings: list[str]
    meta: ResponseMeta
