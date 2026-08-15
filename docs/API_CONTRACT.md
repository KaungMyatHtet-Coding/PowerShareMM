# PowerShare MM API Contract V1.1

This contract is frozen with [SHARED_CONTRACT.md](SHARED_CONTRACT.md). All field names and enum values are stable for the Monday MVP. JSON uses `snake_case`; enums use uppercase values. The frontend consumes backend results and must not perform authoritative utility, equilibrium, uncertainty, or arbitration calculations.

## Common conventions

Success responses use:

```json
{"data":{},"warnings":[],"meta":{"method":"","version":"v1.1"}}
```

Errors use an appropriate HTTP status and:

```json
{"error":{"code":"INVALID_CAPACITY","message":"Available capacity must be greater than zero.","field":"resource.capacity_kwh","correction":"Enter a number greater than zero."}}
```

Every endpoint may return `INVALID_REQUEST` for malformed JSON. Scenario endpoints may return `INVALID_PLAYER_COUNT`, `INVALID_CAPACITY`, `INVALID_ALLOCATION`, `INVALID_HOURS`, `INVALID_COST_SHARE`, or `INVALID_PROBABILITY`. Unknown stored resources return `NOT_FOUND`. Numeric comparisons use the tolerances in the shared contract. Display values are two-decimal strings or numbers in explicit `display_*` fields; mathematical fields retain JSON numeric precision.

## Shared request objects

The canonical `scenario` object is the exact shape in [`demo-scenario.json`](../sample-data/demo-scenario.json): `id`, `name`, exactly two `players`, `resource`, and `uncertainty_fixture`. Each player and resource contains every field frozen in the shared contract. An `outcome` has `id`, `strategies`, `allocation`, `cost`, `penalties`, and optional calculated `components`/`utilities`.

## `GET /api/health`

**Purpose:** Report local API readiness. **Request:** no body. **Failures:** `503 SERVICE_UNAVAILABLE` if required local services are unavailable.

```json
{"data":{"status":"OK","service":"POWERSHARE_MM","offline_ready":true},"warnings":[],"meta":{"method":"HEALTH_CHECK","version":"v1.1"}}
```

## `POST /api/scenarios`

**Purpose:** Validate and persist one two-player scenario. **Request:** `{ "scenario": <scenario> }`. **Success:** `201`, returning the normalized scenario and ID. **Failures:** all scenario validation codes; `SCENARIO_ID_CONFLICT` if create semantics encounter an existing ID.

```json
{"scenario":{"id":"demo-shared-power-001","name":"Mini Market and Phone Service Shared Power","players":[{"id":"P1","name":"Shwe Mini Market","business_type":"mini_market","demand_kwh":6,"essential_kwh":4,"desired_hours":5,"outage_loss_mmk":30000,"urgency":5,"risk_preference":0.4,"preferred_cost_share":0.6},{"id":"P2","name":"TechCare Phone Service","business_type":"phone_service","demand_kwh":7,"essential_kwh":3,"desired_hours":4,"outage_loss_mmk":20000,"urgency":3,"risk_preference":0.6,"preferred_cost_share":0.4}],"resource":{"resource_type":"hybrid","capacity_kwh":10,"available_hours":5,"total_cost_mmk":50000,"max_safe_load_kw":3,"slot_duration_hours":1,"overload_penalty":5,"violation_penalty":0},"uncertainty_fixture":{"nature_states":[],"decisions":[],"hurwicz_alpha":0.6}}}
```

```json
{"data":{"scenario_id":"demo-shared-power-001","scenario":{"id":"demo-shared-power-001","name":"Mini Market and Phone Service Shared Power","players":[],"resource":{},"uncertainty_fixture":{}}},"warnings":[],"meta":{"method":"CREATE_SCENARIO","version":"v1.1"}}
```

## `GET /api/scenarios/{id}`

**Purpose:** Retrieve a saved scenario. **Request:** path `id` (non-empty string), no body. **Success:** full `scenario`. **Failures:** `INVALID_SCENARIO_ID`, `NOT_FOUND`.

```json
{"data":{"scenario":{"id":"demo-shared-power-001","name":"Mini Market and Phone Service Shared Power","players":[{"id":"P1"},{"id":"P2"}],"resource":{"capacity_kwh":10,"overload_penalty":5,"violation_penalty":0},"uncertainty_fixture":{}}},"warnings":[],"meta":{"method":"GET_SCENARIO","version":"v1.1"}}
```

## `POST /api/analysis/payoffs`

**Purpose:** Generate frozen outcomes and authoritative utility components. **Request:** `scenario_id` plus optional inline `scenario`; inline data takes precedence and must validate. **Success:** ordered outcomes and payoff matrix. **Failures:** scenario errors or `UNSUPPORTED_STRATEGY`.

