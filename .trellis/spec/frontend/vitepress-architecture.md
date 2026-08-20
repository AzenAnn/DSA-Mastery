# VitePress 架构与路由

## 1. Scope / Trigger

修改 VitePress 配置、内容发现、数据加载、URL、GitHub Pages base、构建输出或主题入口时适用。

## 2. Signatures

稳定版本固定为 VitePress `1.6.4`。核心边界：

```text
.vitepress/config.ts
  -> config、rewrites、themeConfig、base、outDir
.vitepress/content-index.ts
  -> 扫描与验证 Markdown，产生统一 ContentIndex
.vitepress/content.data.ts
  -> defineLoader 监听同一内容契约，向 Vue 暴露序列化数据
curriculum/**
  -> 课程总目录、Part 入口与章节概览框架（不复制正文）
.vitepress/theme/index.ts
  -> extends DefaultTheme，注册项目组件和样式
index.md / labs/index.md
  -> 仅挂载首页与 Labs 目录组件
```

路由：

```text
content/:chapter/:page.md       -> learn/:chapter/:page/index.md
content/chapter-preface/00-theory-environments.md
                                -> learn/chapter-preface/00-theory-environments/index.md
content/chapter-preface/01-lab-authoring-guide.md
                                -> learn/chapter-preface/01-lab-authoring-guide/index.md
curriculum/outline/chapter-preface.md
                                -> learn/outline/chapter-preface/index.md
labs/:chapter/:lab/README.md    -> labs/:chapter/:lab/index.md
outDir                         -> dist/pages
```

## 3. Contracts

- 仓库根目录同时是 VitePress source root；不移动 `content/**` 和 `labs/**`。
- `srcExclude` 必须排除仓库维护文档和代理数据：根 `README.md`、`CONTRIBUTING.md`、`content/README.md`、`docs/**`、`.github/**`、`.trellis/**`、`.agents/**`、`.codex/**`、`graphify-out/**`。
- `.vitepress/content-index.ts` 是结构化课程元数据、侧栏、首页统计、Labs 目录和文档头部的唯一索引；VitePress 原生搜索索引生成页，原生 prev/next 读取同一侧栏顺序，组件不得另建手写清单。
- 未拆分的课程章节使用 `autoLabChapter` 从 ContentIndex 自动收录对应物理 chapter 的全部 Lab；不得用 `labSources` 维护一个会漏掉新增 Lab 的手写子集。第 1 章把同一自动收录集合按 `labCategory` 展示为“本章 Labs”的 Theory/Exercise/Project，其他章节继续显示“相关 Labs”。只有同一物理 chapter 被编排为多个课程章节时，才使用显式 `labSources` 分流，并说明边界。
- 当课程编排编号与既有文章 `chapter` 元数据不同时，`curriculum/**` 只提供入口和框架，`.vitepress/content-index.ts` 按 `sourcePath` 把唯一的已有 `CourseDocument` 映射进目标 Part/章节。不得移动、改写或复制 `content/**` 正文来适配新编排。
- 前言是 ContentIndex 中唯一的非数字 `ChapterId`：固定为 `"preface"`，通过显式 `label: "前言"` 与 `chapterRank = -1` 排在 Ch.0 之前。它使用真实章节 outline 列出理论环境展示和完整 Lab 更新指南；完整手册通过 include 复用 `docs` 单一事实来源，不改变数字章节编号。
- Node `fs`、`path`、frontmatter 解析和文件遍历只在 config/data loader 构建期执行，不能进入浏览器 bundle。
- `base` 从 `GITHUB_PAGES_BASE_PATH` 规范化：空值为 `/`；非空值首尾各一个斜杠。
- 源码 URL 不含 base；Vue 链接使用 `withBase`。相对 `.md` 内容链接先由 validator 检查，再由 config 的 Markdown transform 按 `sourceUrlMap` 改写成 route。
- 首页 `index.md`、Labs `labs/index.md` 和 404 是站点页面；课程页仍由 rewrites 生成。
- 课程总目录使用 `/learn/`，Part 与章节框架使用 `/learn/parts/:part/`、`/learn/outline/:chapter/`；一般情况下旧 `/learn/chapter-*/.../` 和 `/labs/chapter-*/.../` URL 必须继续可访问。2026-08-18 经维护者明确批准的第 1 章 Demo 删除与 `01-04～01-23 -> 01-01～01-20` 重编号是例外，不提供旧 Lab URL 重定向。
- 静态产物只写 `dist/pages`，不提交 Git。
- 顶栏 Labs 与 Labs 目录卡片保留 `target="_self"`，规避 VitePress 1.6.4 跨 Lab 客户端导航沿用旧 outline 的兼容问题。

