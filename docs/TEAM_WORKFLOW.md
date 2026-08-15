# PowerShare MM Team Workflow

V1.1 is frozen before parallel development. All work begins from the final coordination commit on `main`; contract changes require joint approval by the Mathematical/Algorithm Lead and Integration/Release Lead.

## Roles and ownership

| Person | Branch | Exclusive ownership | Main dependency |
|---|---|---|---|
| 1 — Mathematical/Algorithm Lead | `feat/math-engine` | `backend/app/algorithms/`, `backend/tests/algorithms/`, `docs/MATHEMATICAL_MODEL.md` | frozen contract and expected-results oracle |
| 2 — Backend/API/Database Lead | `feat/backend-api` | `backend/app/api/`, `backend/app/schemas/`, `backend/app/models/`, `backend/app/services/`, `backend/app/database/`, backend API tests/configuration | Person 1 public function contracts |
| 3 — Frontend/UI/Animation Lead | `feat/frontend-dashboard` | entire `frontend/` directory | API contract and mock full-analysis response |
| 4 — Integration/Testing/Docs/Presentation Lead | `test/integration-demo` | integration tests, final docs, setup verification, presentation, screenshots, demo script, release checklist, final README integration updates | each owner’s handoff |

## Working rules

- No one works directly on `main` or edits another owner’s directory without coordination.
- Person 1 exposes pure deterministic functions; Person 2 consumes them; Person 3 consumes backend results and never reimplements authoritative mathematics.
- Person 3 starts with `sample-data/mock-full-analysis-response.json`. Person 2 may use an explicitly marked temporary adapter until Person 1 is integrated.
- Person 4 starts immediately with fixtures, acceptance checks, documentation, rehearsal, and handoff tracking.
- No force-push on shared branches. Do not commit secrets, `.env`, virtual environments, `node_modules`, databases, caches, or build output.
- Before every push: fetch, inspect owned diff, run relevant tests, and report blockers precisely. Sunday 19:00 Asia/Rangoon is feature freeze.

## Responsibility matrix

| Deliverable | P1 | P2 | P3 | P4 |
|---|---|---|---|---|
| Math engine and fixtures | R | C | I | V |
| API/schema/persistence | C | R | C | V |
| UI/accessibility/motion | I | C | R | V |
| Integration/release/demo | C | C | C | R |
| Contract changes | A | I | I | A |

`R` responsible, `A` joint approval, `C` consulted, `I` informed, `V` verifies.

## Checkpoints

| Time | Required outcome |
|---|---|
| Saturday 10:30 | contract/expected-result acknowledgement; public interfaces agreed |
| Saturday 16:00 | mock vertical slice: UI renders fixture and API envelope is stable |
| Saturday 18:30 | Person 1 P0 math and Person 2 validation/API tests available |
| Sunday 09:30 | real math-to-API adapter integrated without shape change |
| Sunday 16:30 | full offline scenario flow and rehearsal |
| Sunday 19:00 | feature freeze; only release-blocking fixes, docs, backup, and verification |
