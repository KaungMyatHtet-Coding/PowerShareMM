"""SQLite-backed repository with an in-memory default for offline demos."""

from __future__ import annotations

import json
import sqlite3
from threading import Lock
from typing import Any


class LocalRepository:
    """Persist scenarios/results locally without requiring any cloud service."""

    def __init__(self, database_url: str = ":memory:") -> None:
        self._connection = sqlite3.connect(database_url, check_same_thread=False)
        self._connection.row_factory = sqlite3.Row
        self._lock = Lock()
        with self._connection:
            self._connection.execute(
                "CREATE TABLE IF NOT EXISTS scenarios (id TEXT PRIMARY KEY, payload TEXT NOT NULL)"
            )
            self._connection.execute(
                "CREATE TABLE IF NOT EXISTS results (id TEXT PRIMARY KEY, scenario_id TEXT NOT NULL, result_type TEXT NOT NULL, payload TEXT NOT NULL)"
            )

    def create_scenario(self, scenario: dict[str, Any]) -> None:
        with self._lock, self._connection:
            try:
                self._connection.execute(
                    "INSERT INTO scenarios (id, payload) VALUES (?, ?)",
                    (scenario["id"], json.dumps(scenario, separators=(",", ":"))),
                )
            except sqlite3.IntegrityError as error:
                raise KeyError(scenario["id"]) from error

    def get_scenario(self, scenario_id: str) -> dict[str, Any] | None:
        row = self._connection.execute("SELECT payload FROM scenarios WHERE id = ?", (scenario_id,)).fetchone()
        return json.loads(row["payload"]) if row else None

    def save_result(self, result_id: str, scenario_id: str, result_type: str, payload: dict[str, Any]) -> None:
        with self._lock, self._connection:
            self._connection.execute(
                "INSERT OR REPLACE INTO results (id, scenario_id, result_type, payload) VALUES (?, ?, ?, ?)",
                (result_id, scenario_id, result_type, json.dumps(payload, separators=(",", ":"))),
            )

    def get_result(self, result_id: str) -> dict[str, Any] | None:
        row = self._connection.execute(
            "SELECT scenario_id, result_type, payload FROM results WHERE id = ?", (result_id,)
        ).fetchone()
        if row is None:
            return None
        return {
            "result_id": result_id,
            "scenario_id": row["scenario_id"],
            "result_type": row["result_type"],
            "result": json.loads(row["payload"]),
        }
