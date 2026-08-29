import { readFile } from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import MarkdownIt from "markdown-it";
import katex from "katex";
import * as vscode from "vscode";
import type { ProgramLab } from "./labIndex";

/**
 * 需要从题面中移除的小节标题。
 *
 * 67/71 个 program lab 的 README 里有 `## 题解`，内含完整 C++ 参考代码（用原生
 * <details> 折叠）。做题面板不应该带着答案，因此整段切掉；想看题解回网站看。
 */
const HIDDEN_SECTIONS = ["题解", "参考答案", "参考实现"];

/**
 * 切掉指定小节：从匹配的 `## X` 开始，到下一个同级 `##` 之前。
 *
 * 只按 h2 切分，因为题解内部用的是 h3（### 思路 等），不会被误当作结束边界。
 */
export function stripSections(markdown: string, titles = HIDDEN_SECTIONS): string {
  const lines = markdown.split(/\r?\n/);
  const kept: string[] = [];
  let skipping = false;
  let insideFence = false;

  for (const line of lines) {
    // 围栏代码块内的 ## 不是标题，必须先排除，否则会错误切分。
    if (/^\s*(```|~~~)/.test(line)) insideFence = !insideFence;

    if (!insideFence) {
      const heading = line.match(/^##\s+(.+?)\s*$/);
      if (heading) {
        const title = heading[1].replace(/[:：].*$/, "").trim();
        skipping = titles.some((hidden) => title === hidden || title.startsWith(hidden));
        if (skipping) continue;
      }
    }
    if (!skipping) kept.push(line);
  }
  return kept.join("\n").replace(/\n{3,}$/, "\n");
}

/** 渲染 $...$ 与 $$...$$。37/71 个 program lab 用到 LaTeX。 */
function renderMath(md: MarkdownIt): void {
  const renderInline = (expression: string, displayMode: boolean): string => {
    try {
      return katex.renderToString(expression, { displayMode, throwOnError: false, output: "html" });
    } catch {
      // 公式写错不该让整个题面挂掉，退化为原文。
      return `<code>${md.utils.escapeHtml(expression)}</code>`;
    }
  };

  md.inline.ruler.before("escape", "dsa_math", (state, silent) => {
    if (state.src[state.pos] !== "$") return false;

    const display = state.src.startsWith("$$", state.pos);
    const marker = display ? "$$" : "$";
    const start = state.pos + marker.length;
    const end = state.src.indexOf(marker, start);
    if (end < 0) return false;

    const content = state.src.slice(start, end);
    if (!content.trim() || (!display && /^\s|\s$/.test(content))) return false;

    if (!silent) {
      const token = state.push("html_inline", "", 0);
      token.content = renderInline(content, display);
    }
    state.pos = end + marker.length;
    return true;
  });
}

/** 把 README 里的相对图片路径改写为 webview 可加载的 URI。 */
function rewriteImages(md: MarkdownIt, lab: ProgramLab, webview: vscode.Webview): void {
  const original = md.renderer.rules.image;
  md.renderer.rules.image = (tokens, index, options, env, self) => {
    const token = tokens[index];
    const src = token.attrGet("src");
    if (src && !/^(https?:|data:)/.test(src)) {
      const absolute = path.resolve(lab.labPath, src);
      token.attrSet("src", webview.asWebviewUri(vscode.Uri.file(absolute)).toString());
    }
    return original
      ? original(tokens, index, options, env, self)
      : self.renderToken(tokens, index, options);
  };
}

export interface RenderedReadme {
  html: string;
  title: string;
}

/** 渲染 Quiz 的题干、选项和解析片段，沿用题面 Markdown、图片与 KaTeX 规则。 */
export function renderMarkdownFragment(
  source: string,
  lab: ProgramLab,
  webview: vscode.Webview,
  allowHtml = false,
): string {
  const md = new MarkdownIt({ html: allowHtml, linkify: true, breaks: false });
  renderMath(md);
  rewriteImages(md, lab, webview);
  return md.render(source);
}

/** 读取并渲染题面：去掉 frontmatter 与题解，处理图片与公式。 */
export async function renderReadme(
  lab: ProgramLab,
  webview: vscode.Webview,
): Promise<RenderedReadme> {
  let raw = "";
  try {
    raw = await readFile(path.join(lab.labPath, "README.md"), "utf8");
  } catch {
    return { html: "<p>这道题缺少 README.md。</p>", title: lab.title };
  }

  const { content } = matter(raw);
  const visibleContent = lab.type === "quiz" ? content.replace(/<QuizSet\s*\/>/g, "") : content;
  return { html: renderMarkdownFragment(stripSections(visibleContent), lab, webview, true), title: lab.title };
}
