# Person 1 to Person 2 Handoff Specification

* **Role**: Mathematical/Algorithm Lead (Person 1)
* **Status**: Corrected and ready for independent re-review
* **Date**: Saturday, August 15, 2026

Dear Person 2 (Backend API Lead),

I have implemented, documented, and fully tested the mathematical and game-theoretic engine for PowerShare MM. The codebase is clean, conforms strictly to Chapters 1–16 of Philip D. Straffin's *Game Theory and Strategy*, and is verified against the canonical oracle values.

Below is the information you need to import the core math modules into your FastAPI endpoints.

---

## 1. Domain Types and Import Path

All domain structures are declared as Python dataclasses in `backend/app/algorithms/domain.py`. You can import them directly to instantiate scenario parameters for calculations:

```python
from backend.app.algorithms.domain import Player, SharedResource, Scenario, UncertaintyFixture, NatureState, Decision
```

### Class Definitions:
* **`Player`**: Holds player constraints (`id`, `name`, `business_type`, `demand_kwh`, `essential_kwh`, `desired_hours`, `outage_loss_mmk`, `urgency`, `risk_preference`, `preferred_cost_share`).
* **`SharedResource`**: Holds generator/battery limits (`resource_type`, `capacity_kwh`, `available_hours`, `total_cost_mmk`, `max_safe_load_kw`, `slot_duration_hours`, `overload_penalty`, `violation_penalty`).
* **`Scenario`**: Aggregates a scenario `id`, `name`, `players` list, and `resource` configuration.

---

## 2. Public Function Signatures for API Routes

You can import all solver functions directly from `backend/app/algorithms/`. Here are the exact signatures and usage guidelines for each endpoint:

### A. Payoff Matrix Generation
* **Endpoint mapping**: `POST /api/analysis/payoffs`
* **Import**: `from backend.app.algorithms.payoffs import build_bimatrix`
* **Signature**:
  ```python
  def build_bimatrix(scenario: Scenario) -> Dict[str, Any]
  ```
* **Returns**: A dictionary containing `scenario_id`, `strategies`, ordered
  `outcomes`, and `payoff_matrix`. Each outcome has stable
  `strategies: [P1_action, P2_action]` values (`COOPERATE` or `CLAIM_MORE`),
  plus `allocation`, `cost`, `penalties`, `utilities`, and `components`. There
  is no ambiguous `actions` field.

### B. Matrix & Dominance Analysis
* **Endpoint mapping**: `POST /api/analysis/matrix`
* **Imports**:
  ```python
  from backend.app.algorithms.matrix import find_dominance
  from backend.app.algorithms.bimatrix import best_responses, pure_nash, detect_prisoners_dilemma
  from backend.app.algorithms.efficiency import pareto_front
  ```
* **Signatures**:
  ```python
  def find_dominance(payoff_matrix: Dict[str, Any]) -> List[Dict[str, Any]]
  def best_responses(payoff_matrix: Dict[str, Any]) -> Dict[str, Any]
  def pure_nash(payoff_matrix: Dict[str, Any]) -> List[str]
  def detect_prisoners_dilemma(payoff_matrix: Dict[str, Any]) -> Dict[str, Any]
  def pareto_front(outcomes: List[Dict[str, Any]]) -> List[str]
  ```
* **Usage**: Feed the `payoff_matrix` (or `outcomes` list for Pareto) directly from the payoff generation step into these analyzers.

### C. Games Against Nature (Uncertainty)
* **Endpoint mapping**: `POST /api/analysis/uncertainty`
* **Import**: `from backend.app.algorithms.nature import solve_nature`
* **Signature**:
  ```python
  def solve_nature(
      nature_states: List[Dict[str, Any]],
      decisions: List[Dict[str, Any]],
      hurwicz_alpha: float
  ) -> Dict[str, Any]
  ```
* **Validation**: Raises `ValueError` if probabilities do not sum to `1.0` (within `1e-9`) or if `hurwicz_alpha` is outside `[0.0, 1.0]`.

