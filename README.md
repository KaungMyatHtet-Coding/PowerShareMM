# PowerShare MM

**PowerShare MM: A Game-Theoretic Decision Support and Simulation System for Shared Backup Electricity Scheduling and Cost Negotiation**

PowerShare MM is a decision-support and educational simulation that models how exactly two nearby businesses can share limited backup electricity, operating time, and costs during outages.

The academic scope is restricted to Chapters 1–16 of Philip D. Straffin's *Game Theory and Strategy*. Chapter 16 is included; Chapter 17 and later material is excluded.

- Development dates: August 15–16, 2026
- Demonstration date: August 17, 2026
- Current status: V1.1 implementation integrated; offline demo preparation complete

See the detailed [project plan](PROJECT_PLAN.md) for the mathematical foundation, implementation order, team responsibilities, verification requirements, and prototype deadline.

## Team coordination

- [Project plan](PROJECT_PLAN.md)
- [Shared contract](docs/SHARED_CONTRACT.md)
- [API contract](docs/API_CONTRACT.md)
- [Four-person task board](docs/TASK_BOARD.md)
- [Canonical demo scenario](sample-data/demo-scenario.json)
- [Mock full-analysis response](sample-data/mock-full-analysis-response.json)
- [Educational repeated-game fixture](sample-data/repeated-game-fixture.json)
- [Team workflow](docs/TEAM_WORKFLOW.md)
- [Merge runbook](docs/MERGE_RUNBOOK.md)
- [Expected-results oracle](docs/EXPECTED_RESULTS.md)
- [Person 1 math prompt](docs/prompts/PERSON_1_MATH_ENGINE.md)
- [Person 2 API prompt](docs/prompts/PERSON_2_BACKEND_API.md)
- [Person 3 frontend prompt](docs/prompts/PERSON_3_FRONTEND_DASHBOARD.md)
- [Person 4 integration prompt](docs/prompts/PERSON_4_INTEGRATION_DEMO.md)
- [Burmese team start guide](docs/TEAM_START_GUIDE_MM.md) — step-by-step guide for all four members

## Monday demo

```powershell
.\scripts\preflight-demo.ps1
.\scripts\start-backend.ps1
.\scripts\start-frontend.ps1
```

The preflight runs the 54-test Python regression/integration suite plus frontend
typecheck, lint, the 12-test Vitest suite, and the production build. Abort and
stale-response handling, landing navigation, localization, themes, and skeleton
loading have behavioral coverage; real-browser mobile, accessibility, and
projector checks remain manual.

See the [demo runbook](docs/DEMO_RUNBOOK.md), [final checklist](docs/FINAL_DEMO_CHECKLIST.md),
and [Person 4 handoff](docs/PERSON_4_HANDOFF.md). The backend and API docs use
`http://127.0.0.1:8000`; the Vite frontend uses `http://127.0.0.1:5173`.
After dependencies are installed, the demo does not require internet access.
