# PowerShare MM Shared Contract V1 — Frozen for Monday MVP

**Frozen:** Saturday, August 15, 2026

**Development:** August 15–16, 2026

**Demo:** Monday, August 17, 2026

**Feature freeze:** Sunday, August 16 at 19:00 (Asia/Rangoon)

## Contract status and authority

This document freezes the shared mathematical rules, names, JSON meanings, and canonical demo values so four people can work independently. After freeze, changing a mathematical rule, field name, JSON shape, or demo value requires approval from both the **Mathematical/Algorithm Lead** and **Integration/Release Lead**. Record every approved change below and update affected fixtures and tests in the same change.

| Version/date | Change | Approvers |
|---|---|---|
| V1 / 2026-08-15 | Initial contract freeze | Pending named leads' acknowledgement |

The system supports exactly two players. The primary electricity-sharing game is non-zero-sum. Zero-sum methods may be used only for a clearly labeled competitive time-slot subproblem, never as the main sharing model. Mathematical methods are restricted to Chapters 1–16 of Philip D. Straffin's *Game Theory and Strategy*, including Chapter 16. Chapter 17+ concepts—N-person games, strategic voting, Shapley Value, Banzhaf Index, and Nucleolus—are explicitly excluded as project features. This is a CPU-friendly educational decision-support application: it does not control equipment, connect to IoT, require a paid API, use external AI/local ML, or require a dedicated GPU.

## Canonical schemas

### Player

| Field | Type/rule |
|---|---|
| `id` | `P1` or `P2` |
| `name` | non-empty string |
| `business_type` | non-empty string |
| `demand_kwh` | number greater than zero |
| `essential_kwh` | number from zero through demand |
| `desired_hours` | number greater than zero |
| `outage_loss_mmk` | nonnegative number |
| `urgency` | integer from 1 through 5 |
| `risk_preference` | number from 0 through 1 |
| `preferred_cost_share` | number from 0 through 1 |

`risk_preference` is retained for decision-under-nature explanations. It must not change physical capacity, energy feasibility, or load limits.

### Shared resource

| Field | Type/demo value |
|---|---|
| `resource_type` | enum; demo is `hybrid` |
| `capacity_kwh` | positive number; demo is `10` |
| `available_hours` | positive number; demo is `5` |
| `total_cost_mmk` | nonnegative number; demo is `50000` |
| `max_safe_load_kw` | positive number; demo is `3` |
| `slot_duration_hours` | positive number; demo is `1` |
| `overload_penalty` | utility points; demo is `20` |
| `violation_penalty` | utility points; demo is `10` |

Overload is only a modeled conflict penalty. The software neither causes nor controls a real electrical overload and must not present its analysis as an electrical safety command.

## Strategies and outcomes

The only main behavioral strategies are `COOPERATE` and `CLAIM_MORE`.

| ID | P1 action | P2 action | Meaning |
|---|---|---|---|
| `CC` | `COOPERATE` | `COOPERATE` | both honor the cooperative allocation |
| `CM` | `COOPERATE` | `CLAIM_MORE` | P1 cooperates; P2 makes the unilateral larger claim |
| `MC` | `CLAIM_MORE` | `COOPERATE` | P1 makes the unilateral larger claim; P2 cooperates |
| `MM` | `CLAIM_MORE` | `CLAIM_MORE` | both claim more; attempted claims are made analytically safe and penalized |

## Allocation and penalty rules

| Outcome | Energy `[P1,P2]` kWh | Exclusive hours `[P1,P2]` | Penalties `[P1,P2]` |
|---|---:|---:|---:|
| `CC` | `[5,5]` | `[3,2]` | overload `[0,0]`; violation `[0,0]` |
| `CM` | `[4,6]` | `[2,3]` | overload `[0,0]`; violation `[0,10]` |
| `MC` | `[6,4]` | `[3,2]` | overload `[0,0]`; violation `[10,0]` |
| `MM` | `[60/13,70/13]` ≈ `[4.62,5.38]` | `[2.5,2.5]` | overload `[20,20]`; violation `[0,0]` |

- `CC`: satisfy essential energy first, then distribute remaining capacity proportionally to unmet demand. The frozen canonical result is `[5,5]`.
- `CM`: P1 receives its essential 4 kWh; P2 receives the feasible 6 kWh remainder.
- `MC`: P2 receives its essential allocation and P1 receives the feasible remainder; the frozen canonical result is `[6,4]`, so P2 receives 1 kWh above essential.
- `MM`: attempted claims are converted to safe demand-proportional shares, `10×[6/13,7/13]`; both players receive the declared 20-point conflict/overload penalty.
- A unilateral `CLAIM_MORE` player receives the 10-point violation penalty. For `MM`, do not stack violation penalties on the frozen 20-point conflict penalties.
- No outcome may allocate more than shared capacity.

