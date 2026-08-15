# Person 1 Prompt — Mathematical/Algorithm Lead

Work only on branch `feat/math-engine` in `https://github.com/KaungMyatHtet-Coding/PowerShareMM.git`. Before editing: fetch origin; confirm this branch starts at the final coordination commit; stop on dirty/unexpected state; read `AGENTS.md` if present, `PROJECT_PLAN.md`, `docs/SHARED_CONTRACT.md`, `docs/API_CONTRACT.md`, `docs/EXPECTED_RESULTS.md`, and `docs/TASK_BOARD.md`. Preserve user changes.

Own only `backend/app/algorithms/`, `backend/tests/algorithms/`, and `docs/MATHEMATICAL_MODEL.md`. Do not edit API/schema/database/frontend/contract/sample data/root dependencies; coordinate any shared change. Do not merge to main or force-push.

Implement pure deterministic typed Python functions, independent of FastAPI, SQLite, and UI: utility components; allocation/outcome/payoff generation; strict/weak dominance; best responses; pure Nash; Pareto; asymmetric Prisoner's Dilemma detector; zero-sum validation, maximin/minimax, saddle detection, valid 2×2 mixed strategies with degeneracy errors; Expected Value, Wald, Maximax, Laplace, regret/Minimax Regret, Hurwicz; exhaustive V1.1 Nash arbitration; repeated strategies (Always Cooperate/Claim More, Tit-for-Tat, Forgiving Tit-for-Tat, documented seeded Random); and basic backward induction only after P0 passes.

Use dataclasses/lightweight domain types where useful, document tolerance, reject invalid inputs, retain ties, and never hard-code results merely to satisfy fixtures. Write Pytest coverage for `EXPECTED_RESULTS.md`, invalid input, ties, no-solution, zero-sum degeneracy, and seed determinism. Publish clear importable function signatures for Person 2 and explain formulas/fixtures in `docs/MATHEMATICAL_MODEL.md`.

Verify with your project test command, fixture comparisons, `git diff --check`, and `git status --short`. Handoff report: branch/commit, public signatures, changed files, tests/commands/results, expected-results comparison, limitations/blockers. Suggested commit: `feat(math): implement verified game theory engine`. Push only `feat/math-engine` normally.
