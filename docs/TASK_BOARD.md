# PowerShare MM Four-Person Task Board

**Allowed status values:** `TODO`, `IN PROGRESS`, `BLOCKED`, `REVIEW`, `DONE`

**Contract:** V1.1 frozen in [SHARED_CONTRACT.md](SHARED_CONTRACT.md)

**Execution references:** [Expected Results](EXPECTED_RESULTS.md) · [Team Workflow](TEAM_WORKFLOW.md) · [Merge Runbook](MERGE_RUNBOOK.md)

**Myanmar start guide:** [TEAM_START_GUIDE_MM.md](TEAM_START_GUIDE_MM.md)

**Feature freeze:** Sunday, August 16, 2026 at 19:00 (Asia/Rangoon)

No task on this board is implemented yet. Each person creates their branch from synchronized `main`, owns only the listed paths, and integrates through the designated release owner. Shared contract files, root dependency files, and lock files are serialized changes, never concurrent edits.

## Priority map

| Priority | Meaning | Work |
|---|---|---|
| P0 | Required before Sunday 19:00 freeze | frozen utility/matrix/nature/arbitration/repeated core; validated API; mock-to-live dashboard; offline demo/checklist |
| P1 | Include only after P0 is green | game-tree minimum, SQLite browsing polish, richer theory/help, extra UI polish |
| P2 | Optional post-demo polish | exports, extra scenarios, enhanced presentation automation |

## How to claim your role

1. Agree on one role in the team chat.
2. Replace the relevant `Person 1`–`Person 4` placeholder in this file with your name in one small coordination commit owned by Person 4.
3. Create/check out the frozen branch name and announce `IN PROGRESS` with the task IDs claimed.
4. Do not alter another person's owned path without explicit coordination.
5. Report `BLOCKED` with the exact contract/fixture/input required; do not silently invent a new field or formula.

## Person 1 — Mathematical/Algorithm Lead

- **Name:** Person 1 (unclaimed)
- **Branch:** `feat/math-engine`
- **Owned paths:** `backend/app/algorithms/`, `backend/tests/algorithms/`, `docs/MATHEMATICAL_MODEL.md`
- **Prompt:** [PERSON_1_MATH_ENGINE.md](prompts/PERSON_1_MATH_ENGINE.md)
- **Parallel rule:** Does not wait for Person 2; implements pure typed functions against frozen plain data contracts and fixtures.

| ID | Day | Task | Deliverable | Dependency | Acceptance | Status |
|---|---|---|---|---|---|---|
| P1-1 | Sat | Translate frozen formulas/outcomes into pure functions | utility/payoff module | shared contract only | all component values match fixture within `1e-9` | TODO |
| P1-2 | Sat | Implement dominance, best response, pure Nash, Pareto, honest PD detector | matrix modules + unit tests | mock matrix | expected strict dominance by `CLAIM_MORE`, sole Nash `MM`, Pareto set `CC/CM/MC`, and asymmetric PD result match | TODO |
| P1-3 | Sat | Implement six nature criteria | nature module/tests | nature fixture | all scores/recommendations match | TODO |
| P1-4 | Sat | Implement arbitration candidate generation/product | arbitration module/tests | frozen generation rules | feasibility, IR, ties, no-solution tested | TODO |
| P1-5 | Sun | Repeated-game strategies and seeded simulation | repeated module/tests | educational fixture | seed 42 deterministic; fixture label retained | TODO |
| P1-6 | Sun | Write mathematical model/manual fixtures | `MATHEMATICAL_MODEL.md` | verified functions | formulas, assumptions, traceability documented | TODO |

## Person 2 — Backend/API/Database Lead

- **Name:** Person 2 (unclaimed)
- **Branch:** `feat/backend-api`
- **Owned paths:** `backend/app/api/`, `backend/app/schemas/`, `backend/app/models/`, `backend/app/services/`, `backend/app/database/`, backend API tests/configuration
- **Prompt:** [PERSON_2_BACKEND_API.md](prompts/PERSON_2_BACKEND_API.md)
- **Parallel rule:** Defines typed interfaces from `API_CONTRACT.md` and initially returns clearly marked mock algorithm results; does not wait for Person 1.

| ID | Day | Task | Deliverable | Dependency | Acceptance | Status |
|---|---|---|---|---|---|---|
| P2-1 | Sat | Define Pydantic request/response schemas | stable V1.1 schema types | API contract | demo fixture validates; bad inputs use error shape | TODO |
| P2-2 | Sat | Add endpoint routing with temporary adapters | all contracted endpoints | typed schemas/mock response | envelopes and enums match fixtures | TODO |
| P2-3 | Sat | Add minimal scenario/result repository | SQLite plus in-memory fallback | scenario schemas | create/get works; exactly two players enforced | TODO |
| P2-4 | Sat | Write API contract tests | API test suite | temporary adapters | status codes and shapes verified | TODO |
| P2-5 | Sun | Replace temporary adapters with Person 1 functions | real analysis integration | Gate 3 / P1 review | no API shape changes; fixture equality passes | TODO |
| P2-6 | Sun | Harden error/offline paths | validation + fallback | integration defects | no credentials/network required | TODO |

## Person 3 — Frontend/UI/Animation Lead

