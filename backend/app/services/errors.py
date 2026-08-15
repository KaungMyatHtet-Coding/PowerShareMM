"""Transport-safe API exceptions."""

from __future__ import annotations

from dataclasses import dataclass


@dataclass
class ApiError(Exception):
    code: str
    message: str
    field: str | None = None
    correction: str | None = None
    status_code: int = 422
