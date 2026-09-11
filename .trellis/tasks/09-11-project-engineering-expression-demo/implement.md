# Implementation And Acceptance Checklist

- [x] Read instructions/specs, restore Azen, inspect worktree/main/PR #173, create branch/task.
- [x] Record requirements/design/acceptance under user's continued-implementation authorization.
- [x] Add build/dependency schema, independent Task grading and diagnostics.
- [x] Add fingerprints/current-result cache/aggregation/invalidation/concurrency checks.
- [x] Add expression Project and migrate existing CTest target metadata.
- [x] Extend plugin task UI/save/request lifecycle/current versus history and regression tests.
- [x] Fix packaging/install/update docs/helper/release; verify PowerShell and isolated runtime.
- [x] Verify reference/starter/fault matrix and fresh external student pack.
- [x] Build/install VSIX; isolated discovery/navigation/grade/failure/retry/update/rollback.
- [x] Run pnpm test, extension tests/typecheck, Pages build/check/desktop/mobile browser tests.
- [x] Update specs and write verification/local inspection report.
- [x] Start website preview and prepare local review delivery.

## Validation

Run pnpm test, test:lab-golden, extension test/typecheck/package, CLI validate/build --task/score --task/verify/pack, then Pages build/check/test:pages with PowerShell environment variables. Exact commands/results go in verification.md. Main session implements/checks (inline); research agents read only. Generated outputs stay cache/temp. No daily VS Code profile changes or remote mutation. No user edits reverted.

Local review is ready. Task remains in progress until Azen inspects the result; no commit/archive/push/PR/tag/release was performed.
