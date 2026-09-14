# Statistics Profile Implementation

- [x] Recover complete source request; inspect panel, styles, counters, chart code and Project completion contract.
- [x] Verify feature branch and Azen identity; write PRD/design/source request and curate context.
- [x] Add centralized rank model with boundary, progress and repeated-activity coverage.
- [x] Extract pure stats rendering, retain host/data contracts, implement rank/header/counters/activity/trend/curriculum.
- [x] Replace only statistics CSS with theme-aware responsive styling.
- [x] Add rendered UI verification for interactions, strict CSP, themes, viewport/layout and screenshots.
- [x] Run extension tests, typecheck and build.
- [x] Run repository validate, test:lab-tools and pnpm test (full required gate).
- [x] Independent final review, fix issues, update relevant spec and record verification evidence.
- [x] Inspect final diff and report result; maintenance commits/publication are not part of the user request.

## Commands

In tools/vscode-extension: `pnpm.cmd test`, `pnpm.cmd run typecheck`, `node build.mjs`.

At repository root: `pnpm.cmd run validate`, `pnpm.cmd run test:lab-tools`, `pnpm.cmd test`; the full test script includes the first two gates. `node scripts/verify-extension-stats-ui.mjs` checks generated HTML in Chromium and writes preview/screenshots under `.lab-cache/stats-profile/`. `--preview` only generates standalone local HTML fixtures. An isolated VS Code host smoke check also ran; see `validation.md`.

## Review Gates

Full source request section 43 checklist maps to PRD acceptance and validation report. Verify narrow and wide real generated HTML, not just source regex matches. Review `git diff` to ensure only stats UI/rank and supporting validation/docs changed. Preserve all unrecognized initial worktree files, including skill Python cache.
