"""PowerShare MM FastAPI application factory."""

from __future__ import annotations

import os
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from backend.app.api.routes import router
from backend.app.services.analysis_service import AnalysisService
from backend.app.services.errors import ApiError


def _error_response(code: str, message: str, field: str | None, correction: str | None, status_code: int) -> JSONResponse:
    return JSONResponse(
        status_code=status_code,
        content={"error": {"code": code, "message": message, "field": field, "correction": correction}},
    )


def _validation_error(request: Request, error: RequestValidationError) -> JSONResponse:
    first = error.errors()[0]
    location = ".".join(str(part) for part in first.get("loc", ()) if part != "body") or None
    message = first.get("msg", "Invalid request.")
    field = location
    lower = f"{location} {message}".lower()
    if "capacity" in lower:
        code, correction = "INVALID_CAPACITY", "Enter a number greater than zero."
    elif "probabil" in lower:
        code, correction = "INVALID_PROBABILITY", "Use nonnegative probabilities that total 1."
    elif "player" in lower or "players" in lower:
        code, correction = "INVALID_PLAYER_COUNT", "Provide exactly two players: P1 and P2."
    elif "cost" in lower:
        code, correction = "INVALID_COST_SHARE", "Use cost shares from 0 through 1 that total 1."
    elif "hour" in lower:
        code, correction = "INVALID_HOURS", "Enter a value within the available-hour constraints."
    else:
        code, correction = "INVALID_REQUEST", "Correct the invalid field and try again."
    return _error_response(code, message, field, correction, 422)


@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.analysis_service = AnalysisService()
    yield


def create_app() -> FastAPI:
    app = FastAPI(title="PowerShare MM API", version="v1.1", lifespan=lifespan)
    origins = [origin.strip() for origin in os.getenv("POWERSHARE_CORS_ORIGINS", "http://localhost:5173").split(",") if origin.strip()]
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=False,
        allow_methods=["GET", "POST"],
        allow_headers=["Content-Type"],
    )
    app.add_exception_handler(ApiError, lambda request, error: _error_response(error.code, error.message, error.field, error.correction, error.status_code))
    app.add_exception_handler(RequestValidationError, _validation_error)
    app.include_router(router)
    return app


app = create_app()
