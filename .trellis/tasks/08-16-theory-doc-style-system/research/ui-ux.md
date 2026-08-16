# UI/UX and Dependency Research

## Repository baseline

- Existing brand: paper/ink, indigo accent, orange signal, restrained 8–10px radius and shadows.
- Default-theme behavior is a hard boundary; only authoring output and CSS are extended.
- Current code blocks already use a single high-contrast dark Shiki theme in both site themes.

## ui-ux-pro-max result

The search recommended an accessible, education-oriented documentation style with full light/dark support, high contrast, visible focus, reduced motion, responsive layouts and 16px mobile body text. It also proposed remote fonts and a pink accent. The accessibility/content-first guidance is adopted; remote fonts and pink are rejected because project specs require the existing CJK-safe local stack and indigo/orange brand.

Additional UX search emphasized root-level horizontal overflow prevention, mobile-first verification, 150–300ms transitions, touch-friendly controls and independent dark-mode contrast testing. Vue guidance reinforced semantic HTML and dynamic ARIA; this implementation is static Markdown output and therefore avoids unnecessary runtime ARIA state.

## Dependency compatibility

- `@mdit/plugin-container@1.0.2`: Node `>=22`, peer `markdown-it ^14.2.0`, bundled TypeScript export.
- `@mdit/plugin-mark@1.0.1`: Node `>=22`, peer `markdown-it ^14.2.0`, bundled TypeScript export.
- Latest 2.x releases require Markdown-it 15 and are intentionally not used.

## VitePress 1.6.4 behavior

- The internal pre-wrapper removes `[filename]` before rendering every normal fenced code block.
- The native `code-group` reads `[filename]` first and renders it as a tab label.
- Therefore a small renderer wrapper is needed only for standalone code blocks; it must detect code-group membership and preserve the existing renderer.
