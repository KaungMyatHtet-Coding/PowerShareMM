# Person 3 Prompt — Frontend/UI/Animation Lead

Work only on `feat/frontend-dashboard` in PowerShare MM. Before editing: fetch origin; confirm your branch starts at the final coordination commit; stop on dirty/unexpected state; read `AGENTS.md` if present, project plan, shared/API contracts, expected results, and task board. Preserve user changes.

You exclusively own `frontend/`. Do not edit backend, algorithms, contracts, fixture JSON, root dependencies, or release docs. Never merge main or force-push.

Build a lightweight React/Vite/TypeScript dashboard starting from `sample-data/mock-full-analysis-response.json`, then switch through an isolated API client/config-controlled mock/live mode. Include responsive tabs/flow for Scenario, Analysis, Uncertainty, Arbitration, Simulation, and Results/Theory; player/resource form and field-error display; payoff matrix, best-response, Nash `MM`, Pareto `CC/CM/MC`, asymmetric PD explanation, all Games Against Nature results, verified arbitration cards, repeated-game summary, assumptions/warnings, loading/empty/error states.

Use strict TypeScript, accessible labels/keyboard/focus/contrast, CSS/Framer Motion only for CPU-friendly motion, and `prefers-reduced-motion`. Authoritative math comes from backend only. Add component tests for expected labels/states and verify a production build. Handoff report: branch/commit, routes/components/config, mock/live status, tests/build/results, accessibility/reduced-motion checks, blockers. Suggested commit: `feat(ui): build PowerShare decision dashboard`. Push only your branch normally.
