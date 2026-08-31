# 验证与 GitHub Pages 合同

## 1. Scope / Trigger

修改内容契约、VitePress、主题组件、依赖、测试、Pages workflow、base 或构建输出时适用。

## 2. Signatures

项目通过 `package.json#packageManager` 固定 pnpm 版本；使用 Corepack 启用该版本。`pnpm-lock.yaml` 是唯一依赖锁文件，禁止重新生成或提交 `package-lock.json`。

标准门禁由 `package.json` 暴露稳定脚本：

```powershell
corepack enable
pnpm install --frozen-lockfile
pnpm test
```

Lab 专项稳定入口：

```powershell
pnpm run test:lab-tools
pnpm run test:lab-docs
pnpm lab:verify -- labs/chapter-01/lab-01-06-sequential-list-deduplication
pnpm lab:verify -- labs/chapter-08/lab-08-03-avl-tree-rotations
```

`pnpm test` 当前依次执行 `validate`（内容 + `vue-tsc` + lint）、`test:discovery`、最终 `build` 与 `check:site`。涉及 Pages 时，在设置 `GITHUB_PAGES_BASE_PATH=/DSA-Mastery` 与 `SITE_URL` 后重新 build/check，再运行 `pnpm run test:pages`。

Pages 构建输入/输出：

```text
actions/configure-pages base_path
  -> GITHUB_PAGES_BASE_PATH
  -> VitePress normalized base
  -> dist/pages
  -> actions/upload-pages-artifact
```

## 3. Contracts

- Node 版本与 `package.json#engines` 一致，Corepack 使用 `package.json#packageManager` 固定 pnpm 版本，干净环境使用 `pnpm install --frozen-lockfile`。
- 源码直接导入的运行时包必须是 `package.json` 的直接依赖；无内置 TypeScript 声明的包还必须直接声明对应 `@types/*`。锁文件中存在传递依赖不代表当前包可以直接使用，且不得以本机 `node_modules` 中的残留链接作为通过依据。
- 内容校验与 VitePress 收集器是独立防线，但共享同一字段/路径契约；禁止一个接受、另一个拒绝。
- workflow 使用 Node 24、全局 `pages` concurrency group；PR 执行全部 build/test 但不 deploy，只有 `main` push 和 `workflow_dispatch` 可部署。
- `actions/configure-pages` 是部署 base 的来源；旧 `NEXT_PUBLIC_*`、RSC patch 和 artifact 修补已删除，不得重新引入。
- 上传目录固定为 `dist/pages`；生成目录不进 Git。
- Playwright 必须服务最终静态产物，并挂载在 `/DSA-Mastery/`，不能只测开发服务器；仓库配置的全部用例必须全绿。
- 真实点击覆盖：首页 CTA → 教材、顶栏 Labs → Labs 索引、Labs 索引 → Lab。
- 浏览器收集 `pageerror`、`console.error`、request failure 和同源 4xx/5xx；任何非明确允许项都失败。
- 理论 Markdown、行内高亮或 fence renderer 改动必须同时经过 discovery 解析、静态产物和 Pages 浏览器三层验证；不能只凭组件截图通过。
- `pnpm test` 必须包含 Lab Schema/路径/比较器/进程限制单测和作者指南示例检查；内容 validator 遍历所有已存在的 `lab.json`，README-only 旧 Lab 保持兼容。
- C++ CI 与 Pages deploy job 隔离：Ubuntu 使用 GCC/Clang，Windows 使用 MSVC；执行代码的 job 只有 `contents: read`，不接收 Pages 写权限或部署秘密。
- Golden Program/Project 的 `verify` 同时断言 reference 自动满分、starter 非满分和 oracle/权重稳定；Project manual 分始终显示 pending。

## 4. Validation & Error Matrix

