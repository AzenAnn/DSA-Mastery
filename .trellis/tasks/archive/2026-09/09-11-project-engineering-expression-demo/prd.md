# Project 工程测评、表达式示范与扩展本地安装

## Goal

Students implement one system across independently graded Tasks, reuse real modules in integration, and distinguish historical achievement from verification of current code. Initial delivery was local; Azen subsequently authorized PR submission and extension 0.1.13 release.

## Requirements

- Preserve root README/lab.json/CMake and per-task contracts/code/tests. Separate build dependencies, assessment prerequisites and completion.
- Grade one Task or the Project. Independent targets retain scores when unrelated modules fail; runnable downstream tests execute after upstream WA. Dependency failures carry build evidence and affected IDs without invented root causes.
- Distinguish CE, BLOCKED, WA, UNASSESSED and STALE; retain diagnostics/file locations. Aggregate weights, never count pending manual work as complete. Source/config/test changes invalidate affected results while preserving historical grades.
- Add a complete expression evaluator: stack, tokenizer, infix-to-postfix, final evaluator. Fixed contracts, deterministic normal/boundary/error tests, compilable incomplete starters, separate reference targets, real cross-task linkage. Document isolation tests; Final uses only student dependencies for student builds.
- Extend Project overview/navigation/dependencies/file entries/per-task and all grading/details/retry. Save relevant dirty inputs, reject failed saves, serialize grading and prevent results crossing navigation or source changes. Preserve Program/Quiz/manual/history and Ch4 migration.
- Correct the single-source install guide plus README/bootstrap/release as needed: PowerShell/macOS paths, dynamic VSIX, reproducible packaging, PATH fallback, spaces/missing files/policy/download blocking/permissions/trust/pnpm approval/runtime requirements/install/update/reload/rollback/progress retention.
- Build a VSIX and exercise isolated VS Code; run an external fresh student package and website links/Pages prefix/desktop/mobile checks. Report untested platforms precisely.

## Acceptance Criteria

- [x] Reference scores 100 automatically; starter compiles and is not full.
- [x] Temporary faults prove independent targets, dependency failure scope, upstream WA with downstream execution, locally passing modules with failing integration, and transitive invalidation.
- [x] Existing tooling/extension checks and necessary new contract tests pass, including manual pending and Ch4 compatibility.
- [x] External student package validates/builds/grades without solution or repository dependencies.
- [x] Isolated installed extension discovers Project, navigates files/Tasks, grades, shows failures and retries; update/rollback retain progress.
- [x] Local website URL, VSIX path, inspection steps, design and verification evidence were delivered before remote operations.
- [x] Submit a PR and publish the CI-built extension 0.1.13 release after verifying its asset; leave PR merge to the maintainer.

## Notes

- Azen already configured. Original worktree clean on Ch4 branch. PR #173 merged at 2026-09-11T01:18:33Z; baseline origin/main e2aac0c includes it.
- CLI reportVersion 1 and stdio/ctest/manual remain compatible. Existing whole-project build contaminates unrelated CTest results; extension lacks per-task grading and source invalidation.
- Full multi-file snapshot history is excluded. User preauthorized task/branch/implementation/tests/preview and delegated routine decisions. After local delivery, the explicit request "提交pr 并且release这个1.13版本的插件" authorizes commit, push, PR, tag and Release; the manifest version is 0.1.13.
