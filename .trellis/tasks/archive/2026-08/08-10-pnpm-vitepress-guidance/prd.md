# Standardize pnpm and VitePress guidance

## Goal

Make pnpm the repository's single documented and automated package manager, and give future agents a practical, project-specific VitePress development contract. Contributors and automation should install, run, and validate the same dependency graph, while VitePress changes should follow explicit ownership, routing, data-flow, and verification rules.

## Confirmed Facts

- The repository is a VitePress `1.6.4` site rooted at the repository root. `.vitepress/content-index.ts` is the single source for derived course metadata and navigation.
- `package.json` requires Node `>=22.13.0`, but its alias and aggregate scripts invoke `npm run`.
- Both `package-lock.json` and `pnpm-lock.yaml` are tracked. The pnpm lockfile uses lockfile version 9 and was added by commit `720fc3c`; CI and current-maintenance documentation still use npm.
- pnpm `11.1.1`, Node `24.15.0`, and Corepack `0.34.6` are available in the development environment.
- `.github/workflows/pages.yml`, README, CONTRIBUTING, the update/migration guides, PR template, and active Trellis specs expose npm commands. `docs/CLEANUP_REPORT.md` records historical npm-era migration evidence.

## Requirements

### R1: pnpm is the default package-management contract

- Declare the exact supported pnpm version in `package.json` using the standard package-manager metadata and enable reproducible installations from the existing `pnpm-lock.yaml`.
- Remove the competing tracked npm lockfile. Do not hand-edit dependency resolution; regenerate or verify the pnpm lockfile through pnpm when package metadata changes.
- Make package scripts internally invoke pnpm rather than npm where one script delegates to another.
- Configure the GitHub Pages workflow to install the declared pnpm version, cache pnpm dependencies, use a frozen lockfile installation, and run project scripts through pnpm.

### R2: current contributor documentation uses pnpm

- Replace current npm installation, run, test, audit, and lockfile guidance in README, CONTRIBUTING, the contributor workflow, migration guide, project blueprint, PR template, and relevant active specs with their pnpm equivalents.
- Describe Corepack activation and distinguish immutable installation (`pnpm install --frozen-lockfile`) from intentional dependency changes (`pnpm install`).
- Preserve historical documentation where an npm command records a past, time-bound verification result; do not present historical evidence as the current recommended procedure.

### R3: VitePress development rules guide agents before implementation

- Extend the frontend specification index and VitePress architecture rules with an agent-oriented guide for the full VitePress change lifecycle.
- Define file ownership and permitted data flow among config, content index, data loader, default-theme extension, Vue components, Markdown sources, validators, generated output, and Pages workflow.
- State rules for server/build-time versus browser code, source-of-truth reuse, VitePress-native feature reuse, route/rewrite/base handling, Markdown links, and the documented Labs full-navigation compatibility exception.
- Give change-to-validation mappings and wrong/correct examples that are specific to this repository and use pnpm commands.

## Out of Scope

- Upgrading Node, pnpm, VitePress, Vue, or any package versions unless pnpm lockfile normalization makes an already-declared resolution change necessary.
- Altering course Markdown contracts, public routes, VitePress visual design, content discovery behavior, or GitHub Pages deployment semantics.
- Rewriting historical audit records in `docs/CLEANUP_REPORT.md` or creating a second documentation site or package workspace.

## Acceptance Criteria

- [ ] `package.json` declares pnpm `11.1.1`; package scripts no longer delegate through `npm run`; `package-lock.json` is removed; `pnpm-lock.yaml` remains the only tracked dependency lockfile.
- [ ] A clean `pnpm install --frozen-lockfile` succeeds under the declared Node requirement, and `pnpm test` succeeds without altering the lockfile.
- [ ] The Pages workflow uses `pnpm/action-setup`, `actions/setup-node` pnpm caching, frozen pnpm installation, and pnpm commands for all existing validation/build/test stages.
- [ ] README and current contributor-facing documentation consistently show pnpm/Corepack workflow and no current operational npm commands or npm-lock guidance remain.
- [ ] The active Trellis specs refer to pnpm for installation and validation, and the frontend index points to a VitePress development guide with the required ownership, data-flow, routing, native-feature, and validation rules.
- [ ] The VitePress guide preserves the existing single `ContentIndex`, one-time Pages base normalization, VitePress default-theme reuse, and Labs `target="_self"` compatibility contract.
- [ ] `pnpm run validate`, `pnpm run build`, `pnpm run check:site`, and the Pages-base Playwright path pass when applicable to the implemented changes.

## Risks and Deferred Items

- A frozen install can expose an existing mismatch between `package.json` and `pnpm-lock.yaml`; resolve only the lockfile consistency issue and record any resulting resolution diff.
- pnpm's strict dependency layout may reveal an undeclared dependency. Add only a dependency proven to be directly imported by this repository, then regenerate the lockfile and rerun the full validation set.
- Documentation must separate current operational guidance from historical evidence to avoid falsifying the migration audit.
