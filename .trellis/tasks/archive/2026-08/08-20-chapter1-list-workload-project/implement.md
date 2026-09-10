# Implementation Plan：第 1 章线性表工作负载评测 Project Lab

## Preconditions

- Branch: `lab/ch01-list-workload-project` from latest `origin/main`.
- Developer: `Azen`.
- Planning approval required before `task.py start`.
- Load `trellis-before-dev` and Phase 2.1 context before product edits.

## Ordered checklist

1. Scaffold and manifests
   - Use the Project scaffolder for chapter 1/order 21/slug `list-workload-analyzer`.
   - Replace generated tasks with the frozen 25/25/30/20 graph.
   - Add README frontmatter, task READMEs, thin Makefile, CMake and presets.

2. Contracts and reference implementations
   - Add List, metrics and workload headers.
   - Implement reviewed SequentialList solution and direct invariant tests.
   - Implement reviewed LinkedList solution and bidirectional invariant tests.
   - Keep interfaces implementation-neutral and freeze exact metric counters with small tests.

3. Workload engine and CLI
   - Implement deterministic xorshift32 generator and five profiles.
   - Run identical operations on both containers and detect divergence.
   - Produce shared result object, human table and versioned JSON.
   - Add input limits, stderr diagnostics and non-zero invalid-input behavior.

4. Student starters and grading
   - Produce compiling, readable starter sources that intentionally fail part of the tests without exposing solutions.
   - Add task.json files whose test names/points match CTest exactly.
   - Add manual report task/template and confirm automated/manual separation.

5. Content and site integration
   - Add Chapter 1 overview link.
   - Update built-site count/order from 20 to 21.
   - Update desktop/mobile Project sidebar assertions from empty state to one real link.
   - Keep navigation/search discovery automatic.

6. Targeted verification loop
   - `pnpm lab:validate -- labs/chapter-01/lab-01-21-list-workload-analyzer`
   - `pnpm lab:run -- ... --target student`
   - `pnpm lab:run -- ... --target solution`
   - `pnpm lab:score -- ... --target solution`
   - `pnpm lab:verify -- ...`
   - Run single-task selection for all three automatic tasks.
   - Exercise CLI human and JSON modes for all profiles and invalid inputs.

7. Package and repository verification
   - `pnpm lab:pack -- ... --profile student`
   - Validate/run inside the generated package and search for forbidden solution/cache/binary files.
   - `pnpm test`
   - Pages-base build/check and `pnpm run test:pages`.
   - Confirm only `.lab-cache/` build outputs exist and clean them before final status.

8. Local preview and handoff
   - Start VitePress on `127.0.0.1` in a persistent terminal session.
   - Check Chapter 1 overview, new Lab page, Labs index and sidebar in the browser.
   - Give the user the URL, paths to inspect, scores, test results and known review risks.
   - Do not push, create PR, commit, or archive the task until the user confirms the PR step.

## Review gates

- Gate A: Planning artifacts approved, then `task.py start`.
- Gate B: Contracts and reference tests pass before starter grading is finalized.
- Gate C: Lab verify proves reference 80/80 and starter <80.
- Gate D: Package independently runs and contains no solution.
- Gate E: Full repository and Pages tests pass.
- Gate F: User visually confirms local preview before any PR action.

## Risky files and rollback points

- `scripts/check-built-site.mjs`: exact Chapter 1 count/order; change only with new directory present.
- `tests/pages-navigation.spec.mjs`: empty Project behavior becomes populated; preserve native folding/accessibility assertions.
- CMake task selection: keep task names synchronized across top-level CMake, CTest and task.json.
- Student package: verify common contracts and runtime sources are retained while solution trees are excluded.

## Final validation evidence to record

- OS, Node/pnpm, compiler and CMake versions.
- Targeted validate/run/score/verify outputs and per-task scores.
- Student package validate/run and forbidden-file audit.
- `pnpm test`, Pages-base build/check and Playwright summary.
- Local preview address and manual pages checked.
- `git status --short` showing only intended source/planning changes and no build artifacts.
