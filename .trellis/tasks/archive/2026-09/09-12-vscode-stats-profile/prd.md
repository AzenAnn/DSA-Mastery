# VS Code statistics progress profile

## Goal

Incrementally redesign the existing DSA-Mastery VS Code statistics WebView into a dense, theme-compatible algorithm training progress profile. The complete user request is preserved in `source-request.md`; its 43 sections remain the authoritative scope. The user authorized implementation, a new branch, Trellis identity Azen, and reasonable color adjustments.

## Confirmed Background

- Branch: `feat/vscode-stats-profile`, created from fetched `origin/main`; developer identity: `Azen`.
- Native HTML/SVG WebView with shared external `media/panel.css` and nonce CSP; no chart or UI framework.
- `countActivity(events)` distinguishes event submissions/passes from unique attempted/passed lab IDs. Rank uses `labsPassed` only.
- Calendar activity uses local dates. Trend counts cumulative pass events, including repeated passes. Chapter completion uses existing type-aware state, including `projectProgressPassed`.
- Stats refreshes on the existing command; no reliable live before/after rank event is exposed, so the optional Rank Up toast is omitted.

## Requirements

1. Preserve all four counters, source data, local persistence, date semantics, metric/year controls, and type-aware chapter completion.
2. Centralize eight ranks and helpers: Trainee 0, Pupil 10, Specialist 30, Expert 60, Candidate Master 100, Master 150, Grandmaster 200, Legendary 250. Show English title, Chinese meaning, rank color, solved/submissions, in-rank progress and remaining problems. Legendary shows MAX RANK without a next rank.
3. In-rank progress is `(solved - min) / (next.min - min)`, with a reset at each threshold. Repeated submissions or passes of the same lab cannot change rank.
4. Use theme variables with fallback tokens, neutral surfaces, one chart accent, restrained rank colors, consistent typography and micro labels PROGRESS OVERVIEW / ACTIVITY / MOMENTUM / CURRICULUM. Cap content width around 1280-1400px, avoid decorative nested section cards.
5. Keep yearly contribution heatmap with neutral zero cells and accent levels. Indicate today; provide readable date tooltips with existing submission/pass counts, including keyboard access. Do not invent daily solved counts.
6. Use a compact 220-250px desktop / 180-220px narrow trend, 2px line, small points and <=10% area fill. For zero/one event-bearing date use a compact empty state. Retain cumulative pass-event semantics and correct units.
7. Chapters show number, title, completed/total and percentage with 5-6px bars. Use two columns when space permits, one on narrow WebViews, and restrained complete indication.
8. Verify no incoherent overlap or page-level horizontal overflow at wide, normal and narrow widths, large text, reduced motion, and dark/light/high-contrast themes. Keep the heatmap readable in its own scroller.

## Acceptance Criteria

- [x] All rank boundaries and adjacent values are verified, including 0/9/10/29/30/60/100/150/200/250 and >250.
- [x] Progress for 10/20/29/30 solved is 0/50/95/0%; 14 solved has 20% and 16 problems to Specialist.
- [x] Rendered UI verifies rank, counters, no-data/one-day/dense activity, real controls, year changes, date tooltip and today state.
- [x] Theme/viewport screenshots and computed layout checks prove compact trend, max width, two/one chapter columns, legible text and visible progress under strict CSP.
- [x] Existing event counting, chapter status, submitting and judging tests pass; no activation/commands/persistence/scanning changes.
- [x] Extension full test, typecheck and build plus repository validate, lab-tools and pnpm test gates run with outcomes recorded.
- [x] Final diff is scoped; changed file list, verification and limitations are in `validation.md` and the independent `review.md`.

## Out Of Scope

Rank Up toast (optional), XP, levels, daily tasks, achievements, leaderboard, social/cloud features, new event collection, migration, judging/submission/scan rewrites, framework replacement, release/publication.
