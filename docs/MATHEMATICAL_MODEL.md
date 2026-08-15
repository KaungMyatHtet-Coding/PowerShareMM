# PowerShare MM — Mathematical Model Specification

This document details the game-theoretic and utility formulation used in PowerShare MM. All core calculations trace directly to Chapters 1–16 of Philip D. Straffin's *Game Theory and Strategy* (1993).

---

## 1. Non-Zero-Sum Electricity Sharing Game (Chapters 11–12)

The main interaction between the two businesses—**Player 1 (Mini Market)** and **Player 2 (Phone/Computer Service Shop)**—is modeled as a $2 \times 2$ non-zero-sum game.

### Strategies
- **COOPERATE (C)**: Honor the agreed cap/time/cost share (essential loads first, proportional distribution of surplus).
- **CLAIM_MORE (M)**: Unilaterally attempt to claim more energy/hours.

### Outcome Matrix
The outcomes are represented as $2 \times 2$ cells:
1. `CC`: Mutual cooperation. Allocations are stable and optimized for essential needs.
2. `CM`: Player 1 cooperates; Player 2 claims more. P2 takes advantage of P1's self-restriction.
3. `MC`: Player 1 claims more; Player 2 cooperates. P1 takes advantage of P2's self-restriction.
4. `MM`: Mutual defection. Both claim more, leading to congestion/overload penalties.

---

## 2. Utility Model and Score Formulation (Chapter 8)

The utility $U_i$ of player $i$ for a given resource allocation outcome is calculated as a weighted sum of normalized score components, clamped to $[0, 100]$.

### Component Scores

$$\text{service\_score}_i = 100 \times \min\left(\frac{e_i}{d_i}, 1.0\right)$$
$$\text{essential\_score}_i = 100 \times \min\left(\frac{e_i}{q_i}, 1.0\right) \quad (\text{if } q_i = 0, \text{ essential\_score}_i = 100)$$
$$\text{time\_score}_i = 100 \times \min\left(\frac{t_i}{T_i^{\text{desired}}}, 1.0\right)$$
$$\text{avoided\_loss\_score}_i = 100 \times \frac{L_i}{\max(L_1, L_2)} \times \frac{\text{service\_score}_i}{100} \times \frac{\text{time\_score}_i}{100}$$
$$\text{urgency\_score}_i = 100 \times \frac{r_i}{5} \times \frac{\text{essential\_score}_i}{100}$$
$$\text{cost\_burden\_score}_i = 100 \times s_i$$

Where:
- $e_i$: allocated energy (kWh)
- $d_i$: player demand (kWh)
- $q_i$: player essential demand (kWh)
- $t_i$: allocated hours
- $T_i^{\text{desired}}$: desired hours
- $L_i$: outage loss (MMK)
- $r_i$: urgency rating ($1 \dots 5$)
- $s_i$: cost share fraction ($s_i = e_i / (e_1 + e_2)$)

The engine rejects non-finite numerical inputs, negative outage loss, negative
allocations, out-of-range cost shares, invalid urgency/risk values, and player
IDs other than exactly `P1` and `P2`. Validation errors are deliberate input
corrections; the engine never silently changes a submitted player or utility.

### Final Utility Formula

$$U_i = \text{clamp}(0.30 \times \text{service\_score}_i + 0.25 \times \text{essential\_score}_i + 0.15 \times \text{time\_score}_i + 0.15 \times \text{avoided\_loss\_score}_i + 0.15 \times \text{urgency\_score}_i - 0.10 \times \text{cost\_burden\_score}_i - P_i^O - P_i^V, 0, 100)$$

Where:
- $P_i^O$: Overload Penalty ($5.0$ utility points under `MM`, $0.0$ otherwise)
- $P_i^V$: Violation Penalty ($0.0$ in the one-shot game)

### Asymmetric Prisoner's Dilemma Proof
Using the canonical demo scenario:
- P1 (Mini Market): $T_1 > R_1 > P_1 > S_1 \implies 82.00 > 76.50 > 66.73 > 66.00$
- P2 (Phone Shop): $T_2 > R_2 > P_2 > S_2 \implies 71.39 > 61.50 > 60.88 > 57.50$
Because $T_i > R_i > P_i > S_i$, `CLAIM_MORE` is a strictly dominant strategy for both players, leading to `MM` as the sole Nash Equilibrium, even though `CC` Pareto-dominates it.

---

## 3. Games Against Nature under Uncertainty (Chapter 9)

