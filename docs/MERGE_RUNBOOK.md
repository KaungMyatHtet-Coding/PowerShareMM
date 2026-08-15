# PowerShare MM Merge Runbook

## Before any merge

Every owner pushes their branch with a clean worktree, small descriptive commits, passing branch tests, and a handoff report (scope, tests/commands, fixture results, known limits, files changed). The integration owner fetches all remotes and inspects commits/diff stats. Never force-push or delete unresolved work.

## Required order

1. `feat/math-engine` — establishes authoritative functions.
2. `feat/backend-api` — consumes math contracts.
3. `feat/frontend-dashboard` — consumes the stable API while initially using mocks.
4. `test/integration-demo` — finalizes combined verification, docs, and demo assets.

Before merge, update a shared feature branch normally:

```bash
git fetch --prune origin
git switch <feature-branch>
git merge origin/main
```

Resolve only understood ownership conflicts, test, commit the merge if needed, and push normally. Do not use `git reset --hard`; do not rebase a shared branch. If rewriting history seems necessary, stop and coordinate.

## Integration procedure

For each branch: fetch; inspect `origin/main..origin/<branch>` and diff stats; confirm handoff/tests; ask owner to merge current main; rerun branch tests; merge through a reviewed GitHub PR where available; fetch main; verify merge; run accumulated tests. Stop immediately on failure before the next branch.

If PRs are unavailable, the integration owner may make a local emergency merge only after creating a named backup branch such as `backup/pre-merge-<branch>-<date>` from current main. Merge normally, test, push normally; never force-push.

## Conflict authority

- Algorithms: Person 1.
- API/schema: Person 2.
- Frontend: Person 3.
- Docs/integration/release: Person 4.
- Contract/formula: Persons 1 and 4 jointly.

## Final release gate

After all four merges: run configured Python format/lint, all Pytest/API tests, frontend typecheck/lint/Vitest/build, manual full scenario, offline-start verification, expected-results comparison, secret/untracked-file checks, clean-worktree/local-remote parity checks. Create a release/demo tag only after all pass; do not create one in this planning phase.