```json
{"scenario_id":"demo-shared-power-001"}
```

```json
{"data":{"scenario_id":"demo-shared-power-001","strategies":["COOPERATE","CLAIM_MORE"],"outcomes":[{"id":"CC","utilities":[76.5,61.5],"components":{"P1":{},"P2":{}}}],"payoff_matrix":{"row_player":"P1","column_player":"P2","row_strategies":["COOPERATE","CLAIM_MORE"],"column_strategies":["COOPERATE","CLAIM_MORE"],"cells":[{"outcome_id":"CC","utilities":[76.5,61.5]}]}},"warnings":[],"meta":{"method":"FROZEN_UTILITY_MODEL","version":"v1.1"}}
```

## `POST /api/analysis/matrix`

**Purpose:** Analyze a non-zero-sum two-player payoff matrix. **Request:** matrix cell IDs/utilities and stable strategy labels. **Success:** dominance, best responses, pure Nash, Pareto set, and Prisoner's Dilemma detector. **Failures:** `INVALID_MATRIX`, `NONFINITE_PAYOFF`, `UNSUPPORTED_PLAYER_COUNT`.

```json
{"payoff_matrix":{"row_strategies":["COOPERATE","CLAIM_MORE"],"column_strategies":["COOPERATE","CLAIM_MORE"],"cells":[{"outcome_id":"CC","utilities":[76.5,61.5]},{"outcome_id":"CM","utilities":[66,71.39285714285714]},{"outcome_id":"MC","utilities":[82,57.5]},{"outcome_id":"MM","utilities":[66.73076923076923,60.875]}]}}
```

```json
{"data":{"dominated_strategies":[{"player_id":"P1","strategy":"COOPERATE","dominated_by":"CLAIM_MORE","kind":"STRICT"},{"player_id":"P2","strategy":"COOPERATE","dominated_by":"CLAIM_MORE","kind":"STRICT"}],"best_responses":{"P1":{"COOPERATE":["CLAIM_MORE"],"CLAIM_MORE":["CLAIM_MORE"]},"P2":{"COOPERATE":["CLAIM_MORE"],"CLAIM_MORE":["CLAIM_MORE"]}},"pure_nash_equilibria":["MM"],"pareto_optimal_outcomes":["CC","CM","MC"],"prisoners_dilemma":{"detected":true,"type":"ASYMMETRIC","failed_conditions":[]},"explanations":["MM is stable, while CC Pareto-dominates MM."]},"warnings":[],"meta":{"method":"BIMATRIX_ANALYSIS","version":"v1.1"}}
```

## `POST /api/analysis/uncertainty`

**Purpose:** Apply all six Games Against Nature criteria. **Request:** `nature_states`, `decisions`, and `hurwicz_alpha`. **Success:** per-method scores, recommendation(s), ties, regret matrix, explanations. **Failures:** `INVALID_PROBABILITY`, `INVALID_HURWICZ_ALPHA`, `INCOMPLETE_UTILITY_TABLE`.

```json
{"nature_states":[{"id":"SHORT","probability":0.3},{"id":"MEDIUM","probability":0.5},{"id":"LONG","probability":0.2}],"decisions":[{"id":"BATTERY_ONLY","utilities":{"SHORT":80,"MEDIUM":55,"LONG":20}},{"id":"GENERATOR_ONLY","utilities":{"SHORT":45,"MEDIUM":70,"LONG":75}},{"id":"HYBRID","utilities":{"SHORT":65,"MEDIUM":85,"LONG":90}}],"hurwicz_alpha":0.6}
```

```json
{"data":{"methods":[{"id":"EXPECTED_VALUE","scores":{"BATTERY_ONLY":55.5,"GENERATOR_ONLY":63.5,"HYBRID":80},"recommended":["HYBRID"],"ties":[],"explanation":"HYBRID has the greatest probability-weighted utility."}],"regret_matrix":{"BATTERY_ONLY":[0,30,70],"GENERATOR_ONLY":[35,15,15],"HYBRID":[15,0,0]}},"warnings":[],"meta":{"method":"GAMES_AGAINST_NATURE","version":"v1.1"}}
```

## `POST /api/analysis/arbitration`

**Purpose:** Select maximum-Nash-product feasible, individually rational candidate(s). **Request:** disagreement pair and either explicit candidates or `generation` settings. **Success:** selected candidate, all maximum ties, qualification data, gains, product, and verification state. **Failures:** `INVALID_DISAGREEMENT`, `INVALID_CANDIDATE`, `NO_QUALIFYING_AGREEMENT` (may be a successful analytical no-solution with `selected:null`).

