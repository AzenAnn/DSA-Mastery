# Design

## Boundaries

Branch feat/project-engineering-expression-demo from e2aac0c. CLI owns evaluation, fingerprints, current aggregation and dependency diagnostics. VS Code renders reports and keeps historical summaries in its existing Project storage key. Website uses the existing content index; preface includes docs/VSCODE_EXTENSION_GUIDE.md.

## Engineering Contract

- dependsOn remains educational ordering/relationships, never a test-pass gate. Legacy values conservatively propagate invalidation.
- Optional buildDependsOn declares source dependencies; CMake target_link_libraries implements linkage. Optional ctest.buildTargets names assessed targets and ctest.moduleTargets exposes implementation-only targets for evidence-based dependency build checks. Upstream WA does not prevent integration.
- Configure once, build selected targets separately. Failed dependency module build yields BLOCKED with task/target/output; own target failure yields CE. Shared configure errors identify project-wide phase. Missing metadata keeps a documented legacy whole-build fallback; existing executable Projects get explicit targets.
- Clean generated targets once per assessment before the first selected build, then reuse this run's objects. Windows CopyFile can retain old mtimes; content fingerprints alone do not force Ninja to rebuild. This trades cross-submission incremental build speed for grading the actual current sources, including restored files. It does not build unrelated targets.
- CLI current-status and generated .lab-cache result state retain per-task results/fingerprints/timestamps. Hash owned files, transitive source inputs, shared inputs/config/tests; exclude solutions/cache. Partial-case grading cannot establish full completion.
- Selected-run score fields remain compatible; add full current-project state. Historical and valid current scores differ. Unassessed/stale/manual rows prevent completion.
- Serialize project grading with a local lock, recover dead owners, publish cache atomically. Compare input hashes before/after evaluation; changed code cannot receive a valid current pass.

## Extension

Capture lab identity before awaits, guard load/submission generations, and use project-wide execution serialization. Save relevant Project inputs and check save results. Refresh discovered inputs and debounce source/config invalidation using CLI status. Preserve storage keys and Ch4 migration. Show current task status/history/dependency evidence/files/single-all retry. Keep diagnostics in CLI cache and bounded VS Code summaries.

## Demonstration

Add expression Project at the next chapter-02 P ID. Four task library/test targets and final executable. Fixed contracts cover stack/tokens/grammar/integer arithmetic/errors. Task 3 uses stack+tokenizer; Final links all student modules. Reference uses separate solution preset; student pack excludes reference. Name/document isolated versus real integration tests.

## Installation And Verification

Repeatable PowerShell helper accepts local VSIX or release download, discovers VS Code, supports isolated directories and explicit errors/version checks. No permanent policy changes or blanket admin advice. Reproducible packaging; release dependency errors fail. Explicit Workspace Trust and Node minimum checks.

Verify Node/TS tests, real MSVC+CMake faults in temp copies, external student pack, isolated VS Code UI/install/update/rollback and Pages desktop/mobile browser tests. Native platforms are claimed only when executed.

Only indexed course/Lab landing pages remove their source H1 in favor of DocumentHeader. Unindexed Task pages retain H1; relative links still use the same route map. The preface continues to include the sole installation guide.
