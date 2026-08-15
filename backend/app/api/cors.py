"""CORS middleware that preserves the PowerShare MM JSON error contract."""

from __future__ import annotations

from starlette.middleware.cors import CORSMiddleware
from starlette.responses import JSONResponse, Response


class ContractCORSMiddleware(CORSMiddleware):
    """Return a safe error envelope instead of Starlette's plaintext denial."""

    def preflight_response(self, request_headers) -> Response:  # type: ignore[no-untyped-def]
        response = super().preflight_response(request_headers)
        if response.status_code < 400:
            return response
        return JSONResponse(
            status_code=400,
            content={
                "error": {
                    "code": "CORS_ORIGIN_NOT_ALLOWED",
                    "message": "The request origin is not allowed by this local API.",
                    "field": "origin",
                    "correction": "Use a configured allowed frontend origin.",
                }
            },
        )
