"""Stable V1.1 request schemas.

These DTOs validate transport data only.  The authoritative game-theory
calculations remain in ``backend.app.algorithms``.
"""

from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field, FiniteFloat, model_validator


class ContractModel(BaseModel):
    model_config = ConfigDict(extra="forbid", allow_inf_nan=False)


class PlayerPayload(ContractModel):
    id: Literal["P1", "P2"]
    name: str = Field(min_length=1)
    business_type: str = Field(min_length=1)
    demand_kwh: FiniteFloat = Field(gt=0)
    essential_kwh: FiniteFloat = Field(ge=0)
    desired_hours: FiniteFloat = Field(gt=0)
    outage_loss_mmk: FiniteFloat = Field(ge=0)
    urgency: int = Field(ge=1, le=5)
    risk_preference: FiniteFloat = Field(ge=0, le=1)
    preferred_cost_share: FiniteFloat = Field(ge=0, le=1)

    @model_validator(mode="after")
    def essential_is_within_demand(self) -> "PlayerPayload":
        if self.essential_kwh > self.demand_kwh:
            raise ValueError("essential_kwh must not exceed demand_kwh")
        return self


class ResourcePayload(ContractModel):
    resource_type: str = Field(min_length=1)
    capacity_kwh: FiniteFloat = Field(gt=0)
    available_hours: FiniteFloat = Field(gt=0)
    total_cost_mmk: FiniteFloat = Field(ge=0)
    max_safe_load_kw: FiniteFloat = Field(gt=0)
    slot_duration_hours: FiniteFloat = Field(gt=0)
    overload_penalty: FiniteFloat = Field(ge=0)
    violation_penalty: FiniteFloat = Field(ge=0)


class NatureStatePayload(ContractModel):
    id: str = Field(min_length=1)
    duration_hours: FiniteFloat = Field(ge=0)
    probability: FiniteFloat = Field(ge=0, le=1)


class DecisionPayload(ContractModel):
    id: str = Field(min_length=1)
    utilities: dict[str, FiniteFloat]


class UncertaintyFixturePayload(ContractModel):
    fixture_type: str = Field(min_length=1)
    nature_states: list[NatureStatePayload]
    decisions: list[DecisionPayload]
    hurwicz_alpha: FiniteFloat = Field(ge=0, le=1)


class ScenarioPayload(ContractModel):
    id: str = Field(min_length=1)
    name: str = Field(min_length=1)
    players: list[PlayerPayload]
    resource: ResourcePayload
    uncertainty_fixture: UncertaintyFixturePayload

    @model_validator(mode="after")
    def exactly_two_distinct_players(self) -> "ScenarioPayload":
        if len(self.players) != 2:
            raise ValueError("Scenario must contain exactly two players")
        if {player.id for player in self.players} != {"P1", "P2"}:
            raise ValueError("Scenario player IDs must be P1 and P2, each once")
        if abs(sum(player.preferred_cost_share for player in self.players) - 1.0) > 1e-9:
            raise ValueError("Player preferred cost shares must total 1")
        probabilities = [state.probability for state in self.uncertainty_fixture.nature_states]
        if probabilities and abs(sum(probabilities) - 1.0) > 1e-9:
            raise ValueError("Nature-state probabilities must total 1")
        return self


class CreateScenarioRequest(ContractModel):
    scenario: ScenarioPayload


class ScenarioReferenceRequest(ContractModel):
    scenario_id: str | None = Field(default=None, min_length=1)
    scenario: ScenarioPayload | None = None

    @model_validator(mode="after")
    def has_reference(self) -> "ScenarioReferenceRequest":
        if self.scenario_id is None and self.scenario is None:
            raise ValueError("Provide scenario_id or scenario")
        return self


class MatrixRequest(ContractModel):
    payoff_matrix: dict[str, Any]


class UncertaintyRequest(ContractModel):
    nature_states: list[dict[str, Any]]
    decisions: list[dict[str, Any]]
    hurwicz_alpha: FiniteFloat = Field(ge=0, le=1)


class EnergyRangePayload(ContractModel):
    minimum: FiniteFloat = Field(alias="min")
    maximum: FiniteFloat = Field(alias="max")
    step: FiniteFloat = Field(gt=0)

    @model_validator(mode="after")
    def range_is_ordered(self) -> "EnergyRangePayload":
        if self.minimum > self.maximum:
            raise ValueError("generation minimum must not exceed maximum")
        return self


class HoursRangePayload(ContractModel):
    minimum: FiniteFloat = Field(alias="min")
    maximum: FiniteFloat = Field(alias="max")
    integer: Literal[True]

    @model_validator(mode="after")
    def range_is_ordered(self) -> "HoursRangePayload":
        if self.minimum > self.maximum:
            raise ValueError("generation minimum must not exceed maximum")
        return self


class ArbitrationGenerationPayload(ContractModel):
    """The fixed V1.1 candidate grid, expressed for contract validation."""

    p1_energy_kwh: EnergyRangePayload
    p2_energy_kwh: EnergyRangePayload
    p1_hours: HoursRangePayload
    p2_hours: HoursRangePayload
    total_energy_kwh_max: FiniteFloat = Field(gt=0)
    total_exclusive_hours_max: FiniteFloat = Field(gt=0)
    p1_cost_shares: list[FiniteFloat] = Field(min_length=1)


class ArbitrationRequest(ScenarioReferenceRequest):
    disagreement: tuple[FiniteFloat, FiniteFloat] = (0.0, 0.0)
    generation: ArbitrationGenerationPayload | None = None


class RepeatedSimulationRequest(ContractModel):
    fixture_id: str = Field(default="educational-pd-001", min_length=1)
    player_strategies: tuple[str, str]
    rounds: int = Field(default=30, gt=0)
    seed: int = 42


class FullAnalysisRequest(ScenarioReferenceRequest):
    include_repeated_game: bool = False
    repeated_settings: RepeatedSimulationRequest | None = None
