# Lab 命令与接口指南 · Implementation Plan

## 1. Source audit and writing

- [x] 以 `package.json`、`tools/lab/cli.mjs`、`tools/lab/lab.mk`、`tools/lab/{core,doctor,compiler,judge,operations,project}.mjs` 为事实源完成命令/参数/类型矩阵。
- [x] 用 Program `lab-01-06` 与 Project `lab-01-21` / `lab-04-02` 的真实 manifest 和 README 校验 case、task、CTest、manual pending 示例。
- [x] 新建 `docs/LAB_CLI_COMMAND_GUIDE.md`，按渐进信息架构写出可复制示例和边界提示。

## 2. Preface integration

- [x] 新建 `content/chapter-preface/03-lab-cli-command-guide.md`，使用规范 frontmatter 与 VitePress include。
- [x] 更新 `.vitepress/content-index.ts` 的前言描述、目标、focusAreas 和 `lessonSources`。
- [x] 更新 `content/README.md` 与前言相关 Trellis 可执行规范，消除固定页面清单漂移。

## 3. Executable documentation checks

- [x] 扩充 `scripts/validate-lab-docs.mjs`，检查正文的命令、参数、Make target/变量和 include 入口。
- [x] 扩充 `scripts/check-built-site.mjs`，验证第 4 个前言页面、新 route、include 展开和关键正文。
- [x] 扩充 `tests/pages-navigation.spec.mjs`，覆盖从前言目录进入新指南、侧栏入口与移动端无溢出。

## 4. Validation gates

- [x] `pnpm run test:lab-docs`
- [x] `pnpm run validate:content`
- [x] `pnpm run validate`
- [x] `pnpm run test:discovery`
- [x] `pnpm run build`
- [x] `pnpm run check:site`
- [x] 相关 `pnpm run test:pages` 前言用例（最终静态产物，Pages base）
- [x] `pnpm test`
- [x] `git diff --check` 与工作区生成物审计

## 5. Local review handoff

- [x] 启动本地 VitePress 服务并打开 `/learn/chapter-preface/03-lab-cli-command-guide/`。
- [x] 人工检查 1440px/390px、浅色/暗色、代码复制、表格局部横滚、侧栏与本页目录。
- [x] 保持本地服务运行，将 URL 与检查重点交给用户；等待用户验收后再进入提交/PR 阶段。

## Verification record

- 2026-08-21：`pnpm run test:lab-docs`、`pnpm run validate:content`、`pnpm run validate`、`pnpm run test:discovery`、根 base 与 Pages base 的 `build` / `check:site` 均通过。
- 2026-08-21：相关 Playwright 前言与中文搜索用例 2/2 通过；最终 `pnpm test` 通过，Lab 工具测试 32 通过、1 个 Windows 符号链接策略用例跳过。
- 2026-08-21：浏览器实机检查 1440px 暗色、1081px 浅色与 390px 浅色均无根页面横向溢出；控制台无 warning/error，代码复制按钮进入 `copied` 状态。
- 本地预览：`http://127.0.0.1:4173/learn/chapter-preface/03-lab-cli-command-guide/`，服务保持运行，等待维护者验收。

## Risk and rollback points

- 命令矩阵最容易因“语法允许但类型不支持”而误写；每项必须同时核对参数白名单与下游 type guard。
- 前言是显式 `lessonSources`，新增文件不会自动进入课程目录；ContentIndex 与三层测试必须同改。
- `scripts/check-built-site.mjs` 当前硬编码前言恰好 3 页，新增页面前必须同步为 4，否则 build 后检查必然失败。
- 不修改 CLI 或 Make 实现；若写作发现实现缺陷，另开任务而不是在文档 PR 中顺带改变行为。
