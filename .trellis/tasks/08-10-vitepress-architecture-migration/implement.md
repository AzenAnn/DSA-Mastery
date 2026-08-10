# Implementation plan

## 1. Baseline and governance

- Verify branch/worktree/remote and run the pre-migration content/build/test suite.
- Record representative desktop/mobile, light/dark, lesson/Labs/Lab screenshots and interaction inventory.
- Initialize pinned Trellis for Codex, disable automatic commits/dispatch, curate project specs and onboarding.

## 2. Parallel VitePress replacement

- Pin VitePress/Vue and only the required stable plugins.
- Implement config, rewrites, content index/loader, root/Labs entry pages, extended theme, Vue components, metadata, search, math, and Pages base.
- Convert only the known rewrite-sensitive Markdown links; do not rewrite lesson content.
- Keep old source present during this phase as the rollback implementation.

## 3. Test the final static artifact

- Keep content validation; add discovery fixture and artifact link/route tests.
- Rewrite Playwright to serve `dist/pages` under `/DSA-Mastery/` and click through learner journeys.
- Cover search, appearance, mobile navigation, math/code/table/task-list, metadata, console/network health, and 404.
- Capture after screenshots at the same viewport sizes and compare against the baseline.

## 4. Switch publishing

- Replace the vinext patch/build workflow with VitePress validation, build, link audit, Playwright, and Pages upload.
- Keep deployment disabled for pull requests and enabled for `main` push/manual runs only.

## 5. Evidence-led cleanup

- Write `docs/CLEANUP_REPORT.md` with candidate category, evidence, replacement, and decision.
- Remove only verified superseded tracked files and dependencies; remove generated local caches by explicit safe targets and update ignore rules.
- Perform a clean dependency install followed by the full suite again.

## 6. Documentation and delivery

- Update README, contributing guide, blueprint, update workflow, Trellis onboarding, migration/rollback, local preview, Pages, and troubleshooting instructions.
- Inspect each staged group, commit by concern, push the feature branch, and open a detailed Draft PR with screenshots and evidence.
- Do not merge.

## Completion checklist

- [x] Local implementation criteria have direct evidence in tests, screenshots, and `docs/CLEANUP_REPORT.md`.
- [x] Temporary discovery fixtures and generated test artifacts are safely cleaned.
- [x] Documentation and Trellis specs describe the final VitePress implementation.
- [ ] Human delivery remains: review/stage commits, push, attach the final branch/PR URL, and keep the Draft PR unmerged.
