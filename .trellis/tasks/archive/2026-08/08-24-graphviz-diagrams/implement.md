# Implementation Plan

## Ordered Checklist

1. [x] Add `vitepress-plugin-diagrams@1.3.1` as a direct dev dependency and update `pnpm-lock.yaml` with the repository's pinned pnpm version.
2. [x] Extend `.vitepress/config.ts` with `createBuildTimeDiagramsPlugin`; preserve existing Markdown-it plugins, Vite `configFile: false`, Pages base handling, and theme config.
3. [x] Add or adjust diagram CSS only where the generated figure needs responsive overflow containment.
4. [x] Use `rg` to enumerate every `text [*.txt]` block under `content/chapter-04-tree/`, convert each to valid DOT while preserving nearby explanations, and use stable plugin IDs/captions because diagram fences do not support VitePress filename suffixes.
5. [x] Add two graph teaching examples to the graph chapter with labels/weights matching the text.
6. [x] Write `docs/GRAPHVIZ_AUTHORING_GUIDE.md`, link it from `docs/DEVELOP_GUIDE.md`, include it as the fifth 前言 guide, and include a minimal DOT example, preview sites, cache/network notes, and validation commands.
7. [x] Generate/refresh cached SVGs through the plugin, inspect representative output, and remove unrelated generated files.
8. [x] Run the quality gates below, fix failures, and perform a final content/visual review before task completion.

## Validation Commands

```bash
corepack enable
pnpm install --frozen-lockfile
pnpm run validate
pnpm run build
pnpm run check:site
GITHUB_PAGES_BASE_PATH=/DSA-Mastery SITE_URL=https://azenann.github.io/DSA-Mastery/ pnpm run build
GITHUB_PAGES_BASE_PATH=/DSA-Mastery SITE_URL=https://azenann.github.io/DSA-Mastery/ pnpm run check:site
```

Use `pnpm run test:pages` when the static server/browser dependency is available. Manually inspect one tree page and one graph page at 1440px and 390px in both themes; check that the generated `<img>` is non-empty, captions are visible, and the document has no horizontal overflow.

## Risk and Rollback Points

- Dependency/API mismatch: stop after step 2, restore config and lockfile, and verify the existing site still builds.
- Kroki/network failure: set `KROKI_SERVER_URL` to a local/self-hosted endpoint or use the checked-in cache; do not weaken build errors to silent placeholders.
- DOT conversion changes meaning: compare each rendered graph with the original ASCII block and adjacent prose before migrating the next block.
- Generated asset noise: keep only SVGs referenced by current Markdown and remove exact stale plugin outputs; never delete unrelated `public/` assets.
