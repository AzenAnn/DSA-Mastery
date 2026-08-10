# VitePress 迁移、验证与回滚

> 状态：迁移实现与本地验收已完成
>
> 固定版本：VitePress `1.6.4`、Trellis `0.6.14`
>
> 发布目标：GitHub Pages，静态产物 `dist/pages`

本文记录 2026-08-10 完成的站点迁移结果、已知风险和回滚方式。日常新增教材或 Lab 请读 [UPDATE_WORKFLOW.md](UPDATE_WORKFLOW.md)；逐文件清理证据见 [CLEANUP_REPORT.md](CLEANUP_REPORT.md)。

## 1. 最终架构

仓库根目录同时是 VitePress root 与 source root：

```text
content/chapter-*/*.md ─┐
                        ├─► .vitepress/content-index.ts
labs/**/README.md ──────┘          │
                                   ├─► sidebar / 首页统计 / Labs 目录 / 文档元数据
                                   └─► .vitepress/content.data.ts ─► Vue 主题组件

.vitepress/config.ts ─► rewrites / Markdown / 搜索 / Pages base / metadata
index.md              ─► HomePage.vue
labs/index.md         ─► LabsIndex.vue
.vitepress/theme/     ─► 扩展默认主题
vitepress build .     ─► dist/pages
```

核心边界：

- `.vitepress/config.ts` 是唯一 Vite/VitePress 配置入口，`outDir` 固定为 `dist/pages`。
- `.vitepress/content-index.ts` 在构建期扫描并派生课程数据；Node 文件系统 API 不进入浏览器 bundle。
- `.vitepress/content.data.ts` 监听 `content/chapter-*/*.md` 与 `labs/chapter-*/lab-*/README.md`，供 Vue 组件消费同一索引。
- `scripts/validate-content.mjs` 是独立校验防线；`scripts/test-content-discovery.mjs` 用临时教材与 Lab 证明自动发现，并在 `finally` 中安全清理。

公开 URL 保持不变：

```text
content/:chapter/:page.md       -> /learn/:chapter/:page/
labs/:chapter/:lab/README.md    -> /labs/:chapter/:lab/
```

GitHub Pages 的 base 只从 `actions/configure-pages` 输出写入 `GITHUB_PAGES_BASE_PATH`，再由 VitePress 规范化一次。Markdown 与 Vue 数据中的课程 URL 都不硬编码 `/DSA-Mastery/`。

## 2. Markdown 与主题行为

### 内容链接

教材可以继续使用便于仓库阅读和 Review 的相对 `.md` 链接，例如：

```md
[数据结构基础概念](./01-data-structure-basics.md)
[对应 Lab](../../labs/chapter-01/lab-01-02-linked-list/README.md)
```

`pnpm run validate:content` 先检查目标源文件存在；VitePress 构建时再把可识别的相对 `.md` 链接改写为无扩展名课程路由，并由统一 base 处理部署前缀。不要把 `/DSA-Mastery/` 写进正文。

### 原生能力与自定义范围

项目扩展 `vitepress/theme-without-fonts` 的默认主题，不自行重写整套站点外壳。

| 由 VitePress 默认主题负责 | 项目自定义 |
| --- | --- |
| 顶栏与移动菜单 | `BrandMark.vue` |
| 本地搜索 | `HomePage.vue` |
| appearance/主题切换 | `LabsIndex.vue` |
| 侧栏与移动课程目录 | `DocumentHeader.vue` |
| outline、prev/next、edit link | `DocumentFooterNote.vue` |
| 代码高亮与复制、404 | `Layout.vue` 插槽和 `custom.css` |

公式使用 VitePress `markdown.math: true` 的 MathJax 管线，正文沿用 `$...$` 与 `$$...$$`。任务列表由 `@mdit/plugin-tasklist` 处理。

### Labs 整页导航兼容策略

VitePress `1.6.4` 在部分 Lab 跨页面客户端导航中会保留上一页 outline 状态。顶栏 Labs 入口与 Labs 目录卡片因此显式使用 `target="_self"`，让浏览器执行同标签整页导航并重新建立文档 outline。这是固定版本下的兼容措施，不应改成 `_blank`，也不应在没有 Pages 子路径回归测试时移除。

## 3. 本地命令与已验证结果

`package.json` 的公共脚本是：

| 命令 | 作用 |
| --- | --- |
| `pnpm run dev` | 在 `127.0.0.1` 启动 VitePress 开发服务 |
| `pnpm run preview` | 在 `127.0.0.1` 预览生产产物 |
| `pnpm run validate` | 内容校验 + `vue-tsc` + ESLint |
| `pnpm run test:discovery` | 临时内容自动发现、渲染与清理 |
| `pnpm run build` | 构建 `dist/pages` |
| `pnpm run check:site` | 检查页面清单、内部链接、base、H1 与搜索内容 |
| `pnpm test` | 依次执行 validate、discovery、最终 build 与 artifact check |
| `pnpm run test:pages` | 对最终 Pages 子路径产物运行 Playwright |