```json
{"scenario_id":"demo-shared-power-001","disagreement":[0,0],"generation":{"p1_energy_kwh":{"min":0,"max":6,"step":0.5},"p2_energy_kwh":{"min":0,"max":7,"step":0.5},"p1_hours":{"min":0,"max":5,"integer":true},"p2_hours":{"min":0,"max":4,"integer":true},"total_energy_kwh_max":10,"total_exclusive_hours_max":5,"p1_cost_shares":[0.4,0.5,0.6]}}
```

```json
{"data":{"disagreement":[0,0],"selected":{"candidate_id":"V1_1_ARBITRATION_E5_5_E4_5_H2_H3_S0_6","energy_kwh":[5.5,4.5],"hours":[2,3],"cost_shares":[0.6,0.4],"utilities":[73,65.35714285714286],"gains":[73,65.35714285714286],"nash_product":4771.071428571428},"ties":[],"qualifying_candidates_count":10440,"no_solution":false,"verification_status":"CANONICAL_V1_1_EXHAUSTIVE","explanations":["The no-agreement baseline [0,0] is verified on the same utility scale."]},"warnings":["The [0,0] baseline represents shared-arrangement benefits, not complete business financial condition."],"meta":{"method":"NASH_ARBITRATION","version":"v1.1"}}
```

## `POST /api/simulations/repeated`

**Purpose:** Run the separately labeled educational repeated game. **Request:** fixture ID or explicit canonical matrix, two strategy enums, rounds, and seed. **Success:** round history, totals, averages, cooperation rates. **Failures:** `INVALID_ROUNDS`, `INVALID_SEED`, `UNSUPPORTED_REPEATED_STRATEGY`, `INVALID_MATRIX`.

```json
{"fixture_id":"educational-pd-001","player_strategies":["TIT_FOR_TAT","ALWAYS_CLAIM_MORE"],"rounds":30,"seed":42}
```

```json
{"data":{"fixture_id":"educational-pd-001","rounds":30,"seed":42,"player_strategies":["TIT_FOR_TAT","ALWAYS_CLAIM_MORE"],"history":[],"total_payoffs":[0,0],"average_payoffs":[0,0],"cooperation_rates":[0,0],"educational_fixture":true},"warnings":[],"meta":{"method":"REPEATED_GAME_SIMULATION","version":"v1.1"}}
```

Empty calculated arrays/totals in this shape are placeholders only in documentation; a successful implemented simulation must populate them.

## `POST /api/analysis/full`

**Purpose:** Return the complete frontend dashboard contract in one call. **Request:** `scenario_id` or inline `scenario`, plus optional `include_repeated_game` and repeated settings. **Success:** every field below must exist even when empty. **Failures:** any component validation error; partial results must not masquerade as complete.

```json
{"scenario_id":"demo-shared-power-001","include_repeated_game":false}
```

```json
{"data":{"scenario_id":"demo-shared-power-001","payoff_matrix":{"cells":[]},"outcomes":[],"dominated_strategies":[],"best_responses":{"P1":{},"P2":{}},"pure_nash_equilibria":[],"pareto_optimal_outcomes":[],"prisoners_dilemma":{"detected":false,"type":null,"failed_conditions":[]},"uncertainty_analysis":{"methods":[],"regret_matrix":{}},"arbitration_result":{"selected":null,"ties":[],"qualifying_candidates":[],"no_solution":false,"verification_status":"PENDING"},"repeated_game_result":null,"final_recommendation":{"outcome_id":null,"energy_kwh":[],"hours":[],"cost_shares":[],"status":"PENDING_VERIFICATION"},"explanations":[]},"warnings":[],"meta":{"method":"FULL_ANALYSIS","version":"v1.1"}}
```

The authoritative populated mock is [`mock-full-analysis-response.json`](../sample-data/mock-full-analysis-response.json). It includes scenario ID, payoff matrix, dominated strategies, best responses, Nash equilibria, Pareto outcomes, honest Prisoner's Dilemma detection, uncertainty analysis, temporary arbitration, final recommendation status, warnings, and explanations.

## `GET /api/results/{id}`

**Purpose:** Retrieve a stored full or component analysis result. **Request:** non-empty result path ID. **Success:** result type, scenario ID, and original success envelope data. **Failures:** `INVALID_RESULT_ID`, `NOT_FOUND`.

```json
{"data":{"result_id":"result-demo-001","scenario_id":"demo-shared-power-001","result_type":"FULL_ANALYSIS","result":{"payoff_matrix":{"cells":[]},"explanations":[]}},"warnings":[],"meta":{"method":"GET_RESULT","version":"v1.1"}}
```

## Stability rule

Clients may tolerate additive fields but must not infer missing required fields. Servers must not rename/remove fields or change enum meaning in V1.1. A breaking change requires the two approvals named in the shared contract, a change-log entry, updated fixtures, and a version change.