Used when choosing scheduling options under nature states (SHORT, MEDIUM, LONG outage durations).

| Criterion | Calculation Rule |
| :--- | :--- |
| **Expected Value** | Maximize $\sum_k p_k \cdot U_{ik}$ |
| **Wald (Maximin)** | Maximize $\min_k U_{ik}$ |
| **Maximax** | Maximize $\max_k U_{ik}$ |
| **Laplace** | Maximize $\frac{1}{N} \sum_k U_{ik}$ |
| **Minimax Regret** | Minimize $\max_k (M_k - U_{ik})$ where $M_k = \max_i U_{ik}$ |
| **Hurwicz** | Maximize $\alpha \max_k U_{ik} + (1 - \alpha) \min_k U_{ik}$ |

---

## 4. Nash Arbitration Scheme (Chapter 16)

Calculates the fair, cooperative arbitration point from all possible discrete allocations.

### Disagreement Point ($d^0$)
- Placed at $[0.0, 0.0]$, representing zero energy/time/cost activations.

### Candidate Search Space
- $e_1 \in [0.0, d_1]$ in steps of $0.5$
- $e_2 \in [0.0, d_2]$ in steps of $0.5$
- $t_1 \in [0.0, T_1]$ (integers)
- $t_2 \in [0.0, T_2]$ (integers)
- $s_1 \in \{0.4, 0.5, 0.6\}$ and $s_2 = 1.0 - s_1$

### Constraints
- $e_1 + e_2 \leq E$ (available capacity)
- $t_1 + t_2 \leq T$ (available hours)

### Selection Rule
Filter out candidates violating Individual Rationality ($U_i < d_i^0$). Select the candidate maximizing the Nash Product:

$$f(U_1, U_2) = (U_1 - d_1^0) \times (U_2 - d_2^0)$$

---

## 5. Repeated Prisoner's Dilemma (Chapters 14–15)

Models long-term cooperation and retaliation behaviors over multiple rounds.

### Strategy Definitions
- **ALWAYS_COOPERATE**: Plays `COOPERATE` in every round.
- **ALWAYS_CLAIM_MORE**: Plays `CLAIM_MORE` in every round.
- **TIT_FOR_TAT**: Plays `COOPERATE` in round 1, then mimics the opponent's previous move.
- **FORGIVING_TIT_FOR_TAT**: Same as TFT, but if the opponent played `CLAIM_MORE`, cooperates anyway with a $20\%$ probability (using seeded RNG).
- **RANDOM**: Plays `COOPERATE` or `CLAIM_MORE` with equal probability (using sequential seeded RNG calls).

---

## 6. Zero-Sum Subproblem and Sequential Game Trees

### Zero-Sum Subproblem (Chapters 2–4)
- Solves competitive time-slot allocation (e.g., peak slot allocation).
- Evaluates maximin, minimax, and saddle point existence. If no saddle point exists, solves the $2 \times 2$ mixed strategy indifference equations.
- The scalar solver accepts one non-empty rectangular matrix of **row-player**
  payoffs. The column-player payoff is defined as the negative of every scalar
  entry. It validates finite real values and rejects booleans, ragged matrices,
  and degenerate mixed-strategy inputs with clear `ValueError` messages.
- `validate_paired_zero_sum_matrices` is available when both payoff matrices are
  supplied. It requires identical shapes and verifies every paired payoff sums
  to zero within the documented `1e-9` tolerance.
- The electricity-sharing bimatrix is non-zero-sum and must not be passed to
  these zero-sum functions.

### Sequential Game Tree (Chapter 7)
- Models sequential bargaining: Player 1 offers $\rightarrow$ Player 2 responds.
- Solves using **backward induction** to find the subgame perfect equilibrium and test the credibility of threats or promises.

### Deterministic Random Strategy Contract

Repeated-game simulations use an isolated `random.Random(seed)` instance. A
`RANDOM` player consumes one sequential `random()` draw per stochastic action:
values below `0.5` choose `COOPERATE`; all other values choose `CLAIM_MORE`.
`FORGIVING_TIT_FOR_TAT` consumes one draw only when its opponent claimed in the
previous round. This documents action consumption rather than relying on an
unspecified container-selection implementation. For seed `42`, `RANDOM` versus
`ALWAYS_COOPERATE` over ten rounds produces P1 actions
`M,C,C,C,M,M,M,C,C,C` and totals `[38,18]` on the educational fixture.
