# VitePress Agent 开发规范

## 1. Scope / Trigger

开始、审查或调试任何 VitePress 配置、Markdown 入口、内容索引、主题组件、样式、路由、构建脚本、Pages workflow 或相关测试时适用。先读本文件，再按改动层读取 `vitepress-architecture.md`、`components-and-data.md`、`visual-responsive.md`、内容规范和质量规范。

## 2. Pre-Development Checklist

1. 运行 `git status --short`，识别并保留已有改动；确认当前 Trellis task、目标层和验收标准。
2. 先找单一数据源和 VitePress 原生能力，再决定是否需要新组件、helper 或配置。
3. 明确改动从 Markdown/配置到最终 Pages 浏览器的完整链路、失败表现和最小验证集合。
4. 不把 `dist/pages`、缓存、截图或临时 fixture 当作源码修改；生成物只用于检查。
5. Node 版本遵循 `package.json#engines`，包管理器遵循 `package.json#packageManager`，安装使用 `pnpm install --frozen-lockfile`。
6. `.vitepress/`、脚本或测试直接导入的包必须在 `package.json` 中直接声明；JavaScript 包没有内置 TypeScript 声明时，同时直接声明对应的 `@types/*`，不得依赖传递依赖或本机残留链接提供类型。

## 3. Ownership and Data Flow

| 层 | 唯一职责 | 不应做什么 |
| --- | --- | --- |
| `content/chapter-*/*.md`、`labs/**/README.md` | 课程正文、frontmatter、源文件相对链接 | 不写生成 URL、Pages base 或重复导航清单 |
| `scripts/validate-content.mjs` | 独立验证字段、路径、排序和源文件链接 | 不生成第二份课程数据 |
| `.vitepress/content-index.ts` | 构建期扫描、解析、排序并派生 `ContentEntry`、侧栏和 route map | 不进入浏览器 bundle，不让组件重新扫描文件 |
| `.vitepress/content.data.ts` | 监听同一内容合同并向主题提供可序列化索引 | 不改变索引语义或维护副本 |
| `.vitepress/config.ts` | VitePress 配置、rewrites、Markdown 扩展、base、outDir 和主题配置 | 不在各组件中拼 Pages base |
| `.vitepress/theme/index.ts`、`Layout.vue` | 扩展默认主题并注册项目组件 | 不重写第二套路由、搜索或完整 layout |
| `theme/components/*.vue`、`course.ts` | 消费 loader 数据，呈现品牌、课程元信息和入口页 | 不硬编码章节/Lab、读取 Node 文件系统或复制正文 |
| `custom.css` | 令牌、布局、暗色、响应式、焦点和原生主题表面样式 | 不用 CSS 替代交互状态或隐藏可访问内容 |
| `scripts/check-built-site.mjs`、Playwright | 审计最终静态产物和真实浏览器流程 | 不只验证开发服务器或 HTML 字符串 |

标准数据流必须保持：

```text
Markdown
  -> validate-content.mjs + content-index.ts (Node/build time)
  -> content.data.ts (serialized loader data)
  -> VitePress default theme + small Vue extensions (SSR/browser)
  -> dist/pages (generated artifact)
  -> artifact check + Pages-base Playwright
```

如果字段、路径、排序或 URL 改变，validator、ContentIndex、loader、组件、产物审计和浏览器测试必须一起检查；不能只修最后一个页面的表现。

## 4. Build-Time and Browser Boundaries

- `fs`、`path`、frontmatter 解析、目录遍历和原始 Markdown 读取只允许出现在 config、content index、data loader 或 Node 脚本中。
- Vue 组件接收 `ContentEntry[]` 等可序列化数据；不要在组件中使用 `import.meta.glob` 扫描课程，也不要从 `process.cwd()` 读取内容。
- `window`、`document`、`localStorage` 和剪贴板等浏览器 API 只在挂载或用户事件之后访问，并处理 SSR/测试环境不可用的情况。
- 主题入口必须通过 `extends: DefaultTheme` 保留 VitePress 文档布局、路由和默认交互；自定义组件只补足项目数据和品牌表达。