The slight difference between the general `CC` description and its frozen `[5,5]` example reflects the canonical time/energy package chosen for the demo. Implementations must return the frozen values for the demo fixture and must document a deterministic tie/remainder rule for user-created scenarios.

## Cost rule

Default shares follow allocated energy:

`s_i = e_i / (e_1 + e_2)`

`c_i = s_i × total_cost_mmk`

For arbitration candidate generation, evaluate P1 shares `0.4`, `0.5`, and `0.6`; P2 is always `1 - P1 share`. Cost shares must total 1 within tolerance.

## Frozen utility model

For player `i`:

`service_score_i = 100 × min(allocated_energy_i / demand_i, 1)`

`essential_score_i = 100 × min(allocated_energy_i / essential_energy_i, 1)`

If `essential_energy_i = 0`, define `essential_score_i = 100` because no essential requirement is unmet.

`time_score_i = 100 × min(allocated_hours_i / desired_hours_i, 1)`

`avoided_loss_score_i = 100 × (outage_loss_i / max_player_outage_loss) × (service_score_i / 100) × (time_score_i / 100)`

`urgency_score_i = 100 × (urgency_i / 5) × (essential_score_i / 100)`

`cost_burden_score_i = 100 × cost_share_i`

`utility_i = clamp(0.30 × service_score_i + 0.25 × essential_score_i + 0.15 × time_score_i + 0.15 × avoided_loss_score_i + 0.15 × urgency_score_i - 0.10 × cost_burden_score_i - overload_penalty_i - violation_penalty_i, 0, 100)`

`allocated_energy_i` and `allocated_hours_i` are the outcome's resources; `demand_i`, `essential_energy_i`, `desired_hours_i`, `outage_loss_i`, and `urgency_i` are player inputs; `max_player_outage_loss` is the larger outage loss among the two players; `cost_share_i` is a fraction; penalties are declared utility-point deductions; `clamp(x,0,100)` limits the result.

Preserve unrounded values internally and round display values to two decimals using one consistent rounding policy. These weights are disclosed prototype assumptions, not a theorem from Straffin. Frontend code must never duplicate or independently recalculate this formula; the backend result is authoritative. Penalties or weights must not be silently adjusted to manufacture a Nash equilibrium or Prisoner's Dilemma. Analyze and report the resulting game honestly.

## Verified canonical calculations

Default cost shares follow energy. All component values below were manually derived and independently recalculated with a temporary command-line calculation; displayed values are rounded to two decimals.

| Outcome/player | Service | Essential | Time | Avoided loss | Urgency | Cost burden | Overload | Violation | Utility |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| `CC/P1` | 83.33 | 100.00 | 60.00 | 50.00 | 100.00 | 50.00 | 0 | 0 | **76.50** |
| `CC/P2` | 71.43 | 100.00 | 50.00 | 23.81 | 60.00 | 50.00 | 0 | 0 | **61.50** |
| `CM/P1` | 66.67 | 100.00 | 40.00 | 26.67 | 100.00 | 40.00 | 0 | 0 | **66.00** |
| `CM/P2` | 85.71 | 100.00 | 75.00 | 42.86 | 60.00 | 60.00 | 0 | 10 | **61.39** |
| `MC/P1` | 100.00 | 100.00 | 60.00 | 60.00 | 100.00 | 60.00 | 0 | 10 | **72.00** |
| `MC/P2` | 57.14 | 100.00 | 50.00 | 19.05 | 60.00 | 40.00 | 0 | 0 | **57.50** |
| `MM/P1` | 76.92 | 100.00 | 50.00 | 38.46 | 100.00 | 46.15 | 20 | 0 | **51.73** |
| `MM/P2` | 76.92 | 100.00 | 62.50 | 32.05 | 60.00 | 53.85 | 20 | 0 | **45.88** |

The exact main payoff matrix (unrounded where nonterminating values are shown as fractions/decimals) is:

| P1 \ P2 | `COOPERATE` | `CLAIM_MORE` |
|---|---:|---:|
| `COOPERATE` | `CC = [76.5, 61.5]` | `CM = [66.0, 61.392857142857...]` |
| `CLAIM_MORE` | `MC = [72.0, 57.5]` | `MM = [51.730769230769..., 45.875]` |

Best responses: P1 chooses `COOPERATE` against either P2 action; P2 chooses `COOPERATE` against either P1 action. Thus `COOPERATE` strictly dominates `CLAIM_MORE` for both players. The sole pure Nash equilibrium is `CC`. `CC` strictly Pareto-dominates each other outcome, so the sole Pareto-optimal outcome is `CC`. This main game is **not** a Prisoner's Dilemma.

## Validation rules

