# PowerShare MM Monday Demo Runbook

This is a CPU-only, offline-capable demonstration of the frozen V1.1
two-player shared-backup-electricity decision-support flow. It does not control
electrical equipment and its utility scores are disclosed prototype assumptions.
The academic scope is Straffin Chapters 1–16; N-person games, Strategic Voting,
Shapley Value, Banzhaf Index, Nucleolus, and other Chapter 17+ methods are not
project features.

## Before the demonstration

1. Use the verified `test/integration-demo` checkout, or the completed main
   commit recorded in `docs/PERSON_4_HANDOFF.md`.
2. Confirm Python 3.11+ and Node.js 20+:

   ```powershell
   python --version
   node --version
   npm.cmd --version
   ```

3. Install backend dependencies in the selected virtual environment:

   ```powershell
   python -m pip install -r backend/requirements-api-dev.txt
   ```

4. Install frontend dependencies:

   ```powershell
   cd frontend
   npm ci
   cd ..
   ```

5. Run `scripts/preflight-demo.ps1` before going offline. It runs 54 Python
   regression/integration tests, frontend typecheck, lint, the 12-test Vitest
   suite, and the production build. Abort/stale-response handling,
   localization, themes, and skeleton loading have behavioral coverage;
   real-browser mobile, accessibility, and projector checks remain manual.
6. Check that ports 8000 and 5173 are available. Do not terminate unrelated
   processes automatically.
7. Open the repository in VS Code before screen sharing, connect the laptop to
   power, disable notifications, and keep this runbook plus the checklist
   available offline.

## Start the two local services

Open two PowerShell terminals at the repository root.

Terminal 1:

```powershell
.\scripts\start-backend.ps1
```

Terminal 2:

```powershell
.\scripts\start-frontend.ps1
```

The services are:

- Frontend: `http://127.0.0.1:5173`
- Backend: `http://127.0.0.1:8000`
- API docs: `http://127.0.0.1:8000/docs`

Stop each service with `Ctrl+C` in its own terminal. These scripts do not kill
processes or require administrator access.

## Live demonstration sequence (5–7 minutes)

1. Introduce the Myanmar shared-backup-electricity problem and the two nearby
   businesses.
2. Show the two players, 10 kWh shared capacity, and 13 kWh combined demand.
3. Run the scenario in **Live Backend** mode and show that the backend is the
   authoritative source.
4. Show the 2×2 payoff matrix and explain that `CLAIM_MORE` strictly dominates
   `COOPERATE` for both players.
5. Highlight the sole pure Nash equilibrium, `MM`.
6. Compare `MM` with the Pareto frontier `CC`, `CM`, and `MC`; explain that
   `CC` Pareto-dominates `MM`.
7. Show the asymmetric Prisoner’s Dilemma explanation.
8. Open Games Against Nature and show all six methods selecting `HYBRID`.
9. Open Nash Arbitration and show the 10,440-candidate verification, selected
   allocation, cost shares, gains, and product.
10. Open Repeated game and explain that the educational repeated-game fixture
    is separate from the electricity payoff matrix.
11. Show Results / theory, including assumptions, warnings, CPU-only design,
    and the Chapters 1–16 boundary.

## Canonical demo oracle

Compare values within absolute tolerance `1e-9` unless a display value is
explicitly rounded:

| Result | Expected |
|---|---|
| CC | `[76.5, 61.5]` |
| CM | `[66.0, 71.39285714285714]` |
| MC | `[82.0, 57.5]` |
| MM | `[66.73076923076923, 60.875]` |
| Strict dominance | `CLAIM_MORE` for both players |
| Pure Nash | `MM` only |
| Pareto frontier | `CC`, `CM`, `MC` |
| Prisoner’s Dilemma | detected, asymmetric |
| Nature winners | `HYBRID` for all six methods |
| Arbitration candidates | `10,440` |
| Arbitration energy | `[5.5, 4.5]` kWh |
| Arbitration hours | `[2, 3]` |
| Arbitration cost shares | `[0.6, 0.4]` |
| Arbitration utilities/gains | `[73.0, 65.35714285714286]` |
| Nash product | `4771.071428571428` |
| Arbitration ties | `[]` |
| Final outcome ID | `null` is valid |

## Fallback plan

If the backend cannot start, switch the frontend to **Mock demo data**. Say
clearly that it is the frozen verified fixture, not a live result. Continue
using the same oracle values and do not imply that the mock is connected to the
backend.

If the frontend cannot start, open `/docs` and use the local API with the
canonical scenario ID:

```powershell
$body = @{ scenario_id = 'demo-shared-power-001'; include_repeated_game = $true } | ConvertTo-Json
Invoke-RestMethod http://127.0.0.1:8000/api/analysis/full -Method Post -ContentType 'application/json' -Body $body
```

If both services fail, use the locally saved expected-results table and any
prepared screenshots or PDF. Explain that the displayed values are validated
offline results; never invent or relabel a result as live.

## Recovery guidance

- **Port in use:** identify the owning process, stop only the process you own,
  or choose a documented alternate port and update `VITE_API_BASE_URL`.
- **Virtual environment:** activate it with
  `.\.venv\Scripts\Activate.ps1`, or install the documented backend
  requirements into the selected environment.
- **Missing npm modules:** run `cd frontend; npm ci`.
- **CORS/API URL mismatch:** confirm the frontend uses
  `VITE_API_BASE_URL=http://127.0.0.1:8000` and restart Vite.
- **Stale build:** use the Vite development server and restart it after
  changing `.env`; do not commit `dist/`.
- **PowerShell policy:** use the safe per-process option
  `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass` only in the
  current presenter terminal, then rerun the script.
- **Safe shutdown:** press `Ctrl+C` in each service terminal. Do not use a
  broad process kill command.

## Presenter notes

Keep the demo to 5–7 minutes. Explain that normalized utilities are not money,
the `[0,0]` arbitration disagreement is a shared-arrangement baseline, and
arbitration’s `outcome_id: null` is intentional because it is not the one-shot
matrix outcome `MM`.