- **Name:** Person 3 (unclaimed)
- **Branch:** `feat/frontend-dashboard`
- **Owned paths:** complete `frontend/` directory
- **Prompt:** [PERSON_3_FRONTEND_DASHBOARD.md](prompts/PERSON_3_FRONTEND_DASHBOARD.md)
- **Parallel rule:** Uses [`mock-full-analysis-response.json`](../sample-data/mock-full-analysis-response.json) immediately; never recalculates authoritative mathematics.

| ID | Day | Task | Deliverable | Dependency | Acceptance | Status |
|---|---|---|---|---|---|---|
| P3-1 | Sat | Define TypeScript types/client adapter from mock | frontend types/API layer | V1.1 fixture | mock parses with no renamed fields | TODO |
| P3-2 | Sat | Build scenario form and validation presentation | scenario tab | demo scenario | exact two-player fields visible; backend remains authority | TODO |
| P3-3 | Sat | Render matrix/results from mock | matrix/dashboard tabs | mock response | Nash/Pareto/dominance/PD explanations render | TODO |
| P3-4 | Sun | Render uncertainty/arbitration/repeated views | analysis tabs | fixtures | warnings and temporary status conspicuous | TODO |
| P3-5 | Sun | Add CPU-friendly motion/responsiveness | accessible polish | core UI complete | reduced-motion works; no information depends on motion | TODO |
| P3-6 | Sun | Switch adapter to live API | integrated flow | Gate 3 / Person 2 | same components work without math duplication | TODO |

## Person 4 — Integration/Test/Docs/Presentation Lead

- **Name:** Person 4 (Integration, QA and Demo Lead)
- **Branch:** `test/integration-demo`
- **Owned paths:** shared documentation, `sample-data/`, integration tests, `presentation/`, final README updates
- **Prompt:** [PERSON_4_INTEGRATION_DEMO.md](prompts/PERSON_4_INTEGRATION_DEMO.md)
- **Parallel rule:** Begins fixtures, independent verification, demo script, test planning, and slides immediately.

| ID | Day | Task | Deliverable | Dependency | Acceptance | Status |
|---|---|---|---|---|---|---|
| P4-1 | Sat | Confirm role claims/contracts | named board + acknowledgements | team response | one owner per path; approvals recorded | DONE |
| P4-2 | Sat | Convert fixtures into integration assertions | fixture/test specification | frozen JSON | JSON/schema/math expected values checked | DONE |
| P4-3 | Sat | Prepare demo script/checklist | runbook and final checklist | plan/fixtures | 5–7 minute narrative fits boundaries | DONE |
| P4-4 | Sun | Integrate reviewed branches in gate order | integration branch | green owner tests | no force push; contract unchanged | DONE |
| P4-5 | Sun | Run full/offline/manual verification | test report | Gate 4 candidate | canonical flow succeeds twice | DONE |
| P4-6 | Sun | Final README/handoff and release hygiene | release bundle | frozen candidate | recoverable offline instructions | DONE |

Person 4 synchronized with hotfix-updated main; the release preflight now runs
54 Python tests and all frontend gates, including the 12-test Vitest suite with
abort/stale-response, landing, localization, theme, persistence, and skeleton coverage.
Real-browser mobile, accessibility, and projector checks remain manual.

## Integration checkpoints

| Gate/time target | Required evidence | Owner(s) | Status |
|---|---|---|---|
| 1. Contract freeze — Sat before coding | V1.1 docs/JSON parse; team acknowledges paths | P1 + P4 approval | REVIEW |
| 2. Mock vertical slice — Sat 16:00 | frontend renders mock; API returns V1.1 envelope | P2 + P3 | DONE |
| 3. Real algorithm integration — Sun 09:30 | backend uses verified functions; fixture tests green | P1 + P2 + P4 | DONE |
| 4. Full demo flow — Sun 16:30 | scenario through final explanation works offline | all | REVIEW |
| 5. Feature freeze — **Sun 19:00** | P0 tests/rehearsal pass; optional work stopped | P4 release owner | REVIEW |

At every gate: fetch, confirm no remote divergence, run owned tests, review contract-sensitive diffs, and record blockers. A gate failure blocks dependent integration, not independent work in owned directories.

## Handoff and merge readiness

Every handoff states branch/commit, owned files, public interfaces or UI/API dependencies, commands/tests run and results, expected-results comparison, known limits, and blockers. Ready to merge means the owner has pushed, worktree is clean, commits are focused, tests pass, and the integration owner has reviewed the handoff and diff. P0 is required for the Monday demo; P1 is included only after P0; P2 is optional polish. Do not mark implementation tasks complete until evidence is reviewed.

## Monday demonstration checklist

- [ ] Local dependency/install instructions were tested before going offline.
- [ ] Canonical scenario loads with exactly two players and 10 kWh capacity.
- [ ] Payoff matrix matches the frozen expected matrix.
- [ ] Sole Nash `MM`, Pareto set `CC/CM/MC`, and asymmetric Prisoner's Dilemma explanation display correctly.
- [ ] Demo explains that `CC` Pareto-dominates stable `MM` and repeated interaction can support cooperation.
- [ ] All six uncertainty methods recommend `HYBRID` for the fixture.
- [ ] Arbitration fallback/verification warning is stated honestly.
- [ ] Educational repeated-game fixture is clearly separate from electricity payoffs.
- [ ] Reduced-motion and static-table fallback work.
- [ ] Demo runs in 5–7 minutes twice.
- [ ] Backup sample, screenshots/slides, and final test report are accessible offline.
- [ ] No Monday implementation is required.
