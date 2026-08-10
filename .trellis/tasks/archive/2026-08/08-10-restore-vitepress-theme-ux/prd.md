# Restore VitePress Theme and UX

## Goal

Restore DSA Mastery's distinctive, high-quality course-reading experience after the VitePress migration, without regressing the native navigation, search, routing, content discovery, or GitHub Pages behavior that the migration established.

The reader should again encounter a deliberate academic-editorial interface: a paper-and-ink reading surface, indigo actions, orange signals, a code-oriented learning visual, and an unhurried learning path that works equally well on desktop and mobile.

## Background

- Commit `92a9f76` migrated the site from the removed Next.js `app/` and `components/` implementation to VitePress.
- The visual reference is `docs/assets/migration-baseline/`; the present VitePress result is recorded in `docs/assets/migration-after/`.
- The migrated theme already extends VitePress rather than replacing it. Its custom surface is `.vitepress/theme/custom.css`, `Layout.vue`, and the components in `.vitepress/theme/components/`.
- Existing frontend specifications require the migration baseline to guide visual work and prohibit restoring the deleted React application as a parallel implementation.

## Requirements

### R1. Restore the visual identity

- Preserve the paper/ink foundation, indigo primary action, orange signal, Chinese-capable serif display hierarchy, sans-serif reading text, and monospaced metadata/code contexts shown in the visual baseline.
- Restore a coherent visual hierarchy across the navigation shell, homepage, lessons, Labs index, and Lab documents; no page may fall back to the stock VitePress blue-and-white appearance.
- Keep the code-window learning visual and content-derived cards as the primary visual evidence. Do not introduce decorative gradients, orb-like effects, or unrelated stock imagery.

### R2. Make the theme systematic

- Theme colors, typography, spacing, radii, shadows, focus treatment, and motion must be expressed through semantic theme tokens, with matching light and dark values.
- Home, document, and Labs components must use the shared visual system rather than page-local one-off styling.
- The implementation must preserve content as the source of truth: cards, statistics, document metadata, sidebar entries, search results, and prev/next remain derived from the existing course index or VitePress.

### R3. Recover the key reading and discovery experiences

- The homepage must retain a clear learning promise, two discernible entry actions, proof points, course statistics, learning loop, chapter cards, Lab preview, update panel, and closing statement.
- Lesson and Lab pages must make current location, title, summary, status, metadata, readable body text, code, tables, math, and next actions easy to scan.
- The default VitePress top navigation, local search, appearance switch, desktop sidebar, mobile drawer, outline, document footer, code-copy controls, and 404 page remain available and visibly integrated with the brand.
- The desktop course sidebar must follow the pre-migration hierarchy: one neutral divider for nested item groups, a quiet chapter heading, and a single active-item surface; it must not render a colored indicator on every item.
- The right-side outline must use a readable 12px class, approximately 1.8 line-height, visible section spacing, and a stable sticky column so headings are scannable rather than compressed into a dense list.
- The homepage and lesson top bars must share the same horizontal content rail; the two-row brand subtitle stays contained and the appearance icon remains centered in its touch target.

### R4. Responsive, accessible interaction

- Verify the established 1180px, 980px, and 720px layout transitions, plus 375px, 768px, 1024px, and 1440px review widths. The root page must not horizontally overflow.
- Light and dark modes must keep normal-size text and interactive controls legible, preserve visible keyboard focus, and not convey status through color alone.
- Hover and focus states must be evident; motion is limited to short, functional opacity/transform transitions and is disabled by `prefers-reduced-motion`.
- A closed mobile course drawer must not expose its links to pointer or keyboard focus, while the native open and Escape-close behavior remains intact.

### R5. Preserve migration behavior

- Do not change the public course URLs, Pages base handling, VitePress content discovery, Markdown-link rewriting, or the Labs `target="_self"` compatibility behavior.
- Do not recreate the removed React/Next.js application, duplicate VitePress search or navigation, add remote font dependencies, or change Markdown/content contracts.

## Out of Scope

- New lesson content, Labs, data schemas, routes, analytics, authentication, or interactive algorithm playgrounds.
- A generic design-system package, a second routing/layout framework, a custom replacement for VitePress local search, or a visual rewrite unrelated to the established course identity.
- Pixel-for-pixel restoration of the old DOM. The visual baseline is a design reference; VitePress-native behavior and accessible responsive layout take precedence.

## Acceptance Criteria

- [x] The homepage, lesson page, Labs index, and Lab page exhibit the required academic-editorial identity in both light and dark mode, with no unintentional stock VitePress styling in their primary surfaces.
- [x] The homepage contains every experience listed in R3 and its cards/statistics still derive from the course index.
- [x] A lesson or Lab page presents branded metadata and a readable three-column desktop reading experience; at mobile widths, the VitePress course drawer is reachable and content remains unobscured.
- [x] At 375px, 768px, 1024px, and 1440px, no root-level horizontal scroll, clipped text, overlapping controls, or hidden primary action is present.
- [x] Keyboard users can visibly focus navigation, search, theme switch, mobile directory, document links, and code-copy controls. Reduced-motion mode suppresses nonessential animation.
- [x] Existing Pages-base navigation, Chinese search, theme persistence, code copy, Markdown tables/task lists, Labs navigation, and branded 404 Playwright coverage remain green.
- [x] `npm run validate`, `npm run build`, `npm run check:site`, and `npm run test:pages` pass; the implementation records before/after screenshot evidence at the defined viewports and classifies intentional differences.

## Execution Status

Planning was approved and implementation, visual review, and quality gates are complete for this session. The task remains active for the owner's review and must not be archived as part of this work.
