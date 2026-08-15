import pytest
from backend.app.algorithms.domain import Player, SharedResource, Scenario, UncertaintyFixture, NatureState, Decision

@pytest.fixture
def demo_scenario():
    p1 = Player(
        id="P1",
        name="Shwe Mini Market",
        business_type="mini_market",
        demand_kwh=6.0,
        essential_kwh=4.0,
        desired_hours=5.0,
        outage_loss_mmk=30000.0,
        urgency=5,
        risk_preference=0.4,
        preferred_cost_share=0.6
    )
    p2 = Player(
        id="P2",
        name="TechCare Phone Service",
        business_type="phone_service",
        demand_kwh=7.0,
        essential_kwh=3.0,
        desired_hours=4.0,
        outage_loss_mmk=20000.0,
        urgency=3,
        risk_preference=0.6,
        preferred_cost_share=0.4
    )
    res = SharedResource(
        resource_type="hybrid",
        capacity_kwh=10.0,
        available_hours=5.0,
        total_cost_mmk=50000.0,
        max_safe_load_kw=3.0,
        slot_duration_hours=1.0,
        overload_penalty=5.0,
        violation_penalty=0.0
    )

    # Uncertainty fixture data
    n_states = [
        NatureState(id="SHORT", duration_hours=2.0, probability=0.3),
        NatureState(id="MEDIUM", duration_hours=5.0, probability=0.5),
        NatureState(id="LONG", duration_hours=8.0, probability=0.2)
    ]
    decisions = [
        Decision(id="BATTERY_ONLY", utilities={"SHORT": 80.0, "MEDIUM": 55.0, "LONG": 20.0}),
        Decision(id="GENERATOR_ONLY", utilities={"SHORT": 45.0, "MEDIUM": 70.0, "LONG": 75.0}),
        Decision(id="HYBRID", utilities={"SHORT": 65.0, "MEDIUM": 85.0, "LONG": 90.0})
    ]
    unc_fix = UncertaintyFixture(
        fixture_type="PREDEFINED_EDUCATIONAL_DEMO",
        nature_states=n_states,
        decisions=decisions,
        hurwicz_alpha=0.6
    )

    return Scenario(
        id="demo-shared-power-001",
        name="Mini Market and Phone Service Shared Power",
        players=[p1, p2],
        resource=res,
        uncertainty_fixture=unc_fix
    )
