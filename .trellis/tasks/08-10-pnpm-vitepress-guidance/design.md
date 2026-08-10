# Technical Design: pnpm Standardization and VitePress Guidance

## Boundaries

The migration changes repository tooling and current operational documentation, not the course site's public behavior. `pnpm-lock.yaml` becomes the only dependency-resolution artifact. `package.json` advertises pnpm `11.1.1`; its scripts retain their public names and behavior but use pnpm for internal script composition. The dependency set and VitePress configuration remain unchanged unless lockfile verification proves an existing consistency defect.

The GitHub Pages workflow continues to use Node 24, the existing build/test stages, `actions/configure-pages`, `dist/pages`, and the PR-only deploy exclusion. It adds pnpm setup before Node dependency caching, switches the cache key to pnpm, performs a frozen lockfile installation, and invokes the same scripts through pnpm.

## Documentation Model

Current operational documentation has one package-manager contract:

```text
Corepack enable
  -> pnpm install --frozen-lockfile
  -> pnpm <script-or-command>
  -> pnpm-lock.yaml
```

README provides the concise entry path. CONTRIBUTING, `docs/UPDATE_WORKFLOW.md`, `docs/VITEPRESS_MIGRATION.md`, `docs/PROJECT_BLUEPRINT.md`, and the PR template inherit that contract for their audiences. Active specs describe it as the required validation environment. Historical cleanup evidence remains unchanged because it reports commands actually executed during a completed migration; a later current-guide reference supplies the new procedure.

## VitePress Guidance Structure

Add `frontend/vitepress-development.md` and link it from the frontend and root spec indexes. It complements, rather than duplicates, the architecture, component/data, visual, content, and quality specs.

```text
Markdown content
  -> validate-content.mjs + content-index.ts (Node/build time)
  -> content.data.ts (serialized loader data)
  -> VitePress default theme + small Vue extensions (browser)
  -> dist/pages (generated only)
  -> artifact check + Playwright under configured Pages base
```

The new guide will route work to the owning layer and require agents to use VitePress-native navigation, search, appearance, sidebar/drawer, outline, prev/next, code copy, and 404 before custom code. It will make explicit that filesystem and frontmatter parsing never cross the browser boundary, and that components consume loader/index data rather than rebuilding it.

## Compatibility and Rollback

No source routes, `base` normalization, rewrites, or `target="_self"` Labs compatibility behavior change. The package-manager migration is rollbackable by restoring the removed npm lockfile and the prior workflow/documentation in one revert; package installation and CI would return to npm. The guidance document is documentation-only and independently revertible.

## Trade-offs

- Pinning `packageManager` gives Corepack and CI a deterministic pnpm version, at the cost of requiring contributors to activate Corepack once.
- Replacing all current operational references avoids mixed instructions, while preserving historical audit records maintains the integrity of past verification evidence.
- A focused VitePress guide avoids overloading the architecture document, but the indexes must link it so agents discover it before edits.
