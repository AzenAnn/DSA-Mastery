# Statistics Profile Design

## Boundaries And Data Flow

Keep `StatsPanel` as the VS Code lifecycle/data adapter. It reads events and existing type-aware chapter bars and passes them to a pure `statsView.ts` HTML renderer. No changes to stats aggregation, ProgressTracker, activation, commands, scan or Judge code.

`rank.ts` exports `RANKS`, `getRankBySolvedCount`, `getNextRank` and `getRankProgress`. RankInfo includes a stable lowercase id, English/Chinese names, min/max, and CSS color token with fallback. RankProgress contains rank, optional nextRank, normalized solvedCount, progress percent [0,100], and remaining. Highest rank has progress 100, remaining 0 and no nextRank; UI shows MAX RANK. Invalid numeric inputs normalize to zero; finite nonnegative fractions truncate.

Renderer input is `{ events, bars, now? }` and resource options `{ cspSource, styleUri, nonce }`. Renderer imports pure aggregation/helpers; host retains project completion predicate. Native SVG drawing remains; extracting pure render code enables runtime DOM testing without faking a VS Code module. Generated HTML retains CSP with external CSS only and nonce JS. All dynamic string data and resource attributes are escaped. No inline style attributes or new network dependencies.

## Visual And Interaction Contract

Statistics CSS remains scoped to `.stats-page` / `.stats-body`. Header is unframed, title and rank side by side on wide view; stacked when narrow. Four KPI surfaces follow. Activity, Momentum and Curriculum are unframed sections separated by spacing/light rules. Shared host and other Lab pages retain their existing rules.

CSS classes keep `.stat-cards`, `.stat-card`, `.stats-block`, `.stats-head`, `.stats-controls`, `.heatmap-toggle`, `.heatmap-scroll`, `.heatmap-legend`, `.trend-wrap`, `.trend`, `.chapter-bars`, `.chapter-row`, `.chapter-bar`, `.chapter-name`, `.chapter-count`. New classes: `.rank-overview`, `.rank-title`, `.rank-meaning`, `.rank-summary`, `.rank-progress`, `.rank-caption`, `.rank-range`, `.chapter-heading`, `.chapter-number`, `.chapter-percent`, `.chapter-complete`, `.heatmap-cell`, `.is-today`, `.heatmap-detail`. Rank overview uses `data-rank` with rank id. Chart colors use `--stats-accent`, `--stats-heat-0..4`; progress is SVG attributes to honor CSP.

Full-year heatmap remains native SVG in a bounded scroller. Focusable day cells expose date and existing per-day submit/pass values via title/accessible label and an adjacent detail readout; do not fabricate first-solved counts. Roving keyboard focus avoids hundreds of tab stops. Today is outlined. Existing metric and year choices remain local UI state through acquireVsCodeApi getState/setState.

Trend preserves pass-event counts and uses calendar-day x coordinates; ResizeObserver adjusts SVG viewBox and positions so chart height and text size remain stable across widths. Empty/one-date state is compact. Y ticks are unique integers, point titles use '次'. Area fill max 0.08 and line width 2. Chapter rows use a grid and 6px SVG bar with clamped percentages.

## Compatibility And Rollback

No persistence migration or extension package changes required. Event history retention remains existing behavior. Existing panel command retains refresh behavior. Optional toast is omitted because a rendered snapshot is insufficient evidence of a new rank event. Rollback only requires reverting stats rendering/rank and scoped CSS/test changes; persisted progress is untouched.
