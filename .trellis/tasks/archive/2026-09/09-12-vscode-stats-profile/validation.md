# Statistics Profile Acceptance Evidence

Date: 2026-09-12. Branch: `feat/vscode-stats-profile`, based on fetched `origin/main` (`acfddf5d`). Trellis developer: `Azen`.

## Commands And Outcomes

| Check | Result |
| --- | --- |
| Extension `node --experimental-strip-types --test test/*.test.ts` | 93 passing, 0 reported skips after independent review fix. Existing lab-index symlink test returns early on Windows, so that POSIX assertion was not exercised. |
| Extension `pnpm.cmd run typecheck` | Passed. |
| Extension `node build.mjs` | Passed, current bundled extension about 572.5 KB. |
| Root `pnpm.cmd test` | Passed: validate content/type/lint, 5 tree-demo tests, 36 bootstrap tests, 45 Lab tool tests plus 1 Windows symlink skip, Lab docs, auto-discovery, VitePress build and built-site check. 88 lessons, 304 Labs, 25 framework pages, 466 HTML outputs. |
| Root `pnpm.cmd exec eslint scripts/verify-extension-stats-ui.mjs` | Passed again after final browser-verifier additions. |
| `node scripts/verify-extension-stats-ui.mjs` | Passed on final renderer: 47 layouts/states, controls, persistence, CSP, keyboard/pointer details, all rank colors and text contrast. |
| `node .lab-cache/stats-profile/host-smoke.mjs` | Passed actual VS Code development host with isolated user-data/extensions and real seeded SQLite progress; 14 solved / 58 submissions / 18 passes produces Pupil and 20% progress. Four native VS Code themes switched successfully. Test host shut down. |
| Standalone local HTML opening | Chromium opened `sample-dark.html` via file path with valid style/heatmap rendering and no browser errors. |
| `git diff --check` | Passed; no product changes outside statistics rendering/rank/scoped CSS and related tests. |

The first root run encountered an orphan previous-branch Lab folder containing only `.lab-cache`, without tracked files or README. It was preserved at `.lab-cache/stats-profile/previous-branch-cache-P-01-02-105-dorm`; the full rerun passed. Generated Graphviz source artifact churn from the required builds was removed/restored to the original tracked state. No course or Judge source was edited.

## Source Request Section 43 Mapping

| Acceptance | Authoritative evidence |
| --- | --- |
| Rank uses solved only; submissions do not affect Rank | `rank.test.ts` repeated event cases and real counters in `stats-panel-ui.test.ts`; renderer feeds `countActivity(events).labsPassed` to `getRankProgress`. |
| Eight boundaries, remaining problems, max rank | All threshold/adjacent unit cases; generated rank documents; browser fixtures for all eight ranks in all four themes at 320px. 10/20/29/30 progress = 0/50/95/0, 14 = 20% / 16 remaining. |
| Corresponding rank colors | `rank.ts` and theme CSS id tokens; browser contrast check records computed colors for all eight titles in `verification.json`. |
| Unified accent, no brown heatmap | Final screenshots plus `--stats-heat-0..4` and `--stats-accent`; neutral zero cells and distinct accent intensities in four themes. |
| Shorter trend and weaker fill | Computed 240px wide / 200px narrow heights, 2px line and 0.08 fill opacity. Zero/one-date cases have no chart. Pass-event units preserved. |
| Two-column curriculum / narrow one-column / short bars | 1440/2560px screenshots and measured two columns; 320/375/720px single column, 6px tracks. Numbers, titles, counts, percentages and complete state present. |
| Max width, fewer borders, micro labels, typography | 1360px cap measured at 1440/2560; unframed sections; all micro labels asserted; final screenshots inspected. Footer/heading spacing verified including Candidate Master at 320px. |
| Resizing and accessibility | 47 cases include live resize, four themes, enlarged text, reduced motion, no page overflow, keyboard day/week navigation and date hover details; recent date visible in narrow heatmap scroller. Body text contrast >=4.5:1, large rank >=3:1. |
| Statistics and submit/Judge regressions | Existing pure aggregation + host-adapter tests; 93 extension and root Lab tool suites. `stats.ts`, ProgressTracker, activation, commands, scan and Judge source unchanged. Historical invalid dates retain totals but cannot crash dated charts. |
| Lint/typecheck/build | Successful command outcomes above. |

## Artifacts

- Pure renderer: `tools/vscode-extension/src/statsView.ts`; rank model: `src/rank.ts`; host adapter: `src/statsPanel.ts`; scoped CSS: `media/panel.css`.
- Tests: `test/rank.test.ts`, `test/stats-panel-ui.test.ts`, root `scripts/verify-extension-stats-ui.mjs`.
- Browser evidence: `.lab-cache/stats-profile/verification.json`, `dark-1440.png`, `light-375.png`, `wide-2560.png`, `candidate-master-320.png`, high-contrast/empty/dense captures.
- Host evidence: `.lab-cache/stats-profile/host-verification.json`, `host-dark.png`, `host-light.png`, `host-hc.png`, `host-hc-light.png`. Fixtures are isolated/sample data; production has no mock-data switch.
- Local preview: `.lab-cache/stats-profile/sample-dark.html` (external local CSS and isolated API shim; no server required).

## Limits And Scope

Optional Rank Up toast omitted: current StatsPanel refreshes on its existing command and has no reliable live before/after event. No new telemetry or persistence was introduced. Existing history retention semantics remain unchanged. Native smoke validation was on Windows; no macOS/Linux VS Code runtime claim. Two existing symlink test paths were unexecuted on Windows as described above. Build retains the repository's existing >500KB chunk warning and Node test package-type warnings.

The implementation audit initially ended without commit or publication. The user subsequently authorized pushing to main and publishing a new extension version. Work commit `c1fa9b23` contains the verified implementation plus the 0.1.14 manifest and module documentation update. Local VSIX packaging and identity validation passed (29 files, approximately 903 KB). `ext-v0.1.14` uses the existing draft-prerelease CI flow, with download/install verification before publication. Initial unrelated skill `__pycache__` remains untouched.
