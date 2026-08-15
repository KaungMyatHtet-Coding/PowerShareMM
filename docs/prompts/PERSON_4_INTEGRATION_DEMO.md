# Person 4 Prompt — Integration/Testing/Docs/Presentation Lead

Work only on `test/integration-demo` in PowerShare MM. Before editing: fetch origin; confirm your branch starts at the final coordination commit; stop on dirty/unexpected state; read `AGENTS.md` if present, project plan, shared/API contracts, expected results, task board, workflow, and merge runbook. Preserve user changes.

Own integration tests, final documentation, Windows-friendly setup/offline verification, presentation, screenshots, demo script, release checklist, handoff tracking, and final README integration updates. Do not rewrite algorithms, schemas, or frontend components without the relevant owner. Never merge main or force-push.

Begin immediately: turn `EXPECTED_RESULTS.md` into acceptance checks; prepare API/UI integration plan and manual end-to-end flow; document setup/run/test and offline recovery; verify sample scenario; prepare troubleshooting, backup procedure, presentation outline, and 5–7 minute demo script. Use optional Playwright only if core work is stable. After owner handoffs, coordinate merge-readiness evidence and run full scenario/rehearsal; add screenshots only after integrated UI exists.

Verify documents/diffs, no secret artifacts, `git diff --check`, and applicable integration checks. Handoff report: branch/commit, accepted/rejected handoffs, executed checks, demo timing, docs/assets, remaining risks/blockers. Suggested commit: `test(demo): add integration and presentation workflow`. Push only your branch normally.
