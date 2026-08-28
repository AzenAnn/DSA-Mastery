import path from "node:path";
import { tasklist } from "@mdit/plugin-tasklist";
import { Blocks, BookOpen, FlaskConical } from "@lucide/vue";
import type MarkdownIt from "markdown-it";
import { defineConfig } from "vitepress";
import { createBuildTimeDiagramsPlugin } from "vitepress-plugin-diagrams";
import { h } from "vue";
import { renderToString } from "vue/server-renderer";
import {
  collectCourseIndex,
  createCourseSidebar,
  normalizePagesBase,
  sourceUrlMap,
} from "./content-index";
import { installTheoryMarkdown } from "./markdown/theory";

const course = collectCourseIndex();
const sidebarIconProps = { size: 16, strokeWidth: 2, "aria-hidden": true, focusable: "false" };
const sidebar = createCourseSidebar(course, {
  theory: await renderToString(h(BookOpen, sidebarIconProps)),
  exercise: await renderToString(h(FlaskConical, sidebarIconProps)),
  project: await renderToString(h(Blocks, sidebarIconProps)),
});
const sourceRoutes = sourceUrlMap(course);
const virtualSources = new Map(
  [...course.lessons, ...course.labs].map((document) => [
    `${document.url.replace(/^\//, "")}index.md`,
    document.sourcePath,
  ]),
);
const base = normalizePagesBase();
const { configureMarkdown: configureDiagramsMarkdown, vitePlugin: createDiagramsVitePlugin } =
  createBuildTimeDiagramsPlugin({
    diagramsDir: "public/diagrams",
    publicPath: `${base}diagrams`,
    diagramsDistDir: "diagrams",
    krokiServerUrl: process.env.KROKI_SERVER_URL ?? "https://kroki.io",
    enableFileImports: false,
  });
const absoluteSiteUrl = process.env.SITE_URL ?? `https://azenann.github.io${base}`;
const withBase = (asset: string) => `${base}${asset.replace(/^\//, "")}`;
const courseDescription =
  "从概念、ADT 与复杂度推导，到动手实现、边界测试与典型问题训练，帮助课程学习者扎实掌握数据结构与算法。";

function routeForSource(relativePath: string): string | undefined {
  const normalized = relativePath.replaceAll("\\", "/");
  if (normalized === "index.md") return "/";
  if (normalized === "labs/index.md") return "/labs/";
  if (normalized === "curriculum/index.md") return "/learn/";
  const partMatch = normalized.match(/^curriculum\/parts\/([a-z0-9-]+)\.md$/);
  if (partMatch) return `/learn/parts/${partMatch[1]}/`;
  const outlineMatch = normalized.match(/^curriculum\/outline\/([a-z0-9-]+)\.md$/);
  if (outlineMatch) return `/learn/outline/${outlineMatch[1]}/`;
  return sourceRoutes.get(virtualSources.get(normalized) ?? normalized);
}

function isCourseSource(relativePath: unknown): relativePath is string {
  return (
    typeof relativePath === "string" &&
    (relativePath.startsWith("content/chapter-") || relativePath.startsWith("labs/chapter-"))
  );
}

