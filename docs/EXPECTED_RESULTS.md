# PowerShare MM V1.1 Expected Results

This is the authoritative test and integration oracle. Compare floating-point values with absolute tolerance `1e-9` unless a display value is explicitly two decimals.

## Main scenario oracle

| Outcome | Full utility pair | Display |
|---|---:|---:|
| `CC` | `[76.5, 61.5]` | `[76.50, 61.50]` |
| `CM` | `[66.0, 71.39285714285714]` | `[66.00, 71.39]` |
| `MC` | `[82.0, 57.5]` | `[82.00, 57.50]` |
| `MM` | `[66.73076923076923, 60.875]` | `[66.73, 60.88]` |

The complete component breakdown is frozen in `SHARED_CONTRACT.md` and `mock-full-analysis-response.json`. Penalties are violation `0`, overload `5` only for `MM`.

- Dominance: `CLAIM_MORE` strictly dominates `COOPERATE` for P1 and P2.
- Best responses: P1 against P2 `COOPERATE`/`CLAIM_MORE` → `CLAIM_MORE`; P2 against P1 `COOPERATE`/`CLAIM_MORE` → `CLAIM_MORE`.
- Sole pure Nash equilibrium: `MM`.
- Pareto frontier: `CC`, `CM`, `MC`; `CC` strictly Pareto-dominates `MM`.
- Asymmetric Prisoner's Dilemma: detected `true`. P1: `82 > 76.5 > 66.73076923076923 > 66`; P2: `71.39285714285714 > 61.5 > 60.875 > 57.5`.

## Games Against Nature oracle

| Method | Battery | Generator | Hybrid | Winner |
|---|---:|---:|---:|---|
| Expected Value | 55.50 | 63.50 | 80.00 | `HYBRID` |
| Wald/Maximin | 20.00 | 45.00 | 65.00 | `HYBRID` |
| Maximax | 80.00 | 75.00 | 90.00 | `HYBRID` |
| Laplace | 51.666666666666664 | 63.333333333333336 | 80.00 | `HYBRID` |
| Minimax Regret (lower wins) | 70.00 | 35.00 | 15.00 | `HYBRID` |
| Hurwicz `α=0.6` | 56.00 | 63.00 | 80.00 | `HYBRID` |

Regret rows are Battery `[0,30,70]`, Generator `[35,15,15]`, Hybrid `[15,0,0]`.

## Nash arbitration oracle

Disagreement is verified `[0,0]`: no shared allocation/time/resource activation/cost/penalty. It represents shared-arrangement benefit, not total business financial condition.

Enumerate P1 energy `0..6` by `0.5`, P2 `0..7` by `0.5`, total `≤10`; P1 hours integer `0..5`, P2 `0..4`, total `≤5`; P1 cost shares `0.4/0.5/0.6`, P2 complement. No penalties apply to valid negotiated candidates. There are 10,440 feasible candidates.

| Selected field | Expected value |
|---|---:|
| energy kWh | `[5.5,4.5]` |
| hours | `[2,3]` |
| cost shares | `[0.6,0.4]` |
| utilities/gains | `[73.0,65.35714285714286]` |
| Nash product | `4771.071428571428` |
| ties | `[]` |

## Repeated-game reference oracle

The separate book-style fixture is `CC=[3,3]`, `CM=[0,5]`, `MC=[5,0]`, `MM=[1,1]`, default 30 rounds, seed 42.

- Always Cooperate vs Always Cooperate: `[90,90]`.
- Always Claim More vs Always Claim More: `[30,30]`.
- Tit-for-Tat vs Always Cooperate: `[90,90]`.
- Tit-for-Tat vs Always Claim More: first `[0,5]`, then 29 × `[1,1]`, total `[29,34]`.
- Tit-for-Tat vs Tit-for-Tat: `[90,90]`.
- For `RANDOM`, Person 1 must document the exact RNG contract and derive/freeze its seed-42 oracle; do not invent it.

## API and UI oracle

Health returns the V1.1 success envelope. All success responses use `data`, `warnings`, and `meta.method/version`; validation errors use `error.code/message/field/correction`. Test invalid capacity, invalid player count, and invalid probability with field-level correction.

UI visibly highlights Nash `MM`, Pareto `CC/CM/MC`, Prisoner’s Dilemma `Detected`, all uncertainty winners `HYBRID`, and verified arbitration allocation. Assumptions/penalties must be visible; reduced motion and invalid-input correction must work. No hidden frontend mathematics.