| 失败 | 阻塞范围 |
| --- | --- |
| frontmatter、路径、order、链接错误 | 所有内容 PR |
| type/lint/build 失败 | 所有站点或依赖 PR |
| 直接导入依赖或类型包仅由传递依赖提供 | 干净安装与 CI 阻塞 |
| 期望 route/asset 缺失或双 base | 发布阻塞 |
| 搜索找不到教材或 Lab | 发布阻塞 |
| math、code、table/task-list 代表页回归 | 发布阻塞 |
| 移动导航、暗色或关键点击失败 | 发布阻塞 |
| PR workflow 触发 deploy | workflow 设计失败 |
| fixture 未清理，工作树变脏 | 测试失败 |
| 交互题库 JSON 损坏却被 loader 静默跳过 | 发布阻塞；validator 与构建都必须报错 |
| 章节实际 Lab 集合与“相关 Labs”或分类“本章 Labs”不完整；空分类章节漏掉槽位 | discovery/Pages 发布阻塞 |
| 理论标题未转义、`:::` 泄漏、搜索丢失正文或代码组文件名重复 | 发布阻塞 |
| Lab tool 单测、Golden verify 或学生包自包含检查失败 | Lab/工具 PR 阻塞 |
| 外部 PR 的 C++ job 获得写 token/秘密，或把评分器宣称为沙箱 | 安全设计失败 |
| `==` 误解析行内代码、fenced code 或 MathJax | 发布阻塞 |

## 5. Good / Base / Bad Cases

- Good：从 `dist/pages` 在 `/DSA-Mastery/` 下点击三段学习路径，无同源错误且 URL 只有一个 base。
- Base：本地 base 为 `/`，同一 build/test 仍通过。
- Bad：直接断言 HTML 字符串，未执行点击；或只在 `vitepress dev` 测试。

## 6. Tests Required

- 内容：字段、类型、路径、章一致性、排序、相对文件与站内路由。
- 依赖：直接导入与 `package.json` 的直接依赖一致；无内置声明的 JavaScript 包具有直接 `@types/*` 依赖，并在冻结锁文件安装后通过 `typecheck`。
- 自动发现：临时教材和 Lab 在 `try/finally` 内创建，贯穿验证、导航、搜索和 build；另在自动收录章节创建临时 Lab，并证明进入指定分类；对 Ch.5 断言 Theory 恰有 5 个、Exercise 恰有 17 个自动收录入口且两者不显示空态，Project 保留空槽位和固定文案。
- 第 1 章目录兼容：静态合同断言原有 21 个连续旧路径全部保留，同时允许自动发现新式稳定 ID 路径；当前分类基线为 5/15/1。Pages 浏览器覆盖四层原生折叠、三色三图标、明暗主题与 390px 无溢出。
- 产物：期望 HTML、favicon/OG、内部链接、asset、404、恰好一个 base。
- 浏览器：三段真实点击、搜索教材/Lab、主题持久化、移动目录、代表性公式/代码/表格/任务列表、edit link；前言还需从资源目录进入六篇完整指南，并在 Lab 命令指南的浅/暗主题与 390/1440px 下断言无根页面溢出，同时验证 macOS 指南图片均成功加载。
- 理论文档：11 种容器、默认/自定义/恶意标题、嵌套 Markdown、搜索内容、mark 边界、独立文件名、代码组去重与 Shiki highlight/focus/diff/warning/error。
- 理论视觉：浅暗主题正文至少 4.5:1、语义边栏/键盘焦点至少 3:1，390/1440px 根页面无横向溢出；复制与 code-group tabs 必须以键盘和点击保持可用。
- 交互题库：内容 validator 检查 schema、唯一挂载点与无静态重复；Pages 浏览器真实选择并提交，检查反馈、题解、重试、题量和每题四个选项。
- Lab 工具：未知版本、越界/空格路径、分值/依赖/环、薄 Makefile、exact/tokens/float、CRLF、全部 verdict、timeout/output cap 和 JSON report。
- C++ Golden：Program 与 Project 分别在 GCC/Clang/MSVC 上 verify；student pack 排除 solution/cache/binary 并脱离仓库 validate/run。
- 视觉：对照 `docs/assets/migration-baseline/` 的桌面/移动、浅/暗证据。

## 7. Wrong vs Correct

### Wrong

```yaml
- run: pnpm run build
- uses: actions/deploy-pages@v5
```

PR 也执行 deploy，且没有最终产物的点击测试。

### Correct

build job 在 PR/push 均运行全部门禁并上传 `dist/pages`；deploy job 依赖 build，且显式排除 `pull_request`。

Lab CI 的错误与正确边界：

```yaml
# Wrong: 执行 PR 代码的 job 拥有写权限
permissions: write-all

# Correct
permissions:
  contents: read
```
