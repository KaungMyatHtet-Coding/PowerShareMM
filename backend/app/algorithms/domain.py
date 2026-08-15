from dataclasses import dataclass, field
from typing import List, Dict, Any

@dataclass
class Player:
    id: str  # "P1" or "P2"
    name: str
    business_type: str
    demand_kwh: float
    essential_kwh: float
    desired_hours: float
    outage_loss_mmk: float
    urgency: int
    risk_preference: float
    preferred_cost_share: float

@dataclass
class SharedResource:
    resource_type: str
    capacity_kwh: float
    available_hours: float
    total_cost_mmk: float
    max_safe_load_kw: float
    slot_duration_hours: float
    overload_penalty: float
    violation_penalty: float

@dataclass
class NatureState:
    id: str
    duration_hours: float
    probability: float

@dataclass
class Decision:
    id: str
    utilities: Dict[str, float]

@dataclass
class UncertaintyFixture:
    fixture_type: str
    nature_states: List[NatureState] = field(default_factory=list)
    decisions: List[Decision] = field(default_factory=list)
    hurwicz_alpha: float = 0.6

@dataclass
class Scenario:
    id: str
    name: str
    players: List[Player]
    resource: SharedResource
    uncertainty_fixture: UncertaintyFixture = field(default_factory=lambda: UncertaintyFixture(fixture_type=""))