## 4. Validation & Error Matrix

| 条件 | 结果 |
| --- | --- |
| 一个消费者维护手写内容列表 | 架构检查失败；改用 ContentIndex |
| client bundle 含 `node:fs`/`node:path` | build 或 bundle 审计失败 |
| base 缺首尾斜杠或出现双前缀 | artifact/Playwright 失败 |
| rewrite 后旧课程 URL 不存在 | 兼容性测试失败 |
| 前言通过负数/大数模拟、遗漏任一作者指南、复制手册正文或改变数字章节 | 内容/架构检查失败 |
| repository-only Markdown 被构建 | 路由清单测试失败 |
| 相对 `.md` 没有改写到课程 route | discovery/artifact check 失败 |
| Part/章节只在组件中手写，或框架页复制已有正文 | 架构检查失败；改为 ContentIndex 编排映射 |
| Labs `_self` 兼容入口被移除 | Pages Playwright 或人工 outline 检查失败 |
| 未拆分章节新增 Lab 后未进入该章的“相关 Labs”或分类“本章 Labs” | discovery/Pages 失败；改为 ContentIndex 自动收录 |
| 自动收录章节同时维护 `labSources` 子集 | 架构检查失败；删除重复来源 |

## 5. Good / Base / Bad Cases

- Good：config 和 loader 从同一收集器取得已排序条目；默认主题负责搜索与文档外壳，Vue 只消费序列化结果。
- Good：前言定义使用 `/learn/outline/chapter-preface/`，并在 `lessonSources` 中显式列出理论展示和 Lab 更新指南两篇站内文章。
- Base：本地开发没有环境变量，base 为 `/`。
- Bad：组件调用 `import.meta.glob` 再建一份索引，或把 `/DSA-Mastery/` 拼进每个 URL。
- Good：Ch.1 声明 `autoLabChapter: 1`，新增 `labs/chapter-01/lab-*` 后自动进入侧栏。
- Bad：Ch.1 的 `labSources` 只列出 01-01～01-03，导致实际存在的 01-04～01-08 消失。

## 6. Tests Required

- `pnpm run validate` 覆盖内容、类型与 lint。
- `pnpm run test:discovery` 用临时教材/Lab 验证相对链接改写、MathJax、代码、表格、任务列表、导航、搜索和安全清理。
- `pnpm run test:discovery` 还必须在启用 `autoLabChapter` 的现有章节创建临时 Lab，并从最终 HTML 的章节侧栏确认它自动出现，最后精确清理 fixture。
- 第 1 章 fixture 若为 README-only，必须显式声明 `labCategory`，并证明它进入对应分类；产物与浏览器测试还要断言 5 个 Theory、15 个 Exercise、1 个 Project，以及 Project 分组的原生折叠行为。
- `pnpm run build && pnpm run check:site` 核对 ContentIndex 返回的全部教材/Lab、首页、Labs 索引、404、链接与恰好一个 base。
- 前言产物检查使用 POSIX 化后的相对路径筛选；断言两篇文章、章节 outline、站内搜索和侧栏入口全部存在。Windows 的 `path.join()` 会产生反斜杠，不能直接与 `learn/chapter-preface/` 比较。
- 在 `/DSA-Mastery/` 下运行 `pnpm run test:pages`，真实点击五组场景并监控网络/控制台错误。
- 编排变更必须断言每个 Part 的子章节、框架页面、至少一个映射后的旧文章 URL 和旧 Lab URL；同时用 `git diff -- content labs` 证明受保护内容未改动。

## 7. Wrong vs Correct

### Wrong

```ts
const url = '/DSA-Mastery/learn/' + slug
const lessons = import.meta.glob('../content/**/*.md')
```

### Correct

```ts
const url = `/learn/${chapterSlug}/${pageSlug}/`
// Node-only content-index.ts 在构建期产生 lessons；组件只接收数据。
```

未拆分章节的正确 Lab 映射：

```ts
{ number: '1', title: '线性表', autoLabChapter: 1 }
```

特殊前言的正确映射：

```ts
{
  number: 'preface',
  label: '前言',
  url: '/learn/outline/chapter-preface/',
  lessonSources: [
    'content/chapter-preface/00-theory-environments.md',
    'content/chapter-preface/01-lab-authoring-guide.md',
  ],
}
```
