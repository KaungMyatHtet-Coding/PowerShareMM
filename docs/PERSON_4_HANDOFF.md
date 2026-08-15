# Person 4 Integration and Demo Handoff

## Branch and scope

- Role: Person 4 Integration, Quality Assurance and Demo Lead
- Branch: `test/integration-demo`
- Starting completed-main commit: `6035362aa52c3b7f37e60b118359f0a2abe1533b`
- Person 4 synchronization: fast-forwarded from `f2a6a9a` with no unique work lost
- Owned changes: integration tests, Windows startup scripts, demo runbook,
  final checklist, handoff, and release documentation

## Files

- `tests/integration/test_release_flow.py`
- `scripts/preflight-demo.ps1`
- `scripts/start-backend.ps1`
- `scripts/start-frontend.ps1`
- `docs/DEMO_RUNBOOK.md`
- `docs/FINAL_DEMO_CHECKLIST.md`
- `docs/PERSON_4_HANDOFF.md`
- `README.md` integration links
- `docs/TASK_BOARD.md` Person 4 status updates

## Commands

```powershell
python -m pytest backend/tests/ tests/integration -q
cd frontend
npm ci
npm run typecheck
npm run lint
npm test -- --run
npm run build
cd ..
.\scripts\preflight-demo.ps1
```

Start the demo with two terminals:

```powershell
.\scripts\start-backend.ps1
.\scripts\start-frontend.ps1
```

URLs:

- Frontend: `http://127.0.0.1:5173`
- Backend: `http://127.0.0.1:8000`
- API docs: `http://127.0.0.1:8000/docs`

Stop safely with `Ctrl+C` in each terminal.

## Verification evidence

- Baseline backend suite: 48 passed.
- Baseline frontend: typecheck, lint, 5 tests, and build passed.
- Person 4 integration suite: 6 passed.
- The integration suite verifies health, ten OpenAPI paths, standard 404/405
  envelopes, full-analysis transport and canonical oracle, representative
  validation errors, CORS rejection, SQLite lifecycle, and frontend backend-
  authority boundaries.
- The live local API flow returned the canonical payoff, Nash, Pareto,
  Prisoner’s Dilemma, uncertainty, arbitration, repeated-game, and null final
  outcome fields.

## Canonical expected-versus-actual summary

| Check | Expected | Actual |
|---|---|---|
| CC | `[76.5, 61.5]` | verified |
| CM | `[66.0, 71.39285714285714]` | verified |
| MC | `[82.0, 57.5]` | verified within `1e-9` |
| MM | `[66.73076923076923, 60.875]` | verified |
| Pure Nash | `MM` only | verified |
| Pareto | `CC`, `CM`, `MC` | verified |
| Nature | six `HYBRID` winners | verified |
| Arbitration | 10,440 candidates | verified |
| Allocation | `[5.5,4.5]`, `[2,3]`, `[0.6,0.4]` | verified |
| Nash product | `4771.071428571428` | verified |
| Final outcome ID | `null` | verified |

## Limitations and warnings

- Full browser automation was not available; browser verification is covered by
  the existing Vitest/jsdom checks, source review, live HTTP checks, and the
  documented manual browser sequence.
- Backend tests emit a known Starlette/httpx deprecation warning.
- `npm ci` reports a deprecated `whatwg-encoding` transitive package.
- Utilities are disclosed prototype scores, not money or electrical-safety
  commands.
- Mock mode is an explicit offline fixture and must not be described as live.

## Merge readiness

The branch is ready for independent re-review after the Person 4 commit and
normal push. Main remains unchanged by Person 4. No algorithm, API schema,
frontend component, frozen contract, fixture, or expected-result file was
modified.
