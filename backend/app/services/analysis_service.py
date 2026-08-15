"""API-facing adapters for Person 1's pure mathematical engine."""

from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Any
from uuid import uuid4

from backend.app.algorithms.arbitration import nash_arbitration
from backend.app.algorithms.bimatrix import best_responses, detect_prisoners_dilemma, pure_nash
from backend.app.algorithms.domain import (
    Decision,
    NatureState,
    Player,
    Scenario,
    SharedResource,
    UncertaintyFixture,
)
from backend.app.algorithms.efficiency import pareto_front
from backend.app.algorithms.matrix import find_dominance
from backend.app.algorithms.nature import solve_nature
from backend.app.algorithms.payoffs import build_bimatrix
from backend.app.algorithms.repeated import simulate_repeated
from backend.app.database.repository import LocalRepository
from backend.app.schemas.contracts import ArbitrationGenerationPayload, ScenarioPayload
from backend.app.services.errors import ApiError


def envelope(data: dict[str, Any], method: str, warnings: list[str] | None = None) -> dict[str, Any]:
    return {"data": data, "warnings": warnings or [], "meta": {"method": method, "version": "v1.1"}}


def payload_to_domain(payload: ScenarioPayload) -> Scenario:
    """Map validated transport fields to Person 1's dataclasses without math."""
    return Scenario(
        id=payload.id,
        name=payload.name,
        players=[Player(**player.model_dump()) for player in payload.players],
        resource=SharedResource(**payload.resource.model_dump()),
        uncertainty_fixture=UncertaintyFixture(
            fixture_type=payload.uncertainty_fixture.fixture_type,
            nature_states=[NatureState(**state.model_dump()) for state in payload.uncertainty_fixture.nature_states],
            decisions=[Decision(**decision.model_dump()) for decision in payload.uncertainty_fixture.decisions],
            hurwicz_alpha=payload.uncertainty_fixture.hurwicz_alpha,
        ),
    )


