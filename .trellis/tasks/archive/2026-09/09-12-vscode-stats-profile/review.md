# Independent Statistics Profile Review

Reviewed on 2026-09-12 against `check.jsonl`, the complete `source-request.md`, PRD, design, implementation plan, and the extension and visual specs. Review ownership: product sources and extension tests. Root owns repository gates, browser verification, host checks and final documentation.

## Findings Fixed

- `tools/vscode-extension/src/statsView.ts`: extracting the heatmap renderer removed its empty-map guard. A persisted event with `at: "invalid-date"` produced a NaN year and threw while reading `map.cells[0].date`. Reproduced with the real bundled renderer before editing. The view now supplies finite-date events to dated charts, keeps all original events in counters and Rank, and retains an empty-calendar fallback. No storage, event collection or aggregation helper was changed.
- `tools/vscode-extension/test/stats-panel-ui.test.ts`: added a regression for entirely undated and mixed dated/undated histories. It proves the page renders, undated events remain in total submissions/passes and distinct solved counts, dated trend totals remain valid, and generated charts/year options contain no NaN or Invalid Date values.
- Spec drift was reported to root, which updated the statistics supplement in `frontend/visual-responsive.md` and the new Rank contract in `quality/vscode-extension.md` to match the implemented dark-first theme inheritance, layout and data boundaries.

## Requirement Evidence

Section 43 checklist, preserving the original scope:

| Requirement | Result and evidence |
| --- | --- |
| Rank depends only on solvedCount | PASS: renderer calls `getRankProgress(counters.labsPassed)`; original `countActivity` deduplicates passed lab IDs. |
| Eight Rank boundaries | PASS: `rank.test.ts` checks each threshold and adjacent values from 0 through 250, plus 1000 and the maximum finite number. |
| Corresponding Rank colors | PASS: CSS maps all stable rank IDs to theme-specific colors; browser artifact contains 32 rank/theme contrast checks. |
| Remaining problems to next Rank | PASS: 14 solved renders Pupil, 20% and 16 problems to Specialist; tests verify in-rank reset and 10/20/29/30 values. |
| Legendary maximum handling | PASS: no nextRank, 100%, remaining zero in the model; visible MAX RANK at 250 and above. |
| Submissions do not affect Rank | PASS: 300 repeated submissions and passes preserve 29 distinct solved labs until one new lab passes. |
| Unified chart accent | PASS: heatmap, trend and chapter fills resolve through `--stats-accent`; Rank colors remain semantic exceptions. |
| No previous brown heatmap | PASS: old ORANGE/BLUE renderer arrays are removed; zero activity is neutral and levels 1-4 use the shared accent. |
| Compact trend height | PASS: computed browser evidence measures 240px desktop and 200px narrow. |
| Weak trend area fill | PASS: generated SVG and CSS both specify 0.08 fill opacity and a 2px line. |
| No extremely long single-column chapter bars | PASS: bounded 1360px content and two equal desktop columns; chapter bars remain 6px high. |
| Two chapter columns on wide view | PASS: browser evidence at 1440px and 2560px measures two columns. |
| One chapter column on narrow view | PASS: browser evidence at 375px and 320px measures one column. |
| Reasonable max-width | PASS: computed desktop content width is 1360px, including at 2560px viewport. |
| Restrained borders | PASS: only four KPI items use individual surfaces; Activity/Momentum/Curriculum remain unframed with spacing and separators. Reviewed desktop dark and narrow high-contrast-light screenshots. |
| English micro labels | PASS: generated document and browser checks retain PROGRESS OVERVIEW, ACTIVITY, MOMENTUM and CURRICULUM. |
| Consistent typography | PASS: fixed typography, tabular numeric values, wrapped long rank/chapter names and zero letter spacing; screenshots reviewed. |
| Resizing remains correct | PASS: 47 browser layout cases, four themes, 320-2560px, live resize, 1.25x zoom and reduced-motion fixture; no page overflow or script/CSP/resource errors. |
| Existing statistics remain correct | PASS: four counters, local dates, leap years, yearly metric controls/state, repeated pass-event trend units, and type-aware chapter status tests all pass. |
| Submission/Judge regression | PASS in extension scope: existing submission, Project completion, quiz, identity and migration suites pass. Root owns and reports full repository Judge/lab gates. |
| Lint/typecheck/build | PASS: extension typecheck and build; no extension-local lint command exists. Root runs repository lint as part of validate and full pnpm test. |

