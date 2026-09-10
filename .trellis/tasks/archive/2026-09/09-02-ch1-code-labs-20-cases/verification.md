# Verification: Chapter 1 Program Labs — 20 Cases Each

Verified on Windows 11 with Node.js 24.14.0, pnpm 11.1.1 and Clang 21.1.0-rc2 in C++17 mode on 2026-09-02.

## Scope and coverage

- Scope: `01E01`～`01E15` only; `01P01` and all Quiz Labs excluded.
- Baseline: 65 cases; final: 300 cases; added: 235 cases / 470 fixture files.
- Every Lab has exactly 20 unique cases at 5 points each, totaling 100.
- Every Lab includes `sample`, `normal`, `boundary` and `stress`; scenario-specific `special`, `regression`, `duplicates` and `complexity` tags are used where relevant.
- Generator allow-list, path containment, ID uniqueness, point totals, required tags, deterministic inputs, output existence and independent semantic oracles all pass.

| Lab | Baseline | Final | Solution | Oracle stable | Starter compiles / non-full | Verify time |
| --- | ---: | ---: | ---: | --- | --- | ---: |
| 01E01 | 4 | 20 | 100/100 | yes | yes / yes | 4.42 s |
| 01E02 | 5 | 20 | 100/100 | yes | yes / yes | 5.05 s |
| 01E03 | 5 | 20 | 100/100 | yes | yes / yes | 4.50 s |
| 01E04 | 4 | 20 | 100/100 | yes | yes / yes | 4.61 s |
| 01E05 | 5 | 20 | 100/100 | yes | yes / yes | 4.57 s |
| 01E06 | 4 | 20 | 100/100 | yes | yes / yes | 4.61 s |
| 01E07 | 6 | 20 | 100/100 | yes | yes / yes | 4.49 s |
| 01E08 | 4 | 20 | 100/100 | yes | yes / yes | 4.44 s |
| 01E09 | 4 | 20 | 100/100 | yes | yes / yes | 4.35 s |
| 01E10 | 4 | 20 | 100/100 | yes | yes / yes | 4.04 s |
| 01E11 | 4 | 20 | 100/100 | yes | yes / yes | 4.66 s |
| 01E12 | 4 | 20 | 100/100 | yes | yes / yes | 4.55 s |
| 01E13 | 4 | 20 | 100/100 | yes | yes / yes | 4.15 s |
| 01E14 | 4 | 20 | 100/100 | yes | yes / yes | 4.16 s |
| 01E15 | 4 | 20 | 100/100 | yes | yes / yes | 4.02 s |

## Fixture size and limits

- 300 `.in` files: 9,709,567 bytes total.
- 300 `.out` files: 6,432,306 bytes total.
- Largest input: `01E08/020-stress-capacity-and-operations.in`, 991,019 bytes.
- Largest output: `01E06/020-stress-interleaved.out`, 778,000 bytes, below the 1,024 KiB Lab output cap.
- All Chapter 1 `.out` files are LF-only; `.gitattributes` now enforces LF for Lab oracle files on Windows checkouts.
- No `.lab-cache`, executable, object file or VitePress build artifact appears in Git status.

## Correctness fixes retained as regressions

- `01E03`: two-way Lomuto quickselect was replaced by deterministic three-way partitioning so maximum all-equal input does not degenerate; README reference code is synchronized.
- `01E08`: `002-capacity-one.out` now returns `-1` then `2`, matching LRU eviction semantics.
- `01E12`: solution now reads the target after the `n` list values, matching README and fixtures; README reference code is synchronized.

## Commands and results

1. `node .trellis/tasks/09-02-ch1-code-labs-20-cases/research/generate-cases.mjs --plan` — pass, 15 Labs / 300 cases.
2. Generator `--write` followed by `--check` — pass; independent oracle agrees with all 300 expected outputs.
3. `node tools/lab/cli.mjs validate <lab> --json --no-color` for all 15 — all `ok: true`.
4. `node tools/lab/cli.mjs verify <lab> --json --no-color` for all 15 — all reference scores 100/100, no drift, starter compiles and remains below full score.
5. Representative solution scoring: `01E03/001-sample`, `01E08/002-capacity-one`, `01E06/020-stress-interleaved` — all AC, 5/5.
6. `pnpm run test:lab-tools` — 38 passed, 1 Windows symlink-policy skip, 0 failed.
7. `pnpm run test:lab-docs` — pass.
8. `pnpm test` — pass: content validation, typecheck, lint, Lab tools/docs, discovery, VitePress build and built-site checks. Final site: 352 HTML files.
9. `git diff --check` — pass.

The VitePress build emitted the repository's existing chunk-size advisory for chunks above 500 KiB; the build and artifact checks completed successfully.
