# VitePress 迁移旧栈清理审计

> 审计日期：2026-08-10
>
> 审计分支：`feat/trellis-vitepress-migration`（基于 `origin/main`）
>
> 本文性质：两阶段清理记录。第 1.1 节以及第 2–8 节保留**清理前审计快照**和当时的门禁；第 1.2 节与第 9 节记录门禁通过后的最终执行结果。

## 1. 结论与最终执行状态

### 1.1 清理前审计快照（历史状态）

开始清理时，旧 vinext / React / RSC / Cloudflare / Sites 实现仍以 30 个受 Git 跟踪的文件完整存在，但其应用内依赖形成一个封闭的旧图：`app/` 只依赖 `components/` 与 `lib/content.ts`，旧 Vite 配置再连接 `worker/index.ts`、`build/sites-vite-plugin.ts` 与 `.openai/hosting.json`。新的 `.vitepress/`、`index.md`、`labs/index.md`、产物检查器和最终产物 Playwright 测试不导入这些旧模块。

清理前的决定是：待 VitePress 的内容、构建、链接、Pages base、浏览器与视觉门禁全部通过后，删除下文标记为“删除（门禁后）”的 30 个文件，同时原位改写工作流、包清单、TypeScript 与 ESLint 配置；课程内容、实验、素材、文档、Trellis、validator、Playwright 和新 `.vitepress/` 实现必须保留。

当时有两个明确的阻塞条件，不能先删后补：

1. `package.json` 的默认 `dev`、`build`、`start` 和 `test` 仍运行 vinext；
2. `.github/workflows/pages.yml` 仍调用旧兼容补丁与旧产物整理脚本，并注入 `NEXT_PUBLIC_*`。

这两项是清理前时间点的事实，不是当前状态。最终实现已经把默认入口与 Pages workflow 切换到 VitePress，并在干净依赖安装后重跑完整门禁。

### 1.2 最终执行记录

