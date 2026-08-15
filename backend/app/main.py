"""PowerShare MM FastAPI application factory."""

from __future__ import annotations

import os
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from backend.app.api.cors import ContractCORSMiddleware
from backend.app.api.routes import router
from backend.app.services.analysis_service import AnalysisService
from backend.app.services.errors import ApiError


def _error_response(code: str, message: str, field: str | None, correction: str | None, status_code: int) -> JSONResponse:
    return JSONResponse(
        status_code=status_code,
        content={"error": {"code": code, "message": message, "field": field, "correction": correction}},
    )


def _validation_error(request: Request, error: RequestValidationError) -> JSONResponse:
    """Map the first deterministic Pydantic error by location and endpoint."""
    first = error.errors()[0]
    location_parts = [str(part) for part in first.get("loc", ()) if part != "body"]
    location = ".".join(location_parts) or "body"
    message = first.get("msg", "Invalid request.")
    error_type = first.get("type", "")
    lower_message = message.lower()

    code = "INVALID_REQUEST"
    correction = "Correct the invalid field and try again."
    field = location

    if error_type == "json_invalid":
        field = "body"
        correction = "Send valid JSON matching the documented request shape."
    elif location.startswith("generation"):
        code = "UNSUPPORTED_GENERATION_OVERRIDE"
        correction = "Use the exact frozen V1.1 arbitration generation settings."
    elif location.endswith("capacity_kwh"):
        code = "INVALID_CAPACITY"
        correction = "Enter a number greater than zero."
    elif location.endswith("available_hours") or location.endswith("desired_hours") or location.endswith("slot_duration_hours"):
        code = "INVALID_HOURS"
        correction = "Enter a number greater than zero within the scheduling limits."
    elif location.endswith("demand_kwh"):
        code = "INVALID_DEMAND"
        correction = "Enter a demand greater than zero."
    elif location.endswith("essential_kwh") or "essential_kwh" in lower_message:
        code = "INVALID_ESSENTIAL_DEMAND"
        field = location if location.endswith("essential_kwh") else f"{location}.essential_kwh"
        correction = "Enter essential demand from zero through the player's demand."
    elif location.endswith("outage_loss_mmk"):
        code = "INVALID_OUTAGE_LOSS"
        correction = "Enter a nonnegative outage-loss estimate."
    elif location.endswith("urgency"):
        code = "INVALID_URGENCY"
        correction = "Enter an integer from 1 through 5."
    elif location.endswith("risk_preference"):
        code = "INVALID_RISK_PREFERENCE"
        correction = "Enter a value from 0 through 1."
    elif location.endswith("preferred_cost_share") or "preferred cost shares" in lower_message:
        code = "INVALID_COST_SHARE"
        field = location if location.endswith("preferred_cost_share") else "scenario.players.preferred_cost_share"
        correction = "Use cost shares from 0 through 1 that total 1."
    elif location.endswith("probability") or "probabil" in lower_message:
        code = "INVALID_PROBABILITY"
        field = location if location != "scenario" else "scenario.uncertainty_fixture.nature_states"
        correction = "Use nonnegative probabilities that total 1."
    elif location.endswith("hurwicz_alpha"):
        code = "INVALID_HURWICZ_ALPHA"
        correction = "Enter a value from 0 through 1."
    elif location.startswith("disagreement"):
        code = "INVALID_DISAGREEMENT"
        correction = "Provide exactly two finite disagreement utilities."
    elif location == "rounds":
        code = "INVALID_ROUNDS"
        correction = "Enter a positive integer number of rounds."
    elif location == "seed":
        code = "INVALID_SEED"
        correction = "Enter an integer random seed."
    elif ".players" in location and location.endswith(".id"):
        code = "INVALID_PLAYER_COUNT"
        correction = "Provide exactly one P1 and one P2."
    elif location == "scenario" and ("exactly two players" in lower_message or "player ids" in lower_message):
        code = "INVALID_PLAYER_COUNT"
        scenario_input = first.get("input")
        players = scenario_input.get("players", []) if isinstance(scenario_input, dict) else []
        if isinstance(players, list):
            seen_ids: set[str] = set()
            for index, player in enumerate(players):
                player_id = player.get("id") if isinstance(player, dict) else None
                if player_id not in {"P1", "P2"} or player_id in seen_ids:
                    field = f"scenario.players.{index}.id"
                    break
                seen_ids.add(player_id)
        correction = "Provide exactly two players: P1 and P2."
    elif request.url.path.endswith("/analysis/matrix"):
        code = "INVALID_MATRIX"
        correction = "Provide the complete two-player 2x2 payoff matrix."

    return _error_response(code, message, field, correction, 422)


@asynccontextmanager
async def lifespan(app: FastAPI):
    service = AnalysisService()
    app.state.analysis_service = service
    try:
        yield
    finally:
        service.close()


def create_app() -> FastAPI:
    app = FastAPI(title="PowerShare MM API", version="v1.1", lifespan=lifespan)
    origins = [origin.strip() for origin in os.getenv("POWERSHARE_CORS_ORIGINS", "http://localhost:5173").split(",") if origin.strip()]
    app.add_middleware(
        ContractCORSMiddleware,
        allow_origins=origins,
        allow_credentials=False,
        allow_methods=["GET", "POST"],
        allow_headers=["Content-Type"],
    )
    async def api_error_handler(request: Request, error: ApiError) -> JSONResponse:
        return _error_response(error.code, error.message, error.field, error.correction, error.status_code)

    async def http_error_handler(request: Request, error: StarletteHTTPException) -> JSONResponse:
        if error.status_code == 404:
            return _error_response("NOT_FOUND", "The requested API endpoint was not found.", "path", "Use a documented API endpoint.", 404)
        if error.status_code == 405:
            return _error_response("METHOD_NOT_ALLOWED", "The HTTP method is not supported for this endpoint.", "method", "Use the documented method for this endpoint.", 405)
        return _error_response("INVALID_REQUEST", "The request could not be completed.", "request", "Check the documented API contract.", error.status_code)

    async def unexpected_error_handler(request: Request, error: Exception) -> JSONResponse:
        return _error_response("INTERNAL_SERVER_ERROR", "The local API encountered an unexpected error.", None, "Check the request and local server logs.", 500)

    app.add_exception_handler(ApiError, api_error_handler)
    app.add_exception_handler(StarletteHTTPException, http_error_handler)
    app.add_exception_handler(RequestValidationError, _validation_error)
    app.add_exception_handler(Exception, unexpected_error_handler)
    app.include_router(router)
    return app


app = create_app()
