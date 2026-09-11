# Ch4 Local Preview Review

Implementation owner and checker: Azen, Codex inline. Read-only researchers reviewed the old inventory and new function contracts; the main session implemented and verified the changes.

## Passed

- PASS: 34 exercises match mapping.json. The supplied 31-row document stays in order; omitted old E10/E11/E15 are preserved as E32/E33/E34.
- PASS: all 20 original Labs retain identical code, manifests, Makefiles and 400 cases after renaming, confirmed by migrate-layout.mjs --verify.
- PASS: all 14 new Labs have complete statements, three exact examples, function-focused starters, full reference implementations and 20 distinct cases at 5 points each. Structured exercises include PNG/DOT diagrams.
- PASS: all 34 lab:verify reports show reference 100/100, compilable non-full student starters and zero expected-output drift. Total: 680 cases. E24 was reverified after strengthening its large-integer case.
- PASS: independent generated expectations and 14 compiled typical wrong implementations; every mutant is rejected by at least one actual case. BigInt preserves exact large tilt answers.
- PASS: E16 student package copied outside the repository, with no solution target, successfully validated, built and scored as an incomplete starter.
- PASS: VS Code tests 44/44, TypeScript check and extension build. ID migration covers simultaneous overlapping IDs, awaited backup, aliases, snapshots/events, restart idempotence and reset preservation.
- PASS: pnpm test, final lint, Pages-prefixed build and check:site. Final site contains 88 lessons, 241 Labs and 399 HTML files. One Windows filesystem-symlink tool test is explicitly skipped by the existing environment guard.
- PASS: configured Pages browser suite: 48 passed initially; one new sidebar test had an incorrect outline URL. Corrected to chapter-04-tree-binary-tree and reran the failed test successfully. All 49 configured scenarios have passed against the final product build.
- PASS: all 14 new statements checked at 1440px/390px and light/dark, including three examples, expanded C++ snippets, loaded diagrams, no root overflow and no browser errors. Actual preview server additionally checked in four configurations; durable screenshots and JSON are in review/.

## Delivery

- Branch: feat/ch04-exercise-expansion-and-order, based on origin/main f5edf22.
- Trellis developer: Azen.
- Preview: http://127.0.0.1:4175/DSA-Mastery/learn/outline/chapter-04-tree-binary-tree/
- Preview process: 45924, node vitepress preview, explicit base /DSA-Mastery/.
- No commit, push or PR in this stage. Task remains active while awaiting user preview approval.
- Old and new extension versions writing the same globalState simultaneously are outside the one-time renumbering migration contract.

## Reproduction

Submission follow-up: the user approved PR submission after this preview. Product commit 7cfb4a8 and archive commit 12b28f9 were pushed; PR https://github.com/AzenAnn/DSA-Mastery/pull/173 is open against main. The 900 original non-README Git blobs were also compared in the staging area with no differences. The empty-forest trailing blank line was removed and that case rechecked at AC 5/5.

```powershell
node .trellis/tasks/archive/2026-09/09-11-ch04-exercise-expansion-and-order/migrate-layout.mjs --verify
node .trellis/tasks/archive/2026-09/09-11-ch04-exercise-expansion-and-order/verify-labs.mjs
node .trellis/tasks/archive/2026-09/09-11-ch04-exercise-expansion-and-order/mutation-check.mjs
pnpm test
$env:GITHUB_PAGES_BASE_PATH='/DSA-Mastery'
$env:SITE_URL='https://azenann.github.io'
pnpm run build
pnpm run check:site
pnpm run test:pages
```