### Zero-Sum Competitive Time-Slot Subproblem
* **Imports**:
  ```python
  from backend.app.algorithms.zero_sum import (
      find_saddles,
      maximin_minimax,
      solve_mixed_2x2,
      validate_paired_zero_sum_matrices,
      validate_scalar_zero_sum_matrix,
  )
  ```
* **Convention**: a scalar matrix is the row-player payoff matrix and the
  column-player payoff is its negation. The validation functions reject empty,
  ragged, non-finite, and non-zero-sum paired inputs. Do not send the main
  electricity-sharing bimatrix to these functions.

### D. Nash Arbitration
* **Endpoint mapping**: `POST /api/analysis/arbitration`
* **Import**: `from backend.app.algorithms.arbitration import nash_arbitration`
* **Signature**:
  ```python
  def nash_arbitration(scenario: Scenario, disagreement_point: Tuple[float, float] = (0.0, 0.0)) -> Dict[str, Any]
  ```
* **Returns**: Evaluates the $10,440$ allocation combinations, checks individual rationality, and returns the selected candidate, maximizing Nash product, and any ties.

### E. Repeated Game Simulation
* **Endpoint mapping**: `POST /api/simulations/repeated`
* **Import**: `from backend.app.algorithms.repeated import simulate_repeated`
* **Signature**:
  ```python
  def simulate_repeated(
      payoff_matrix: Dict[str, List[float]],
      p1_strategy: str,
      p2_strategy: str,
      rounds: int = 30,
      seed: int = 42,
      fixture_id: str = "educational-pd-001",
      is_educational: bool = True
  ) -> Dict[str, Any]
  ```
* **Details**: Computes round-by-round history of moves, cumulative payoffs, and average cooperation rates. Uses sequential random choice evaluations to ensure strict seed determinism.

### F. Sequential Game Tree / Backward Induction
* **Endpoint mapping**: `POST /api/analysis/full` (or sequential trees)
* **Import**: `from backend.app.algorithms.game_tree import backward_induction`
* **Signature**:
  ```python
  def backward_induction(node: Dict[str, Any]) -> Dict[str, Any]
  ```

---

## 3. QA Testing & Verification Evidence

As the QA Tester, I have verified all edge cases and oracle results. The complete pytest suite executes successfully in our virtual environment:

```powershell
python -m pip install -r backend/requirements-math-dev.txt
python -m pytest backend/tests/algorithms/
```

### Test Assertions Passed:
1. **Utility and Scenario Validation**: Rejects negative outage loss,
   non-finite numerical values, invalid player IDs, and invalid ranges without
   mutating caller input.
2. **Oracle Values Match**: Asserts that `CC` utility equals exactly `76.50` for P1 and `61.50` for P2.
3. **Equilibrium & Pareto Accuracy**: Confirms that `CLAIM_MORE` is strictly dominant, `MM` is the sole pure Nash Equilibrium, and `CC`, `CM`, and `MC` are the only Pareto optimal outcomes.
4. **Nash Arbitration Count**: Verified that exactly $10,440$ feasible candidate configurations are scanned, and the selected configuration corresponds to:
   - Energy: `[5.5, 4.5]`
   - Hours: `[2, 3]`
   - Cost shares: `[0.6, 0.4]`
   - Product: `4771.071428571428`
5. **Zero-Sum Validation**: Covers scalar/paired conventions, malformed and
   non-finite matrices, a saddle point, 2x2 shape checks, and degeneracy.
6. **Repeated Game Output Determinism**: Verifies the documented seed-42
   `random()` action sequence and preserves the supplied payoff fixture.

---

## 4. Integration Guidelines

1. **Input Schema Mapping**: When defining Pydantic schemas in `backend/app/schemas/`, map the JSON payloads directly to `Player` and `SharedResource` dataclasses to initialize a `Scenario` object before calling these algorithms.
2. **Exception Handling**: Wrap calls in `try...except ValueError as e` blocks. All validation failures (e.g. probability sum failures, invalid ranges) raise a standard `ValueError`.
3. **No Double-Counting**: Do not adjust outcomes or apply penalties inside the API endpoints. All penalty/allocation rules are fully handled by the algorithm layer.

If you have any questions during setup, let me know!