export default defineConfig({
  lang: "zh-CN",
  title: "DSA Mastery",
  titleTemplate: ":title · DSA Mastery",
  description: courseDescription,
  base,
  srcDir: ".",
  outDir: "dist/pages",
  cleanUrls: false,
  appearance: true,
  lastUpdated: false,
  rewrites: {
    "content/:chapter/:page.md": "learn/:chapter/:page/index.md",
    "labs/:chapter/:lab/README.md": "labs/:chapter/:lab/index.md",
    "curriculum/index.md": "learn/index.md",
    "curriculum/parts/:part.md": "learn/parts/:part/index.md",
    "curriculum/outline/:chapter.md": "learn/outline/:chapter/index.md",
  },
  srcExclude: [
    "README.md",
    "CONTRIBUTING.md",
    "AGENTS.md",
    "CLAUDE.md",
    "CLAUDE.local.md",
    "content/README.md",
    "docs/**",
    "tools/**",
    ".github/**",
    ".trellis/**",
    ".agents/**",
    ".codex/**",
    "graphify-out/**",
    "node_modules/**",
    "playwright-report/**",
    "test-results/**",
  ],
  sitemap: { hostname: absoluteSiteUrl },
  transformHead({ pageData }) {
    const route = routeForSource(pageData.relativePath);
    const pageTitle = pageData.title
      ? `${pageData.title} · DSA Mastery`
      : "DSA Mastery · 数据结构与算法理论与实验教程";
    const pageDescription = pageData.description || courseDescription;
    const socialHead: [string, Record<string, string>][] = [
      ["meta", { property: "og:title", content: pageTitle }],
      ["meta", { property: "og:description", content: pageDescription }],
    ];

    if (!route) return socialHead;
    const canonical = new URL(withBase(route), absoluteSiteUrl).toString();
    return [
      ["link", { rel: "canonical", href: canonical }],
      ["meta", { property: "og:url", content: canonical }],
      ...socialHead,
    ];
  },
  vite: {
    // Keep `.vitepress/config.ts` as the sole Vite configuration boundary.
    configFile: false,
    plugins: [createDiagramsVitePlugin()],
  },
  head: [
    ["link", { rel: "icon", type: "image/svg+xml", href: withBase("favicon.svg") }],
    ["meta", { name: "theme-color", content: "#f7f6f2" }],
    ["meta", { property: "og:type", content: "website" }],
    ["meta", { property: "og:image", content: new URL(withBase("og.png"), absoluteSiteUrl).toString() }],
    ["meta", { name: "twitter:card", content: "summary_large_image" }],
  ],
  markdown: {
    math: true,
    lineNumbers: false,
    image: { lazyLoading: true },
    // Course code blocks intentionally keep a dark surface in both site themes.
    // Use one high-contrast dark Shiki palette so light-mode tokens never become
    // dark text on the dark code surface.
    theme: "github-dark-high-contrast",
    // 样例输入/输出用 log 语法:shiki 内置,对纯文本不产生高亮 token
    languageAlias: { input: "log", output: "log" },
    config(md) {
      // VitePress exposes its own MarkdownIt structural type, while the stable
      // plugin publishes the equivalent @types/markdown-it signature.
      tasklist(md as unknown as Parameters<typeof tasklist>[0]);
      installTheoryMarkdown(md as unknown as MarkdownIt);
      configureDiagramsMarkdown(md);
      md.core.ruler.after("block", "dsa-course-source-transform", (state) => {
        const renderedPath =
          typeof state.env?.relativePath === "string"
            ? state.env.relativePath.replaceAll("\\", "/")
            : "";
        const relativePath = isCourseSource(renderedPath)
          ? renderedPath
          : virtualSources.get(renderedPath);
        if (!relativePath) return;

        if (state.env?.dsaSearchIndex !== true) {
          const firstH1 = state.tokens.findIndex(
            (token) => token.type === "heading_open" && token.tag === "h1",
          );
          if (
            firstH1 >= 0 &&
            state.tokens[firstH1 + 1]?.type === "inline" &&
            state.tokens[firstH1 + 2]?.type === "heading_close"
          ) {
            state.tokens.splice(firstH1, 3);
          }
        }

        for (const token of state.tokens) {
          if (token.type !== "inline" || !token.content.includes(".md")) continue;
          token.content = token.content.replace(
            /\]\(((?:\.\.\/|\.\/)[^)#\s]+\.md)(#[^)\s]+)?\)/g,
            (match, relativeTarget: string, hash = "") => {
              const sourceTarget = path.posix.normalize(
                path.posix.join(path.posix.dirname(relativePath), relativeTarget),
              );
              const route = sourceRoutes.get(sourceTarget);
              return route ? `](${route}${hash})` : match;
            },
          );
        }
      });
    },
  },
  themeConfig: {
    siteTitle: "DSA Mastery",
    nav: [
      { text: "教材", link: course.curriculum.url },
      { text: "Labs", link: "/labs/", target: "_self" },
    ],
    socialLinks: [
      { icon: "github", link: "https://github.com/AzenAnn/DSA-Mastery", ariaLabel: "GitHub 仓库" },
    ],
    sidebar: {
      "/learn/": sidebar,
      "/labs/": sidebar,
    },
    search: {
      provider: "local",
      options: {
        _render(source, environment, markdown) {
          return markdown.render(source, { ...environment, dsaSearchIndex: true });
        },
        translations: {
          button: { buttonText: "搜索教材与实验", buttonAriaLabel: "搜索教材与实验" },
          modal: {
            displayDetails: "显示详细列表",
            resetButtonTitle: "清除查询条件",
            backButtonTitle: "关闭搜索",
            noResultsText: "没有找到相关内容",
            footer: {
              selectText: "选择",
              navigateText: "切换",
              closeText: "关闭",
            },
          },
        },
      },
    },
    outline: { level: [2, 3], label: "本页目录" },
    docFooter: { prev: "上一篇", next: "下一篇" },
    editLink: {
      pattern: "https://github.com/AzenAnn/DSA-Mastery/edit/main/:path",
      text: "在 GitHub 上编辑此页",
    },
    darkModeSwitchLabel: "外观",
    lightModeSwitchTitle: "切换到明亮模式",
    darkModeSwitchTitle: "切换到暗色模式",
    sidebarMenuLabel: "课程目录",
    returnToTopLabel: "返回顶部",
    externalLinkIcon: true,
  },
});