- Exactly two players with unique IDs `P1` and `P2`.
- Allocations and penalties are nonnegative; demands and desired hours are positive.
- `0 ≤ essential_kwh ≤ demand_kwh`.
- Total energy cannot exceed `resource.capacity_kwh`.
- Total exclusive allocated hours cannot exceed `resource.available_hours`.
- Cost shares total 1 within absolute tolerance `1e-9`.
- Nature probabilities total 1 within absolute tolerance `1e-9`.
- Mixed probabilities remain in `[0,1]` and each player's probabilities total 1 within tolerance.
- Arbitration candidates are physically feasible and individually rational on the same utility scale.
- If no qualifying arbitration agreement exists, return an honest no-solution result.

## Games Against Nature educational fixture

This predefined table is an educational demo fixture; its utilities are not generated from the main allocation matrix.

| State | Duration | Probability |
|---|---:|---:|
| `SHORT` | 2 hours | 0.30 |
| `MEDIUM` | 5 hours | 0.50 |
| `LONG` | 8 hours | 0.20 |

| Decision | Short | Medium | Long |
|---|---:|---:|---:|
| `BATTERY_ONLY` | 80 | 55 | 20 |
| `GENERATOR_ONLY` | 45 | 70 | 75 |
| `HYBRID` | 65 | 85 | 90 |

Hurwicz optimism `α = 0.6`. Required output includes criterion scores, winning decision(s), ties, and explanations.

| Method | Battery | Generator | Hybrid | Recommendation |
|---|---:|---:|---:|---|
| Expected Value | 55.50 | 63.50 | 80.00 | `HYBRID` |
| Wald/Maximin | 20.00 | 45.00 | 65.00 | `HYBRID` |
| Maximax | 80.00 | 75.00 | 90.00 | `HYBRID` |
| Laplace | 51.67 | 63.33 | 80.00 | `HYBRID` |
| Minimax Regret (lower wins) | 70.00 | 35.00 | 15.00 | `HYBRID` |
| Hurwicz | 56.00 | 63.00 | 80.00 | `HYBRID` |

State-best utilities are `[80,85,90]`; regret rows are Battery `[0,30,70]`, Generator `[35,15,15]`, Hybrid `[15,0,0]`. There are no winning ties in this fixture, but the response shape must always include `ties: []`.

## Nash Arbitration contract

The disagreement point `d=[d1,d2]` is the status-quo utility pair. Feasible candidates are candidate allocations satisfying energy, time, cost, and input constraints. A candidate is individually rational only if `U1 ≥ d1` and `U2 ≥ d2`. Gains are `[U1-d1,U2-d2]`, and:

`nash_product = (U1 - d1) × (U2 - d2)`

The fallback demo disagreement point is `[15,15]`. Generate candidates at 0.5 kWh energy increments, P1 cost shares `0.4/0.5/0.6` with complementary P2 shares, and integer one-hour time slots for canonical candidates. Total energy must not exceed 10 kWh and total exclusive time must not exceed 5 hours. Return every tie at the maximum Nash product.

The fallback `[15,15]` values are temporary assumptions and must eventually be replaced or verified by the same utility scale used for candidate outcomes. The mock arbitration example is shaped for integration but is not an exhaustive verified optimization and must not be presented as the final mathematical recommendation.

## Honest Prisoner's Dilemma rule

Strategy labels alone do not establish a Prisoner's Dilemma. For a symmetric canonical game, verify `T > R > P > S`. For an asymmetric game, both players must have a unilateral incentive to claim more against either opponent action, while mutual cooperation is Pareto-superior to mutual claiming. The detector must explain failed conditions and return `detected: false` for this main demo.

Repeated-game teaching uses a separate book-style fixture: `CC=[3,3]`, `CM=[0,5]`, `MC=[5,0]`, `MM=[1,1]`. It is not calculated from the electricity scenario.

## File ownership

| Person | Branch | Ownership |
|---|---|---|
| Person 1: Mathematical/Algorithm Lead | `feat/math-engine` | `backend/app/algorithms/`, algorithm unit tests, `docs/MATHEMATICAL_MODEL.md` |
| Person 2: Backend/API/Database Lead | `feat/backend-api` | `backend/app/api/`, `schemas/`, `models/`, `database/`, API tests |
| Person 3: Frontend/UI/Animation Lead | `feat/frontend-dashboard` | complete `frontend/` directory |
| Person 4: Integration/Test/Docs/Presentation Lead | `test/integration-demo` | shared documentation, sample data, integration tests, presentation, final README updates |

Shared contract files, root dependency files, and lock files must never be modified concurrently. Their owner announces and serializes changes.

## Integration gates

1. **Contract freeze:** V1 files accepted; names, formulas, fixtures, and response shapes are stable.
2. **Mock vertical slice:** frontend renders `mock-full-analysis-response.json`; backend returns its agreed envelope using temporary algorithm adapters.
3. **Real algorithm integration:** verified pure functions replace mocks without changing the API shape; fixture comparisons pass.
4. **Full demo flow:** scenario entry/load through explanation and repeated-game view succeeds offline.
5. **Sunday 19:00 feature freeze:** only release-blocking fixes, verification, documentation, screenshots, and backup work proceed.
