# Implementation Plan

## 1. Markdown authoring contract

- [x] Add pinned direct dependencies compatible with Markdown-it 14.
- [x] Implement typed theory container registration, safe titles and stable output classes.
- [x] Implement mark registration and standalone code filename enhancement without code-group duplication.
- [x] Wire the installer into `.vitepress/config.ts` after the existing tasklist plugin.
- [x] Add focused parser/build tests before styling.

## 2. Visual system

- [x] Add semantic and component tokens to `custom.css` for light/dark themes.
- [x] Style all theory variants and native VitePress callouts.
- [x] Style `mark`, semantic text classes, `kbd` and `dfn`.
- [x] Complete code toolbar, filename, code-group, line annotations and responsive overflow styling.
- [x] Preserve native focus/copy/details behavior and reduced-motion contract.

## 3. Real authoring usage

- [x] Migrate the two definition blocks in `01-data-structure-basics.md` and add a restrained inline highlight/semantic term without changing the explanation.
- [x] Migrate the asymptotic definition and selected complexity/pitfall material in `03-algorithm-complexity-analysis.md`; include representative proof/property/complexity syntax using existing conclusions only.
- [x] Exercise native filename, line number, highlight and code-group syntax on the same pages.
- [x] Write `docs/THEORY_DOC_STYLE_GUIDE.md` with the complete API, decisions and migration guide.

## 4. Automated and browser checks

- [x] Extend discovery fixture with all eleven containers, nested formula/list/table/link/code, safe title, mark boundaries, standalone filename, code group, focus/diff/warning/error and search phrase.
- [x] Extend artifact checks for real-page theory classes, escaped title, filename and search content.
- [x] Extend Pages Playwright for theory variants, light/dark contrast, 1440/390 widths, root overflow, keyboard focus, code title/tabs/annotations/copy and local search.
- [x] Run `pnpm run validate`, `pnpm run test:discovery`, `pnpm run build`, `pnpm run check:site`, `pnpm test` and Pages-base `pnpm run test:pages`.
- [x] Capture 1440/390 light/dark screenshots for manual inspection, inspect them, then remove temporary screenshots/services from the worktree.

## 5. Spec, review and finish

- [x] Update the relevant `.trellis/spec/frontend` and content/quality contracts with exact syntax, output and tests.
- [x] Run `trellis-check`, fix all violations and repeat the full completion audit against AC1–AC8.
- [x] Confirm generated fixture/cache/test artifacts are clean and diff contains only task-owned files.
- [ ] Commit implementation in coherent Conventional Commit batches, archive the task and record the Azen session journal.

## Validation Commands

```powershell
pnpm install --frozen-lockfile
pnpm run validate
pnpm run test:discovery
pnpm run build
pnpm run check:site
pnpm test
$env:GITHUB_PAGES_BASE_PATH='/DSA-Mastery'
$env:SITE_URL='https://azenann.github.io/DSA-Mastery/'
pnpm run build
pnpm run check:site
pnpm run test:pages
```

## Risky Files and Rollback Points

- `.vitepress/config.ts` and the fence renderer wrapper: validate immediately after implementation; revert the installer as one unit if Shiki/copy output changes.
- `.vitepress/theme/custom.css`: keep new tokens/styles in named sections so visual rollback does not touch existing homepage/quiz CSS.
- `scripts/test-content-discovery.mjs`: fixtures must stay inside validated `chapter-99` paths and clean in `finally`.
- Content pages: review only the small container/inline diff; never reflow or rewrite surrounding knowledge text.
