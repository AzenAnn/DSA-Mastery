# Quality Check · 前言理论语法展示页

日期：2026-08-16  
结论：通过，AC1–AC5 均有实现与自动化证据。

## 审计范围

- 内容合同与路由：特殊 `ChapterId`、唯一前言路径、排序与标签。
- 数据到界面：ContentIndex → curriculum/sidebar/home → DocumentHeader。
- 展示内容：正文、11 种理论容器、原生 callout、行内语义与代码工作台。
- 质量门禁：内容校验、类型、lint、自动发现、生产构建、静态产物与浏览器回归。
- 人工视觉：应用内浏览器实际打开本地开发页，检查页首、作者指南卡片和代码工作台。

## Pass Evidence

1. **PASS · 唯一章节合同**：validator 仅允许 `content/chapter-preface/00-theory-environments.md` 使用 `chapter: "preface"`、`order: 0`、`chapterTitle: "理论环境展示"`。
2. **PASS · 排序与导航**：静态产物和 Playwright 均断言“前言”位于 Ch.0 之前；侧栏、面包屑和 eyebrow 使用显式标签，无“第 preface 章”泄露。
3. **PASS · 展示覆盖**：产物审计逐项确认 definition、theorem、lemma、corollary、property、proof、intuition、example、counterexample、complexity、pitfall 全部完成渲染，且没有原始 `:::` 标记残留。
4. **PASS · 作者入口**：页面两处显示 `docs/THEORY_DOC_STYLE_GUIDE.md`，链接指向 GitHub `main` 分支上的实际指南；浏览器验收确认可见 href。
5. **PASS · 代码工作台**：文件名、行号、focus、diff add/remove、warning/error、复制按钮和双标签 code-group 均由产物或 Playwright 验证。
6. **PASS · 响应式与可访问性**：1440px 与 390px 均无根页面横向溢出；语义标题、链接、kbd/dfn/mark 可通过 DOM 读取。
7. **PASS · 根路径门禁**：`pnpm test` 通过；产物共 33 篇教材、23 个 Lab、24 个课程框架页、85 个 HTML。
8. **PASS · Pages base 门禁**：`GITHUB_PAGES_BASE_PATH=/DSA-Mastery` 下 build、artifact check 与 14 项 Playwright 全通过，无双 base 或丢路由。
9. **PASS · 自动发现回归**：临时教材与 Lab 进入构建、导航、搜索及相关 Labs 后被安全清理。
10. **PASS · 规格同步**：frontmatter/routing、components/data、VitePress architecture 与 `content/README.md` 已记录特殊章节和外部 `.md` 链接校验规则。

## Commands

```powershell
pnpm run validate
pnpm run test:discovery
pnpm test
$env:GITHUB_PAGES_BASE_PATH='/DSA-Mastery'
$env:SITE_URL='https://azenann.github.io/DSA-Mastery/'
pnpm run build
pnpm run check:site
pnpm run test:pages
git diff --check
```

## Issues Found and Closed

- Windows `path.join()` 使用反斜杠，导致前言产物筛选首轮为 0；筛选前统一为 POSIX 相对路径，并由 discovery 与正式 build 回归覆盖。
- 通用 lesson source 匹配会改变第 0 章既有面包屑落点；章节落地页特例收敛为仅处理 `chapter === "preface"`，原 learner journey 回归恢复通过。
- 外部 GitHub `.md` 链接曾被当作相对文件；validator 先排除 URL scheme 与根路径，再检查相对 Markdown 目标。

## Non-blocking Note

Vite 构建仍报告既有的“大于 500 kB chunk”性能提示；本任务未新增运行时依赖或客户端内容扫描，不影响本次功能与验收。
