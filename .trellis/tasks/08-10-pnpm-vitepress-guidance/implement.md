# Implementation Plan: pnpm Standardization and VitePress Guidance

## Preconditions

- [ ] Obtain explicit approval of this planning summary, then start the task with `python ./.trellis/scripts/task.py start .trellis/tasks/08-10-pnpm-vitepress-guidance`.
- [ ] Load `trellis-before-dev`; read the frontend, content, and quality specs selected by the index, plus the current files being changed.
- [ ] Confirm `pnpm --version` matches the `packageManager` value selected in the plan and inspect `git status --short` before editing.

## Execution

1. Update `package.json` with the pnpm package-manager declaration and replace internal `npm run` delegations with equivalent pnpm script invocations. Do not change public script names or dependency versions without evidence.
2. Run pnpm's frozen installation to verify the committed lockfile. If pnpm updates only metadata required for consistency, inspect and retain that minimal lockfile change; remove `package-lock.json` after the pnpm lockfile is confirmed authoritative.
3. Update `.github/workflows/pages.yml` to set up declared pnpm before `actions/setup-node`, cache pnpm, install with a frozen lockfile, and run all pre-existing workflow stages using pnpm. Preserve Pages environment export, artifact path, and deploy condition.
4. Update README, CONTRIBUTING, current operational documents, and PR template to teach Corepack plus pnpm install/run/test commands. Do not change historical command transcripts in `docs/CLEANUP_REPORT.md`.
5. Update active quality/content/frontend specs to use pnpm command signatures. Add `frontend/vitepress-development.md` with file ownership, build/browser boundary, route/base rules, default-feature reuse, compatibility constraints, and validation mapping; link it from the appropriate indexes.
6. Search current operational sources for residual npm commands or `package-lock.json` claims. Classify any remaining references as required external-tool use (for example the separately installed Trellis CLI) or time-bound historical evidence; revise only the former when it conflicts with the new package-manager policy.

## Validation

```bash
corepack enable
pnpm install --frozen-lockfile
pnpm run validate
pnpm run test:discovery
pnpm run build
pnpm run check:site
GITHUB_PAGES_BASE_PATH=/DSA-Mastery SITE_URL=https://azenann.github.io/DSA-Mastery/ pnpm run build
GITHUB_PAGES_BASE_PATH=/DSA-Mastery SITE_URL=https://azenann.github.io/DSA-Mastery/ pnpm run check:site
GITHUB_PAGES_BASE_PATH=/DSA-Mastery SITE_URL=https://azenann.github.io/DSA-Mastery/ pnpm run test:pages
```

Use `pnpm test` as the compact full local gate when the lockfile and normal VitePress behavior are the only affected surfaces. Review the workflow syntax and confirm `package-lock.json` is absent from tracked files before completing.

## Review Gates and Rollback

| Gate | Evidence | Rollback point |
| --- | --- | --- |
| Dependency contract | Frozen install succeeds without unexpected package drift | Restore `package-lock.json` and prior package metadata in one revert if pnpm cannot reproduce the resolved tree. |
| CI contract | Workflow retains all gates, only changing package-manager setup/invocations | Revert the workflow-only change; Pages deployment behavior is otherwise unchanged. |
| Documentation contract | Current docs/specs contain one pnpm path; historical audit text remains factual | Revert only the affected documentation file. |
| VitePress contract | Validation, artifact check, and Pages-base Playwright preserve routes, one base prefix, and Labs full navigation | Revert package/documentation changes; no VitePress configuration change is planned. |
