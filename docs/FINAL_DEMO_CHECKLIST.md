# Final Demo Checklist

## Repository and dependencies

- [ ] Repository, branch, and verified commit confirmed.
- [ ] Python 3.11+ and Node.js 20+ confirmed.
- [ ] Backend requirements installed before going offline.
- [ ] `npm ci` completed before going offline.
- [ ] No secrets are present or visible on screen.
- [ ] No internet dependency is required during the demo.

## Quality gates

- [ ] Python regression/integration tests pass (`54 passed`).
- [ ] Backend-only regression tests pass (`48 passed`).
- [ ] Person 4 integration tests pass.
- [ ] Frontend typecheck passes.
- [ ] Frontend lint passes.
- [ ] Seven frontend tests pass, including behavioral abort/stale-response coverage.
- [ ] Frontend production build passes.
- [ ] Canonical values match `docs/EXPECTED_RESULTS.md`.
- [ ] Live `POST /api/analysis/full` tested.
- [ ] Mock mode tested and visibly labelled.
- [ ] Retry/error UI tested.
- [ ] `outcome_id: null` renders correctly.

## Visual and presentation readiness

- [ ] Desktop layout checked.
- [ ] Mobile layout checked.
- [ ] Projector readability checked.
- [ ] Reduced-motion behavior checked.
- [ ] Static table/overflow fallback is usable.
- [ ] Laptop charger ready.
- [ ] Presentation/PDF available offline.
- [ ] Demo screenshots available offline.
- [ ] Notifications disabled.
- [ ] Five-to-seven-minute sequence rehearsed twice.
- [ ] Fallback sequence rehearsed.
- [ ] Team roles and speaking order confirmed.

## Demo flow

- [ ] Two players and 10 kWh capacity shown.
- [ ] Live backend source label shown.
- [ ] `CLAIM_MORE` dominance explained.
- [ ] Sole Nash `MM` shown.
- [ ] Pareto `CC/CM/MC` shown.
- [ ] Asymmetric Prisoner’s Dilemma shown.
- [ ] Six `HYBRID` uncertainty recommendations shown.
- [ ] Arbitration warning and canonical allocation shown.
- [ ] Educational repeated-game fixture distinguished from electricity results.
- [ ] Chapters 1–16 academic boundary and limitations stated.

## Release hygiene

- [ ] `git diff --check` passes.
- [ ] Only Person 4 integration/demo files are changed.
- [ ] No `.env`, database, `node_modules`, `dist`, cache, or generated file is tracked.
- [ ] Worktree is clean apart from intentionally preserved ignored files.
- [ ] Person 4 branch is pushed and remote parity is confirmed.
