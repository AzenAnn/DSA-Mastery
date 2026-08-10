# Technical Design: Restore VitePress Theme and UX

## Intent and Source Hierarchy

This is a theme recovery, not a framework rollback. The preferred source hierarchy is:

1. Current VitePress behavior and the executable frontend specifications.
2. `docs/assets/migration-baseline/` as the visual intent to recover.
3. The deleted Next.js implementation at commit `5c9e03b` as historical evidence only.
4. UI/UX Pro Max research as a quality and accessibility lens, not a brand replacement.

The chosen visual language is **academic editorial documentation**: light paper or dark ink surfaces; an expressive but readable Chinese-capable serif display face; neutral sans-serif reading text; monospaced labels and code; indigo for route-forward actions; orange only for signals; and restrained borders/shadows. This retains the existing DSA Mastery identity and rejects the skill generator's teal/children's-font suggestion because it conflicts with the confirmed university-course audience and baseline.

## Boundaries and Ownership

| Area | Owner | Contract |
| --- | --- | --- |
| Content, ordering, URLs, and statistics | `content-index.ts` and `content.data.ts` | Remain the only source of course facts; no visual component may hard-code a content list. |
| VitePress shell | `vitepress/theme-without-fonts` via `Layout.vue` | Keeps top navigation, local search, appearance, sidebars, outline, footer, code copy, 404, and routing. |
| Brand composition | `BrandMark.vue`, `HomePage.vue`, `LabsIndex.vue`, document header/footer components | Supplies only product-specific semantic markup and data-derived presentation. |
| Visual system | `custom.css` | Defines semantic tokens, maps them to `--vp-*`, styles native VitePress primitives, and styles custom component classes. |
| Behavior validation | existing scripts and `tests/pages-navigation.spec.mjs` | Continues to verify Pages base, navigation, search, theme persistence, document affordances, and 404. |

No browser-only data access is needed. The route-to-document lookup remains in `course.ts`; visual work must not add a second data-loading path.

## Design System

### Semantic Color Roles

| Role | Light | Dark | Use |
| --- | --- | --- | --- |
| Paper | `#f7f6f2` | `#121419` | Page background |
| Raised paper | `#ffffff` | `#191c23` | Search, cards, document surfaces |
| Muted paper | `#efeee9` | `#20232b` | Grouping and inactive surfaces |
| Ink | `#17191f` | `#f2f3f7` | Main text and high-emphasis UI |
| Soft ink | `#555b68` | `#b8bdc8` | Supporting text |
| Brand action | `#4655e8` | `#8290ff` | Links, active navigation, primary action, focus relationship |
| Signal | `#ff6b35` | `#ff8a60` | Secondary emphasis, never the sole status indicator |
| Success | `#12805c` | `#62d8ad` | Published/verified state alongside text |

`--course-*` tokens are the source layer and VitePress `--vp-*` values map to them. Components consume semantic classes and variables; they do not introduce raw color literals except where a code-window syntax palette needs its own documented contrast pair.

### Typography, Spacing, and Effects

- Display: the existing Chinese-capable serif fallback stack. Body/UI: the existing CJK-safe sans stack. Contextual labels, page numbers, and code: the existing monospace stack. Do not fetch web fonts: self-contained static Pages and reliable CJK fallback take priority over a new external request.
- Use a 4px/8px rhythm with established tiers of 8, 12, 16, 24, 32, 48, and 72px. Article measure remains constrained; body text wraps rather than shrinks or truncates.
- Preserve the asymmetric DSA mark and the code-window visual. Cards use a thin semantic border, a small radius (8-10px), and restrained shadow/elevation. Page sections are unframed layouts, not nested cards.
- Keep transitions to color, opacity, box-shadow, and transform in the 150-300ms range. No scroll-triggered reveal library or layout-affecting animation is introduced. `prefers-reduced-motion` disables the nonessential transition layer.

### UI/UX Pro Max Decisions

Applied: WCAG-oriented contrast, semantic heading order, visible focus rings, keyboard reachability, no hover-only behavior, responsive viewport checks, native semantic elements, and reduced motion.