## 5. Native Capability and Component Rules

在新增代码前逐项确认 VitePress 默认主题是否已经提供：顶栏、路由、local search、appearance、桌面 sidebar、移动 drawer、outline、prev/next、edit link、代码复制、语法高亮和 404。能复用就配置或样式化，不能以复制交互代码的方式重建。

允许的项目扩展包括品牌标记、首页/Labs 入口、课程元信息、审阅提示和由 ContentIndex 驱动的卡片。新抽象至少应有两个真实消费者，或能明确消除跨层重复；单页面一次性逻辑保留在页面/组件内。

所有入口卡片、侧栏、搜索相关元数据、统计和 prev/next 顺序都必须来自同一 ContentIndex。组件只负责呈现和交互，不维护平行数组或正文副本。

VitePress `1.6.4` 的 Labs 跨页面 outline 兼容例外必须保留：顶栏 Labs 与 Labs 目录卡片使用 `target="_self"`，触发同标签整页导航；不得改成 `_blank`，也不得在没有 Pages 子路径测试时删除。

## 6. Routes, Links, and Pages Base

- `content/:chapter/:page.md` 映射到 `/learn/:chapter/:page/`；`labs/:chapter/:category/:lab/README.md` 映射到 `/labs/:chapter/:category/:lab/`。公共 URL 由 config 的 rewrites 和统一 route map 维护。
- 源码 URL 不含 `/DSA-Mastery/`。正文优先使用相对 `.md` 链接；Vue 站内链接使用 `withBase` 或 VitePress 生成的 route。
- `GITHUB_PAGES_BASE_PATH` 只在 config 中规范化一次，空值为 `/`，Pages 构建输出固定为 `dist/pages`。任何双 base、硬编码 base 或 source path 泄漏都是阻塞问题。
- 修改 route、rewrite、base、Markdown link transform 或 Labs 导航时，同时验证本地 `/` 与 Pages `/DSA-Mastery/`；不要只打开开发服务判断成功。

## 7. Change-to-Validation Matrix

| 改动 | 最小验证 | 额外门禁 |
| --- | --- | --- |
| frontmatter、内容路径或相对链接 | `pnpm run validate:content` | `pnpm run test:discovery`、产物链接审计 |
| ContentIndex、loader、rewrite 或 config | `pnpm run validate`、`pnpm run build` | `pnpm run check:site`、Pages-base Playwright |
| Vue 组件、导航或默认主题扩展 | `pnpm run validate`、`pnpm run build` | 代表性桌面/移动页面真实点击、搜索、键盘和控制台检查 |
| 样式、暗色或响应式 | `pnpm run build`、`pnpm run check:site` | 浅/暗色和桌面/移动截图、焦点、无横向溢出、reduced motion |
| 包、脚本或 Pages workflow | 检查直接导入与直接依赖/类型声明一致；`pnpm install --frozen-lockfile`、`pnpm test` | workflow 静态审查；涉及发布时运行 Pages-base Playwright |

常规合并前至少运行 `pnpm test`。涉及导航、主题、Markdown 渲染、base 或发布时，再设置 `GITHUB_PAGES_BASE_PATH=/DSA-Mastery` 与 `SITE_URL`，在最终 `dist/pages` 上运行 `pnpm run build`、`pnpm run check:site` 和 `pnpm run test:pages`。

## 8. Good / Base / Bad Cases

### Good

```ts
// content-index.ts (Node/build time)
const entries = collectContentEntries()

// Vue component (browser)
defineProps<{ lessons: ContentEntry[] }>()
```

### Bad

```ts
const labs = [{ title: 'Lab 01-01', href: '/DSA-Mastery/labs/...' }]
const files = import.meta.glob('../content/**/*.md')
```

前者让索引只有一个来源并保持浏览器 bundle 可序列化；后者复制数据、泄漏 Pages base 并跨越构建期/浏览器边界。