| 执行项 | 最终结果与证据 |
| --- | --- |
| 受跟踪旧实现 | 第 4 节列出的 30 个旧文件已经全部删除；与 `origin/main` 比较均为 `D`，当前工作树中不存在。它们仍在 Git 历史中，可通过 review 后的 revert 或从迁移前提交恢复。 |
| 公共入口切换 | `package.json` 的默认 `dev/build/preview/test` 已切到 VitePress；`.github/workflows/pages.yml` 已移除 vinext patch、`NEXT_PUBLIC_*` 和旧 artifact 重排，直接构建、检查并上传 `dist/pages`。 |
| 本地缓存与空目录 | 清理阶段已按精确路径清除 `.next/`、`.vinext/`、`.wrangler/`、`.vitepress/cache/`、`test-results/`，并清除删除文件后留下的空 `app/`、`components/`、`build/`、`worker/`、`.openai/` 目录。这些对象从未被 Git 跟踪；后续开发或测试若重新生成缓存与结果目录，交付前仍按精确路径清理。 |
| 依赖树 | 旧栈移除后，安装树减少 435 个依赖包；React、RSC、vinext、Cloudflare、Wrangler、Tailwind 与旧 Markdown renderer 不再是直接依赖。 |
| 干净安装 | 全新的 `npm ci` 成功，证明 `package.json` 与 `package-lock.json` 一致且不依赖本地旧缓存。 |
| 项目总门禁 | `npm test` 全绿，覆盖内容校验、typecheck、lint、自动发现、生产构建与静态产物检查。 |
| Pages base | 使用 `GITHUB_PAGES_BASE_PATH=/DSA-Mastery` 构建后，`npm run check:site` 通过；教材、Lab、资源和内部链接只有一个 Pages base 前缀。 |
| 浏览器验收 | 最终 `dist/pages` 上的 Playwright 为 **5/5 通过**，覆盖真实导航、搜索、暗色/代码复制、移动菜单与 404。 |
| `.nojekyll` | 最终不添加 `.nojekyll`。项目采用 [VitePress 官方 GitHub Pages Actions artifact 部署模式](https://vitepress.dev/guide/deploy#github-pages)，上传的是已经构建好的 `dist/pages`，不走分支式 Jekyll 构建；因此旧 artifact 整理脚本写入该文件的行为不需要迁移。Pages-base artifact 检查与 Playwright 已通过。 |
| 安全审计 | `npm audit` 仍报告 3 项：2 个 moderate、1 个 high，依赖链为 `vitepress@1.6.4 -> vite@5.4.21 -> esbuild@0.21.5`，且当前审计结果为 `fixAvailable: false`。稳定 VitePress 1.x 兼容线没有可直接采用的修复，因此不使用 `--force` 或强制 override。`dev` 与 `preview` 均显式绑定 `127.0.0.1`，减少开发服务器在局域网暴露；生产交付物是静态 Pages 产物，不运行 Vite dev server。 |

恢复边界必须区分：30 个受跟踪删除可由 Git 精确恢复；`.next/`、`.vinext/`、`.wrangler/`、`test-results/` 等受忽略缓存不在 Git 历史中，只能通过重新安装、构建或测试重新生成。

## 2. 清理前审计证据与判定方法

### 2.1 Git 跟踪证据

以下命令返回本文“删除清单”中的 30 个文件，证明它们是可通过 Git 历史恢复的受跟踪旧实现，而不是未知用户文件：

```powershell
git ls-files app components lib/content.ts next-env.d.ts next.config.ts `
  vite.config.ts postcss.config.mjs worker/index.ts build/sites-vite-plugin.ts `
  .openai/hosting.json scripts/patch-vinext-pages.mjs `
  scripts/prepare-pages-artifact.mjs tests/pages-navigation.test.mjs `
  tests/rendered-html.test.mjs
```

审计结果：30 个路径；每个路径都在第 4 节逐项列出。回滚时可从 `origin/main` 或迁移前提交恢复这些文件，不需要移动或转换 Markdown 数据。

### 2.2 引用隔离证据

执行了以下只读检查：

```powershell
rg -n -S '^import ' app components lib/content.ts
rg -n -S '(@/components/|@/lib/content|sites-vite-plugin|worker/index|patch-vinext-pages|prepare-pages-artifact)' .
rg -n -S '(vinext|from ["'']react|next/|@cloudflare|wrangler|hosting\.json|sites-vite-plugin|plugin-rsc|lucide-react)' `
  .vitepress index.md labs/index.md scripts/check-built-site.mjs `
  scripts/test-content-discovery.mjs tests/pages-navigation.spec.mjs
```

结果：

- 旧 `app/` 的入站引用只来自旧 `app/` 自身；旧组件和 `lib/content.ts` 的入站引用只来自这组旧 TSX 文件。
- `worker/index.ts` 与 `build/sites-vite-plugin.ts` 只由旧根 `vite.config.ts` 连接。
- `.openai/hosting.json` 只服务旧根 `vite.config.ts` / Sites 打包插件，不被 VitePress 读取。
- 最后一条针对 VitePress 替代集的检查返回 `NO MATCHES`：新站点没有 vinext、React、Next、Cloudflare、Wrangler、Sites 或 `lucide-react` 运行时导入。
- 文档与 `.trellis/tasks/` 中仍会出现“vinext/React/Cloudflare”等迁移历史文字；它们不是运行时引用，应保留为决策与回滚证据。`docs/PROJECT_BLUEPRINT.md` 和 `docs/UPDATE_WORKFLOW.md` 中把旧栈描述为“当前架构”的段落则必须在同一迁移 PR 更新。

### 2.3 已存在的替代边界

| 新边界 | 已承担的职责 |
| --- | --- |
| `.vitepress/config.ts` | VitePress 配置、旧 URL rewrites、Pages base、`dist/pages`、侧栏、搜索、appearance、edit link、Markdown 扩展与元数据 |
| `.vitepress/content-index.ts` | 构建期扫描教材与 Lab、frontmatter、排序、URL、章节、阅读时间与侧栏数据 |
| `.vitepress/content.data.ts` | 监听同一内容合同并向 Vue 主题提供序列化索引 |
| `.vitepress/theme/index.ts`、`.vitepress/theme/Layout.vue` | 扩展 VitePress 默认主题与文档布局 |
| `.vitepress/theme/custom.css` | 纸张/墨色、靛蓝/橙色、暗色、响应式、焦点与组件视觉 |
| `.vitepress/theme/components/HomePage.vue`、根 `index.md` | 品牌首页 |
| `.vitepress/theme/components/LabsIndex.vue`、`labs/index.md` | Lab 目录页 |
| `.vitepress/theme/components/DocumentHeader.vue`、`DocumentFooterNote.vue` | 教材/Lab 元信息与文档补充区 |
| `.vitepress/theme/course.ts` | 浏览器侧课程索引读取、route 归一化与当前文档定位 |
| `scripts/check-built-site.mjs` | 最终 `dist/pages` 的路由、链接、base、H1 与搜索产物审计 |
| `scripts/test-content-discovery.mjs` | 临时教材/Lab 的自动发现、构建、搜索与安全清理验证 |
| `tests/pages-navigation.spec.mjs` | 在 `/DSA-Mastery/` 下服务最终静态产物并真实点击、搜索、切主题、测移动导航与 404 |

## 3. 清理前决定图例

以下图例记录执行前的授权边界；第 4 节标记为“删除（门禁后）”的 30 项最终均已按第 1.2 节执行。

- **删除（门禁后）**：替代物和引用边界已明确；仍须先完成第 8 节的删除前门禁。
- **保留并改写**：路径仍是项目公共入口，不能删除；只替换其中的旧栈配置。
- **保留**：是内容、治理、验证或新架构资产，不属于垃圾文件。
- **待确认**：证据不足时不删除。本次 30 个受跟踪候选中没有用途不明项；清理前单独保留验证的 `.nojekyll` 差异现已按第 1.2 节确认不需要迁移。

## 4. 清理前受跟踪旧文件逐项决定（最终已执行）

### 4.1 旧 App Router 页面与样式（9 个）

| 精确路径 | 旧职责与引用证据 | VitePress 替代 | 决定 | 主要风险与删除后验证 |
| --- | --- | --- | --- | --- |
| `app/globals.css` | `git ls-files` 命中；仅由 `app/layout.tsx:3` 导入，首行加载 Tailwind | `.vitepress/theme/custom.css` 与默认主题变量 | 删除（门禁后） | 风险：品牌、暗色、移动布局回归。对照桌面/移动、浅/暗迁移截图，并检查 focus 与 reduced-motion。 |
| `app/layout.tsx` | 跟踪；导入旧全局 CSS、`SiteHeader`、旧搜索数据，并读取 `NEXT_PUBLIC_SITE_URL` | `.vitepress/config.ts` 的 head/元数据/themeConfig + `.vitepress/theme/Layout.vue` | 删除（门禁后） | 风险：标题、OG、favicon、导航和 theme 初始化丢失。检查 head、favicon、顶栏、暗色持久化与无 hydration 错误。 |
| `app/page.tsx` | 跟踪；旧首页，导入 `lucide-react`、`SiteLink`、`lib/content.ts` | 根 `index.md` + `HomePage.vue` + `custom.css` | 删除（门禁后） | 风险：品牌首页和统计退化。检查 CTA、章节/Lab 卡片、统计、学习循环与基线截图。 |
| `app/not-found.tsx` | 跟踪；旧自定义 404，依赖 `SiteLink` | VitePress 原生 404 与主题样式 | 删除（门禁后） | 风险：错误路由返回错误状态或回首页链接失效。Playwright 断言真实 404 状态、文案和返回首页点击。 |
| `app/learn/layout.tsx` | 跟踪；导入旧桌面侧栏、移动目录和课程索引 | VitePress 默认主题 sidebar/mobile drawer，由 `createCourseSidebar()` 生成 | 删除（门禁后） | 风险：教材侧栏与移动导航丢失。桌面侧栏、移动菜单、当前项与章节顺序均需点击验证。 |
| `app/learn/[...slug]/page.tsx` | 跟踪；Next 动态路由、静态参数、metadata、`DocumentView` | `.vitepress/config.ts` rewrites + Markdown 页面 + `DocumentHeader.vue`/`DocumentFooterNote.vue` | 删除（门禁后） | 风险：兼容 URL、404、frontmatter metadata、前后页回归。核对 7 篇教材、旧 `/learn/.../` URL 和恰好一个 H1。 |
| `app/labs/layout.tsx` | 跟踪；与教材布局一样装配旧侧栏/移动目录 | VitePress 默认主题 sidebar/mobile drawer | 删除（门禁后） | 风险：Lab 文档导航断裂。点击顶栏 Labs、目录卡片、Lab 侧栏，并监控同源 4xx/5xx。 |
| `app/labs/page.tsx` | 跟踪；旧 Lab 汇总页，导入旧索引与 React 图标 | `labs/index.md` + `LabsIndex.vue` | 删除（门禁后） | 风险：Lab 分组、难度/时长、卡片 URL 或数量错误。核对 4 个 Lab、章节分组和卡片真实点击。 |
| `app/labs/[...slug]/page.tsx` | 跟踪；Next Lab 动态路由、metadata、`DocumentView` | Labs README rewrite + VitePress 文档主题 | 删除（门禁后） | 风险：旧 `/labs/.../` 兼容路径或 Lab 特有字段丢失。核对 4 个 Lab、difficulty/duration/status 与代表性任务列表。 |

### 4.2 旧 React 组件与浏览器内容索引（10 个）

| 精确路径 | 旧职责与引用证据 | VitePress 替代 | 决定 | 主要风险与删除后验证 |
| --- | --- | --- | --- | --- |
| `components/copy-button.tsx` | 跟踪；仅被旧 `markdown-renderer.tsx` 导入，依赖 React state 与 `lucide-react` | VitePress 默认主题代码复制按钮 | 删除（门禁后） | 在代表性代码块实际点击复制并检查按钮状态/剪贴板。 |
| `components/docs-sidebar.tsx` | 跟踪；仅被两个旧 layout 导入，依赖 `next/navigation` | `createCourseSidebar()` + 默认主题侧栏 | 删除（门禁后） | 检查章节顺序、active 状态、桌面折叠与移动抽屉。 |
| `components/document-view.tsx` | 跟踪；仅被两个旧动态页面导入，拼装正文、元信息、TOC 与兄弟页 | VitePress doc layout、outline、prev/next、`DocumentHeader.vue`、`DocumentFooterNote.vue` | 删除（门禁后） | 检查正文层级、TOC、edit link、prev/next、状态/贡献者/更新时间。 |
| `components/markdown-renderer.tsx` | 跟踪；仅被旧 `document-view.tsx` 导入；唯一直接使用 `highlight.js`、`react-markdown`、rehype/remark 与旧 KaTeX 管线 | VitePress Markdown/Shiki；`.vitepress/config.ts` 的 math、tasklist 与链接重写 | 删除（门禁后） | 检查公式、代码高亮、表格、任务列表、标题锚点与相对 `.md` 链接。 |
| `components/mobile-docs-nav.tsx` | 跟踪；仅被两个旧 layout 导入 | VitePress 默认主题移动导航 | 删除（门禁后） | 390px 视口打开菜单、跳转教材/Lab，并确认无横向溢出。 |
| `components/search-palette.tsx` | 跟踪；只由旧 `site-header.tsx` 导入，维护第二份 React 搜索 UI | VitePress `themeConfig.search.provider = "local"` | 删除（门禁后） | 搜索至少返回一篇教材和一个 Lab，并点击结果验证 Pages base。 |
| `components/site-header.tsx` | 跟踪；只由旧根 layout 导入，装配品牌、搜索、主题切换 | 默认主题 nav + `BrandMark.vue` + VitePress 搜索/appearance | 删除（门禁后） | 检查品牌、教材/Labs 导航、搜索入口、移动折叠与暗色开关。 |
| `components/site-link.tsx` | 跟踪；旧页面/组件的 Pages-aware Next Link 包装器，包含 vinext RSC 文档跳转 workaround | VitePress router、`withBase`、Markdown route rewrite；必要的 Labs 全文档跳转由新 Vue 组件显式控制 | 删除（门禁后） | 这是历史 Pages 导航故障的高风险点；必须在 `/DSA-Mastery/` 下真实点击 CTA、教材相对链接、顶栏 Labs 和 Lab 卡片，且无双 base/pageerror。 |
| `components/theme-toggle.tsx` | 跟踪；只由旧 header 导入，手写 localStorage/theme 逻辑 | VitePress `appearance: true` 与默认主题持久化 | 删除（门禁后） | 切换暗色、刷新并断言持久化；检查浅/暗截图。 |
| `lib/content.ts` | 跟踪；所有旧页面/导航/搜索的数据入口，使用 `import.meta.glob` 和 `github-slugger` | `.vitepress/content-index.ts` + `.vitepress/content.data.ts` + `.vitepress/theme/course.ts` | 删除（门禁后） | 风险：字段、排序、URL、阅读时间或自动发现差异。独立 validator、临时 fixture、7+4 route 清单、搜索/侧栏/统计一致性全部通过后再删。 |

### 4.3 旧构建、RSC、Cloudflare 与 Sites 文件（7 个）

| 精确路径 | 旧职责与引用证据 | VitePress / Pages 替代 | 决定 | 主要风险与删除后验证 |
| --- | --- | --- | --- | --- |
| `next-env.d.ts` | 跟踪；导入 `vinext/types` 与 `.next/types/routes.d.ts`；同时被当前 `tsconfig.json`/ESLint 配置列入 | VitePress、Vue 与项目 TypeScript 配置 | 删除（门禁后） | 同时从 `tsconfig.json` 与 ESLint ignore 删除旧引用，执行 typecheck/lint。 |
| `next.config.ts` | 跟踪；Next static export、basePath、trailingSlash | `.vitepress/config.ts` 的 `base`、rewrites、clean URLs 与 `outDir` | 删除（门禁后） | 本地 `/` 与 Pages `/DSA-Mastery/` 各构建一次，检查没有双前缀和缺失尾斜杠。 |
| `vite.config.ts` | 跟踪；唯一连接 vinext、Sites、Cloudflare RSC、Worker 与 Wrangler 状态 | `.vitepress/config.ts` 是唯一站点配置；默认脚本改为 VitePress | 删除（门禁后） | 删除前先改默认脚本；删除后检查 VitePress 不再需要共存期的旧配置规避，并执行 dev/build/preview。 |
| `postcss.config.mjs` | 跟踪；只注册 `@tailwindcss/postcss`；旧 CSS 首行唯一使用 Tailwind | `.vitepress/theme/custom.css` 由 VitePress/Vite 直接处理 | 删除（门禁后） | lint/build 后核对 CSS 产物和视觉；确认新 CSS 无 Tailwind 指令。 |
| `worker/index.ts` | 跟踪；只由旧 `vite.config.ts` 的 Cloudflare 配置引用，提供 vinext app-router 与图片优化 Worker | GitHub Pages 直接托管 `dist/pages` 静态文件，不需要 Worker/RSC/图片优化端点 | 删除（门禁后） | 检查产物没有 `/_vinext/image`、RSC 或 Worker 请求；Playwright 监控 request failure。 |
| `build/sites-vite-plugin.ts` | 跟踪；只由旧 `vite.config.ts` 导入，将 `.openai/hosting.json`/drizzle 打包到 `dist/.openai` | GitHub Pages workflow 直接上传 `dist/pages` | 删除（门禁后） | 确认 workflow 不再读取 `dist/.openai`；删除该文件后仅在目录为空时移除空 `build/`，禁止递归宽泛清理。 |
| `.openai/hosting.json` | 跟踪；仅包含 OpenAI Sites `project_id`，`d1`/`r2` 均为 `null`；只被旧 Vite/Sites 打包链读取 | `.github/workflows/pages.yml` + `actions/configure-pages`/`upload-pages-artifact`/`deploy-pages` | 删除（门禁后） | **正式发布目标已明确为 GitHub Pages，任务范围明确排除第二生产主机。** 保留该文件会继续暗示并触发一条未维护的 Sites 发布路径，也会迫使项目保留无用插件；文件不含课程内容或数据库绑定，因此可删。删除后验证仓库无 `.openai/hosting.json`/`dist/.openai` 引用，Pages workflow 全绿；若将来决定增加 Sites，应以新 ADR/任务重新初始化，而非复用本次旧元数据。 |

### 4.4 旧补丁与旧实现测试（4 个）

| 精确路径 | 旧职责与引用证据 | VitePress 替代 | 决定 | 主要风险与删除后验证 |
| --- | --- | --- | --- | --- |
| `scripts/patch-vinext-pages.mjs` | 跟踪；由 `.github/workflows/pages.yml` 调用，直接修改 `node_modules/vinext/dist/build/prerender.js` 的 HTML/RSC/404 请求 | `.vitepress/config.ts` 原生 Pages base + rewrites；产物/Playwright base 检查 | 删除（门禁后） | 先从 workflow 删除调用；Pages base 构建与真实点击必须覆盖旧故障路径。 |
| `scripts/prepare-pages-artifact.mjs` | 跟踪；由 workflow 调用，将 `dist/client` 重排到 `dist/pages`、写 `.nojekyll`、检查旧 `_next` | VitePress 直接输出 `dist/pages` + `scripts/check-built-site.mjs` + Pages artifact action | 删除（门禁后） | 清理前把 `.nojekyll` 列为待验证差异；最终确认官方 Actions artifact 模式直接部署预构建的 `dist/pages`，不走 Jekyll，故无需迁移该文件。Pages-base 检查与 Playwright 5/5 已通过。 |
| `tests/pages-navigation.test.mjs` | 跟踪；静态断言旧 `SiteLink`、`NEXT_PUBLIC_*` 与 workflow workaround | `scripts/check-built-site.mjs` + `tests/pages-navigation.spec.mjs` 的最终产物真实点击 | 删除（门禁后） | 确认新测试覆盖 home → lesson、top Labs → index、index → Lab、相对链接与单一 base。 |
| `tests/rendered-html.test.mjs` | 跟踪；动态导入旧 `dist/server/index.js` Worker 并测试 vinext SSR/RSC HTML | `scripts/check-built-site.mjs` + 在 `dist/pages` 上运行的 Playwright | 删除（门禁后） | 确认首页、7 篇教材、4 个 Lab、404 的静态产物与状态均被覆盖，不再引用 `dist/server`。 |

## 5. 清理前识别的保留并原位改写入口（最终已执行）

清理前，这些文件含有旧引用，但删除路径本身会破坏项目公共接口，因此决定不是“删除”。最终实现保留了路径并完成 VitePress 改写。

| 精确路径 | 当前旧引用 | 决定与目标状态 | 验证 |
| --- | --- | --- | --- |
| `package.json` | 默认 `dev/build/start/test` 使用 vinext/Wrangler；仍声明旧直接依赖 | 保留并改写为 VitePress 公共脚本，删除第 6 节旧直接依赖 | `npm ci` 后运行所有公共脚本；文档和 CI 使用同一名称。 |
| `package-lock.json` | 锁定 vinext/React/RSC/Cloudflare/Wrangler 树 | 保留，由包管理器随 `package.json` 一致更新；禁止手工删 lock 片段 | `npm ci` 成功；`npm ls --depth=0` 无旧直接包。 |
| `.github/workflows/pages.yml` | 调用两个旧脚本，注入 `NEXT_PUBLIC_*`，默认 `npm run build` 仍指 vinext | 保留路径并改写：配置 Pages → VitePress build/check/discovery/Playwright → 上传 `dist/pages`；PR 不 deploy | PR build 全绿且 deploy job 显式排除 `pull_request`；main/manual 才部署。 |
| `eslint.config.mjs` | 导入 `@next/eslint-plugin-next`，忽略 `.next`/旧类型文件，配置 React/Next 规则 | 保留并改写为新 TS/Vue/Node 脚本范围 | `npm run lint` 覆盖 `.vitepress/**/*.ts`、`.vue`、scripts/tests。 |
| `tsconfig.json` | 包含 JSX/Next plugin、`next-env.d.ts`、`.next/types` | 保留并改写为 VitePress/Vue/Node 类型检查范围 | typecheck 覆盖新 config、content index、theme 与测试辅助脚本。 |
| `.gitignore` | 忽略 `.next/`、`.vinext/`、`.wrangler/`，也忽略新 `dist/` 与 Playwright 产物 | 保留；这些历史缓存忽略项有助于回滚与防误提交，无需为“看起来旧”而删除 | `git status --short` 不出现缓存、日志、artifact。 |
| `docs/PROJECT_BLUEPRINT.md` | 仍写“当前 React/vinext 应用” | 保留并更新为 VitePress 架构 | 与 `.vitepress/`、内容合同和 Pages workflow 对照复核。 |
| `docs/UPDATE_WORKFLOW.md` | 仍提到旧缓存/构建流程 | 保留；更新作者工作流和真实公共脚本。历史缓存“不手改”原则可继续保留 | 从干净 checkout 按文档操作一次。 |

## 6. 清理前依赖级清理清单（最终已执行）

这些包在清理前的 `package.json` 中是直接依赖，`rg` 显示其项目级使用仅落在第 4 节旧文件、旧脚本/配置或旧 ESLint 配置中。最终已经从 `package.json` 移除并由包管理器重建 lockfile；没有直接编辑 `node_modules` 或手工裁剪 `package-lock.json`。

### 6.1 最终已删除的旧直接依赖

```text
cross-env
github-slugger
highlight.js
katex
lucide-react
react
react-dom
react-markdown
rehype-katex
rehype-slug
remark-gfm
remark-math
@cloudflare/vite-plugin
@next/eslint-plugin-next
@tailwindcss/postcss
@types/react
@types/react-dom
@vitejs/plugin-react
@vitejs/plugin-rsc
eslint-plugin-jsx-a11y
eslint-plugin-react
eslint-plugin-react-hooks
react-server-dom-webpack
tailwindcss
vinext
wrangler
```

### 6.2 最终保留的新站点/质量依赖

```text
vitepress
vue
@lucide/vue
gray-matter
markdown-it
markdown-it-mathjax3
@mdit/plugin-tasklist
@playwright/test
typescript
@types/node
eslint
@eslint/js
typescript-eslint
globals
```

`vite` 是 VitePress 的底层构建工具；是否继续作为项目直接 devDependency 应由最终 lint/type/build 配置的真实导入决定，不能因旧根 `vite.config.ts` 被删除就机械移除。任何仍作为 VitePress 或测试工具的传递依赖出现的包，也不能仅凭 lockfile 名称判为残留；验收重点是无旧**直接**依赖、无旧运行时入口、无旧命令。

## 7. 清理前生成目录与日志计划：只按精确目标执行

审计时的只读检查表明以下目录均未被 Git 跟踪：

| 精确目录 | 审计时存在 | 决定 | 安全要求 |
| --- | --- | --- | --- |
| `.next/` | 是 | 删除本地旧 Next/vinext 输出 | 删除前解析为工作区内绝对路径；不得用空变量或宽泛 glob。 |
| `.vinext/` | 是 | 删除本地 vinext 状态 | 同上；保留 `.gitignore` 条目。 |
| `.wrangler/` | 是 | 删除本地 Wrangler 日志/状态 | 同上；确认不含人为保存的诊断证据。 |
| `dist/` | 是 | 保留为受忽略的可再生 VitePress 输出；依赖清理后可精确清空并重建 | 不把它当旧栈目录整体提交；最终内容应只由 `vitepress build` 产生在 `dist/pages`。 |
| `test-results/` | 是 | 测试完成后精确清理 | 失败证据已记录后再清；不得提交。 |
| `playwright-report/` | 否 | 保留 ignore；若生成则交付前精确清理 | 不因当前不存在而执行推断式递归删除。 |
| `node_modules/` | 是（依赖已安装） | 通过干净 `npm ci` 重建依赖状态，不作为 PR 文件 | 不手工挑删子包；以 `package.json`/lockfile 为事实来源。 |

第 4 节文件删除后，仅在确认没有其他文件时，才移除空的 `app/`、`components/`、`worker/`、`build/` 与 `.openai/` 目录；不得把目录名替代精确文件清单用于递归删除。

## 8. 删除前门禁（最终已通过）

所有“删除（门禁后）”项共享以下前置条件；任一失败就保持旧文件不动：

1. 从实际 `package.json` 暴露并跑通内容校验、typecheck、lint、VitePress build、产物链接检查和测试。
2. 本地 base `/` 与 `GITHUB_PAGES_BASE_PATH=/DSA-Mastery` 的生产构建均通过。
3. `dist/pages` 包含品牌首页、Labs 索引、404、7 篇教材与 4 个 Lab。
4. Playwright 从最终静态产物真实点击首页 CTA → 教材、顶栏 Labs → Labs 索引、Labs 索引 → Lab；搜索命中教材和 Lab；无 pageerror、console error、request failure 或同源 4xx/5xx（预期 404 用例除外）。
5. 数学公式、代码与复制、表格、任务列表、相对 Markdown 链接、edit link、移动导航和暗色持久化通过。
6. 桌面/移动、浅/暗 after 截图与 `docs/assets/migration-baseline/` 比较通过。
7. 临时教材和 Lab 的自动发现测试在 `finally` 后留下干净工作树。
8. `git status --short` 中没有未知用户改动；清理报告已经进入同一 PR。

## 9. 最终删除后验证与残留判定

第 1.2 节记录了本次实际结果：干净 `npm ci` 成功、`npm test` 全绿、Pages base 产物检查通过、Playwright 5/5；下列命令与边界继续作为未来 review 和回归排查的可重复检查方式。

### 9.1 精确残留检查

删除组完成后，以下旧文件清单命令应无输出：

```powershell
git ls-files app components lib/content.ts next-env.d.ts next.config.ts `
  vite.config.ts postcss.config.mjs worker/index.ts build/sites-vite-plugin.ts `
  .openai/hosting.json scripts/patch-vinext-pages.mjs `
  scripts/prepare-pages-artifact.mjs tests/pages-navigation.test.mjs `
  tests/rendered-html.test.mjs
```

以下检查在活动源码、配置、脚本、测试、工作流和包清单中应无旧运行时引用：

```powershell
rg -n -S '(vinext|NEXT_PUBLIC_|@cloudflare/vite-plugin|wrangler|@vitejs/plugin-rsc|react-server-dom-webpack|lucide-react|patch-vinext-pages|prepare-pages-artifact|dist/server|dist/client)' `
  package.json .github .vitepress scripts tests eslint.config.mjs tsconfig.json index.md labs/index.md
```

迁移 PRD、设计、回滚文档和本报告中的历史名称属于允许结果；若产品文档仍把旧栈写成当前实现，则不是允许结果。

### 9.2 干净安装与全量门禁

按最终 `package.json` 中真实存在的脚本执行，最低要求是：

```powershell
npm ci
npm run validate:content
npm run typecheck
npm run lint
npm run build
npm run check:site
npm run test:discovery
npm test
npm run test:pages
```

随后用 `npm ls --depth=0` 确认第 6.1 节包不再是直接依赖，并重新核对 Pages base 产物、7+4 内容数量、搜索、截图和真实导航。

### 9.3 受保护路径审查

提交前审查 staged diff，任何下列路径出现删除都必须立即停止：

```text
content/**
labs/**（仅允许保留/更新根 labs/index.md；不得删除已有 Lab README 或源码）
public/**
docs/**（本报告和迁移文档更新除外，不删除项目资料或截图证据）
.trellis/**
.agents/**
.codex/**
AGENTS.md
scripts/validate-content.mjs
tests/pages-navigation.spec.mjs
.vitepress/**
index.md
labs/index.md
```

另外必须保留 `.github` 的 Issue/PR 模板以及经过改写的 `.github/workflows/pages.yml`。清理目标是旧运行时，不是课程单一事实来源、团队治理层或验证层。

## 10. 回滚

- 合并前：旧生产站仍来自 `main`；关闭 Draft PR 或放弃功能分支即可，不影响当前 Pages。
- 清理提交内：按文件组独立提交；若验证回归，只 revert 对应删除/依赖提交，不触碰 Markdown。
- 合并后：通过新的 Review PR 逆序 revert 迁移提交，并重新部署最后一个绿色 Pages artifact。
- 如果只有 Pages 发布失败：先恢复上一份绿色 artifact；不要为了快速恢复而重新引入 `.openai/hosting.json` 或第二生产主机。
- Git 只能恢复第 4 节的受跟踪文件与配置历史；受忽略的缓存、日志和测试产物没有版本化副本，需要通过 `npm ci`、构建或测试重新生成。

## 11. 2026-08-18 第 1 章 Demo Lab 精确清理

本节是第 9.3 节“不得删除已有 Lab”的显式、经维护者授权的例外，只覆盖下表三个早期 Demo。第 1 章其余 20 个正式 Lab 保留完整题面、实现、答案和测试，仅重新编号。

| 候选路径 | 旧职责 | 替代物 | 无引用与替代证据 | 决定 | 回滚方式 |
| --- | --- | --- | --- | --- | --- |
| `labs/chapter-01/lab-01-01-sequence-list` | README-only 顺序表演示 | 重编号后的五个 Theory Quiz 与十五个 Exercise Program | 正式题目已覆盖线性表概念和实现训练；删除后执行全仓引用、内容、构建与 Pages 检查 | 删除 | 合并前放弃分支；合并后 revert 本任务提交 |
| `labs/chapter-01/lab-01-02-linked-list` | README-only 单链表演示 | 重编号后的链表 Quiz 与多道链表 Program | 正式题目已覆盖链表概念、边界和代码练习；删除后执行同一门禁 | 删除 | 同上 |
| `labs/chapter-01/lab-01-03-problem-template` | Program 模板兼 Golden 示例 | 新 `lab-01-06-sequential-list-deduplication` Golden Program | 新示例必须通过 solution=100、starter<100、oracle 与 Make 一致性验证后交付 | 删除 | 同上 |

执行前已逐项解析三个绝对路径并确认它们均位于 `labs/chapter-01` 内。旧产品引用会清零；本报告和 Trellis 任务中的历史名称只作为删除、编号映射和回滚证据保留。

## 12. 2026-08-24 物理 Chapter 05 图内容迁移

课程总目录已经把旧物理 Chapter 05 的图内容编排为网站 Ch.6“图的基础与存储”和 Ch.7“图的遍历与应用”。维护者明确批准补齐网站 Ch.5“树的应用”后，旧文件若继续保留 `chapter: 5` 会与新树应用页面产生重复 order 和 `chapterTitle` 冲突。本次只迁移路径、编号、元数据与必要链接，不删除知识正文或 Lab 学习目标。

| 候选路径 | 旧职责 | 替代物 | 无引用与替代证据 | 决定 | 回滚方式 |
| --- | --- | --- | --- | --- | --- |
| `content/chapter-05-graph/00-overview.md` | 旧物理 Ch.5 图总览，被课程映射到 Ch.6 | `content/chapter-06-graph-foundations/01-graph-basics.md` | 基础概念已并入 6.1，不再保留独立章节介绍页 | 迁移 | 合并前放弃分支；合并后 revert 本任务提交 |
| `content/chapter-05-graph/01-representation.md` | 图的表示正文，被课程映射到 Ch.6 | `content/chapter-06-graph-foundations/02-graph-storage.md` | 存储正文保留邻接矩阵/表、复杂度与练习，并改为 `chapter: 6` | 迁移 | 同上 |
| `content/chapter-05-graph/02-traversal.md` | 图遍历正文，被课程映射到 Ch.7 | `content/chapter-07-graph-traversal/01-dfs-and-bfs.md` | 新页保留并扩展 DFS/BFS、非连通与复杂度内容，编号改为 `chapter: 7` | 迁移 | 同上 |
| `content/chapter-05-graph/03-applications.md` | MST/最短路径正文，被课程映射到 Ch.7 | `content/chapter-07-graph-traversal/02-minimum-spanning-tree.md`、`content/chapter-07-graph-traversal/03-shortest-path.md` | 原正文拆分为最小生成树与最短路径两节，均改为 `chapter: 7` | 迁移 | 同上 |
| `content/chapter-05-graph/04-astar-visualization.md` | A* 交互正文，被课程映射到 Ch.7 | `content/chapter-07-graph-applications/04-astar-visualization.md` | 新页保留原演示路由并改用现有主题令牌 | 迁移 | 同上 |

迁移前目标目录经只读检查确认不存在受跟踪文件冲突。旧产品路径将在 source map、正文、脚本、测试和文档中清零；旧 Trellis 规划任务中的路径只作为历史证据保留。替代页必须通过 frontmatter/链接校验、自动发现、构建、静态产物检查与 Pages 浏览器测试，失败则回退整组迁移，不留下半套编号。

## 13. 2026-09-04 第 12 章分治与递归 Labs 重建

本节是第 9.3 节“不得删除已有 Lab”的显式、经维护者批准的例外。旧 Ch12 的 2 个 Theory Quiz 与 13 个 Exercise Program 将由 16 个重新选题、重新编号并重新编写的 Exercise Program 完整替代；`theory/` 与 `project/` 分类目录保留空的 `.gitkeep`，不创建虚假占位 Lab。

删除前已经逐题运行新 Lab 的严格验证：`12E01`～`12E16` 的参考解均为 `100/100`，starter 均可编译且不能满分，320 个公开用例的标准输出均由仓库 Lab CLI 从参考解生成。旧路径在课程正文中的引用已通过 `rg` 列出，并将在同一变更中由新的 8 篇 Ch12 正文与 `autoLabChapter: 12` 自动收录取代；删除后的产品源码必须不再引用下表路径。

| 候选路径 | 旧职责 | 替代物 | 无引用与替代证据 | 决定 | 回滚方式 |
| --- | --- | --- | --- | --- | --- |
| `labs/chapter-12/theory/T-12-01-recursion-foundations-quiz` | 递归基础选择题 | 新 Ch12 的 8 篇正文、自检题与 `12E01`～`12E06` | 新正文直接承担契约、调用栈、递归建模与自检；目录由 ContentIndex 自动发现，不再手写该 Quiz 链接 | 删除 | 合并前放弃本分支；合并后 revert 本任务提交 |
| `labs/chapter-12/theory/T-12-02-divide-conquer-applications-quiz` | 分治应用选择题 | 新 Ch12 的 8 篇正文、自检题与 `12E07`～`12E16` | 新正文直接承担 Divide–Conquer–Combine、合并模式、证明与复杂度自检 | 删除 | 同上 |
| `labs/chapter-12/exercise/E-12-01-hanoi-recursion` | 汉诺塔输出递归 | `E-12-01-function-memoization` | 新题已通过 20 组测试与严格 verify；旧正文手写链接将在重写时移除 | 删除 | 同上 |
| `labs/chapter-12/exercise/E-12-02-maximum-subarray` | 最大子数组分治 | `E-12-02-power-expression` 与 `E-12-08-sort-array-merge` | 新题分别覆盖输出型递归和标准分治合并，均已严格 verify | 删除 | 同上 |
| `labs/chapter-12/exercise/E-12-03-inversion-count` | 逆序对计数 | `E-12-11-inversion-count` | 同一核心能力迁移到指定的新顺序；新题 20 组测试已严格 verify | 删除 | 同上 |
| `labs/chapter-12/exercise/E-12-04-stair-climbing` | 朴素递归与记忆化 | `E-12-01-function-memoization` | 新题直接覆盖递归状态复用与定义域裁剪，已严格 verify | 删除 | 同上 |
| `labs/chapter-12/exercise/E-12-05-recursive-binary-search` | 区间递归 | `E-12-07-kth-smallest-quickselect` | 新题覆盖区间划分、目标侧递归与重复值边界，已严格 verify | 删除 | 同上 |
| `labs/chapter-12/exercise/E-12-06-fast-power` | 整数快速幂 | `E-12-04-pow-x-n` | 新题增加负指数、`INT_MIN` 与浮点比较合同，已严格 verify | 删除 | 同上 |
| `labs/chapter-12/exercise/E-12-07-merge-sort` | 归并排序 | `E-12-08-sort-array-merge` | 新题按指定题源重建，20 组测试已严格 verify | 删除 | 同上 |
| `labs/chapter-12/exercise/E-12-08-quicksort` | 快速排序 | `E-12-07-kth-smallest-quickselect` | 新题聚焦三路划分与单侧递归，20 组测试已严格 verify | 删除 | 同上 |
| `labs/chapter-12/exercise/E-12-09-kth-largest-quickselect` | 第 k 大快速选择 | `E-12-07-kth-smallest-quickselect` | 按指定的 0-based 第 k 小合同重建，已严格 verify | 删除 | 同上 |
| `labs/chapter-12/exercise/E-12-10-merge-two-sorted-lists` | 两路链表递归合并 | `E-12-09-construct-quad-tree` 与 `E-12-10-carpet-tromino` | 新题加强结构递归与四象限组合，均已严格 verify | 删除 | 同上 |
| `labs/chapter-12/exercise/E-12-11-majority-element` | 候选合并 | `E-12-13-beautiful-array` | 新题覆盖性质保持与确定性构造，已严格 verify | 删除 | 同上 |
| `labs/chapter-12/exercise/E-12-12-merge-k-sorted-lists` | 多路链表分治 | `E-12-14-reverse-pairs`、`E-12-15-count-smaller-after-self`、`E-12-16-count-range-sum` | 三题形成归并计数进阶链，均已严格 verify | 删除 | 同上 |
| `labs/chapter-12/exercise/E-12-13-different-ways-to-compute` | 表达式结果集合 | `E-12-12-different-ways-add-parentheses` | 新题明确保留重复结果并提供 20 组测试，已严格 verify | 删除 | 同上 |

执行时须先把上述路径解析为绝对路径并逐项确认都位于 `labs/chapter-12/theory` 或 `labs/chapter-12/exercise` 内，再按这份固定清单删除。删除后运行产品源码引用检查、16 个 Lab verify、内容发现、完整 `pnpm test` 与 Pages-base 浏览器验收；任一门禁失败则回退本组删除和对应正文改写。
