# Implementation Plan: Restore VitePress Theme and UX

## Preconditions

- [x] Obtain explicit approval of this planning summary and start the task with `python ./.trellis/scripts/task.py start .trellis/tasks/08-10-restore-vitepress-theme-ux`.
- [ ] Load `trellis-before-dev` and reread `.trellis/spec/frontend/{vitepress-architecture,components-and-data,visual-responsive}.md` plus `.trellis/spec/quality/validation-and-pages.md`.
- [ ] Record the starting visual matrix using the current routes, `migration-baseline` references, 375/768/1024/1440px widths, and both color modes.

## Execution Checklist

1. Establish or refine the `--course-*` token layer in `.vitepress/theme/custom.css`, then map it consistently into the VitePress `--vp-*` variables. Verify contrast pairs before changing component selectors.
2. Restyle the native VitePress shell in `custom.css`: navbar, brand mark, search, menu states, appearance control, sidebar, local mobile navigation, outline, code-copy control, and focus ring. Preserve native markup, labels, keyboard behavior, and the Labs `target="_self"` exception.
3. Restore the homepage hierarchy through `HomePage.vue` plus component-scoped class styling: hero/code window, action hierarchy, proof points, data-derived statistics, learning loop, chapters, Labs preview, update panel, and close. Use the existing content index only.
4. Restore document and Lab reading hierarchy through `Layout.vue`, `DocumentHeader.vue`, `DocumentFooterNote.vue`, `LabsIndex.vue`, and `custom.css`: breadcrumb, heading, metadata/status, Markdown typography, tables, math, code, footer navigation, Lab cards, and empty/long-content resilience.
5. Apply the defined responsive model in `custom.css`. Test on both sides of 1180px, 980px, and 720px; reserve stable dimensions for the code window, statistics, learning loop, and cards. Correct root overflow, overlap, and text clipping before polishing effects.
6. Add focused Playwright coverage only for new visual/interaction contracts that existing scenarios do not exercise, such as visible branded mobile search affordance, stable responsive card count/layout, or reduced-motion/focus regression. Do not replace functional tests with screenshot-only checks.
7. Update screenshot evidence and classify differences from the baseline. Re-run the full quality matrix and fix failures before proceeding to the final Trellis check.
8. Run `trellis-check`, update this frontend specification with any implementation-discovered contract, review the diff for accidental content/routing changes, and commit only the approved theme-recovery scope.

## Validation Commands

```bash
npm run validate
npm run build
npm run check:site
npm run test:pages
```

For Pages-base validation, run the repository's documented environment-specific build and Playwright sequence from `docs/VITEPRESS_MIGRATION.md`. During browser review, inspect console/page errors and use the same base path as the deployment target.

## Review Gates

- After tokens and native shell: compare desktop light/dark navbar, search, sidebar, and outline with baseline intent; confirm no stock VitePress color leak.
- After homepage and document work: compare 1440px and 375px light/dark views; check heading hierarchy, text wrapping, focus, code copy, and the mobile drawer.
- Before merge: verify all acceptance criteria, Pages-base navigation, Chinese search, theme persistence, Labs full-page navigation, reduced motion, and screenshot classification.

## Risk and Rollback Points

| Risk | Prevention | Rollback point |
| --- | --- | --- |
| Native VitePress selectors differ from assumptions | Inspect rendered DOM and retain the default layout | Revert the affected selector slice without changing components or config. |
| CSS fixes cause a responsive regression | Test at and around the three documented breakpoints | Revert the breakpoint-specific rule and restore the last green responsive screenshot. |
| Visual refactor harms Pages navigation/search | Do not alter `config.ts`, link data, or native behavior | Revert theme/component changes; retain content and route layers unchanged. |
| Decorative restoration lowers readability or accessibility | Treat contrast, focus, wrapping, and reduced motion as release gates | Prefer the accessible VitePress-native variation and document the intentional baseline difference. |

## Definition of Ready

The task is now `in_progress` and must remain active until implementation, visual review evidence, the full quality gate, any resulting spec update, and scoped commits are complete. Do not archive it in this session.
