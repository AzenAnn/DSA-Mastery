# Technical design

## Decision summary

Use VitePress 1.6.4 as the sole site generator. Extend its default Vue theme so the project keeps VitePress's accessible routing, sidebar, outline, local search, appearance switch, code-copy behavior, and mobile shell while replacing the generic presentation with DSA Mastery components and tokens.

## Source and route model

- The repository root is the VitePress root and source directory.
- `.vitepress/config.ts` excludes repository-only Markdown and rewrites:
  - `content/:chapter/:page.md` → `learn/:chapter/:page/index.md`
  - `labs/:chapter/:lab/README.md` → `labs/:chapter/:lab/index.md`
- Root `index.md` mounts the branded homepage; `labs/index.md` mounts the Labs catalog.
- Build output is `dist/pages`; GitHub Pages supplies the normalized base path through `GITHUB_PAGES_BASE_PATH`.
- Course Markdown may retain relative `.md` links. The validator checks source targets, then the Markdown transform rewrites known targets to route paths before VitePress applies Pages base once.

## Content index

`.vitepress/content-index.ts` is the build-time authority for structured course metadata. It scans only the two content contracts, parses frontmatter, derives source path/URL/reading time, and returns deterministic lesson, Lab, chapter, and sidebar data. `.vitepress/content.data.ts` watches the same globs for Vue components; native search indexes generated pages and native prev/next follows the generated sidebar. Node filesystem APIs never enter the client bundle.

The existing content validator remains an independent guard. A dedicated fixture test creates temporary compliant Markdown files, checks discovery, and removes them in `finally` so the repository is left clean.

## Theme and interaction

- `.vitepress/theme/index.ts` extends `vitepress/theme-without-fonts` and registers the custom Home/Labs entry components.
- `custom.css` ports the paper/ink, indigo, orange, typography, spacing, card, glass-header, document, dark-mode, focus, and reduced-motion rules from the visual baseline.
- A custom Home component recreates the code-window hero, learning loop, live statistics, chapter/Lab cards, update panel, and manifesto.
- Default-theme layout slots add `BrandMark`, document metadata/breadcrumbs/status, and the footer note. Native navigation remains intact.
- VitePress native local search is configured for Chinese content. Native appearance, outline, sidebar/mobile drawer, prev/next, code copy, syntax highlighting, and 404 behavior are retained and restyled.
- Math uses VitePress `markdown.math: true` and MathJax; existing `$...$` and `$$...$$` syntax is covered by discovery tests.
- Top-level Labs navigation and Labs catalog cards use `target="_self"` to avoid stale outline state in VitePress 1.6.4 cross-page navigation.

## Metadata

Site title, description, canonical/OG data, favicon, and theme-color are generated with the Pages-aware base. Each page uses existing frontmatter title/description; source metadata drives edit links and status/author/update labels.

## Verification layers

1. Content contract validation.
2. Type/lint checks and VitePress production build.
3. Static artifact audit: expected routes, asset/link targets, and exactly-one base prefix.
4. Playwright against the final artifact mounted at `/DSA-Mastery/`, using real clicks and checking network/console failures, search, theme, desktop/mobile layout, and representative Markdown.
5. Screenshot comparison against `docs/assets/migration-baseline/`.
6. GitHub Actions PR gate; deployment job only runs for `main` push/manual dispatch.

## Cleanup design

After gates 1–5 passed, `docs/CLEANUP_REPORT.md` authorized removal of the 30 tracked React/vinext/RSC/Cloudflare/Sites files and obsolete direct dependencies. Markdown, Labs, public assets, project docs, templates, Trellis, validator, Playwright, VitePress, and Pages workflow remain.

## Rollback

- Until merge, the old production site remains on `main`; abandoning the branch is sufficient.
- Before old-source deletion, the branch has a known-green VitePress commit and the prior vinext files remain in git history.
- After future merge, revert the migration commit set in reverse order and redeploy; no content-path data migration is required.
- If only Pages deployment fails, disable the new deploy workflow run and redeploy the prior successful Pages artifact while investigating on a fix branch.