## 9. Graphviz Diagram Integration

### Scope / Trigger

修改 `vitepress-plugin-diagrams`、Graphviz fenced blocks、Kroki 环境变量、图资源缓存或 Pages 图资源路径时适用。

### Signatures

`.vitepress/config.ts` 必须创建：

```ts
createBuildTimeDiagramsPlugin({
  diagramsDir: "public/diagrams",
  diagramsDistDir: "diagrams",
  publicPath: `${base}diagrams`,
  krokiServerUrl: process.env.KROKI_SERVER_URL ?? "https://kroki.io",
  enableFileImports: false,
})
```

### Contracts

- 图源只能写在 Markdown 的纯 ```` ```graphviz ```` fenced block 中；插件按完整 info string 匹配，不支持 `[filename]` 后缀。
- `diagram id` 只能使用稳定 ASCII 标识；caption 描述教学关系。SVG 缓存位于 `public/diagrams/`，最终资产位于 `dist/pages/diagrams/`。
- `KROKI_SERVER_URL` 可选；未设置时使用 `https://kroki.io`。`publicPath` 必须包含规范化 Pages base。
- DOT 若固定使用深色文字或边线，画布必须使用不透明浅色背景（当前基线为 `bgcolor="#ffffff"`）；禁止同时使用透明画布与固定深色文字，否则暗色主题会让表格外标签失去对比度。只有在全部节点、边和文字都经过浅/暗主题实测可读时才能使用透明画布。

### Validation & Error Matrix

| 条件 | 结果 |
| --- | --- |
| 缺少或无法生成 SVG | build 在 `generateBundle` 阶段失败并指出图路径 |
| `graphviz [name]` info string | 被当作普通代码块；作者必须改为纯 `graphviz` |
| Pages 构建使用 `/diagrams/...` | `check:site` 报 base 越界；使用 `${base}diagrams` |
| SVG 未进入 `dist/pages/diagrams` | 产物断链；保留 `diagramsDistDir: "diagrams"` |

### Good / Base / Bad Cases

- Good：`graphviz` 块配稳定 ID，`publicPath` 为 `/DSA-Mastery/diagrams`，Pages 产物能找到对应 SVG。
- Base：本地 `base=/`，图 URL 为 `/diagrams/...`，构建复用缓存。
- Bad：浏览器端 Graphviz/WASM、手写 `/DSA-Mastery/`，或把 SVG 当作第二份 Markdown 来源。

### Tests Required

- `pnpm run validate`、`pnpm run build`、`pnpm run check:site`。
- 设置 `GITHUB_PAGES_BASE_PATH=/DSA-Mastery` 后重复 build/check，并断言图资源只含一个 Pages base。
- `rg -n '^```text \[[^]]+\.txt\]$' content/chapter-04-tree` 必须无结果；代表性树/图页面检查 `<figure class="vpd-diagram">`、`<img>` 和 caption。

### Wrong vs Correct

````md
<!-- Wrong: plugin will not match the full info string -->
```graphviz [tree.dot]

<!-- Correct -->
```graphviz
````

暗色主题下的固定色 SVG 还需保证画布对比度：

```dot
// Wrong: 暗色页面会透过透明画布，固定深色标签几乎不可见
digraph WrongDiagram {
  graph [bgcolor="transparent"];
  node [fontcolor="#0f172a"];
}

// Correct: SVG 自带稳定浅色画布，浅色与暗色页面都可读
digraph CorrectDiagram {
  graph [bgcolor="#ffffff"];
  node [fontcolor="#0f172a"];
}
```

## 10. Completion Review

收尾前逐项确认：源码无硬编码 Pages base；没有新增第二份内容/导航索引；默认主题能力仍可访问；SSR/build、类型、lint、产物、真实点击和必要的视觉/键盘检查都有真实结果；fixture、服务、截图和缓存已按精确路径清理；规范与实现若有偏差已在同一变更中同步或明确阻塞。
