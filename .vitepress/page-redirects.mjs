/**
 * 章节/实验重命名、拆分产生的旧 URL → 新 URL 映射。
 *
 * 这些旧 URL 曾作为公开页面存在（main 分支），结构重组后被删除。站点部署在
 * GitHub Pages（纯静态、无服务端重定向），因此由 .vitepress/config.ts 的
 * buildEnd 钩子消费本文件，在 dist/pages 中为每个旧 URL 生成一个静态兼容页
 * （meta refresh + JS 跳转 + 链接列表）。scripts/check-built-site.mjs 复用
 * 同一份数据，在 CI 中验证兼容页确实生成、目标确实可达。
 *
 * 注意：路径一律不含站点 base 前缀（如 /DSA-Mastery），生成与检查时统一拼接。
 */

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

export const pageRedirects = [
  {
    from: "/learn/chapter-06-graph-foundations/00-overview/",
    to: "/learn/chapter-06-graph-foundations/01-graph-basics/",
  },
  {
    from: "/learn/chapter-06-graph-foundations/01-representation/",
    to: "/learn/chapter-06-graph-foundations/02-graph-storage/",
  },
  {
    from: "/learn/chapter-07-graph-traversal/02-minimum-spanning-tree-and-shortest-path/",
    to: "/learn/chapter-07-graph-traversal/02-minimum-spanning-tree/",
    also: ["/learn/chapter-07-graph-traversal/03-shortest-path/"],
    note: "原「最小生成树与最短路径」已拆分为两节。",
  },
  {
    from: "/learn/chapter-07-graph-applications/03-astar-visualization/",
    to: "/learn/chapter-07-graph-applications/04-astar-visualization/",
  },
  {
    from: "/labs/chapter-07/lab-07-01-bfs-traversal/",
    to: "/labs/chapter-07/lab-07-04-bfs-traversal/",
  },
  {
    from: "/labs/chapter-07/lab-07-02-bfs-maze/",
    to: "/labs/chapter-07/lab-07-05-bfs-maze/",
  },
  {
    from: "/labs/chapter-07/lab-07-03-dijkstra-path/",
    to: "/labs/chapter-07/lab-07-06-dijkstra-path/",
  },
];

const escapeHtml = (value) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

export function redirectPageHtml(to, { base = "/", also = [], note = "" } = {}) {
  const withBase = (route) => `${base}${route.replace(/^\//, "")}`;
  const targets = [...new Set([to, ...(also ?? [])].map(withBase))];
  const primary = targets[0];
  const links = targets
    .map((href) => `    <li><a href="${escapeHtml(href)}">${escapeHtml(href)}</a></li>`)
    .join("\n");
  const bodyNote = note ? `（${escapeHtml(note)}）` : "";
  return [
    "<!DOCTYPE html>",
    '<html lang="zh-CN">',
    "<head>",
    '  <meta charset="utf-8">',
    "  <title>页面已移动 · DSA Mastery</title>",
    '  <meta name="robots" content="noindex, follow">',
    `  <meta http-equiv="refresh" content="0; url=${escapeHtml(primary)}">`,
    `  <link rel="canonical" href="${escapeHtml(primary)}">`,
    `  <script>location.replace(${JSON.stringify(primary)});</script>`,
    "</head>",
    "<body>",
    `  <p>此页面已移动${bodyNote}，正在跳转到 <a href="${escapeHtml(primary)}">新地址</a>……</p>`,
    "  <ul>",
    links,
    "  </ul>",
    "</body>",
    "</html>",
    "",
  ].join("\n");
}

export async function emitRedirectPages(outDir, { base = "/" } = {}) {
  await Promise.all(
    pageRedirects.map(async (rule) => {
      const targetDir = path.join(outDir, rule.from);
      await mkdir(targetDir, { recursive: true });
      await writeFile(
        path.join(targetDir, "index.html"),
        redirectPageHtml(rule.to, { base, also: rule.also, note: rule.note }),
        "utf8",
      );
    }),
  );
}
