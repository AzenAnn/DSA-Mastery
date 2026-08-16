import { container } from "@mdit/plugin-container";
import { mark } from "@mdit/plugin-mark";
import type MarkdownIt from "markdown-it";

export const theoryContainers = [
  { name: "definition", label: "定义", code: "DEF" },
  { name: "theorem", label: "定理", code: "THM" },
  { name: "lemma", label: "引理", code: "LEM" },
  { name: "corollary", label: "推论", code: "COR" },
  { name: "property", label: "性质", code: "PROP" },
  { name: "proof", label: "证明", code: "PROOF" },
  { name: "intuition", label: "直觉", code: "IDEA" },
  { name: "example", label: "示例", code: "EX" },
  { name: "counterexample", label: "反例", code: "ANTI" },
  { name: "complexity", label: "复杂度", code: "O(·)" },
  { name: "pitfall", label: "易错点", code: "WARN" },
] as const;

type MarkdownToken = Parameters<NonNullable<MarkdownIt["renderer"]["rules"]["fence"]>>[0][number];

const codeGroupMetaKey = "dsaInsideCodeGroup";

function containerTitle(token: MarkdownToken, name: string, fallback: string): string {
  const rawTitle = token.info.trim().slice(name.length).trim();
  return rawTitle || fallback;
}

function extractFenceTitle(info: string): string | undefined {
  const match = info.match(/\[([^\r\n]*)\]/);
  const title = match?.[1]?.trim();
  return title || undefined;
}

function markCodeGroupFences(md: MarkdownIt): void {
  md.core.ruler.after("block", "dsa-code-group-fences", (state) => {
    let codeGroupDepth = 0;

    for (const token of state.tokens) {
      if (token.type === "container_code-group_open") {
        codeGroupDepth += 1;
        continue;
      }
      if (token.type === "container_code-group_close") {
        codeGroupDepth = Math.max(0, codeGroupDepth - 1);
        continue;
      }
      if (token.type === "fence" && codeGroupDepth > 0) {
        token.meta = { ...token.meta, [codeGroupMetaKey]: true };
      }
    }
  });
}

function addStandaloneCodeTitles(md: MarkdownIt): void {
  const renderFence = md.renderer.rules.fence;
  if (!renderFence) throw new Error("VitePress fence renderer is unavailable");

  md.renderer.rules.fence = (tokens, index, options, env, self) => {
    const token = tokens[index];
    const title = extractFenceTitle(token.info);
    const insideCodeGroup = Boolean(token.meta?.[codeGroupMetaKey]);
    const rendered = renderFence(tokens, index, options, env, self);

    if (!title || insideCodeGroup) return rendered;

    const escapedTitle = md.utils.escapeHtml(title);
    const titledWrapper = rendered.replace(
      /^(<div class="[^"]+)/,
      "$1 dsa-code-block--titled",
    );
    return titledWrapper.replace(
      /(<span class="lang">[^<]*<\/span>)/,
      `$1<span class="dsa-code-title" title="${escapedTitle}">${escapedTitle}</span>`,
    );
  };
}

export function installTheoryMarkdown(md: MarkdownIt): void {
  md.use(mark);

  for (const definition of theoryContainers) {
    md.use(container, {
      name: definition.name,
      openRender(tokens, index) {
        const token = tokens[index];
        const title = md.utils.escapeHtml(
          containerTitle(token, definition.name, definition.label),
        );
        const attrs = md.renderer.renderAttrs(token);
        return `<div class="dsa-theory-block dsa-theory-block--${definition.name}" data-theory-kind="${definition.name}"${attrs}>\n<p class="dsa-theory-block__title"><span class="dsa-theory-block__code" aria-hidden="true">${definition.code}</span><span>${title}</span></p>\n`;
      },
      closeRender() {
        return "</div>\n";
      },
    });
  }

  markCodeGroupFences(md);
  addStandaloneCodeTitles(md);
}