class AnalysisService:
    """Coordinates storage and existing pure algorithms; contains no formulas."""

    def __init__(self, repository: LocalRepository | None = None) -> None:
        database_url = os.getenv("POWERSHARE_DATABASE_URL", ":memory:")
        self.repository = repository or LocalRepository(database_url)
        self._load_demo_scenario()

    def close(self) -> None:
        """Release the local repository during application shutdown."""
        self.repository.close()

    def _load_demo_scenario(self) -> None:
        fixture_path = Path(__file__).resolve().parents[3] / "sample-data" / "demo-scenario.json"
        if not fixture_path.exists():
            return
        scenario = json.loads(fixture_path.read_text(encoding="utf-8"))
        try:
            self.repository.create_scenario(scenario)
        except KeyError:
            pass

    def create_scenario(self, scenario: ScenarioPayload) -> dict[str, Any]:
        payload = scenario.model_dump(mode="json")
        try:
            self.repository.create_scenario(payload)
        except KeyError as error:
            raise ApiError(
                "SCENARIO_ID_CONFLICT",
                f"Scenario '{scenario.id}' already exists.",
                "scenario.id",
                "Choose a new scenario ID or retrieve the existing scenario.",
                409,
            ) from error
        return payload

    def get_scenario_payload(self, scenario_id: str) -> ScenarioPayload:
        stored = self.repository.get_scenario(scenario_id)
        if stored is None:
            raise ApiError("NOT_FOUND", f"Scenario '{scenario_id}' was not found.", "scenario_id", "Create the scenario first.", 404)
        try:
            return ScenarioPayload.model_validate(stored)
        except ValueError as error:  # A stored malformed record must never reach algorithms.
            raise ApiError("INVALID_REQUEST", str(error), "scenario", "Correct the saved scenario data.") from error

    def resolve_scenario(self, scenario_id: str | None, inline: ScenarioPayload | None) -> ScenarioPayload:
        return inline if inline is not None else self.get_scenario_payload(scenario_id or "")

    @staticmethod
    def _algorithm_error(error: ValueError) -> ApiError:
        message = str(error)
        lower = message.lower()
        if "hurwicz" in lower or "alpha" in lower:
            return ApiError("INVALID_HURWICZ_ALPHA", message, "hurwicz_alpha", "Enter a value from 0 through 1.")
        if "probabil" in lower:
            return ApiError("INVALID_PROBABILITY", message, "uncertainty_fixture.nature_states", "Ensure nonnegative probabilities total 1.")
        if "capacity" in lower:
            return ApiError("INVALID_CAPACITY", message, "resource.capacity_kwh", "Enter a number greater than zero.")
        if "hour" in lower:
            return ApiError("INVALID_HOURS", message, "resource.available_hours", "Use nonnegative allocations within available hours.")
        if "cost" in lower:
            return ApiError("INVALID_COST_SHARE", message, "cost_shares", "Use shares between 0 and 1 that total 1.")
        if "disagreement" in lower:
            return ApiError("INVALID_DISAGREEMENT", message, "disagreement", "Provide two finite utility values.")
        if "round" in lower:
            return ApiError("INVALID_ROUNDS", message, "rounds", "Enter a positive integer number of rounds.")
        if "strategy" in lower:
            return ApiError("UNSUPPORTED_REPEATED_STRATEGY", message, "player_strategies", "Use a documented repeated-game strategy.")
        if "matrix" in lower or "payoff" in lower:
            return ApiError("INVALID_MATRIX", message, "payoff_matrix", "Provide the complete two-player 2x2 payoff matrix.")
        if "player" in lower:
            return ApiError("INVALID_PLAYER_COUNT", message, "scenario.players", "Provide exactly P1 and P2.")
        return ApiError("INVALID_REQUEST", message, None, "Correct the highlighted input and try again.")

    def payoffs(self, scenario_payload: ScenarioPayload) -> dict[str, Any]:
        try:
            result = build_bimatrix(payload_to_domain(scenario_payload))
            outcomes_by_id = {outcome["id"]: outcome for outcome in result["outcomes"]}
            for outcome in result["outcomes"]:
                outcome["display_utilities"] = [round(value, 2) for value in outcome["utilities"]]
                outcome["feasible"] = True
            for cell in result["payoff_matrix"]["cells"]:
                outcome = outcomes_by_id[cell["outcome_id"]]
                cell["row_strategy"], cell["column_strategy"] = outcome["strategies"]
            return result
        except ValueError as error:
            raise self._algorithm_error(error) from error

    def matrix_analysis(self, payoff_matrix: dict[str, Any], outcomes: list[dict[str, Any]] | None = None) -> dict[str, Any]:
        try:
            return {
                "dominated_strategies": find_dominance(payoff_matrix),
                "best_responses": best_responses(payoff_matrix),
                "pure_nash_equilibria": pure_nash(payoff_matrix),
                "pareto_optimal_outcomes": pareto_front(outcomes or self._outcomes_from_cells(payoff_matrix)),
                "prisoners_dilemma": detect_prisoners_dilemma(payoff_matrix),
                "explanations": ["The main electricity-sharing game is non-zero-sum."],
            }
        except (KeyError, TypeError, ValueError) as error:
            raise self._algorithm_error(ValueError(str(error))) from error

    @staticmethod
    def _outcomes_from_cells(payoff_matrix: dict[str, Any]) -> list[dict[str, Any]]:
        return [{"id": cell["outcome_id"], "utilities": cell["utilities"]} for cell in payoff_matrix["cells"]]

    def uncertainty(self, nature_states: list[dict[str, Any]], decisions: list[dict[str, Any]], alpha: float) -> dict[str, Any]:
        try:
            return solve_nature(nature_states, decisions, alpha)
        except ValueError as error:
            raise self._algorithm_error(error) from error

    @staticmethod
    def _validate_canonical_generation(generation: ArbitrationGenerationPayload | None) -> None:
        """V1.1 freezes Person 1's exhaustive candidate grid.

        The math engine intentionally exposes the canonical enumeration only;
        this API therefore accepts an override only when it restates that grid.
        """
        if generation is None:
            return
        expected = {
            "p1_energy_kwh": {"min": 0.0, "max": 6.0, "step": 0.5},
            "p2_energy_kwh": {"min": 0.0, "max": 7.0, "step": 0.5},
            "p1_hours": {"min": 0.0, "max": 5.0, "integer": True},
            "p2_hours": {"min": 0.0, "max": 4.0, "integer": True},
            "total_energy_kwh_max": 10.0,
            "total_exclusive_hours_max": 5.0,
            "p1_cost_shares": [0.4, 0.5, 0.6],
        }
        supplied = generation.model_dump(by_alias=True)
        for field, expected_value in expected.items():
            actual_value = supplied[field]
            if isinstance(expected_value, dict):
                for nested_field, nested_expected in expected_value.items():
                    if actual_value[nested_field] != nested_expected:
                        raise ApiError(
                            "UNSUPPORTED_GENERATION_OVERRIDE",
                            "PowerShare MM V1.1 supports only the frozen canonical arbitration grid.",
                            f"generation.{field}.{nested_field}",
                            f"Use the canonical value {nested_expected}.",
                        )
            elif actual_value != expected_value:
                raise ApiError(
                    "UNSUPPORTED_GENERATION_OVERRIDE",
                    "PowerShare MM V1.1 supports only the frozen canonical arbitration grid.",
                    f"generation.{field}",
                    f"Use the canonical value {expected_value}.",
                )

    def arbitration(
        self,
        scenario_payload: ScenarioPayload,
        disagreement: tuple[float, float],
        generation: ArbitrationGenerationPayload | None = None,
    ) -> dict[str, Any]:
        self._validate_canonical_generation(generation)
        try:
            return nash_arbitration(payload_to_domain(scenario_payload), disagreement)
        except ValueError as error:
            raise self._algorithm_error(error) from error

    @staticmethod
    def _fixture() -> dict[str, Any]:
        fixture_path = Path(__file__).resolve().parents[3] / "sample-data" / "repeated-game-fixture.json"
        return json.loads(fixture_path.read_text(encoding="utf-8"))

    def repeated(self, fixture_id: str, strategies: tuple[str, str], rounds: int, seed: int) -> dict[str, Any]:
        fixture = self._fixture()
        if fixture_id != fixture["id"]:
            raise ApiError("NOT_FOUND", f"Repeated-game fixture '{fixture_id}' was not found.", "fixture_id", "Use educational-pd-001.", 404)
        try:
            return simulate_repeated(
                fixture["payoff_matrix"], strategies[0], strategies[1], rounds, seed, fixture_id, True
            )
        except ValueError as error:
            message = str(error)
            error_data = self._algorithm_error(error)
            raise error_data from error

    @staticmethod
    def _full_arbitration_shape(result: dict[str, Any]) -> dict[str, Any]:
        selected = result["selected"]
        selected_shape = None if selected is None else {
            "candidate_id": selected["candidate_id"],
            "allocation": {"energy_kwh": selected["energy_kwh"], "hours": selected["hours"]},
            "cost_shares": selected["cost_shares"],
            "utilities": selected["utilities"],
            "gains": selected["gains"],
            "nash_product": selected["nash_product"],
        }
        return {**result, "selected": selected_shape}

    @staticmethod
    def _full_best_responses(responses: dict[str, dict[str, list[str]]]) -> dict[str, dict[str, list[str]]]:
        return {player: {f"against_{strategy}": choices for strategy, choices in options.items()} for player, options in responses.items()}

    @staticmethod
    def _full_uncertainty_shape(result: dict[str, Any], scenario_payload: ScenarioPayload) -> dict[str, Any]:
        state_ids = [state.id for state in scenario_payload.uncertainty_fixture.nature_states]
        regret_matrix = {
            decision_id: dict(zip(state_ids, regrets))
            for decision_id, regrets in result["regret_matrix"].items()
        }
        return {
            "fixture_type": scenario_payload.uncertainty_fixture.fixture_type,
            "probability_total": sum(state.probability for state in scenario_payload.uncertainty_fixture.nature_states),
            "hurwicz_alpha": scenario_payload.uncertainty_fixture.hurwicz_alpha,
            "regret_matrix": regret_matrix,
            "methods": result["methods"],
        }

    @staticmethod
    def _full_prisoners_dilemma_shape(result: dict[str, Any], payoff_matrix: dict[str, Any]) -> dict[str, Any]:
        cells = {cell["outcome_id"]: cell["utilities"] for cell in payoff_matrix["cells"]}
        return {
            **result,
            "fixture_type": "ELECTRICITY_ALLOCATION_GAME",
            "payoff_ordering": {
                "P1": {
                    "temptation": cells["MC"][0], "reward": cells["CC"][0],
                    "punishment": cells["MM"][0], "sucker": cells["CM"][0],
                    "condition": "T > R > P > S", "satisfied": result["detected"],
                },
                "P2": {
                    "temptation": cells["CM"][1], "reward": cells["CC"][1],
                    "punishment": cells["MM"][1], "sucker": cells["MC"][1],
                    "condition": "T > R > P > S", "satisfied": result["detected"],
                },
            },
            "explanation": "The engine reports the asymmetric Prisoners Dilemma from the calculated payoff matrix.",
        }

    def full_analysis(self, scenario_payload: ScenarioPayload, include_repeated: bool, repeated_settings: Any | None) -> tuple[dict[str, Any], str]:
        payoff = self.payoffs(scenario_payload)
        matrix = self.matrix_analysis(payoff["payoff_matrix"], payoff["outcomes"])
        uncertainty = self.uncertainty(
            [state.model_dump() for state in scenario_payload.uncertainty_fixture.nature_states],
            [decision.model_dump() for decision in scenario_payload.uncertainty_fixture.decisions],
            scenario_payload.uncertainty_fixture.hurwicz_alpha,
        )
        arbitration = self.arbitration(scenario_payload, (0.0, 0.0))
        repeated = None
        if include_repeated:
            settings = repeated_settings
            if settings is None:
                repeated = self.repeated("educational-pd-001", ("TIT_FOR_TAT", "ALWAYS_CLAIM_MORE"), 30, 42)
            else:
                repeated = self.repeated(settings.fixture_id, settings.player_strategies, settings.rounds, settings.seed)
        pd = matrix["prisoners_dilemma"]
        selected = arbitration["selected"]
        final = {
            "outcome_id": None,
            "energy_kwh": selected["energy_kwh"] if selected else [],
            "hours": selected["hours"] if selected else [],
            "cost_shares": selected["cost_shares"] if selected else [],
            "matrix_basis_status": "VERIFIED_ENGINE",
            "arbitration_status": arbitration["verification_status"],
            "explanation": "MM is stable; the arbitration result is the feasible shared-arrangement recommendation.",
        }
        data = {
            "scenario_id": scenario_payload.id,
            "analysis_status": "V1_1_VERIFIED_ENGINE_WITH_CANONICAL_ARBITRATION",
            "payoff_matrix": payoff["payoff_matrix"],
            "outcomes": payoff["outcomes"],
            "dominated_strategies": matrix["dominated_strategies"],
            "best_responses": self._full_best_responses(matrix["best_responses"]),
            "pure_nash_equilibria": [{"outcome_id": item, "utilities": next(cell["utilities"] for cell in payoff["payoff_matrix"]["cells"] if cell["outcome_id"] == item)} for item in matrix["pure_nash_equilibria"]],
            "pareto_optimal_outcomes": [{"outcome_id": item, "utilities": next(cell["utilities"] for cell in payoff["payoff_matrix"]["cells"] if cell["outcome_id"] == item)} for item in matrix["pareto_optimal_outcomes"]],
            "prisoners_dilemma": self._full_prisoners_dilemma_shape(pd, payoff["payoff_matrix"]),
            "uncertainty_analysis": self._full_uncertainty_shape(uncertainty, scenario_payload),
            "arbitration_result": {**self._full_arbitration_shape(arbitration), "temporary_mock": False},
            "repeated_game_result": repeated,
            "final_recommendation": final,
            "explanations": matrix["explanations"],
        }
        result_id = f"result-{uuid4().hex[:12]}"
        self.repository.save_result(result_id, scenario_payload.id, "FULL_ANALYSIS", data)
        return data, result_id
