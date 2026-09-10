# Implementation Plan: Chapter 1 Program Labs — 20 Cases Each

## Phase A — Freeze baseline and generator contract

- [x] Record current per-Lab case counts, point totals, tags and fixture bytes.
- [x] Save baseline verify results: 13 passing Labs, `01E08` oracle drift, `01E12` reference/input mismatch.
- [x] Implement task-local deterministic generator with an explicit allow-list for `01E01`～`01E15` and check/dry-run support.
- [x] Encode the approved 300-case matrix and assertions: 20 cases, 5 points each, unique IDs/paths and required tags per Lab.

Rollback point: generator/research changes only; no learner-facing assets modified.

## Phase B — Close reference/oracle blockers

- [x] Correct `01E08/002-capacity-one.out` through the standard refresh workflow.
- [x] Fix `01E12` solution input order and synchronize the README reference-code block.
- [x] Add the `01E12` sample as a retained regression and verify the reference reaches 100 before bulk generation.
- [x] Replace `01E03` two-way duplicate-degenerate partition with three-way quickselect and synchronize the README reference-code block.
- [x] Verify `01E03` on small and maximum all-equal inputs before accepting generated oracle output.

Rollback point: three isolated baseline/reference corrections, reviewable without bulk fixtures.

## Phase C — Generate the 20-case suites

- [x] Run generator in dry-run/check mode and review the planned path list.
- [x] Generate/update all 15 `cases.json` files and missing `.in/.out` placeholders.
- [x] Audit that existing case input semantics are preserved and all new inputs satisfy documented domains.
- [x] Measure total added bytes, largest inputs/outputs and expected output-cap headroom.
- [x] Run generator check again to prove deterministic regeneration.

Rollback point: fixtures are isolated by Lab; revert any one Lab without affecting the others.

## Phase D — Produce and review oracle outputs

- [x] For each Lab, run `pnpm lab:refresh-expected -- <path> --write`.
- [x] Review small cases manually against the problem semantics, especially head/tail, duplicate, circle and static-index cases.
- [x] Run refresh preview again for all 15 and require zero drift.
- [x] Confirm all `.out` files are LF and all paths remain within their Lab.

## Phase E — Per-Lab verification

- [x] Run `pnpm lab:validate -- <path> --json` for all 15 Labs.
- [x] Run `pnpm lab:verify -- <path> --json` for all 15 Labs.
- [x] Require each reference to score 100/100, each starter to compile and each starter to score below 100.
- [x] Record per-Lab execution time and investigate any TLE/OLE/IE rather than weakening the case silently.
- [x] Run representative single-case commands for a sample, a boundary case and a stress case.

## Phase F — Repository gates and review

- [x] Run the 300-case coverage audit and attach its summary to `verification.md`.
- [x] Run `pnpm run test:lab-tools`.
- [x] Run `pnpm run test:lab-docs`.
- [x] Run full `pnpm test`.
- [x] Run `git diff --check`, inspect file statistics and confirm no `.lab-cache/` or generated binaries are tracked.
- [x] Review the final diff by Lab against `research/case-matrix.md` and update acceptance criteria with evidence.

## Expected change groups

1. Minimal correctness corrections: `01E03`, `01E08`, `01E12`.
2. Deterministic test manifests and input fixtures for `01E01`～`01E15`.
3. Refreshed expected outputs for the same 15 Labs.
4. Trellis research, verification and session records.

## Stop conditions

- A valid case contradicts the published problem contract rather than only the implementation.
- Full-scale output cannot fit the declared cap without changing the public contract.
- Correct reference runtime remains unstable after applying the planned algorithm-specific fix and safe stress policy.
- Generator would modify any path outside the explicit 15-Lab allow-list.

When a stop condition occurs, record the exact Lab/case and return to planning instead of deleting the revealing test.