迁移收口时的实际结果：

- `pnpm install --frozen-lockfile` 成功；
- `pnpm test` 成功，产物包含首页、Labs 索引、404、7 篇教材与 4 个 Lab；
- `GITHUB_PAGES_BASE_PATH=/DSA-Mastery` 下 artifact check 成功；
- Playwright `5/5` 通过：学习路径、中文搜索、主题/复制/表格/元数据、移动导航、404；
- 浏览器监控未发现非预期同源 4xx/5xx、request failure、`pageerror` 或 `console.error`。

在 Windows PowerShell 复现 Pages 子路径验收：

```powershell
$env:GITHUB_PAGES_BASE_PATH = "/DSA-Mastery"
$env:SITE_URL = "https://azenann.github.io/DSA-Mastery/"
pnpm run build
pnpm run check:site
pnpm run test:pages
Remove-Item Env:GITHUB_PAGES_BASE_PATH
Remove-Item Env:SITE_URL
```

普通提交至少运行 `pnpm test`；涉及导航、base、主题、Markdown 渲染或 Pages workflow 时，再执行上面的子路径验收。

## 4. GitHub Pages

`.github/workflows/pages.yml` 在 PR、`main` push 和手动触发时共用同一个 build job：

1. `pnpm install --frozen-lockfile`；
2. `actions/configure-pages@v6` 提供 `base_path` 与 `base_url`；
3. validate、discovery、最终 build、artifact check；
4. Chromium Playwright；
5. `actions/upload-pages-artifact@v5` 上传 `dist/pages`。

`actions/deploy-pages@v5` 只在非 PR 事件执行。PR 会完整构建与测试，但不会覆盖正式网站。这三个 Pages action 均使用当前 Node 24 major，避免 GitHub Runner 的 Node 20 弃用告警。

## 5. 清理结果与依赖风险

清理报告审计的 30 个旧 vinext、React、RSC、Cloudflare Workers 与 OpenAI Sites 跟踪文件已全部删除；旧直接依赖和补丁脚本也已从 package/lockfile 与 workflow 移除。Markdown、Labs、`public`、文档、Trellis、内容校验、Playwright、VitePress 和 Pages workflow 均保留。

`pnpm audit` 仍报告 3 个传递依赖问题（2 moderate、1 high）：

```text
vitepress 1.6.4
└─ vite 5.4.21
   └─ esbuild 0.21.5
```

在固定 VitePress `1.6.4` 的兼容范围内没有可用修复。`pnpm audit --fix` 或强制升级会越过当前版本合同，可能破坏 VitePress 构建，禁止作为自动处置。当前缓解措施：

- `dev` 与 `preview` 强制绑定 `127.0.0.1`，不向局域网暴露开发服务器；
- 正式环境只发布预构建的静态 `dist/pages`，不运行 Vite/esbuild 开发服务；
- 升级需单独 Issue/PR，重新跑 `pnpm test`、Pages 子路径 Playwright 与视觉检查。

## 6. 回滚

### 合并前

关闭或放弃迁移 Draft PR 即可；`main` 与正式 Pages 不受影响。不要通过重建旧 Sites/Worker 发布路径来“临时验证”。

### 合并后

1. 从当前 `main` 建立回滚分支；
2. 通过新的 Review PR 逆序 revert 迁移提交组，不强推或改写 `main`；
3. 从 lockfile 执行 `pnpm install --frozen-lockfile` 和恢复后对应的完整检查；
4. 重新发布最后一个绿色 Pages artifact；
5. 核对 `/DSA-Mastery/` 首页、首篇教材、Labs 索引与至少一个 Lab。

内容目录和公开课程 URL 在迁移中保持不变，因此没有数据库、内容格式或数据迁移需要恢复。被删除的跟踪文件可由 Git/revert 找回；ignored 缓存只能通过依赖安装和构建重建。

### 仅 Pages 发布故障

优先恢复上一份绿色 Pages artifact，再在短分支修复 workflow/base 问题。不要重新引入 `.openai/hosting.json`、Cloudflare Worker、vinext 补丁或第二生产主机。

## 7. 常见排查

| 现象 | 先检查 |
| --- | --- |
| 相对 `.md` 链接 404 | 源文件是否存在、是否位于两类内容扫描路径、`pnpm run validate:content` 输出 |
| URL 出现双 `/DSA-Mastery/` | 源码是否硬编码 base；`GITHUB_PAGES_BASE_PATH` 是否只注入一次 |
| 新页面没有进入导航/搜索 | frontmatter、目录命名、`pnpm run test:discovery` |
| Lab 跳转后 outline 错乱 | `target="_self"` 是否仍在顶栏 Labs/目录卡片上 |
| 公式未渲染 | `markdown.math` 是否仍为 `true`，正文分隔符是否完整 |
| 本地正常、Pages 失败 | 使用本节 PowerShell 命令在最终 `dist/pages` 上复现 |
