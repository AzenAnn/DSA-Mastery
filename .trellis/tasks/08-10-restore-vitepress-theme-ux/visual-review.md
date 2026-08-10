# Visual Review Evidence

## Review Matrix

Date: 2026-08-10

Routes reviewed:

- `/` (homepage)
- `/learn/chapter-00-introduction/02-complexity-basics/` (lesson)
- `/labs/` (Labs index)
- `/labs/chapter-01/lab-01-02-linked-list/` (Lab document)

Each route was rendered at `1440`, `1024`, `768`, and `375` CSS pixels in both light and dark mode through the local VitePress server. The same route families and viewport intent are represented by the committed references in [migration-baseline](../../../docs/assets/migration-baseline/) and [migration-after](../../../docs/assets/migration-after/).

## Evidence

| Check | Result | Evidence |
| --- | --- | --- |
| Root horizontal overflow | Pass: `0px` at every reviewed route, theme, and width | `document.documentElement.scrollWidth - innerWidth` browser measurement |
| Homepage hierarchy | Pass: hero actions, proof points, four stats, learning loop, chapter cards, Lab preview, update panel, and closing statement remain visible | `HomePage.vue` data-derived sections plus light/dark browser review |
| Desktop reading layout | Pass at `1440px` and `1024px`: sidebar, document content, and outline remain readable | `DocumentHeader.vue`, native VitePress sidebar/outline, lesson/Lab screenshots |
| Mobile reading layout | Pass at `768px` and `375px`: outline is hidden, local course-directory control is visible, content stays within the viewport | `.VPLocalNav .menu` visibility and root overflow measurement |
| Navbar brand lockup | Pass: subtitle remains inside the title box with no clipped scroll width | `.VPNavBarTitle .title` and `.course-brand-subtitle` bounding-box measurement |
| Appearance control | Pass: native switch remains keyboard/ARIA-compatible and icon center delta is `0px` in navbar and extra menu | `.VPSwitchAppearance` geometry at `1440px` and `1024px` |
| Sidebar/outline hierarchy | Pass: indicators are transparent; nested groups use a single neutral border; outline links are `12px` with `21.6px` line height | Responsive Playwright regression in `tests/pages-navigation.spec.mjs` |
| Reduced motion | Pass: `prefers-reduced-motion: reduce` changes scroll behavior to `auto` and transition duration to the minimal value | Browser emulation check |

## Difference Classification

- **Restored:** old `.brand` two-row lockup, centered `.icon-button` behavior, neutral nested sidebar divider, active sidebar surface, and readable table-of-contents spacing.
- **Intentional VitePress/accessibility improvement:** native VitePress navigation, search, appearance switch, mobile drawer, outline, and code-copy behavior remain the source of interaction semantics; touch targets are at least `44px`.
- **Intentional visual cleanup:** semantic tokens replace scattered theme values, body text wraps instead of truncating, and decorative gradients/circles are omitted to preserve reading contrast and reduce motion.
- **Regression:** none observed in this matrix. Pages-base click/search coverage remains green.

To reproduce the Pages-base browser evidence after a clean build:

```bash
GITHUB_PAGES_BASE_PATH=/DSA-Mastery npm run build
GITHUB_PAGES_BASE_PATH=/DSA-Mastery npm run check:site
GITHUB_PAGES_BASE_PATH=/DSA-Mastery npm run test:pages
```
