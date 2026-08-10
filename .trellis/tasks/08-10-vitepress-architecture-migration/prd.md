# VitePress architecture migration

## Goal

Replace the vinext/React/RSC course-site runtime with a stable VitePress static site while preserving DSA Mastery's distinctive learning experience, content-only update workflow, public URLs, and GitHub Pages deployment. Install Trellis as the shared planning/specification layer for human and AI contributors before changing the site.

## Users and outcomes

- Learners can move from theory to Labs on desktop and mobile without broken links or visual regression.
- Content authors add one compliant Markdown file and automatically get a page, navigation entry, search result, and updated homepage/Labs statistics.
- Maintainers use a reviewable Trellis task/spec workflow without hidden commits or duplicated GitHub Issue tracking.

## Scope

### Included

- Trellis 0.6.14 project initialization for Codex, team specs, onboarding, and this migration task.
- VitePress 1.6.4 with an extended default theme and custom Vue homepage/course components.
- Existing `content/chapter-*/*.md` and `labs/**/README.md` as the single source of truth.
- Compatibility for existing `/learn/.../` and `/labs/.../` URLs and GitHub Pages base `/DSA-Mastery/`.
- Local Chinese search, appearance switch, responsive navigation, document metadata, breadcrumbs, outline, edit links, prev/next, code copy, GFM, math, 404, metadata, favicon, and Open Graph data.
- Build-time content discovery, validation, internal-link audit, real-click Playwright smoke tests, visual comparison, and Pages workflow.
- Evidence-led removal of the superseded vinext/React/Cloudflare stack and generated caches.
- Updated project, contributor, publishing, troubleshooting, migration, and rollback documentation.

### Excluded

- Rewriting the seven lessons or four Labs beyond link/metadata compatibility edits.
- Adding new course chapters, runnable algorithm implementations, PDF/LaTeX output, CMS, authentication, analytics, or a second production host.
- Merging the final pull request or changing repository visibility/collaborator permissions.

## Content contract

- Lessons: `content/chapter-*/*.md`; exclude `content/README.md`.
- Labs: `labs/chapter-*/lab-*/README.md`.
- Lesson fields: `title`, `description`, `order`, `chapter`, `chapterTitle`, `updated`, `contributors`, `status`.
- Lab fields add `lab: true`, `difficulty`, and `duration`.
- Navigation order is numeric `chapter`, then numeric `order`, then title as a deterministic tie-breaker.
- Draft content remains visible with a status badge during the Demo.

## Constraints

- Pin stable Trellis 0.6.14 and VitePress 1.6.4; do not use prerelease versions.
- Work only on `feat/trellis-vitepress-migration`, based on `origin/main`; target `main` with a Draft PR.
- Preserve user content and templates. Old tracked source is deleted only after the replacement passes build, link, browser, Pages-base, and visual checks.
- Trellis must use `session_auto_commit: false` and inline Codex dispatch for the initial rollout.
- Generated directories, logs, credentials, and unrelated files must not be committed.

## Acceptance criteria

- [x] Trellis files are reviewable, project specs cover the agreed policy areas, and onboarding explains the exact team workflow.
- [x] `npm ci` and `npm test` pass; Pages-subpath Playwright passes 5/5.
- [x] The build emits all seven lesson pages, four Lab pages, the branded home page, Labs index, and 404 page.
- [x] Existing lesson and Lab URLs remain valid locally and beneath exactly one `/DSA-Mastery/` prefix.
- [x] Browser coverage includes the learner journey, Chinese search, theme/code/metadata, mobile navigation, and 404 without unexpected network or console failures.
- [x] Desktop and mobile light/dark evidence retains the brand, document hierarchy, and responsive layout.
- [x] MathJax, code, table/task-list, relative Markdown links, and edit links render and behave correctly.
- [x] A temporary compliant lesson and Lab are automatically discovered and safely removed.
- [x] `docs/CLEANUP_REPORT.md` records and authorizes the completed tracked removals.
- [x] No deleted vinext/React/Cloudflare/Sites direct dependency or active command remains after clean verification.
- [ ] The branch is split into intentional commits, pushed, and represented by an unmerged detailed Draft PR.

## Release and rollback gates

- Do not delete the old stack until the VitePress acceptance suite and visual review pass.
- Do not merge if Pages-base navigation, search, mobile layout, math, or content auto-discovery regresses.
- Rollback before merge: close the Draft PR or reset only the feature branch; `main` remains untouched.
- Rollback after a future merge: revert the migration commits as a group and redeploy the last green `main` Pages artifact. Content commits remain independently recoverable because Markdown paths are preserved.

## Evidence to attach to the PR

- Version and environment check, before/after command results, route/link inventory, browser test results, and screenshot pairs.
- Architecture/dependency comparison and per-file cleanup table.
- Known differences, risks, manual post-merge checklist, and exact rollback steps.
