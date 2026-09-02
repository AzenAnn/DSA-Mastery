# Design: Chapter 1 Program Labs — 20 Cases Each

## 1. Scope and boundaries

The implementation targets exactly the 15 Program Labs `01E01` through `01E15` under `labs/chapter-01/exercise/`. `01P01` is excluded by explicit user decision because its CTest/manual task model is not compatible with the Program `cases.json` contract.

Primary assets are:

```text
labs/chapter-01/exercise/E-01-*/tests/cases.json
labs/chapter-01/exercise/E-01-*/tests/*.in
labs/chapter-01/exercise/E-01-*/tests/*.out
```

Minimal correctness fixes are allowed only when a valid new case exposes an existing reference/oracle defect. The known candidates are `01E08`, `01E12`, and `01E03`; student starters, stable IDs, Lab manifests, schema, judge tooling and unrelated prose remain unchanged.

## 2. Test-suite contract

Each target Lab ends with exactly 20 cases:

- unique IDs and paths;
- `points: 5` for every case, totaling 100;
- existing IDs and scenario meanings preserved;
- at least one case tagged each of `sample`, `normal`, `boundary`, and `stress`;
- problem-specific tags such as `duplicates`, `regression`, `extreme`, `recency`, `odd`, `even`, or `index-layout` where they add review value;
- committed `.in/.out` pairs contained inside the owning Lab.

The exact semantic plan is the task research file [`research/case-matrix.md`](research/case-matrix.md). That matrix is the review checklist and must remain synchronized with generated assets.

## 3. Deterministic fixture generation

Creating 235 new inputs by hand would be error-prone. A task-local deterministic Node script will generate the mechanical assets from explicit per-Lab scenario functions:

```text
.trellis/tasks/09-02-ch1-code-labs-20-cases/research/generate-cases.mjs
  -> tests/cases.json
  -> tests/005-*.in ... tests/020-*.in
  -> missing .out placeholders
```

Design rules:

- use only Node built-ins and repository-relative paths;
- fixed formulas/seeds; no `Math.random()`-dependent committed data;
- refuse to touch paths outside the 15 allow-listed Lab directories;
- assert exactly 20 IDs, unique names, 5 points each and required tags before writing;
- preserve the contents of existing `001`～`004/006` input cases unless a documented protocol defect requires correction;
- normalize generated text to LF and end text fixtures with one LF;
- keep stress values compact enough that valid output remains under the existing 1024 KiB cap;
- support a check/dry-run mode so the committed fixtures can be regenerated and compared during review.

The generator belongs to the archived Trellis evidence, not the learner-facing Lab API. The public contract remains the committed fixtures and `cases.json`.

## 4. Oracle lifecycle

The generator creates missing `.out` placeholders because `loadCases` requires expected files to exist. Oracle production then follows the repository contract:

1. run `pnpm lab:refresh-expected -- <lab> --write` for each Lab;
2. inspect changed output and confirm it matches the README protocol;
3. run refresh without `--write` and require zero drift;
4. run `pnpm lab:verify -- <lab> --json` and require solution 100, starter compilable and starter below 100.

No expected output is written from the starter or the independent audit oracle. The repository reference remains the only writer; generator check mode independently recomputes all 300 answers from the published semantics and rejects disagreements.

## 5. Minimal reference/oracle corrections

### 5.1 `01E08` incorrect existing oracle

For capacity one, after `put(1,1)` then `put(2,2)`, `get(1)` is `-1` and `get(2)` is `2`. The current second output is incorrectly `-1`. Regenerating expected output from the reviewed reference is the minimal fix; reference code does not change.

### 5.2 `01E12` input protocol mismatch

README and fixtures define input as `n`, then `n` values, then `x`; solution currently reads `x` before the values. Move the read of `x` after list construction/input consumption, and make the same minimal change in the README reference-code block. Algorithm behavior remains unchanged.

### 5.3 `01E03` duplicate degeneration

The current two-way Lomuto quickselect degenerates on all-equal input. The maximum duplicate case is valid and is a direct complexity boundary. Replace partitioning with a deterministic or fixed-seed three-way partition that returns the equal interval, then update the README reference-code block to match. Preserve expected `O(n)` selection semantics and `O(1)` auxiliary storage; do not substitute a full sort.

Any additional reference failure must be treated the same way: retain the failing input as a regression case, document the defect, and make the smallest contract-preserving correction.

## 6. Stress and repository-size policy

- `O(n)` problems use at least one full documented scale (`100000`) with compact values.
- Output-heavy suites use one full-scale fixture by default; other stress/regression cases use medium deterministic sizes.
- `01E08` uses `100000` operations and capacity up to `10000`, mixing hits, updates, misses and evictions.
- `01E13`/`01E14` use `n = 1000`; `01E15` uses `500 + 500`.
- `01E10` covers `n = 10000` and `m = 10000` separately, with a bounded combined step count that is stable under the existing 2000 ms limit.
- Stress cases validate asymptotic plausibility and termination, not precise wall-clock performance.

After generation, the change summary must report total fixture bytes and the largest individual files. If output exceeds configured limits or repository growth is disproportionate, reduce only redundant medium cases; do not remove the single documented-scale case or semantic boundary coverage.

## 7. Validation and observability

A coverage audit will parse all 15 `cases.json` files and report per Lab:

```text
case count | point sum | unique IDs | required tags | missing files | input/output bytes
```

Execution gates:

- generator check/dry-run;
- all 15 `pnpm lab:validate`;
- all 15 `pnpm lab:verify --json`;
- oracle drift preview for all 15;
- `pnpm run test:lab-tools` and `pnpm run test:lab-docs`;
- full `pnpm test`;
- `git diff --check` and a final dirty-file audit excluding ignored `.lab-cache/`.

The verification record must preserve actual commands, counts, scores, elapsed time, and any platform-specific limitation.

## 8. Compatibility and rollback

- No schema, manifest version, case loader or route changes.
- Existing case IDs remain addressable through `--case`.
- Student packs continue to contain the public fixtures and no solution.
- Changes can be rolled back per Lab because each suite is self-contained. Reference corrections are committed separately from bulk fixtures when practical, so a disputed algorithm fix can be reviewed independently.

## 9. Risks

- **Fixture volume:** mitigated by one full-output stress case per output-heavy Lab and compact deterministic values.
- **Reference-as-oracle bias:** mitigated by reviewing small/medium expected values and retaining minimal semantic regression cases, not only random stress.
- **Timing flakiness:** mitigated by avoiding Josephus double maxima and by treating the local timeout as a coarse guard.
- **Hidden baseline defects:** baseline verification has already found `01E08` and `01E12`; every new valid failure is recorded before correction.
- **Mechanical duplication:** the matrix requires distinct control-flow or invariant coverage for every scenario; mere value permutations do not satisfy the plan.