Additional source sections 0-42:

- Sections 1-6 and 37-38: centralized rank model exports configuration and all three requested helpers; English titles and Chinese meanings are visible. Optional Rank Up toast is omitted because the current command-driven snapshot does not supply reliable before/after promotion events, as explicitly permitted by section 6.
- Sections 14-17 and 30: all natural-year days are rendered; today has both text and an outline; date details contain existing submit/pass values only. Native SVG titles and a live detail readout support hover/focus. One roving tab stop per calendar avoids hundreds of Tab stops; arrow/Home/End handlers move within the correct grid. Existing metric/year controls remain local and persist through the VS Code WebView state API.
- Sections 18-20: zero or one pass-bearing date uses a compact empty state. Trend uses true local calendar-day distances and unique integer y-ticks; repeated passes remain events measured in times, not invented solved-question units.
- Sections 21-25: chapter number, title, completed/total and percentage are present; 100% adds a restrained completed label. The host continues checking program/quiz/Project state by stable ID, including stale, unknown, manual-pending and internal-error Project cases.
- Sections 7-13 and 26-31 and 39-41: neutral surfaces, shared chart accent, restrained semantic rank colors, wrapped responsive structure and four-theme CSS follow the requested developer profile. Small radius, no decorative shadows/glow/gradient cards, and no added gamification. Rank text contrast is measured in all four themes; reduced motion disables transitions.
- Sections 32-36 and 42: the implementation remains native HTML/SVG/CSS with the existing external stylesheet and nonce CSP. It extracts pure rendering and adds rank logic without changing activation, command registration, scanning, judging, persistence or framework dependencies. Dynamic chapter/resource strings are escaped and no inline style or unsafe-inline is introduced.

## Verification

- Extension `pnpm.cmd test`: PASS, 93 tests, 0 failures, 0 reported skips; includes the added invalid-date regression. Existing Node MODULE_TYPELESS_PACKAGE_JSON warnings remain unchanged.
- Extension `pnpm.cmd run typecheck`: PASS.
- Extension `node build.mjs`: PASS, resulting bundle approximately 572.5 KB.
- Scoped `git diff --check`: PASS; only normal Windows LF/CRLF notices.
- Extension lint: not configured; repository lint is owned by root and included in its successful validate/full-test run.
- Existing Windows test limitation: `test/lab-index.test.ts` returns before its POSIX symlink assertions on win32, although Node reports that test as passed. This is separate from the explicit Windows symlink skip in repository tests.
- Inspected `.lab-cache/stats-profile/verification.json`: `ok: true`, 47 layouts, 32 rank/theme color checks, zero captured errors. The report timestamp is later than the final renderer edit, so it covers the date-filter change.
- Inspected `.lab-cache/stats-profile/host-verification.json`: `ok: true` for native VS Code dark/light/high-contrast/high-contrast-light, with Pupil, 14 solved, 58 submissions and 18 passes. These host artifacts were produced by root.
- Inspected `dark-1440.png` and `hc-light-375.png`: legible rank/counters/detail text, compact trend, appropriate chapter columns and no incoherent overlap. Remaining screenshots and host interaction checks are owned by root.

## Findings Not Fixed

No unresolved product issue found in the reviewed scope. Root remains responsible for recording repository gate results, final diff cleanup and final task completion. This review does not claim installation/publishing or a persistence migration, neither of which the task requests.
