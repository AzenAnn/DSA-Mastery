# Technical Design

## Architecture

```text
Markdown author syntax
  -> .vitepress/markdown/theory.ts (build-time Markdown-it extensions)
  -> VitePress/Shiki native renderer
  -> stable dsa-theory / dsa-code classes
  -> .vitepress/theme/custom.css tokens and component styles
  -> dist/pages
  -> discovery + artifact + Pages Playwright checks
```

No Vue runtime component is required: the feature is static authoring syntax and CSS, so build-time rendering preserves SSR, local search and default-theme behavior.

## Markdown Extension Boundary

Create `.vitepress/markdown/theory.ts` with one public installer used by `.vitepress/config.ts`.

- Use `@mdit/plugin-container@1.0.2`, whose peer contract supports Markdown-it `^14.2.0`, for the eleven domain containers.
- Use `@mdit/plugin-mark@1.0.1`, whose peer contract supports Markdown-it `^14.2.0`, for `==...==`.
- Both packages are direct devDependencies with bundled TypeScript declarations; update `pnpm-lock.yaml`.
- Container metadata is a single typed constant containing name, Chinese default title and short visual code. This is the only list used by registration and tests.
- The opening renderer captures the trimmed custom title, falls back to the default, and passes it through `md.utils.escapeHtml`. It emits a stable wrapper, visible short code, visible Chinese/custom title and body slot. Closing renderer emits the matching closing tag.
- Do not render inline Markdown inside container titles: plain escaped text prevents title HTML/link injection and keeps the contract deterministic.
- A core rule marks fenced-code tokens that live inside `code-group`, so the filename enhancer does not duplicate native tab labels.
- A fence renderer wrapper captures `[filename]` before VitePress strips it, calls the existing renderer, then injects only an escaped `.dsa-code-title` into standalone code wrappers. Shiki output, copy button and code-group activation remain native.

## Output Contract

Theory container:

```html
<div class="dsa-theory-block dsa-theory-block--definition" data-theory-kind="definition">
  <p class="dsa-theory-block__title">
    <span class="dsa-theory-block__code" aria-hidden="true">DEF</span>
    <span>定义</span>
  </p>
  <!-- Markdown body -->
</div>
```

Standalone fenced code with title:

```html
<div class="language-cpp dsa-code-block--titled">
  <button class="copy">...</button>
  <span class="lang">cpp</span>
  <span class="dsa-code-title">student-list-interface.cpp</span>
  <pre>...</pre>
</div>
```

The exact placement may follow the installed renderer, but class names, escaping and non-duplication are stable contracts.

## Token Strategy

Extend the existing root block without replacing its brand primitives:

1. Existing primitives: paper, ink, line, accent, signal, success, code surfaces, radius, motion.
2. Semantic aliases: definition/theorem/property/proof/example/counterexample/complexity/pitfall/highlight foreground, border and surface.
3. Component aliases: theory block accent/surface/border/title/code and code-toolbar/tab/annotation tokens.

Component selectors reference only semantic/component tokens. New surfaces use `color-mix()` from existing primitives; no new component-level hex values. Dark mode overrides semantic values only when the base aliases are insufficient.

## Visual Semantics

- Definition/intuition: indigo family, solid left rail.
- Theorem/lemma/corollary: ink + indigo, double/strong top rule and serif title.
- Property/complexity: success family with distinct short codes and border pattern.
- Proof: neutral paper, dashed boundary, optional decorative QED square.
- Example: neutral/accent card.
- Counterexample/pitfall: signal family with explicit labels and warning rail.
- Native callouts: same paper/ink system, keeping their VitePress classes and details semantics.
- Code: fixed dark workbench; filename centered/left after language, copy action remains right; annotation classes gain inset rail/symbol treatment.

## Inline Syntax

- `@mdit/plugin-mark` creates semantic `<mark>` only in normal inline Markdown tokens; code spans/fences are already separate tokens and MathJax parsing must be verified by fixture.
- Semantic text colors use explicit, finite HTML classes documented for authors. There is no user-provided color value and no runtime parser.
- `kbd` and `dfn` use native elements, with CSS scoped to course documents.

## Compatibility and Failure Modes

| Risk | Prevention / rollback |
| --- | --- |
| Plugin incompatible with Markdown-it 14 | Pin versions with declared `^14.2.0` peers; frozen install + typecheck |
| Container title injects HTML | Plain `escapeHtml`; regression fixture with `<img onerror>` text |
| Mark breaks math/code | Fixture asserts `$a == b$`, inline code and fenced code remain literal |
| Filename duplicates code-group tab | Mark tokens inside code-group and skip enhancer there |
| Fence wrapper breaks copy/Shiki | Wrap existing renderer output; never replace code/pre generation |
| Search loses content | Use static HTML containers and assert a unique phrase in search bundle/Playwright |
| Mobile overflow | `min-width: 0`, wrapping title, internal code/tab scrolling, 390px browser assertion |
| Theme regression | semantic tokens, light/dark Playwright metrics and visual screenshots |

Rollback is isolated: remove installer imports/dependencies, CSS section and two syntax migrations; no content paths, routes or data index change.