Not adopted: teal/amber palette, playful children's typography, generic FAQ/support landing structure, and GSAP scroll reveal. They do not fit a serious Chinese DSA course or the established visual reference.

## Page Composition

### Shared VitePress Shell

`custom.css` restyles the default navbar, local search, sidebar, outline, code-copy controls, and footer through the public VitePress class surface. `Layout.vue` continues to provide slots only; it must not reimplement navigation or search. Interactive elements retain visible `:focus-visible` treatment, readable active states, and their native accessible names.

### Homepage

`HomePage.vue` retains its data-derived sections in this order: learning promise and two entry actions; proof points; index statistics; learning loop; chapters; Labs; the Markdown update panel; closing statement. The code window is the hero's primary visual, has an accessible text alternative, and uses stable dimensions across breakpoints so badges cannot collide with text.

### Documents and Labs

`DocumentHeader.vue` provides the heading sequence, breadcrumbs, text-labelled status, duration/date/contributors, and Lab difficulty. `custom.css` gives documents an editorial reading measure, logical rhythm, clear Markdown tables/code/math, and a desktop three-column layout made from VitePress sidebar, content, and outline. `LabsIndex.vue` uses the same card and metadata grammar as the homepage and preserves `target="_self"` for the known VitePress outline compatibility issue.

### Sidebar and Outline Recovery

The old React implementation is the reference for hierarchy, not a DOM to restore. Its `.chapter-links` used one neutral `border-left` for the nested group and its active link used `accent-soft` plus accent text. The equivalent VitePress rules are:

- Reset the broad `.VPSidebarItem .indicator` color override. Keep indicators transparent except for an active nested item if VitePress needs one for anchor context; do not color every `.item`.
- Retain a single neutral divider on `.VPSidebarItem.level-1 .items` and deeper nested `.items`, with 12px readable item text, 24px line-height, and a padded active link surface.
- Give collapsible carets a 44px target while keeping chapter headings visually quiet. Active state uses text plus a background surface, never color alone.
- Style `.VPDocAsideOutline .content` as the old table-of-contents column: a neutral left border, 12px links, 1.8 line-height, 6-8px vertical rhythm, and wrapped long headings. The outline title is 12px/800 and is separated from links by at least 14px.

These rules preserve VitePress's active-anchor behavior while recovering the pre-migration information hierarchy.

## Responsive Behavior

| Width | Layout behavior |
| --- | --- |
| More than 1180px | Full navigation/search, generous hero two-column composition, VitePress sidebar/content/outline reading layout. |
| 981-1180px | Same information architecture with reduced gutters, narrower hero visual, search, and outline. |
| 721-980px | Native mobile navigation and drawer replace desktop navigation/sidebar/outline; hero becomes a single column; statistic and learning grids reflow. |
| Up to 720px | Search becomes an icon-sized control, branded title text yields to the mark, CTAs and cards use one column, article gutters retain 16-20px minimum, and text wraps instead of clipping. |

The implementation tests nearby widths around the three named transitions and reviews 375px, 768px, 1024px, and 1440px in light and dark modes. Only intrinsically wide code, math, and tables may scroll horizontally.

## Compatibility, Rollout, and Rollback

- Keep `.vitepress/config.ts`, content discovery, route rewrites, public URLs, Pages base normalization, and the Labs full-page-navigation exception unchanged unless a regression proves a styling interaction requires a minimal documented adjustment.
- Work in CSS/component slices: shared tokens and shell first, then home, documents, Labs, then responsive correction. Each slice remains buildable.
- Roll back by reverting the isolated theme changes; source content and the VitePress migration architecture remain untouched. A navigation, search, hydration, or Pages-base failure blocks visual merge and takes priority over appearance.

## Verification Strategy

Automated gates are `npm run validate`, `npm run build`, `npm run check:site`, and `npm run test:pages`. Extend Playwright only where a visible branded affordance lacks coverage, without making brittle assertions about incidental CSS values.

Manual visual evidence compares the same route/theme/viewport against the migration baseline for homepage, lesson, Labs index, and Lab page. Differences are recorded as restored, intentionally improved for VitePress/accessibility, or a blocking regression. The review also confirms keyboard focus, system/theme persistence, mobile directory access, reduced motion, and no root-level horizontal overflow.
