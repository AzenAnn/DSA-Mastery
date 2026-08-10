# Rollback runbook

## Before merge

1. Stop the Draft PR and preserve its test evidence.
2. Keep `main` and the current GitHub Pages deployment unchanged.
3. If work resumes, rebase a new feature branch on the then-current `origin/main` and cherry-pick only proven commits.

## After a future merge

1. Confirm whether the incident is content-only, Pages configuration, or the site generator.
2. For content-only defects, revert the responsible content commit.
3. For deployment-only defects, redeploy the last successful GitHub Pages workflow artifact while preparing a fix.
4. For architectural regressions, revert the migration commits in reverse order through a reviewed PR, run the restored vinext suite from its lockfile, and redeploy.
5. Verify `/DSA-Mastery/`, the first lesson, Labs index, and one Lab after rollback.

Markdown paths are intentionally preserved by the migration, so rollback requires no content conversion or database restore.
